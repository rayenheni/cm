<?php
declare(strict_types=1);
namespace CMCB;

final class Database
{
    public static function connect(Config $config): \PDO
    {
        if ($config->databaseDriver === 'sqlite') return self::open($config->databasePath);
        $m = $config->mysql;
        $options = [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION, \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC, \PDO::ATTR_EMULATE_PREPARES => false];
        if ($m['sslCa'] !== '') {
            if (!defined('PDO::MYSQL_ATTR_SSL_CA') || !defined('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')) throw new \RuntimeException('Ce pilote PDO MySQL ne permet pas la vérification TLS requise.');
            $options[constant('PDO::MYSQL_ATTR_SSL_CA')] = $m['sslCa'];
            $options[constant('PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT')] = true;
        }
        $db = new \PDO('mysql:host=' . $m['host'] . ';port=' . $m['port'] . ';dbname=' . $m['name'] . ';charset=utf8mb4', $m['user'], $m['password'], $options);
        if ($m['sslCa'] !== '') {
            // Refuse a driver/server downgrade to a cleartext connection.
            $cipher = $db->query("SHOW SESSION STATUS LIKE 'Ssl_cipher'")->fetch();
            if (!$cipher || empty($cipher['Value'])) throw new \RuntimeException('La connexion MySQL n’utilise pas TLS.');
        }
        return $db;
    }
    public static function isMysql(\PDO $db): bool { return $db->getAttribute(\PDO::ATTR_DRIVER_NAME) === 'mysql'; }

    public static function open(string $path): \PDO
    {
        if ($path !== ':memory:') {
            $dir = dirname($path);
            if (!is_dir($dir)) mkdir($dir, 0700, true);
            chmod($dir, 0700);
        }
        $pdo = new \PDO('sqlite:' . $path, null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION, \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC, \PDO::ATTR_EMULATE_PREPARES => false]);
        if ($path !== ':memory:') chmod($path, 0600);
        $pdo->exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS admins (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE, csrf_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
            CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
            CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, expertise_id TEXT NOT NULL, image TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN (\'draft\',\'published\')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, published_at TEXT);
            CREATE TABLE IF NOT EXISTS article_translations (article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, lang TEXT NOT NULL CHECK(lang IN (\'fr\',\'ar\')), body TEXT NOT NULL, PRIMARY KEY(article_id,lang));
            CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, payload_hash TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, consent_at TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN (\'new\',\'contacted\',\'closed\')), name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, domain TEXT NOT NULL, urgency TEXT NOT NULL, message TEXT NOT NULL, lang TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS reservations_created ON reservations(created_at DESC);
            CREATE INDEX IF NOT EXISTS reservations_status ON reservations(status);
            CREATE TABLE IF NOT EXISTS outbox (reservation_id TEXT PRIMARY KEY REFERENCES reservations(id) ON DELETE CASCADE, status TEXT NOT NULL CHECK(status IN (\'disabled\',\'pending\',\'sending\',\'sent\',\'failed\')), attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL DEFAULT 0, last_error TEXT, sent_at TEXT);
            CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, hits INTEGER NOT NULL, reset_at INTEGER NOT NULL);
        ');
        if (!self::one($pdo, "SELECT value FROM meta WHERE key='articles_seeded'")) {
            self::transaction($pdo, function () use ($pdo, $path) {
                // A fresh in-memory test database can intentionally contain no seed.
                $seed = $path === ':memory:' ? [] : json_decode(file_get_contents(dirname(__DIR__) . '/resources/articles.json'), true, 512, JSON_THROW_ON_ERROR);
                foreach ($seed as $a) {
                    self::run($pdo, 'INSERT OR IGNORE INTO articles VALUES (?,?,?,?,?,?,?)', [$a['id'], $a['expertiseId'], $a['image'], $a['status'], $a['createdAt'], $a['updatedAt'], $a['publishedAt']]);
                    foreach ($a['translations'] as $lang => $body) self::run($pdo, 'INSERT OR IGNORE INTO article_translations VALUES (?,?,?)', [$a['id'], $lang, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
                }
                self::run($pdo, "INSERT INTO meta VALUES ('articles_seeded','1')");
            });
        }
        self::run($pdo, 'DELETE FROM sessions WHERE expires_at < ?', [time()]);
        self::run($pdo, 'DELETE FROM rate_limits WHERE reset_at < ?', [time()]);
        // Do not reclaim another active worker's jobs when opening a web request.
        // The locked CLI worker recovers interrupted jobs at startup.
        return $pdo;
    }
    public static function run(\PDO $db, string $sql, array $params = []): \PDOStatement
    {
        $st = $db->prepare($sql);
        foreach (array_values($params) as $i => $value) $st->bindValue($i + 1, $value, is_int($value) ? \PDO::PARAM_INT : ($value === null ? \PDO::PARAM_NULL : \PDO::PARAM_STR));
        $st->execute(); return $st;
    }
    public static function one(\PDO $db, string $sql, array $params = []): ?array
    {
        return self::run($db, $sql, $params)->fetch() ?: null;
    }
    public static function transaction(\PDO $db, callable $fn): mixed
    {
        if (self::isMysql($db)) $db->beginTransaction(); else $db->exec('BEGIN IMMEDIATE');
        try { $result = $fn(); $db->exec('COMMIT'); return $result; }
        catch (\Throwable $e) { if ($db->inTransaction()) $db->exec('ROLLBACK'); throw $e; }
    }
    public static function uuid(): string
    {
        $b = random_bytes(16); $b[6] = chr((ord($b[6]) & 15) | 64); $b[8] = chr((ord($b[8]) & 63) | 128);
        $h = bin2hex($b); return substr($h, 0, 8) . '-' . substr($h, 8, 4) . '-' . substr($h, 12, 4) . '-' . substr($h, 16, 4) . '-' . substr($h, 20);
    }
    public static function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
}
