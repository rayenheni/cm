<?php
declare(strict_types=1);
namespace CMCB;

/** Installation uniquement : la base doit être vide et dédiée à CMCB. */
final class MySqlSchema
{
    public static function install(\PDO $db): void
    {
        // Refuse any existing tables; never overwrite an existing application.
        if ((int)$db->query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()')->fetchColumn() !== 0) {
            throw new \RuntimeException('La base MySQL doit être vide et réservée à CMCB.');
        }
        $tables = [
            'CREATE TABLE meta (`key` VARCHAR(191) PRIMARY KEY, value TEXT NOT NULL)',
            'CREATE TABLE admins (id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at VARCHAR(32) NOT NULL)',
            'CREATE TABLE sessions (token_hash CHAR(64) PRIMARY KEY, admin_id BIGINT UNSIGNED NOT NULL, csrf_token CHAR(64) NOT NULL, expires_at BIGINT NOT NULL, INDEX sessions_expiry(expires_at), FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE)',
            'CREATE TABLE articles (id VARCHAR(120) PRIMARY KEY, expertise_id VARCHAR(32) NOT NULL, image TEXT NOT NULL, status VARCHAR(16) NOT NULL, created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL, published_at VARCHAR(32) NULL)',
            'CREATE TABLE article_translations (article_id VARCHAR(120) NOT NULL, lang VARCHAR(2) NOT NULL, body LONGTEXT NOT NULL, PRIMARY KEY(article_id,lang), FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE)',
            'CREATE TABLE reservations (id CHAR(36) PRIMARY KEY, idempotency_key CHAR(36) NOT NULL UNIQUE, payload_hash CHAR(64) NOT NULL, created_at VARCHAR(32) NOT NULL, updated_at VARCHAR(32) NOT NULL, consent_at VARCHAR(32) NOT NULL, status VARCHAR(16) NOT NULL, name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL, phone VARCHAR(40) NOT NULL, domain VARCHAR(200) NOT NULL, urgency VARCHAR(16) NOT NULL, message TEXT NOT NULL, lang VARCHAR(2) NOT NULL, INDEX reservations_created(created_at), INDEX reservations_status(status))',
            'CREATE TABLE outbox (reservation_id CHAR(36) PRIMARY KEY, status VARCHAR(16) NOT NULL, attempts INT NOT NULL DEFAULT 0, next_attempt_at BIGINT NOT NULL DEFAULT 0, last_error TEXT NULL, sent_at VARCHAR(32) NULL, FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE)',
            'CREATE TABLE rate_limits (`key` CHAR(64) PRIMARY KEY, hits INT NOT NULL, reset_at BIGINT NOT NULL)',
        ];
        // MySQL DDL commits implicitly. A failed installation requires a new empty DB.
        foreach ($tables as $sql) $db->exec($sql . ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');
        $seed = json_decode(file_get_contents(dirname(__DIR__) . '/resources/articles.json'), true, 512, JSON_THROW_ON_ERROR);
        Database::transaction($db, function () use ($db, $seed) {
            foreach ($seed as $a) {
                Database::run($db, 'INSERT INTO articles VALUES (?,?,?,?,?,?,?)', [$a['id'], $a['expertiseId'], $a['image'], $a['status'], $a['createdAt'], $a['updatedAt'], $a['publishedAt']]);
                foreach ($a['translations'] as $lang => $body) Database::run($db, 'INSERT INTO article_translations VALUES (?,?,?)', [$a['id'], $lang, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
            }
            Database::run($db, "INSERT INTO meta (`key`,value) VALUES ('articles_seeded','1')");
        });
    }
}
