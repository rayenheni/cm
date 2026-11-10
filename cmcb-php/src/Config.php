<?php
declare(strict_types=1);
namespace CMCB;

final class Config
{
    public readonly string $root;
    public readonly string $databasePath;
    public readonly string $databaseDriver;
    public readonly string $mediaPath;
    public readonly array $mysql;
    public readonly bool $production;
    public readonly ?string $appOrigin;
    public readonly bool $previewBearer;
    public readonly string $cookiePolicy;
    public readonly int $trustProxy;
    public readonly ?array $smtp;

    public function __construct(string $root, ?array $env = null)
    {
        $this->root = rtrim($root, '/');
        $env ??= self::environment($this->root);
        $mode = $env['APP_ENV'] ?? 'development';
        if (!in_array($mode, ['development', 'production', 'test'], true)) throw new \RuntimeException('APP_ENV doit être development, test ou production.');
        $this->production = $mode === 'production';
        $origin = trim($env['APP_ORIGIN'] ?? '');
        if ($origin !== '') {
            $p = parse_url($origin);
            if (!$p || !in_array($p['scheme'] ?? '', ['http', 'https'], true) || !isset($p['host']) || isset($p['user']) || isset($p['pass']) || isset($p['path']) || isset($p['query']) || isset($p['fragment']) || rtrim($origin, '/') !== $origin) {
                throw new \RuntimeException('APP_ORIGIN doit être une origine HTTP(S), sans chemin.');
            }
            if ($this->production && $p['scheme'] !== 'https') throw new \RuntimeException('APP_ORIGIN doit utiliser HTTPS en production.');
            $this->appOrigin = $origin;
        } else {
            if ($this->production) throw new \RuntimeException('Définissez APP_ORIGIN en production.');
            $this->appOrigin = null;
        }
        // Legacy SQLite is available only for existing development previews and tests.
        $this->databaseDriver = $env['DB_DRIVER'] ?? (isset($env['DATABASE_PATH']) ? 'sqlite' : 'mysql');
        if (!in_array($this->databaseDriver, ['mysql', 'sqlite'], true) || ($this->production && $this->databaseDriver !== 'mysql')) throw new \RuntimeException('La production exige MySQL.');
        $path = $env['DATABASE_PATH'] ?? 'data/cmcb.sqlite';
        $this->databasePath = str_starts_with($path, '/') ? $path : $this->root . '/' . $path;
        $mediaPath = $env['MEDIA_PATH'] ?? 'data/media';
        if ($mediaPath === '' || str_contains($mediaPath, "\0")) throw new \RuntimeException('MEDIA_PATH invalide.');
        $this->mediaPath = str_starts_with($mediaPath, '/') ? $mediaPath : $this->root . '/' . $mediaPath;
        $host = $env['DB_HOST'] ?? '127.0.0.1'; $port = $env['DB_PORT'] ?? '3306'; $name = $env['DB_NAME'] ?? '';
        $user = isset($env['DB_USER_BASE64']) ? base64_decode($env['DB_USER_BASE64'], true) : ($env['DB_USER'] ?? '');
        if ($this->databaseDriver === 'mysql' && ($user === false || !preg_match('/^[a-zA-Z0-9.:-]+$/', $host) || !ctype_digit($port) || (int)$port < 1 || (int)$port > 65535 || !preg_match('/^[a-zA-Z0-9_$-]{1,64}$/', $name) || $user === '' || preg_match('/[\r\n\0]/', $user))) throw new \RuntimeException('Configuration MySQL invalide.');
        $pass = isset($env['DB_PASSWORD_BASE64']) ? base64_decode($env['DB_PASSWORD_BASE64'], true) : ($env['DB_PASSWORD'] ?? '');
        if ($pass === false) throw new \RuntimeException('Mot de passe MySQL invalide.');
        $ca = $env['DB_SSL_CA'] ?? '';
        if ($ca !== '' && (!str_starts_with($ca, '/') || strpbrk($ca, "\r\n\0") !== false || str_contains($ca, ' #') || !is_file($ca) || !is_readable($ca))) throw new \RuntimeException('DB_SSL_CA doit désigner un fichier CA absolu et lisible.');
        if ($this->production && $this->databaseDriver === 'mysql' && !in_array(strtolower($host), ['localhost', '127.0.0.1', '::1'], true) && $ca === '') throw new \RuntimeException('MySQL distant exige DB_SSL_CA et une connexion TLS vérifiée.');
        $this->mysql = ['host' => $host, 'port' => (int)$port, 'name' => $name, 'user' => $user, 'password' => $pass, 'sslCa' => $ca];
        $policy = $env['SESSION_COOKIE_SAMESITE'] ?? 'strict';
        if (!in_array($policy, ['strict', 'none'], true)) throw new \RuntimeException('SESSION_COOKIE_SAMESITE : strict ou none.');
        $this->cookiePolicy = $policy;
        $this->previewBearer = !$this->production && ($env['PREVIEW_BEARER_AUTH'] ?? '') === 'true';
        $proxy = $env['TRUST_PROXY'] ?? '0';
        if (!ctype_digit($proxy)) throw new \RuntimeException('TRUST_PROXY doit être un entier positif.');
        $this->trustProxy = (int)$proxy;
        $this->smtp = null;
        if (trim($env['SMTP_HOST'] ?? '') !== '') {
            foreach (['SMTP_HOST', 'SMTP_FROM', 'NOTIFICATION_EMAIL'] as $key) {
                if (trim($env[$key] ?? '') === '') throw new \RuntimeException("$key est obligatoire avec SMTP.");
            }
            $port = $env['SMTP_PORT'] ?? '587';
            if (!ctype_digit($port) || (int)$port < 1 || (int)$port > 65535) throw new \RuntimeException('SMTP_PORT invalide.');
            foreach (['SMTP_FROM', 'NOTIFICATION_EMAIL'] as $key) {
                if (!self::address($env[$key])) throw new \RuntimeException("$key invalide.");
            }
            if ((($env['SMTP_USER'] ?? '') !== '') !== (($env['SMTP_PASS'] ?? '') !== '')) throw new \RuntimeException('Définissez SMTP_USER et SMTP_PASS ensemble, ou laissez les deux vides.');
            $this->smtp = ['host' => $env['SMTP_HOST'], 'port' => (int)$port, 'secure' => ($env['SMTP_SECURE'] ?? '') === 'true', 'user' => $env['SMTP_USER'] ?? '', 'pass' => $env['SMTP_PASS'] ?? '', 'from' => $env['SMTP_FROM'], 'to' => $env['NOTIFICATION_EMAIL']];
        }
    }

