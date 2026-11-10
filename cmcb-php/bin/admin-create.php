<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__); require $root . '/src/Config.php'; require $root . '/src/Http.php'; require $root . '/src/Database.php'; require $root . '/src/Auth.php';
try {
    $config = new CMCB\Config($root); $env = CMCB\Config::environment($root);
    $email = strtolower(trim($env['ADMIN_EMAIL'] ?? '')); $password = $env['ADMIN_PASSWORD'] ?? '';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Définissez ADMIN_EMAIL dans .env.');
    if (strlen($password) < 12 || strlen($password) > 128) throw new RuntimeException('ADMIN_PASSWORD doit contenir 12 à 128 octets.');
    $db = CMCB\Database::connect($config);
    CMCB\Database::transaction($db, function () use ($db, $email, $password) {
        $existing = CMCB\Database::one($db, 'SELECT id FROM admins WHERE email=?', [$email]);
        if ($existing) {
            CMCB\Database::run($db, 'UPDATE admins SET password_hash=? WHERE id=?', [CMCB\Auth::hash($password), $existing['id']]);
            CMCB\Database::run($db, 'DELETE FROM sessions WHERE admin_id=?', [$existing['id']]);
        } else CMCB\Database::run($db, 'INSERT INTO admins(email,password_hash,created_at) VALUES (?,?,?)', [$email, CMCB\Auth::hash($password), CMCB\Database::now()]);
    });
    echo "Administrateur créé ou mis à jour : $email\nToutes ses anciennes sessions ont été révoquées.\nRetirez ADMIN_PASSWORD de .env après provisioning.";
    if (!CMCB\Database::one($db, "SELECT value FROM meta WHERE `key`='admin_provisioned'")) {
        CMCB\Database::run($db, "INSERT INTO meta (`key`,value) VALUES ('admin_provisioned','1')");
    }
} catch (Throwable $e) { fwrite(STDERR, 'Erreur : ' . $e->getMessage() . "\n"); exit(1); }
