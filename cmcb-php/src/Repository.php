<?php
declare(strict_types=1);
namespace CMCB;

final class Repository
{
    public function __construct(private readonly \PDO $db) {}
    public function articles(bool $publishedOnly = false): array
    {
        $rows = Database::run($this->db, 'SELECT * FROM articles ' . ($publishedOnly ? "WHERE status='published' " : '') . 'ORDER BY COALESCE(published_at,created_at) DESC,id')->fetchAll();
        return array_map(function ($r) {
            $translations = [];
            foreach (Database::run($this->db, 'SELECT lang,body FROM article_translations WHERE article_id=?', [$r['id']]) as $tr) $translations[$tr['lang']] = json_decode($tr['body'], true, 512, JSON_THROW_ON_ERROR);
            return ['id' => $r['id'], 'expertiseId' => $r['expertise_id'], 'image' => $r['image'], 'status' => $r['status'], 'createdAt' => $r['created_at'], 'updatedAt' => $r['updated_at'], 'publishedAt' => $r['published_at'], 'translations' => $translations];
        }, $rows);
    }
    public function article(string $id, bool $publishedOnly = false): ?array
    {
        foreach ($this->articles($publishedOnly) as $a) if ($a['id'] === $id) return $a;
        return null;
    }
    public static function localized(array $a, string $lang): array
    {
        $tr = $a['translations'][$lang] ?? $a['translations']['fr'];
        $date = new \DateTimeImmutable($a['publishedAt'] ?? $a['createdAt'], new \DateTimeZone('Africa/Tunis'));
        // Identique à Intl.DateTimeFormat('ar-TN') côté React : mois tunisiens.
        $months = ['fr' => [1=>'janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'], 'ar' => [1=>'جانفي','فيفري','مارس','أفريل','ماي','جوان','جويلية','أوت','سبتمبر','أكتوبر','نوفمبر','ديسمبر']];
        return ['id' => $a['id'], 'expertiseId' => $a['expertiseId'], 'image' => $a['image'] ?: 'https://images.pexels.com/photos/261621/pexels-photo-261621.jpeg?auto=compress&cs=tinysrgb&w=1400'] + $tr + ['date' => $date->format('j') . ' ' . $months[$lang === 'ar' ? 'ar' : 'fr'][(int)$date->format('n')] . ' ' . $date->format('Y')];
    }
    public function saveArticle(array $input, bool $create): array
    {
        Database::transaction($this->db, function () use ($input, $create) {
            $now = Database::now(); $id = $input['id'];
            $old = Database::one($this->db, 'SELECT published_at FROM articles WHERE id=?', [$id]);
            if ($create) Database::run($this->db, 'INSERT INTO articles VALUES (?,?,?,?,?,?,?)', [$id, $input['expertiseId'], $input['image'], $input['status'], $now, $now, $input['status'] === 'published' ? $now : null]);
            else {
                if (!$old) throw new HttpError(404, 'NOT_FOUND', 'Article introuvable.');
                Database::run($this->db, 'UPDATE articles SET expertise_id=?,image=?,status=?,updated_at=?,published_at=? WHERE id=?', [$input['expertiseId'], $input['image'], $input['status'], $now, $input['status'] === 'published' ? ($old['published_at'] ?? $now) : null, $id]);
                Database::run($this->db, 'DELETE FROM article_translations WHERE article_id=?', [$id]);
            }
            foreach ($input['translations'] as $lang => $body) Database::run($this->db, 'INSERT INTO article_translations VALUES (?,?,?)', [$id, $lang, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)]);
        });
        return $this->article($input['id']);
    }
    public function delete(string $table, string $id): void
    {
        if (!in_array($table, ['articles', 'reservations'], true)) throw new \InvalidArgumentException('Table interdite.');
        $st = Database::run($this->db, "DELETE FROM $table WHERE id=?", [$id]);
        if (!$st->rowCount()) throw new HttpError(404, 'NOT_FOUND', 'Élément introuvable.');
    }
    public function createReservation(array $input, string $key, bool $mailEnabled): array
    {
        $hash = hash('sha256', json_encode($input, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        $existing = Database::one($this->db, 'SELECT id,payload_hash FROM reservations WHERE idempotency_key=?', [$key]);
        if ($existing) return $this->existingReservation($existing, $hash);
        $id = Database::uuid(); $now = Database::now();
        try {
            Database::transaction($this->db, function () use ($id, $key, $hash, $now, $input, $mailEnabled) {
                Database::run($this->db, 'INSERT INTO reservations VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [$id, $key, $hash, $now, $now, $now, 'new', $input['name'], $input['email'], $input['phone'], $input['domain'], $input['urgency'], $input['message'], $input['lang']]);
                Database::run($this->db, 'INSERT INTO outbox (reservation_id,status) VALUES (?,?)', [$id, $mailEnabled ? 'pending' : 'disabled']);
            });
        } catch (\PDOException $e) {
            $existing = Database::one($this->db, 'SELECT id,payload_hash FROM reservations WHERE idempotency_key=?', [$key]);
            if (!$existing) throw $e;
            return $this->existingReservation($existing, $hash);
        }
        return ['status' => 201, 'body' => ['id' => $id, 'persisted' => true]];
    }
    private function existingReservation(array $row, string $hash): array
    {
        if (!hash_equals($row['payload_hash'], $hash)) throw new HttpError(409, 'IDEMPOTENCY_CONFLICT', 'Cette clé a déjà été utilisée pour une autre demande.');
        return ['status' => 200, 'body' => ['id' => $row['id'], 'persisted' => true]];
    }
    private function reservationRow(array $r): array
    {
        return ['id' => $r['id'], 'createdAt' => $r['created_at'], 'updatedAt' => $r['updated_at'], 'consentAt' => $r['consent_at'], 'status' => $r['status'], 'name' => $r['name'], 'email' => $r['email'], 'phone' => $r['phone'], 'domain' => $r['domain'], 'urgency' => $r['urgency'], 'message' => $r['message'], 'lang' => $r['lang'], 'notification' => ['status' => $r['notification_status'], 'attempts' => (int)$r['attempts']]];
    }
    public function reservation(string $id): ?array
    {
        $r = Database::one($this->db, 'SELECT r.*,o.status AS notification_status,o.attempts FROM reservations r JOIN outbox o ON o.reservation_id=r.id WHERE r.id=?', [$id]);
        return $r ? $this->reservationRow($r) : null;
    }
    public function reservations(array $query): array
    {
        $where = []; $params = [];
        if ($query['status']) { $where[] = 'r.status=?'; $params[] = $query['status']; }
        if ($query['q'] !== '') {
            $pattern = '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($query['q'])) . '%';
            $where[] = "(LOWER(r.name) LIKE ? ESCAPE '!' OR LOWER(r.email) LIKE ? ESCAPE '!' OR LOWER(r.domain) LIKE ? ESCAPE '!' OR LOWER(r.message) LIKE ? ESCAPE '!')";
            array_push($params, $pattern, $pattern, $pattern, $pattern);
        }
        $where = $where ? ' WHERE ' . implode(' AND ', $where) : '';
        $total = (int)Database::one($this->db, 'SELECT COUNT(*) n FROM reservations r' . $where, $params)['n'];
        $rows = Database::run($this->db, 'SELECT r.*,o.status AS notification_status,o.attempts FROM reservations r JOIN outbox o ON o.reservation_id=r.id' . $where . ' ORDER BY r.created_at DESC,r.id LIMIT ? OFFSET ?', [...$params, $query['limit'], ($query['page'] - 1) * $query['limit']])->fetchAll();
        $counts = ['new' => 0, 'contacted' => 0, 'closed' => 0];
        foreach (Database::run($this->db, 'SELECT status,COUNT(*) n FROM reservations GROUP BY status') as $r) $counts[$r['status']] = (int)$r['n'];
        return ['reservations' => array_map(fn($r) => $this->reservationRow($r), $rows), 'total' => $total, 'page' => $query['page'], 'limit' => $query['limit'], 'counts' => $counts];
    }
}