    public static function environment(string $root): array
    {
        $values = [];
        $file = $root . '/.env';
        if (is_file($file)) {
            foreach (file($file, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !preg_match('/^([A-Z0-9_]+)\s*=\s*(.*)$/', $line, $m)) continue;
                $v = trim($m[2]);
                if (strlen($v) >= 2 && (($v[0] === '"' && str_ends_with($v, '"')) || ($v[0] === "'" && str_ends_with($v, "'")))) $v = substr($v, 1, -1);
                elseif (($pos = strpos($v, ' #')) !== false) $v = rtrim(substr($v, 0, $pos));
                $values[$m[1]] = $v;
            }
        }
        foreach ($_ENV as $k => $v) if (is_string($v)) $values[$k] = $v;
        foreach (getenv() as $k => $v) $values[$k] = $v;
        // PHP-WASM exposes request-scoped values through getenv($name) even
        // where the unqualified getenv() snapshot omits them. Native PHP also
        // benefits from consistently applying explicit process overrides.
        foreach (['APP_ENV', 'APP_ORIGIN', 'DATABASE_PATH', 'MEDIA_PATH', 'DB_DRIVER', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_USER_BASE64', 'DB_PASSWORD', 'DB_PASSWORD_BASE64', 'DB_SSL_CA', 'TRUST_PROXY', 'SESSION_COOKIE_SAMESITE', 'PREVIEW_BEARER_AUTH', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'NOTIFICATION_EMAIL'] as $key) {
            $value = getenv($key);
            if ($value !== false) $values[$key] = $value;
        }
        return $values;
    }

    public static function address(string $value): ?string
    {
        if (preg_match('/<([^<>]+)>/', $value, $m)) $value = $m[1];
        return filter_var(trim($value), FILTER_VALIDATE_EMAIL) ?: null;
    }
}
