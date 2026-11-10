<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__); require $root . '/src/Config.php'; require $root . '/src/Http.php'; require $root . '/src/Database.php';
try {
    $config = new CMCB\Config($root);
    if ($config->databaseDriver === 'mysql') throw new RuntimeException('Utilisez un outil de sauvegarde MySQL cohérent (voir INSTALLATION.md). Aucune sauvegarde SQLite ne sera créée.');
    $db = CMCB\Database::connect($config);
    $dir = $root . '/backups'; if (!is_dir($dir)) mkdir($dir, 0700, true); chmod($dir, 0700);
    $file = $dir . '/cmcb-' . gmdate('Y-m-d\THis\Z') . '-' . bin2hex(random_bytes(3)) . '.sqlite';
    $lock = fopen($dir . '/backup.lock', 'c'); if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('Une sauvegarde est déjà en cours.');
    try {
        // Quote the SQLite string literal; VACUUM INTO includes committed WAL data atomically.
        $db->exec('VACUUM INTO ' . $db->quote($file)); chmod($file, 0600);
        $check = new PDO('sqlite:' . $file); $check->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        if ($check->query('PRAGMA integrity_check')->fetchColumn() !== 'ok') throw new RuntimeException('La sauvegarde n’a pas passé le contrôle SQLite.');
        unset($check); echo "Sauvegarde vérifiée : $file\n";
    } finally { flock($lock, LOCK_UN); fclose($lock); }
} catch (Throwable $e) { fwrite(STDERR, 'Sauvegarde impossible : ' . $e->getMessage() . "\n"); exit(1); }
