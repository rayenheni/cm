<?php
declare(strict_types=1);
namespace CMCB;

final class Auth
{
    public const HOURS = 8;
    public function __construct(private readonly \PDO $db, private readonly Config $config) {}
    public static function hash(string $password): string
    {
        if (strlen($password) < 12 || strlen($password) > 128 || str_contains($password, "\0")) throw new HttpError(400, 'INVALID_PASSWORD', 'Le mot de passe doit contenir 12 à 128 octets.');
        // bcrypt silently truncates after 72 bytes. Never create ambiguous credentials.
        if (!defined('PASSWORD_ARGON2ID') && strlen($password) > 72) throw new HttpError(400, 'INVALID_PASSWORD', 'Ce serveur utilise bcrypt : le mot de passe ne doit pas dépasser 72 octets.');
        return password_hash($password, defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT, defined('PASSWORD_ARGON2ID') ? ['memory_cost' => 65536, 'time_cost' => 4, 'threads' => 1] : ['cost' => 12]);
    }
    public function session(Request $request): ?array
    {
        $token = $request->cookie('cmcb_session');
        if ($this->config->previewBearer) {
            if (preg_match('/^[a-f0-9]{64}$/', $request->header('x-cmcb-session'))) $token = $request->header('x-cmcb-session');
            elseif (preg_match('/^Bearer ([a-f0-9]{64})$/', $request->header('authorization'), $m)) $token = $m[1];
        }
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) return null;
        $s = Database::one($this->db, 'SELECT s.*,a.email FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE token_hash=? AND expires_at>?', [hash('sha256', $token), time()]);
        if ($s) $s['raw_token'] = $token;
        return $s;
    }
    public function requireSession(Request $request, bool $write = false): array
    {
        $s = $this->session($request);
        if (!$s) throw new HttpError(401, 'UNAUTHENTICATED', 'Veuillez vous connecter.');
        if ($write && !hash_equals($s['csrf_token'], $request->header('x-csrf-token'))) throw new HttpError(403, 'CSRF_REJECTED', 'Votre session a changé. Reconnectez-vous.');
        return $s;
    }
    public function login(array $input, Request $request): array
    {
        $admin = Database::one($this->db, 'SELECT * FROM admins WHERE email=?', [$input['email']]);
        // Compute a real hash even for an unknown account.
        $dummy = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $hash = $admin['password_hash'] ?? $dummy;
        $valid = password_verify($input['password'], $hash);
        // Reject longer bcrypt inputs even for legacy hashes; suffixes must not authenticate.
        if (str_starts_with($hash, '$2') && strlen($input['password']) > 72) $valid = false;
        if (!$admin || !$valid) throw new HttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou mot de passe incorrect.');
        $bearer = $this->config->previewBearer && ($input['transport'] === 'bearer' || $request->header('x-auth-transport') === 'bearer');
        $token = bin2hex(random_bytes(32)); $csrf = bin2hex(random_bytes(32));
        Database::transaction($this->db, function () use ($admin, $token, $csrf, $request) {
            Database::run($this->db, 'DELETE FROM sessions WHERE expires_at<?', [time()]);
            if ($old = $this->session($request)) Database::run($this->db, 'DELETE FROM sessions WHERE token_hash=?', [$old['token_hash']]);
            Database::run($this->db, 'INSERT INTO sessions VALUES (?,?,?,?)', [hash('sha256', $token), $admin['id'], $csrf, time() + self::HOURS * 3600]);
        });
        return [Response::json(['authenticated' => true, 'user' => ['id' => (int)$admin['id'], 'email' => $admin['email']], 'csrfToken' => $csrf] + ($bearer ? ['sessionToken' => $token] : [])), $this->cookie($bearer ? '' : $token, $bearer ? 0 : self::HOURS * 3600)];
    }
    public function cookie(string $token, int $age): string
    {
        $secure = $this->config->production || $this->config->cookiePolicy === 'none';
        return 'cmcb_session=' . $token . '; Path=/; Max-Age=' . $age . '; HttpOnly; SameSite=' . ($this->config->cookiePolicy === 'none' ? 'None' : 'Strict') . ($secure ? '; Secure' : '') . ($this->config->cookiePolicy === 'none' ? '; Partitioned' : '');
    }
    public function changePassword(array $input, array $session): string
    {
        Validation::keys($input, ['currentPassword', 'newPassword']);
        $current = $input['currentPassword']; $new = $input['newPassword'];
        if (!is_string($current) || $current === '' || strlen($current) > 128 || !is_string($new)) throw new HttpError(400, 'VALIDATION_ERROR', 'Mot de passe invalide.');
        $admin = Database::one($this->db, 'SELECT password_hash FROM admins WHERE id=?', [$session['admin_id']]);
        if (!password_verify($current, $admin['password_hash']) || (str_starts_with($admin['password_hash'], '$2') && strlen($current) > 72)) throw new HttpError(400, 'INVALID_PASSWORD', 'Le mot de passe actuel est incorrect.');
        $hash = self::hash($new);
        Database::transaction($this->db, function () use ($hash, $session) {
            Database::run($this->db, 'UPDATE admins SET password_hash=? WHERE id=?', [$hash, $session['admin_id']]);
            Database::run($this->db, 'DELETE FROM sessions WHERE admin_id=?', [$session['admin_id']]);
        });
        return $this->cookie('', 0);
    }
}
