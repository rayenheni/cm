<?php
declare(strict_types=1);
namespace CMCB;

final class Validation
{
    public const DOMAINS = ['affaires', 'famille', 'travail', 'penal', 'mediation'];
    private array $errors = [];
    public static function keys(array $input, array $keys): void
    {
        $unknown = array_diff(array_keys($input), $keys); $missing = array_diff($keys, array_keys($input));
        if ($unknown || $missing) throw new HttpError(400, 'VALIDATION_ERROR', 'Veuillez vérifier les champs envoyés.', ['_form' => 'Champs inattendus ou manquants.']);
    }
    private function text(array $data, string $key, int $min, int $max, bool $optional = false): string
    {
        $v = $data[$key] ?? null;
        if (!is_string($v)) { $this->errors[$key] = 'Texte attendu.'; return ''; }
        $v = trim($v); $len = mb_strlen($v);
        if ($len < ($optional && $v === '' ? 0 : $min) || $len > $max) $this->errors[$key] = "Entre $min et $max caractères.";
        if (str_contains($v, "\0")) $this->errors[$key] = 'Caractère non autorisé.';
        return $v;
    }
    private function finish(array $value): array { if ($this->errors) throw new HttpError(400, 'VALIDATION_ERROR', 'Veuillez vérifier les champs envoyés.', $this->errors); return $value; }
    public function reservation(array $input): array
    {
        self::keys($input, ['name', 'email', 'phone', 'domain', 'urgency', 'message', 'lang', 'consent', 'website']);
        $name = $this->text($input, 'name', 2, 120);
        $email = $this->text($input, 'email', 3, 254);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $this->errors['email'] = 'Adresse e-mail invalide.';
        $phone = $this->text($input, 'phone', 0, 40, true);
        if ($phone !== '' && !preg_match('/^[+\d][\d\s.\-()]{7,}$/u', $phone)) $this->errors['phone'] = 'Numéro de téléphone invalide.';
        $domain = $this->text($input, 'domain', 1, 200);
        $message = $this->text($input, 'message', 15, 5000);
        if (!in_array($input['urgency'] ?? null, ['normal', '48h', 'urgent'], true)) $this->errors['urgency'] = 'Degré d’urgence invalide.';
        if (!in_array($input['lang'] ?? null, ['fr', 'ar'], true)) $this->errors['lang'] = 'Langue invalide.';
        if (($input['consent'] ?? null) !== true) $this->errors['consent'] = 'Votre accord est nécessaire.';
        if (($input['website'] ?? null) !== '') $this->errors['website'] = 'Requête refusée.';
        return $this->finish(['name' => $name, 'email' => strtolower($email), 'phone' => $phone, 'domain' => $domain, 'urgency' => $input['urgency'], 'message' => $message, 'lang' => $input['lang'], 'consent' => true, 'website' => '']);
    }
    public function credentials(array $input): array
    {
        if (array_diff(array_keys($input), ['email', 'password', 'transport']) || !isset($input['email'], $input['password'])) throw new HttpError(400, 'VALIDATION_ERROR', 'E-mail et mot de passe requis.');
        $email = $this->text($input, 'email', 3, 254);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $this->errors['email'] = 'Adresse e-mail invalide.';
        $password = $input['password'] ?? '';
        if (!is_string($password) || $password === '' || strlen($password) > 128) $this->errors['password'] = 'Mot de passe invalide (128 octets maximum).';
        if (isset($input['transport']) && !in_array($input['transport'], ['cookie', 'bearer'], true)) $this->errors['transport'] = 'Transport invalide.';
        return $this->finish(['email' => strtolower($email), 'password' => $password, 'transport' => $input['transport'] ?? 'cookie']);
    }
    public function article(array $input): array
    {
        self::keys($input, ['id', 'expertiseId', 'image', 'status', 'translations']);
        $id = $this->text($input, 'id', 1, 120);
        if (!preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $id)) $this->errors['id'] = 'Utilisez des minuscules, chiffres et tirets simples.';
        if (!in_array($input['expertiseId'] ?? null, self::DOMAINS, true)) $this->errors['expertiseId'] = 'Domaine invalide.';
        if (!in_array($input['status'] ?? null, ['draft', 'published'], true)) $this->errors['status'] = 'Statut invalide.';
        $image = $input['image'] ?? null;
        if (!is_string($image) || strlen($image) > 2048 || ($image !== '' && !preg_match('#^/media/[a-f0-9]{32}\.(?:jpg|png|webp)$#D', $image) && (!filter_var($image, FILTER_VALIDATE_URL) || !str_starts_with($image, 'https://')))) $this->errors['image'] = 'Utilisez une image téléversée ou un lien HTTPS.';
        $trs = $input['translations'] ?? null;
        if (!is_array($trs) || !isset($trs['fr']) || array_diff(array_keys($trs), ['fr', 'ar'])) $this->errors['translations'] = 'Traductions FR et AR attendues.';
        else {
            if (($input['status'] ?? '') === 'published' && !isset($trs['ar'])) $this->errors['translations.ar'] = 'Ajoutez la traduction arabe avant publication.';
            $translations = [];
            foreach ($trs as $lang => $tr) {
                if (!is_array($tr)) { $this->errors["translations.$lang"] = 'Objet attendu.'; continue; }
                try { self::keys($tr, ['category', 'readTime', 'title', 'excerpt', 'imageAlt', 'intro', 'sections', 'keyPoints']); }
                catch (HttpError $e) { $this->errors["translations.$lang"] = $e->getMessage(); continue; }
                $v = new self();
                $out = ['category' => $v->text($tr, 'category', 1, 120), 'readTime' => $v->text($tr, 'readTime', 1, 40), 'title' => $v->text($tr, 'title', 1, 240), 'excerpt' => $v->text($tr, 'excerpt', 1, 1200), 'imageAlt' => $v->text($tr, 'imageAlt', 0, 300, true), 'intro' => $v->text($tr, 'intro', 1, 10000)];
                foreach (['sections' => [1, 30], 'keyPoints' => [0, 20]] as $key => [$min, $max]) {
                    $items = $tr[$key] ?? null;
                    if (!is_array($items) || !array_is_list($items) || count($items) < $min || count($items) > $max) { $v->errors["$key"] = "Entre $min et $max éléments."; $out[$key] = []; continue; }
                    $out[$key] = $items;
                    foreach ($items as $i => $item) {
                        if ($key === 'keyPoints') {
                            if (!is_string($item) || trim($item) === '' || mb_strlen(trim($item)) > 1000 || str_contains($item, "\0")) $v->errors["$key.$i"] = 'Texte de 1 à 1000 caractères attendu.';
                            else $out[$key][$i] = trim($item);
                        } else {
                            if (!is_array($item)) { $v->errors["$key.$i"] = 'Section invalide.'; continue; }
                            try { self::keys($item, ['heading', 'paragraphs']); } catch (HttpError) { $v->errors["$key.$i"] = 'Section invalide.'; continue; }
                            $out[$key][$i] = ['heading' => $v->text($item, 'heading', 1, 240), 'paragraphs' => []];
                            $ps = $item['paragraphs'] ?? null;
                            if (!is_array($ps) || !array_is_list($ps) || count($ps) < 1 || count($ps) > 40) { $v->errors["$key.$i.paragraphs"] = 'Entre 1 et 40 paragraphes.'; continue; }
                            foreach ($ps as $j => $p) {
                                if (!is_string($p) || trim($p) === '' || mb_strlen(trim($p)) > 10000 || str_contains($p, "\0")) $v->errors["$key.$i.paragraphs.$j"] = 'Paragraphe de 1 à 10000 caractères attendu.';
                                else $out[$key][$i]['paragraphs'][] = trim($p);
                            }
                        }
                    }
                }
                if ($v->errors) foreach ($v->errors as $k => $msg) $this->errors["translations.$lang.$k"] = $msg;
                $translations[$lang] = $out;
            }
        }
        return $this->finish(['id' => $id, 'expertiseId' => $input['expertiseId'], 'image' => $image, 'status' => $input['status'], 'translations' => $translations ?? []]);
    }
    public static function listQuery(array $input): array
    {
        if (array_diff(array_keys($input), ['page', 'limit', 'status', 'q'])) throw new HttpError(400, 'VALIDATION_ERROR', 'Paramètres de liste invalides.');
        foreach (['page' => 1, 'limit' => 25] as $k => $default) {
            $v = $input[$k] ?? (string)$default;
            if (!is_string($v) && !is_int($v) || !preg_match('/^\d+$/', (string)$v) || (int)$v < 1 || (int)$v > ($k === 'limit' ? 100 : 1000000)) throw new HttpError(400, 'VALIDATION_ERROR', 'Pagination invalide.');
        }
        if (isset($input['status']) && !in_array($input['status'], ['new', 'contacted', 'closed'], true)) throw new HttpError(400, 'VALIDATION_ERROR', 'Statut invalide.');
        if (isset($input['q']) && (!is_string($input['q']) || mb_strlen($input['q']) > 200)) throw new HttpError(400, 'VALIDATION_ERROR', 'Recherche trop longue.');
        return ['page' => (int)($input['page'] ?? 1), 'limit' => (int)($input['limit'] ?? 25), 'status' => $input['status'] ?? null, 'q' => trim($input['q'] ?? '')];
    }
}
