<?php
declare(strict_types=1);
namespace CMCB;

final class RateLimiter
{
    public function __construct(private readonly \PDO $db, private readonly bool $enabled = true) {}
    public function hit(string $scope, string $identity, int $limit, int $window): void
    {
        if (!$this->enabled) return;
        $key = hash('sha256', $scope . ':' . $identity); $now = time();
        $result = Database::transaction($this->db, function () use ($key, $now, $window) {
            $sql = Database::isMysql($this->db)
                ? 'INSERT INTO rate_limits(`key`,hits,reset_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE hits=CASE WHEN reset_at<=? THEN 1 ELSE hits+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END'
                : 'INSERT INTO rate_limits(`key`,hits,reset_at) VALUES (?,1,?) ON CONFLICT(`key`) DO UPDATE SET hits=CASE WHEN reset_at<=? THEN 1 ELSE hits+1 END,reset_at=CASE WHEN reset_at<=? THEN ? ELSE reset_at END';
            Database::run($this->db, $sql, [$key, $now + $window, $now, $now, $now + $window]);
            return Database::one($this->db, 'SELECT * FROM rate_limits WHERE `key`=?', [$key]);
        });
        if (random_int(1, 100) === 1) Database::run($this->db, 'DELETE FROM rate_limits WHERE reset_at<?', [$now]);
        if ($result['hits'] > $limit) throw new HttpError(429, 'RATE_LIMITED', 'Trop de tentatives. Veuillez réessayer plus tard.');
    }
}
