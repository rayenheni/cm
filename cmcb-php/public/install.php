<?php
declare(strict_types=1);
// First installation only. A server operator must first enable it via the CLI.
$root = dirname(__DIR__);
ini_set('display_errors', '0');
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
header('Referrer-Policy: no-referrer');
$keyFile = $root . '/.install-key';
if (file_exists($root . '/.env') || !is_file($keyFile)) { http_response_code(404); exit('Installation fermée.'); }
if (!extension_loaded('pdo_mysql') || !extension_loaded('mbstring') || !extension_loaded('openssl')) { http_response_code(503); exit('Extensions PHP requises : pdo_mysql, mbstring et openssl.'); }
require $root . '/src/Config.php';
require $root . '/src/Http.php';
require $root . '/src/Database.php';
require $root . '/src/MySqlSchema.php';
require $root . '/src/Auth.php';
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
// HTTPS termination at a trusted reverse proxy must be configured at the web server.
// Do not trust arbitrary X-Forwarded-Proto headers here.
$local = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true);
$localHttp = !$secure && $local && getenv('CMCB_INSTALL_ALLOW_HTTP_LOCAL') === 'true' && preg_match('/^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]+)?$/i', $_SERVER['HTTP_HOST'] ?? '');
if (!$secure && !$localHttp) { http_response_code(403); exit('HTTPS est obligatoire pour installer le site.'); }
ini_set('session.use_strict_mode', '1');
session_set_cookie_params(['path' => '/install.php', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict']);
session_start();
if (!isset($_SESSION['install_csrf'])) $_SESSION['install_csrf'] = bin2hex(random_bytes(32));
$error = ''; $success = false;
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $lock = null; $createdEnv = false;
    try {
        $value = static function (string $name): string {
            $v = $_POST[$name] ?? '';
            if (!is_string($v) || strlen($v) > 1024 || str_contains($v, "\0") || str_contains($v, "\n") || str_contains($v, "\r")) throw new RuntimeException('Champ invalide.');
            return $v;
        };
        if (!hash_equals($_SESSION['install_csrf'], $value('csrf'))) throw new RuntimeException('Session expirée. Rechargez le formulaire.');
        $key = $value('setup_key'); $expected = @file_get_contents($keyFile);
        if (!preg_match('/^[a-f0-9]{64}$/', $key) || !is_string($expected) || !hash_equals($expected, hash('sha256', $key))) throw new RuntimeException('Clé d’installation invalide.');
        $host = trim($value('host')); $port = trim($value('port')); $name = trim($value('db_name')); $user = trim($value('db_user')); $dbPass = $value('db_password'); $dbCa = trim($value('db_ssl_ca'));
        $email = strtolower(trim($value('admin_email'))); $password = $value('admin_password');
        $origin = trim($value('origin'));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) throw new RuntimeException('Adresse administrateur invalide.');
        if ($password !== $value('admin_password_confirm')) throw new RuntimeException('Les mots de passe administrateur ne correspondent pas.');
        $hash = CMCB\Auth::hash($password);
        // Production always requires HTTPS; local testing uses development explicitly.
        $mode = $localHttp ? 'development' : 'production';
        $env = ['APP_ENV' => $mode, 'APP_ORIGIN' => $origin, 'DB_DRIVER' => 'mysql', 'DB_HOST' => $host, 'DB_PORT' => $port, 'DB_NAME' => $name, 'DB_USER_BASE64' => base64_encode($user), 'DB_PASSWORD_BASE64' => base64_encode($dbPass), 'DB_SSL_CA' => $dbCa, 'TRUST_PROXY' => '0', 'SESSION_COOKIE_SAMESITE' => 'strict', 'PREVIEW_BEARER_AUTH' => 'false'];
        $config = new CMCB\Config($root, $env);
        if (!$config->appOrigin) throw new RuntimeException('Indiquez l’origine exacte du site.');
        umask(0077);
        $lock = @fopen($root . '/.install.lock', 'c');
        if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('Une installation est déjà en cours.');
        if (file_exists($root . '/.env') || !is_file($keyFile)) throw new RuntimeException('Installation déjà terminée.');
        // Reserve .env before touching the database. Exclusive creation prevents overwrites.
        $file = @fopen($root . '/.env', 'x');
        if (!$file) throw new RuntimeException('Impossible de créer .env : vérifiez les permissions du dossier applicatif.');
        $createdEnv = true;
        try {
            if (!chmod($root . '/.env', 0600)) throw new RuntimeException('Impossible de protéger .env.');
            $db = CMCB\Database::connect($config);
            CMCB\MySqlSchema::install($db);
            CMCB\Database::transaction($db, function () use ($db, $email, $hash) {
                CMCB\Database::run($db, 'INSERT INTO admins(email,password_hash,created_at) VALUES (?,?,?)', [$email, $hash, CMCB\Database::now()]);
                CMCB\Database::run($db, "INSERT INTO meta (`key`,value) VALUES ('admin_provisioned','1')");
            });
            // Values containing arbitrary credentials are encoded; the config parser decodes them.
            $lines = [];
            foreach ($env as $k => $v) $lines[] = $k . '=' . $v;
            $contents = implode("\n", $lines) . "\n";
            if (fwrite($file, $contents) !== strlen($contents) || !fflush($file)) throw new RuntimeException('Impossible d’écrire la configuration.');
            fclose($file); $file = null;
            // .env itself closes the installer even if the key cannot be removed.
            $createdEnv = false;
            if (!@unlink($keyFile)) error_log('CMCB install: remove .install-key manually');
            $success = true;
            $_SESSION = []; session_destroy();
        } catch (Throwable $e) {
            if (is_resource($file)) fclose($file);
            // If configuration was not published, allow an operator to retry with an empty DB.
            if ($createdEnv) @unlink($root . '/.env');
            throw $e;
        }
    } catch (Throwable $e) {
        error_log('CMCB install: ' . get_class($e));
        $error = $e instanceof CMCB\HttpError ? $e->getMessage() : ($e instanceof PDOException ? 'Connexion ou initialisation MySQL impossible. Vérifiez les paramètres, les droits et utilisez une base vide.' : $e->getMessage());
    } finally { if (is_resource($lock)) { flock($lock, LOCK_UN); fclose($lock); } }
}
function h(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
?><!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Installation CMCB</title><style>
body{margin:0;background:#f7f2e9;color:#342a2d;font:16px/1.5 system-ui,sans-serif}main{max-width:720px;margin:3rem auto;padding:2rem;background:#fff;border:1px solid #e4d8c3;border-radius:12px}h1,h2{color:#572939}label{display:block;font-weight:600;margin-top:1rem}input{box-sizing:border-box;width:100%;padding:.7rem;border:1px solid #baa99e;border-radius:5px;font:inherit}button{background:#572939;color:#fff;padding:.8rem 1.3rem;border:0;border-radius:5px;font:inherit;margin-top:1.5rem;cursor:pointer}.error{color:#9c1e1e}.hint{font-size:.9rem;color:#615453}@media(max-width:780px){main{margin:1rem;padding:1.2rem}}
</style></head><body><main><h1>Installation CMCB</h1>
<?php if ($success): ?><p>Installation terminée. La base MySQL et le compte administrateur ont été créés. L’installateur est maintenant fermé.</p><p><a href="/admin">Ouvrir l’administration</a></p><p class="hint">Retirez le droit d’écriture temporaire du dossier applicatif et supprimez ou bloquez install.php sur le serveur.</p>
<?php else: ?><p>Utilisez une base MySQL <strong>vide et dédiée</strong>, préalablement créée chez votre hébergeur. Les données SQLite existantes ne sont pas importées.</p>
<?php if ($error !== ''): ?><p class="error" role="alert"><?=h($error)?></p><?php endif; ?>
<form method="post" action="/install.php" autocomplete="off"><input type="hidden" name="csrf" value="<?=h($_SESSION['install_csrf'])?>">
<label>Clé d’installation<input name="setup_key" type="password" required></label>
<h2>Base MySQL</h2><label>Serveur<input name="host" value="127.0.0.1" required></label><label>Port<input name="port" value="3306" inputmode="numeric" required></label><label>Nom de la base<input name="db_name" required></label><label>Utilisateur MySQL<input name="db_user" required></label><label>Mot de passe MySQL<input name="db_password" type="password"></label><label>Chemin absolu du certificat CA MySQL<input name="db_ssl_ca" placeholder="/etc/ssl/certs/mysql-ca.pem"></label><p class="hint">Obligatoire pour un serveur MySQL distant en production. Le certificat doit être fourni par l’hébergeur et lisible par PHP-FPM.</p>
<h2>Compte administrateur</h2><label>Adresse e-mail<input name="admin_email" type="email" maxlength="254" required></label><label>Mot de passe (12 à 128 octets)<input name="admin_password" type="password" minlength="12" required></label><label>Confirmer le mot de passe<input name="admin_password_confirm" type="password" minlength="12" required></label>
<h2>Site</h2><label>Origine exacte du site (HTTPS en production)<input name="origin" type="url" placeholder="https://votre-domaine.tn" required></label><p class="hint">Sans chemin ni slash final. Les identifiants MySQL sont conservés dans .env, en dehors de public/.</p><button type="submit">Installer</button></form><?php endif; ?></main></body></html>
