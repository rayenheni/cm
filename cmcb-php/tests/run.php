<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
foreach (['Config', 'Http', 'Database', 'MySqlSchema', 'Content', 'Design', 'View', 'Validation', 'Media', 'Auth', 'Repository', 'RateLimiter', 'Mailer', 'App'] as $name) require "$root/src/$name.php";
use CMCB\{App, Auth, Config, Database, Content, HttpError, Mailer, Outbox, RateLimiter, Repository, Request, Validation};
$passed = 0; $failed = 0;
function test(string $name, callable $fn): void { global $passed, $failed; try { $fn(); $passed++; echo "PASS  $name\n"; } catch (Throwable $e) { $failed++; echo "FAIL  $name\n      " . get_class($e) . ': ' . $e->getMessage() . "\n"; } }
function check(bool $condition, string $message = 'Assertion échouée'): void { if (!$condition) throw new RuntimeException($message); }
function throws(int $status, callable $fn): void { try { $r = $fn(); if ($r instanceof CMCB\Response) { check($r->status === $status, "HTTP {$r->status} au lieu de $status"); return; } } catch (HttpError $e) { check($e->status === $status, "HTTP {$e->status} au lieu de $status"); return; } throw new RuntimeException("HTTP $status attendu"); }
function req(string $method, string $path, array $body = null, array $headers = [], string $ip = '127.0.0.1'): Request { return new Request($method, $path, ['host' => 'cmcb.test', 'content-type' => 'application/json'] + $headers, $body === null ? '' : json_encode($body, JSON_UNESCAPED_UNICODE), $ip); }
function jsonBody(CMCB\Response $r): array { return json_decode($r->body, true, 512, JSON_THROW_ON_ERROR); }
function throwsRuntime(callable $fn): void { try { $fn(); } catch (RuntimeException) { return; } throw new RuntimeException('RuntimeException attendue'); }
function reservationInput(array $changes = []): array { return array_replace(['name' => 'Client Test', 'email' => 'client@example.test', 'phone' => '+216 92 166 466', 'domain' => 'Droit des affaires', 'urgency' => 'normal', 'message' => 'Je souhaite une consultation concernant un contrat commercial.', 'lang' => 'fr', 'consent' => true, 'website' => ''], $changes); }
function articleInput(string $id = 'test-article', bool $ar = true): array {
    $tr = ['category' => 'Droit des affaires', 'readTime' => '5 min', 'title' => 'Titre de test', 'excerpt' => 'Résumé de test', 'imageAlt' => '', 'intro' => 'Introduction de test', 'sections' => [['heading' => 'Analyse', 'paragraphs' => ['Premier paragraphe.']]], 'keyPoints' => ['Point essentiel']];
    return ['id' => $id, 'expertiseId' => 'affaires', 'image' => '', 'status' => $ar ? 'published' : 'draft', 'translations' => ['fr' => $tr] + ($ar ? ['ar' => ['category' => 'قانون الأعمال', 'readTime' => '5 دقائق', 'title' => 'عنوان تجريبي', 'excerpt' => 'ملخص تجريبي', 'imageAlt' => '', 'intro' => 'مقدمة تجريبية', 'sections' => [['heading' => 'تحليل', 'paragraphs' => ['فقرة أولى.']]], 'keyPoints' => ['نقطة أساسية']]] : [])];
}
$mysqlTest = getenv('CMCB_TEST_MYSQL') === '1';
$temp = null;
if ($mysqlTest) {
    $name = getenv('CMCB_TEST_DB_NAME') ?: '';
    if (!preg_match('/^cmcb_test_[a-zA-Z0-9_]+$/', $name)) { fwrite(STDERR, "Refus : utilisez une base vide dédiée nommée cmcb_test_...\n"); exit(1); }
    $config = new Config($root, ['APP_ENV' => 'development', 'DB_DRIVER' => 'mysql', 'DB_HOST' => getenv('CMCB_TEST_DB_HOST') ?: '127.0.0.1', 'DB_PORT' => getenv('CMCB_TEST_DB_PORT') ?: '3306', 'DB_NAME' => $name, 'DB_USER' => getenv('CMCB_TEST_DB_USER') ?: '', 'DB_PASSWORD' => getenv('CMCB_TEST_DB_PASSWORD') ?: '', 'PREVIEW_BEARER_AUTH' => 'true']);
    $db = Database::connect($config);
    // install() refuses a non-empty database; no tables are dropped by this suite.
    CMCB\MySqlSchema::install($db);
    $seedDb = $db;
} else {
    // A unique temporary SQLite file is used by the historical WASM preview tests.
    $temp = sys_get_temp_dir() . '/cmcb-php-test-' . bin2hex(random_bytes(6)); mkdir($temp, 0700);
    $dbFile = $temp . '/requests.sqlite';
    $config = new Config($root, ['APP_ENV'=>'development','DATABASE_PATH'=>$dbFile,'PREVIEW_BEARER_AUTH'=>'true']);
    $db = Database::open($dbFile);
    $seedDb = Database::open($temp . '/test.sqlite');
}
$app = new App($config, $db, false);
$email = 'admin@example.test'; $password = 'Test-password-2026!';
Database::run($db, 'INSERT INTO admins(email,password_hash,created_at) VALUES (?,?,?)', [$email, Auth::hash($password), Database::now()]);
$sessionHeaders = [];
test('PHP extensions required', fn() => check(extension_loaded($mysqlTest ? 'pdo_mysql' : 'pdo_sqlite') && extension_loaded('mbstring') && extension_loaded('openssl')));
test('four bilingual seed articles, independent DB', fn() => check(count((new Repository($seedDb))->articles(true)) === 4 && count((new Repository($seedDb))->article('creer-sa-societe-suarl-sarl')['translations']) === 2));
test('health endpoint', function () use ($app, $mysqlTest) { $r = $app->handle(req('GET', '/api/health')); check($r->status === 200 && jsonBody($r)['storage'] === ($mysqlTest ? 'mysql' : 'sqlite')); });
test('all public routes FR and AR', function () use ($app) {
    $paths = ['/', '/cabinet', '/expertises', '/expertises/affaires', '/expertises/famille', '/expertises/travail', '/expertises/penal', '/expertises/mediation', '/articles', '/articles/creer-sa-societe-suarl-sarl', '/faq', '/contact', '/mentions-legales', '/confidentialite', '/admin'];
    foreach ($paths as $path) foreach (['fr', 'ar'] as $lang) { $r = $app->handle(req('GET', $path . '?lang=' . $lang)); check($r->status === 200, $path); if ($path !== '/admin') check(str_contains($r->body, 'lang="' . $lang . '"'), $path); check(!str_contains($r->body, 'Fatal error') && !str_contains($r->body, 'Warning:'), $path); }
});
test('article public API and missing translation boundary', function () use ($app) { $r = $app->handle(req('GET', '/api/articles?lang=ar')); check(count(jsonBody($r)['articles']) === 4); check(jsonBody($app->handle(req('GET', '/api/articles/creer-sa-societe-suarl-sarl?lang=ar')))['article']['title'] !== ''); });
test('admin endpoints require authentication', function () use ($app) { throws(401, fn() => $app->handle(req('GET', '/api/admin/articles'))); throws(401, fn() => $app->handle(req('GET', '/api/admin/reservations'))); });
test('wrong credentials rejected', function () use ($app, $email) { throws(401, fn() => $app->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => 'wrong']))); });
test('bcrypt inputs longer than 72 bytes cannot authenticate', function () use ($app, $db) {
    $email = 'bcrypt-test@example.test'; $password = str_repeat('a', 72);
    Database::run($db, 'INSERT INTO admins(email,password_hash,created_at) VALUES (?,?,?)', [$email, password_hash($password, PASSWORD_BCRYPT, ['cost' => 4]), Database::now()]);
    try {
        throws(401, fn() => $app->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => $password . 'suffix'])));
        check($app->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => $password]))->status === 200);
    } finally { Database::run($db, 'DELETE FROM admins WHERE email=?', [$email]); }
});
test('cross-origin login rejected', function () use ($app, $email, $password) { throws(403, fn() => $app->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => $password], ['origin' => 'https://attacker.test']))); });
test('cookie login, hashed token, CSRF, logout', function () use ($app, $db, $email, $password) {
    $r = $app->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => $password])); check($r->status === 200); $data = jsonBody($r); check(!isset($data['sessionToken']));
    preg_match('/cmcb_session=([a-f0-9]{64})/', $r->headers['Set-Cookie'], $m); $token = $m[1]; check(str_contains($r->headers['Set-Cookie'], 'HttpOnly'));
    check(Database::one($db, 'SELECT * FROM sessions WHERE token_hash=?', [hash('sha256', $token)]) !== null);
    check(!Database::one($db, 'SELECT * FROM sessions WHERE token_hash=?', [$token]));
    $h = ['cookie' => 'cmcb_session=' . $token, 'x-csrf-token' => $data['csrfToken']];
    check($app->handle(req('GET', '/api/admin/articles', null, $h))->status === 200);
    throws(403, fn() => $app->handle(req('POST', '/api/auth/logout', [], ['cookie' => $h['cookie']])));
    check($app->handle(req('POST', '/api/auth/logout', [], $h))->status === 200);
    throws(401, fn() => $app->handle(req('GET', '/api/admin/articles', null, $h)));
});
test('preview Bearer transport survives without cookies', function () use ($app, $email, $password, &$sessionHeaders) {
    $r = $app->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => $password, 'transport' => 'bearer'])); $data = jsonBody($r); check(!empty($data['sessionToken']));
    $sessionHeaders = ['x-cmcb-session' => $data['sessionToken'], 'x-csrf-token' => $data['csrfToken']];
    check(jsonBody($app->handle(req('GET', '/api/auth/session', null, $sessionHeaders)))['authenticated'] === true);
});
test('admin writes require CSRF', function () use ($app, $sessionHeaders) { $h = $sessionHeaders; unset($h['x-csrf-token']); throws(403, fn() => $app->handle(req('POST', '/api/admin/articles', articleInput(), $h))); });
test('publishing requires complete Arabic translation', function () use ($app, $sessionHeaders) { $a = articleInput('draft-only', false); $a['status'] = 'published'; throws(400, fn() => $app->handle(req('POST', '/api/admin/articles', $a, $sessionHeaders))); });
test('article create, update, immutable slug, duplicate, delete', function () use ($app, $sessionHeaders) {
    $a = articleInput(); $r = $app->handle(req('POST', '/api/admin/articles', $a, $sessionHeaders)); check($r->status === 201);
    throws(409, fn() => $app->handle(req('POST', '/api/admin/articles', $a, $sessionHeaders)));
    $a['translations']['fr']['title'] = 'Titre modifié'; $a['image'] = 'https://images.pexels.com/photos/261621/pexels-photo-261621.jpeg';
    $r = $app->handle(req('PUT', '/api/admin/articles/test-article', $a, $sessionHeaders)); check(jsonBody($r)['article']['translations']['fr']['title'] === 'Titre modifié');
    $wrong = $a; $wrong['id'] = 'other-slug'; throws(400, fn() => $app->handle(req('PUT', '/api/admin/articles/test-article', $wrong, $sessionHeaders)));
    check($app->handle(req('GET', '/articles/test-article?lang=ar'))->status === 200);
    check($app->handle(req('DELETE', '/api/admin/articles/test-article', null, $sessionHeaders))->status === 200);
    throws(404, fn() => $app->handle(req('GET', '/api/articles/test-article')));
});
test('article content is escaped in public HTML', function () use ($app, $sessionHeaders) {
    $a = articleInput('escaped-content-test'); $a['translations']['fr']['title'] = '<script>alert(1)</script>';
    check($app->handle(req('POST', '/api/admin/articles', $a, $sessionHeaders))->status === 201);
    try {
        $response = $app->handle(req('GET', '/articles/escaped-content-test'));
        check($response->status === 200 && !str_contains($response->body, '<script>alert(1)</script>') && str_contains($response->body, '&lt;script&gt;alert(1)&lt;/script&gt;'));
    } finally { $app->handle(req('DELETE', '/api/admin/articles/escaped-content-test', null, $sessionHeaders)); }
});
test('authenticated image uploads are validated and served safely', function () use ($root, $db, $sessionHeaders) {
    $dir = sys_get_temp_dir() . '/cmcb-media-test-' . bin2hex(random_bytes(6));
    $config = new Config($root, ['APP_ENV' => 'development', 'DATABASE_PATH' => ':memory:', 'MEDIA_PATH' => $dir, 'PREVIEW_BEARER_AUTH' => 'true']);
    $app = new App($config, $db, false);
    $png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
    try {
        throws(401, fn() => $app->handle(req('POST', '/api/admin/media', ['data' => $png])));
        $noCsrf = $sessionHeaders; unset($noCsrf['x-csrf-token']);
        throws(403, fn() => $app->handle(req('POST', '/api/admin/media', ['data' => $png], $noCsrf)));
        throws(400, fn() => $app->handle(req('POST', '/api/admin/media', ['data' => base64_encode('<script>alert(1)</script>')], $sessionHeaders)));
        throws(400, fn() => $app->handle(req('POST', '/api/admin/media', ['data' => base64_encode(str_repeat('x', 2097153))], $sessionHeaders)));
        $upload = $app->handle(req('POST', '/api/admin/media', ['data' => $png], $sessionHeaders)); check($upload->status === 201);
        $url = jsonBody($upload)['url']; check((bool)preg_match('#^/media/[a-f0-9]{32}\.png$#', $url));
        $public = $app->handle(req('GET', $url)); check($public->status === 200 && $public->body === base64_decode($png));
        check($public->headers['Content-Type'] === 'image/png' && $public->headers['X-Content-Type-Options'] === 'nosniff');
        $a = articleInput('image-test'); $a['image'] = $url;
        check($app->handle(req('POST', '/api/admin/articles', $a, $sessionHeaders))->status === 201);
        check(str_contains($app->handle(req('GET', '/articles/image-test'))->body, $url));
        $app->handle(req('DELETE', '/api/admin/articles/image-test', null, $sessionHeaders));
    } finally { foreach (glob($dir . '/*') ?: [] as $file) unlink($file); if (is_dir($dir)) rmdir($dir); }
});
test('strict image and slug validation', function () use ($app, $sessionHeaders) { $a = articleInput(); $a['image'] = 'javascript:alert(1)'; throws(400, fn() => $app->handle(req('POST', '/api/admin/articles', $a, $sessionHeaders))); $a = articleInput('Bad_Slug'); throws(400, fn() => $app->handle(req('POST', '/api/admin/articles', $a, $sessionHeaders))); });
test('reservation validation, consent and honeypot', function () use ($app) { foreach ([['name' => 'A'], ['email' => 'invalid'], ['phone' => 'abc'], ['message' => 'short'], ['consent' => false], ['website' => 'spam']] as $change) throws(400, fn() => $app->handle(req('POST', '/api/reservations', reservationInput($change), ['idempotency-key' => Database::uuid()]))); });
test('native contact form works without JavaScript', function () use ($app, $db) {
    $page = $app->handle(req('GET', '/contact')); preg_match('/cmcb_csrf=([a-f0-9]{64})/', $page->headers['Set-Cookie'][0], $csrf); preg_match('/cmcb_key=([a-f0-9-]{36})/', $page->headers['Set-Cookie'][1], $key);
    $input = reservationInput(['name' => 'Formulaire natif', 'email' => 'native@example.test']) + ['_csrf' => $csrf[1], '_key' => $key[1], 'consent' => '1'];
    $request = new Request('POST', '/contact', ['host' => 'cmcb.test', 'content-type' => 'application/x-www-form-urlencoded', 'cookie' => 'cmcb_csrf=' . $csrf[1] . '; cmcb_key=' . $key[1]], http_build_query($input));
    $r = $app->handle($request); check($r->status === 303 && str_contains($r->headers['Location'], 'envoi=ok'));
    check(Database::one($db, 'SELECT id FROM reservations WHERE email=?', ['native@example.test']) !== null);
    check($app->handle($request)->status === 303);
    check((int)Database::one($db, 'SELECT COUNT(*) n FROM reservations WHERE email=?', ['native@example.test'])['n'] === 1);
    Database::run($db, 'DELETE FROM reservations WHERE email=?', ['native@example.test']);
});
test('native contact errors are HTML, not raw JSON', function () use ($app) {
    $request = new Request('POST', '/contact', ['host' => 'cmcb.test', 'content-type' => 'application/x-www-form-urlencoded'], http_build_query(['lang' => 'fr', '_csrf' => 'expired']));
    $r = $app->handle($request); check($r->status === 403 && str_contains($r->headers['Content-Type'], 'text/html') && str_contains($r->body, 'Le formulaire a expiré'));
});
test('reservation persistence, idempotent retry and conflict', function () use ($app, $db) {
    $key = Database::uuid(); $h = ['idempotency-key' => $key]; $input = reservationInput();
    $r = $app->handle(req('POST', '/api/reservations', $input, $h)); check($r->status === 201 && jsonBody($r)['persisted'] === true); $id = jsonBody($r)['id'];
    $r = $app->handle(req('POST', '/api/reservations', $input, $h)); check($r->status === 200 && jsonBody($r)['id'] === $id);
    throws(409, fn() => $app->handle(req('POST', '/api/reservations', reservationInput(['message' => 'Un message différent pour cette même demande.']), $h)));
    check((int)Database::one($db, 'SELECT COUNT(*) n FROM reservations')['n'] === 1);
    check(Database::one($db, 'SELECT consent_at FROM reservations WHERE id=?', [$id])['consent_at'] !== '');
});
test('reservation search, filter, pagination, status, deletion', function () use ($app, $sessionHeaders, $db) {
    $id = Database::one($db, 'SELECT id FROM reservations')['id'];
    $r = $app->handle(req('GET', '/api/admin/reservations?q=client%25&page=1&limit=1', null, $sessionHeaders)); check(jsonBody($r)['total'] === 0);
    $r = $app->handle(req('GET', '/api/admin/reservations?q=CLIENT&status=new&page=1&limit=1', null, $sessionHeaders)); check(jsonBody($r)['total'] === 1 && jsonBody($r)['counts']['new'] === 1);
    $r = $app->handle(req('PATCH', '/api/admin/reservations/' . $id, ['status' => 'contacted'], $sessionHeaders)); check(jsonBody($r)['reservation']['status'] === 'contacted');
    throws(400, fn() => $app->handle(req('PATCH', '/api/admin/reservations/' . $id, ['status' => 'invalid'], $sessionHeaders)));
    check($app->handle(req('DELETE', '/api/admin/reservations/' . $id, null, $sessionHeaders))->status === 200);
});
test('password change revokes all sessions', function () use ($app, $email, $sessionHeaders) {
    $new = 'New-test-password-2026!';
    $r = $app->handle(req('POST', '/api/auth/password', ['currentPassword' => 'Test-password-2026!', 'newPassword' => $new], $sessionHeaders)); check($r->status === 200);
    throws(401, fn() => $app->handle(req('GET', '/api/admin/articles', null, $sessionHeaders)));
    check($app->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => $new]))->status === 200);
});
test('expired sessions denied', function () use ($app, $db) { Database::run($db, 'UPDATE sessions SET expires_at=?', [time() - 1]); throws(401, fn() => $app->handle(req('GET', '/api/admin/articles'))); });
test('database-backed rate limit', function () use ($db) { $limiter = new RateLimiter($db); $limiter->hit('test', 'ip', 2, 60); $limiter->hit('test', 'ip', 2, 60); throws(429, fn() => $limiter->hit('test', 'ip', 2, 60)); $limiter->hit('test', 'other-ip', 2, 60); });
test('SMTP can be disabled without losing requests', function () use ($app) { $r = $app->handle(req('POST', '/api/reservations', reservationInput(), ['idempotency-key' => Database::uuid()])); $reservation = $app->repo->reservation(jsonBody($r)['id']); check($reservation['notification']['status'] === 'disabled'); });
test('outbox success and retry backoff with injected transport', function () use ($app, $db) {
    $r = $app->handle(req('POST', '/api/reservations', reservationInput(), ['idempotency-key' => Database::uuid()])); $id = jsonBody($r)['id']; Database::run($db, "UPDATE outbox SET status='pending' WHERE reservation_id=?", [$id]);
    $outbox = new Outbox($db, null); $sent = $outbox->processOnce(fn($r) => null); check($sent === 1 && $app->repo->reservation($id)['notification']['status'] === 'sent');
    Database::run($db, "UPDATE outbox SET status='pending',attempts=0 WHERE reservation_id=?", [$id]); $outbox->processOnce(fn($r) => throw new RuntimeException('SMTP test failure'));
    $row = Database::one($db, 'SELECT * FROM outbox WHERE reservation_id=?', [$id]); check($row['status'] === 'pending' && (int)$row['attempts'] === 1 && (int)$row['next_attempt_at'] > time());
    check(!str_contains($row['last_error'], 'SMTP test failure'));
});
test('SMTP message encoding and header injection protection', function () { $m = Mailer::message('CMCB <test@example.test>', 'cabinet@example.test', ['id' => Database::uuid(), 'name' => 'شيماء', 'email' => 'test@example.test', 'phone' => '', 'domain' => 'Affaires', 'urgency' => 'normal', 'lang' => 'fr', 'message' => ".ligne\nTexte"]); check(str_contains($m, 'charset=UTF-8') && str_contains($m, '..ligne')); throwsRuntime(fn() => Mailer::message("test@example.test\r\nBcc: evil@example.test", 'cabinet@example.test', [])); });
test('account login limit applies across IPs and unknown accounts', function () use ($config, $db) {
    $limited = new App($config, $db, true); $email = 'limited-unknown@example.test';
    $key = hash('sha256', 'login-account:' . $email);
    Database::run($db, 'INSERT INTO rate_limits (`key`,hits,reset_at) VALUES (?,?,?)', [$key, 10, time() + 900]);
    try {
        throws(429, fn() => $limited->handle(req('POST', '/api/auth/login', ['email' => strtoupper($email), 'password' => 'wrong'], [], '198.51.100.10')));
        throws(429, fn() => $limited->handle(req('POST', '/api/auth/login', ['email' => $email, 'password' => 'wrong'], [], '198.51.100.11')));
        throws(401, fn() => $limited->handle(req('POST', '/api/auth/login', ['email' => 'another-unknown@example.test', 'password' => 'wrong'], [], '198.51.100.12')));
    } finally { Database::run($db, 'DELETE FROM rate_limits WHERE `key`=?', [$key]); }
});
test('production requires MySQL and rejects insecure origin and preview Bearer', function () use ($root) {
    throwsRuntime(fn() => new Config($root, ['APP_ENV' => 'production']));
    throwsRuntime(fn() => new Config($root, ['APP_ENV' => 'production', 'APP_ORIGIN' => 'https://cmcb.test', 'DB_DRIVER' => 'sqlite']));
    $c = new Config($root, ['APP_ENV' => 'production', 'APP_ORIGIN' => 'https://cmcb.test', 'DB_DRIVER' => 'mysql', 'DB_NAME' => 'cmcb', 'DB_USER' => 'test', 'PREVIEW_BEARER_AUTH' => 'true']);
    check(!$c->previewBearer && $c->databaseDriver === 'mysql');
});
test('invalid modes, credential origins and unverified remote MySQL fail closed', function () use ($root) {
    $base = ['APP_ENV' => 'production', 'APP_ORIGIN' => 'https://cmcb.test', 'DB_DRIVER' => 'mysql', 'DB_NAME' => 'cmcb', 'DB_USER' => 'test'];
    throwsRuntime(fn() => new Config($root, ['APP_ENV' => 'prodution'] + $base));
    throwsRuntime(fn() => new Config($root, ['APP_ORIGIN' => 'https://user:pass@cmcb.test'] + $base));
    throwsRuntime(fn() => new Config($root, ['DB_HOST' => 'db.example.test'] + $base));
    throwsRuntime(fn() => new Config($root, ['DB_HOST' => 'db.example.test', 'DB_SSL_CA' => '/missing-ca.pem'] + $base));
    $c = new Config($root, ['DB_HOST' => 'db.example.test', 'DB_SSL_CA' => __FILE__] + $base);
    check($c->mysql['sslCa'] === __FILE__);
});
test('explicit environment values override .env', function () use ($root) {
    $before = getenv('APP_ORIGIN');
    try {
        putenv('APP_ORIGIN=https://override.example.test');
        check((Config::environment($root)['APP_ORIGIN'] ?? null) === 'https://override.example.test');
    } finally { $before === false ? putenv('APP_ORIGIN') : putenv('APP_ORIGIN=' . $before); }
});
test('MySQL configuration validates DSN and preserves encoded credentials', function () use ($root) {
    $base = ['DB_DRIVER' => 'mysql', 'DB_NAME' => 'cmcb', 'DB_USER_BASE64' => base64_encode('user #1'), 'DB_PASSWORD_BASE64' => base64_encode(" pass #=\" ")];
    $c = new Config($root, $base); check($c->mysql['user'] === 'user #1' && $c->mysql['password'] === " pass #=\" ");
    throwsRuntime(fn() => new Config($root, ['DB_HOST' => 'localhost;dbname=other'] + $base));
    throwsRuntime(fn() => new Config($root, ['DB_PORT' => '99999'] + $base));
    throwsRuntime(fn() => new Config($root, ['DB_PASSWORD_BASE64' => '%%%'] + $base));
});
test('security headers and private data path', function () use ($app) { $r = $app->handle(req('GET', '/api/health')); check($r->headers['X-Content-Type-Options'] === 'nosniff' && str_contains($r->headers['Content-Security-Policy'], "object-src 'none'")); check(!str_starts_with(realpath(dirname(__DIR__) . '/data') ?: '/app/data', $app->config->root . '/public')); });
if (!$mysqlTest) test('SQLite preview backup is coherent and excludes deleted seed data', function () use ($temp, $seedDb) { (new Repository($seedDb))->delete('articles', 'creer-sa-societe-suarl-sarl'); $file = $temp . '/backup.sqlite'; $seedDb->exec('VACUUM INTO ' . $seedDb->quote($file)); $restored = Database::open($file); check(count((new Repository($restored))->articles()) === 3); });
// Close handles. Never drop the dedicated MySQL test database automatically.
$db = null; $seedDb = null; $app = null;
if ($temp !== null) { foreach (glob($temp . '/*') ?: [] as $file) if (is_file($file)) unlink($file); rmdir($temp); }
echo "\n$passed passed, $failed failed\n";
if ($failed) exit(1);
// Normal return also lets the sandbox's PHP-WASM adapter release its runtime cleanly.
