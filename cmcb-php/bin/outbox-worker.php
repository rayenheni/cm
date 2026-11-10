<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__); require $root . '/src/Config.php'; require $root . '/src/Http.php'; require $root . '/src/Database.php'; require $root . '/src/Repository.php'; require $root . '/src/Mailer.php';
try {
    $config = new CMCB\Config($root);
    if (!$config->smtp) { echo "SMTP désactivé : les demandes restent enregistrées dans la base de données.\n"; exit(0); }
    $once = in_array('--once', $argv, true);
    $lock = fopen($root . '/data/outbox.lock', 'c'); if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('Un worker est déjà actif.');
    chmod($root . '/data/outbox.lock', 0600);
    $db = CMCB\Database::connect($config);
    CMCB\Database::run($db, "UPDATE outbox SET status='pending',next_attempt_at=0 WHERE status='sending'");
    unset($db);
    $running = true;
    if (function_exists('pcntl_async_signals')) { pcntl_async_signals(true); foreach ([SIGTERM, SIGINT] as $signal) pcntl_signal($signal, function () use (&$running) { $running = false; }); }
    echo "Worker SMTP démarré. CTRL+C pour arrêter.\n";
    do { $db = CMCB\Database::connect($config); $count = (new CMCB\Outbox($db, new CMCB\Mailer($config->smtp)))->processOnce(); if ($count) echo gmdate('c') . " : $count notification(s) envoyée(s).\n"; unset($db); if (!$once && $running) sleep(10); } while (!$once && $running);
    flock($lock, LOCK_UN); fclose($lock);
} catch (Throwable $e) { fwrite(STDERR, 'Worker arrêté : ' . $e->getMessage() . "\n"); exit(1); }
