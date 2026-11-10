<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__);
if (file_exists($root . '/.env')) { fwrite(STDERR, "Installation refusée : .env existe déjà. Ne l'écrasez pas.\n"); exit(1); }
$keyFile = $root . '/.install-key';
umask(0077);
$h = @fopen($keyFile, 'x');
if (!$h) { fwrite(STDERR, "Impossible de créer .install-key : vérifiez les droits ou désactivez une installation déjà ouverte.\n"); exit(1); }
if (!chmod($keyFile, 0600)) { fclose($h); @unlink($keyFile); fwrite(STDERR, "Impossible de protéger la clé.\n"); exit(1); }
$key = bin2hex(random_bytes(32));
if (fwrite($h, hash('sha256', $key)) !== 64 || !fclose($h)) { @unlink($keyFile); fwrite(STDERR, "Impossible d'enregistrer la clé.\n"); exit(1); }
echo "Clé d'installation à usage unique (ne la partagez pas) :\n$key\nOuvrez /install.php en HTTPS.\n";
