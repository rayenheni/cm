<?php
declare(strict_types=1);
namespace CMCB;

final class App
{
    public readonly \PDO $db;
    public readonly Repository $repo;
    public readonly Auth $auth;
    public readonly View $view;
    private readonly RateLimiter $limits;
    public function __construct(public readonly Config $config, ?\PDO $db = null, bool $rateLimits = true)
    {
        $this->db = $db ?? Database::connect($config);
        $this->repo = new Repository($this->db); $this->auth = new Auth($this->db, $config);
        $this->view = new View($config->root); $this->limits = new RateLimiter($this->db, $rateLimits);
    }
    public static function securityHeaders(Config $config): array
    {
        $csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self'; connect-src 'self'; frame-src https://www.openstreetmap.org; object-src 'none'; base-uri 'self'; form-action 'self'" . ($config->production ? "; frame-ancestors 'self'; upgrade-insecure-requests" : '');
        return ['X-Content-Type-Options' => 'nosniff'] + ($config->production ? ['X-Frame-Options' => 'SAMEORIGIN'] : []) + ['Referrer-Policy' => 'strict-origin-when-cross-origin', 'Permissions-Policy' => 'camera=(), microphone=(), geolocation=()', 'Content-Security-Policy' => $csp, 'Cache-Control' => 'no-store'] + ($config->production ? ['Strict-Transport-Security' => 'max-age=31536000; includeSubDomains'] : []);
    }
    public function handle(Request $request): Response
    {
        try {
            if (str_starts_with($request->path, '/api')) {
                $response = $this->api($request);
                if ($response->status === 429) $response = new Response(429, $response->body, $response->headers + ['Retry-After' => '900']);
            } elseif (in_array($request->method, ['GET', 'HEAD'], true) && preg_match('#^/media/([a-f0-9]{32}\.(?:jpg|png|webp))$#', $request->path, $media)) $response = (new Media($this->config))->read($media[1]);
            elseif (in_array($request->method, ['GET', 'HEAD'], true)) $response = $this->page($request);
            elseif ($request->method === 'POST' && $request->path === '/contact') $response = $this->contact($request);
            else throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Méthode non autorisée.');
        } catch (HttpError $e) {
            $body = ['error' => ['code' => $e->errorCode, 'message' => $e->getMessage()] + ($e->fields ? ['fields' => $e->fields] : [])];
            $lang = $request->query['lang'] ?? 'fr';
            if ($request->method === 'POST' && $request->path === '/contact') { parse_str($request->body, $form); $lang = $form['lang'] ?? 'fr'; }
            $response = str_starts_with($request->path, '/api') ? Response::json($body, $e->status) : $this->view->page('error', new Content(in_array($lang, ['fr', 'ar'], true) ? $lang : 'fr'), ['error' => $e, 'title' => 'Erreur'], $e->status);
            if ($e->status === 429) $response = new Response($response->status, $response->body, $response->headers + ['Retry-After' => '900']);
        } catch (\Throwable $e) {
            error_log('CMCB request failure: ' . get_class($e));
            $response = str_starts_with($request->path, '/api') ? Response::json(['error' => ['code' => 'INTERNAL_ERROR', 'message' => 'Le serveur ne peut pas terminer cette opération. Réessayez plus tard.']], 500) : Response::html('<!doctype html><html lang="fr"><meta charset="utf-8"><title>CMCB — Erreur</title><h1>Une erreur est survenue.</h1><p>Veuillez réessayer plus tard.</p>', 500);
        }
        $response = new Response($response->status, $request->method === 'HEAD' ? '' : $response->body, $response->headers + self::securityHeaders($this->config));
        try {
            (new Outbox($this->db, $this->config->smtp ? new Mailer($this->config->smtp) : null))->processOnce();
        } catch (\Throwable $e) {
            // A notification outage must never turn a persisted request into a failed submission.
            error_log('CMCB outbox unavailable: ' . get_class($e));
        }
        return $response;
    }
    private function api(Request $r): Response
    {
        $r->checkOrigin($this->config);
        $this->limits->hit('api', $r->ip, 300, 60);
        $p = $r->path; $m = $r->method;
        if ($m === 'GET' && $p === '/api/health') { Database::one($this->db, 'SELECT 1'); return Response::json(['status' => 'ok', 'runtime' => 'PHP ' . PHP_VERSION, 'storage' => Database::isMysql($this->db) ? 'mysql' : 'sqlite']); }
        if ($m === 'GET' && ($p === '/api/articles' || preg_match('#^/api/articles/([a-z0-9-]+)$#', $p, $match))) {
            $lang = $r->query['lang'] ?? 'fr'; if (!in_array($lang, ['fr', 'ar'], true)) throw new HttpError(400, 'VALIDATION_ERROR', 'Langue invalide.');
            if (isset($match)) { $a = $this->repo->article($match[1], true); if (!$a || !isset($a['translations'][$lang])) throw new HttpError(404, 'NOT_FOUND', 'Article introuvable.'); return Response::json(['article' => Repository::localized($a, $lang)]); }
            $articles = array_values(array_filter($this->repo->articles(true), fn($a) => isset($a['translations'][$lang])));
            return Response::json(['articles' => array_map(fn($a) => Repository::localized($a, $lang), $articles)]);
        }
        if ($p === '/api/auth/session' && $m === 'GET') {
            $s = $this->auth->session($r); return Response::json(['authenticated' => !!$s, 'user' => $s ? ['id' => (int)$s['admin_id'], 'email' => $s['email']] : null, 'csrfToken' => $s['csrf_token'] ?? null]);
        }
        if ($p === '/api/auth/login' && $m === 'POST') {
            $this->limits->hit('login', $r->ip, 10, 900);
            $input = (new Validation())->credentials($r->json());
            // Also limit per normalized account, including unknown accounts, across IP addresses.
            $this->limits->hit('login-account', $input['email'], 10, 900);
            [$response, $cookie] = $this->auth->login($input, $r);
            return new Response(200, $response->body, $response->headers + ['Set-Cookie' => $cookie]);
        }
        if ($p === '/api/auth/logout' && $m === 'POST') {
            $s = $this->auth->session($r);
            if ($s) { $this->auth->requireSession($r, true); Database::run($this->db, 'DELETE FROM sessions WHERE token_hash=?', [$s['token_hash']]); }
            return new Response(200, '{"ok":true}', ['Content-Type' => 'application/json', 'Set-Cookie' => $this->auth->cookie('', 0)]);
        }
        if ($p === '/api/reservations' && $m === 'POST') {
            $this->limits->hit('contact', $r->ip, 8, 900);
            $input = (new Validation())->reservation($r->json()); $key = $r->header('idempotency-key');
            if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i', $key)) throw new HttpError(400, 'VALIDATION_ERROR', 'Une clé Idempotency-Key UUID est requise.');
            $result = $this->repo->createReservation($input, strtolower($key), $this->config->smtp !== null);
            return Response::json($result['body'], $result['status']);
        }
        if ($p === '/api/auth/password' && $m === 'POST') {
            $s = $this->auth->requireSession($r, true); $cookie = $this->auth->changePassword($r->json(), $s);
            return new Response(200, '{"ok":true}', ['Content-Type' => 'application/json', 'Set-Cookie' => $cookie]);
        }
        if (!str_starts_with($p, '/api/admin/')) throw new HttpError(404, 'NOT_FOUND', 'Point API introuvable.');
        $write = !in_array($m, ['GET', 'HEAD'], true); $this->auth->requireSession($r, $write);
        if ($p === '/api/admin/media' && $m === 'POST') {
            $this->limits->hit('media', $r->ip, 30, 900);
            return Response::json(['url' => (new Media($this->config))->save($r->json())], 201);
        }
        if ($p === '/api/admin/articles') {
            if ($m === 'GET') return Response::json(['articles' => $this->repo->articles()]);
            if ($m === 'POST') {
                $input = (new Validation())->article($r->json());
                if ($this->repo->article($input['id'])) throw new HttpError(409, 'DUPLICATE_SLUG', 'Ce slug existe déjà.');
                return Response::json(['article' => $this->repo->saveArticle($input, true)], 201);
            }
        }
        if (preg_match('#^/api/admin/articles/([a-z0-9-]+)$#', $p, $match)) {
            if ($m === 'PUT') { $input = (new Validation())->article($r->json()); if ($input['id'] !== $match[1]) throw new HttpError(400, 'IMMUTABLE_SLUG', 'Conservez le slug pour préserver les liens.'); return Response::json(['article' => $this->repo->saveArticle($input, false)]); }
            if ($m === 'DELETE') { $this->repo->delete('articles', $match[1]); return Response::json(['ok' => true]); }
        }
        if ($p === '/api/admin/reservations' && $m === 'GET') return Response::json($this->repo->reservations(Validation::listQuery($r->query)));
        if (preg_match('#^/api/admin/reservations/([a-f0-9-]+)(/retry)?$#', $p, $match)) {
            $id = $match[1]; $reservation = $this->repo->reservation($id);
            if (!$reservation) throw new HttpError(404, 'NOT_FOUND', 'Demande introuvable.');
            if ($m === 'DELETE' && !isset($match[2])) { $this->repo->delete('reservations', $id); return Response::json(['ok' => true]); }
            if ($m === 'PATCH' && !isset($match[2])) {
                $input = $r->json(); Validation::keys($input, ['status']);
                if (!in_array($input['status'], ['new', 'contacted', 'closed'], true)) throw new HttpError(400, 'VALIDATION_ERROR', 'Statut invalide.');
                Database::run($this->db, 'UPDATE reservations SET status=?,updated_at=? WHERE id=?', [$input['status'], Database::now(), $id]);
                return Response::json(['reservation' => $this->repo->reservation($id)]);
            }
            if ($m === 'POST' && isset($match[2])) {
                if (!$this->config->smtp) throw new HttpError(409, 'SMTP_DISABLED', 'Configurez SMTP sur le serveur.');
                $st = Database::run($this->db, "UPDATE outbox SET status='pending',attempts=0,next_attempt_at=0,last_error=NULL WHERE reservation_id=? AND status IN ('failed','disabled','pending')", [$id]);
                if (!$st->rowCount()) throw new HttpError(409, 'NOT_RETRYABLE', 'Aucune notification à réessayer.');
                return Response::json(['ok' => true]);
            }
        }
        if ($p === '/api/admin/system' && $m === 'GET') return Response::json(['smtpConfigured' => $this->config->smtp !== null, 'storage' => Database::isMysql($this->db) ? 'mysql' : 'sqlite', 'sessionHours' => Auth::HOURS, 'runtime' => 'PHP ' . PHP_VERSION]);
        throw new HttpError(404, 'NOT_FOUND', 'Point API introuvable.');
    }
    private function page(Request $r): Response
    {
        $lang = $r->query['lang'] ?? 'fr'; if (!in_array($lang, ['fr', 'ar'], true)) $lang = 'fr';
        $c = new Content($lang); $p = $r->path; $articles = array_map(fn($a) => Repository::localized($a, $lang), array_values(array_filter($this->repo->articles(true), fn($a) => isset($a['translations'][$lang]))));
        $data = ['path' => $p, 'articles' => $articles];
        if ($p === '/') return $this->view->page('home', $c, $data);
        if ($p === '/cabinet') return $this->view->page('cabinet', $c, $data + ['title' => $c->t('cabinet.docTitle')]);
        if ($p === '/expertises') return $this->view->page('expertises', $c, $data + ['title' => $c->t('expertises.docTitle')]);
        if (preg_match('#^/expertises/([a-z]+)$#', $p, $m)) {
            foreach ($c->expertises as $expertise) if ($expertise['id'] === $m[1]) return $this->view->page('expertise', $c, $data + ['expertise' => $expertise, 'title' => $expertise['title']]);
        }
        if ($p === '/articles') {
            $q = is_string($r->query['q'] ?? null) ? mb_substr(trim($r->query['q']), 0, 200) : '';
            $category = is_string($r->query['category'] ?? null) ? mb_substr(trim($r->query['category']), 0, 120) : '';
            $matches = [];
            foreach ($articles as $a) $matches[$a['id']] = ($category === '' || $a['category'] === $category) && ($q === '' || mb_stripos($a['title'] . ' ' . $a['excerpt'] . ' ' . $a['category'] . ' ' . $a['intro'], $q) !== false);
            return $this->view->page('articles', $c, $data + ['title' => $c->t('articles.docTitle'), 'allArticles' => $articles, 'matches' => $matches, 'resultCount' => count(array_filter($matches)), 'q' => $q, 'category' => $category]);
        }
        if (preg_match('#^/articles/([a-z0-9-]+)$#', $p, $m)) {
            foreach ($articles as $article) if ($article['id'] === $m[1]) return $this->view->page('article', $c, $data + ['article' => $article, 'title' => $article['title']]);
        }
        if ($p === '/faq') return $this->view->page('faq', $c, $data + ['title' => $c->t('faq.docTitle')]);
        if ($p === '/contact') {
            $token = bin2hex(random_bytes(32)); $formKey = Database::uuid();
            $response = $this->view->page('contact', $c, $data + ['title' => $c->t('contact.docTitle'), 'formToken' => $token, 'formKey' => $formKey, 'success' => ($r->query['envoi'] ?? '') === 'ok']);
            return new Response($response->status, $response->body, $response->headers + ['Set-Cookie' => [$this->formCookie('csrf', $token, $r), $this->formCookie('key', $formKey, $r)]]);
        }
        if ($p === '/mentions-legales' || $p === '/confidentialite') return $this->view->page('legal', $c, $data + ['privacy' => $p === '/confidentialite', 'title' => $c->t($p === '/confidentialite' ? 'legal.privacyTitle' : 'legal.mentionsTitle')]);
        if ($p === '/admin') return Response::html($this->view->render('admin', ['preview' => $this->config->previewBearer]), 200);
        throw new HttpError(404, 'NOT_FOUND', 'Page introuvable.');
    }
    private function formCookie(string $name, string $value, Request $r): string
    {
        $policy = $this->config->cookiePolicy; $secure = $this->config->production || $r->https;
        // SameSite=None requires Secure. On local HTTP only, fall back to first-party Lax.
        $embedded = $policy === 'none' && $secure;
        return 'cmcb_' . $name . '=' . $value . '; Path=/contact; Max-Age=900; HttpOnly; SameSite=' . ($embedded ? 'None' : 'Lax') . ($secure ? '; Secure' : '') . ($embedded ? '; Partitioned' : '');
    }
    private function contact(Request $r): Response
    {
        $r->checkOrigin($this->config); $this->limits->hit('contact', $r->ip, 8, 900);
        parse_str($r->body, $input);
        $lang = in_array($input['lang'] ?? '', ['fr', 'ar'], true) ? $input['lang'] : 'fr';
        $cookie = $r->cookie('cmcb_csrf'); $key = $r->cookie('cmcb_key');
        if (!preg_match('/^[a-f0-9]{64}$/', $cookie) || !is_string($input['_csrf'] ?? null) || !hash_equals($cookie, $input['_csrf'])) throw new HttpError(403, 'CSRF_REJECTED', 'Le formulaire a expiré. Rechargez la page.');
        if (!is_string($input['_key'] ?? null) || !preg_match('/^[a-f0-9-]{36}$/', $input['_key'])) throw new HttpError(400, 'VALIDATION_ERROR', 'Formulaire invalide.');
        unset($input['_csrf'], $input['_key']);
        // Cookie-bound key prevents a refreshed form from creating a second request.
        $key = preg_match('/^[a-f0-9-]{36}$/', $key) ? $key : $input['_key'];
        $input['consent'] = ($input['consent'] ?? '') === '1';
        $input['website'] ??= ''; $input['lang'] = $lang; $input['phone'] ??= '';
        $valid = (new Validation())->reservation($input);
        $this->repo->createReservation($valid, $key, $this->config->smtp !== null);
        return new Response(303, '', ['Location' => '/contact?lang=' . $lang . '&envoi=ok#consultation', 'Set-Cookie' => [$this->formCookie('csrf', '', $r), $this->formCookie('key', '', $r)]]);
    }
}
