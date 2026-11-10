<?php
declare(strict_types=1);
$root = dirname(__DIR__);
require $root . '/src/Config.php';
require $root . '/src/Http.php';
require $root . '/src/Database.php';
require $root . '/src/Content.php';
require $root . '/src/Design.php';
require $root . '/src/View.php';
require $root . '/src/Validation.php';
require $root . '/src/Media.php';
require $root . '/src/Auth.php';
require $root . '/src/Repository.php';
require $root . '/src/RateLimiter.php';
require $root . '/src/Mailer.php';
require $root . '/src/App.php';
ini_set('display_errors', '0');
date_default_timezone_set('Africa/Tunis');
try {
    $config = new CMCB\Config($root);
    $request = CMCB\Request::capture($config);
    (new CMCB\App($config))->handle($request)->send();
} catch (CMCB\HttpError $e) {
    http_response_code($e->status); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
    echo json_encode(['error' => ['code' => $e->errorCode, 'message' => $e->getMessage()]], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    error_log('CMCB bootstrap: ' . get_class($e) . ': ' . $e->getMessage());
    http_response_code(500); header('Content-Type: application/json; charset=utf-8');
    echo '{"error":{"code":"BOOTSTRAP_ERROR","message":"Configuration serveur incomplète. Consultez les journaux privés."}}';
}
