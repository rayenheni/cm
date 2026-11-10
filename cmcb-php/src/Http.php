<?php
declare(strict_types=1);
namespace CMCB;

final class HttpError extends \RuntimeException
{
    public function __construct(public readonly int $status, public readonly string $errorCode, string $message, public readonly array $fields = []) { parent::__construct($message, $status); }
}
final class Request
{
    public readonly string $method;
    public readonly string $path;
    public readonly array $query;
    public readonly array $headers;
    public readonly string $body;
    public readonly string $ip;
    public readonly bool $https;
    public function __construct(string $method, string $uri, array $headers = [], string $body = '', string $ip = '127.0.0.1', bool $https = false)
    {
        $this->method = strtoupper($method);
        $parts = parse_url($uri);
        $this->path = rtrim($parts['path'] ?? '/', '/') ?: '/';
        parse_str($parts['query'] ?? '', $query); $this->query = $query;
        $this->headers = array_change_key_case($headers, CASE_LOWER);
        $this->body = $body; $this->ip = $ip; $this->https = $https;
    }
    public function header(string $name): string { $v = $this->headers[strtolower($name)] ?? ''; return is_array($v) ? implode(', ', $v) : (string)$v; }
    public static function capture(Config $config): self
    {
        $headers = [];
        foreach ($_SERVER as $k => $v) if (str_starts_with($k, 'HTTP_')) $headers[str_replace('_', '-', strtolower(substr($k, 5)))] = $v;
        if (isset($_SERVER['CONTENT_TYPE'])) $headers['content-type'] = $_SERVER['CONTENT_TYPE'];
        $https = (!empty($_SERVER['HTTPS']) && !in_array(strtolower((string)$_SERVER['HTTPS']), ['off', '0', ''], true)) || ($config->trustProxy > 0 && ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        // Enable only when the web server overwrites forwarded headers at a trusted boundary.
        if ($config->trustProxy > 0) {
            $chain = array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
            $candidate = $chain[max(0, count($chain) - $config->trustProxy)] ?? '';
            if (filter_var($candidate, FILTER_VALIDATE_IP)) $ip = $candidate;
        }
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        $limit = $path === '/api/admin/media' ? 3 * 1024 * 1024 : 1048576;
        $body = file_get_contents('php://input', false, null, 0, $limit + 1);
        if ($body === false || strlen($body) > $limit) throw new HttpError(413, 'BODY_TOO_LARGE', 'Le contenu envoyé est trop volumineux.');
        return new self($_SERVER['REQUEST_METHOD'] ?? 'GET', $_SERVER['REQUEST_URI'] ?? '/', $headers, $body, $ip, $https);
    }
    public function json(): array
    {
        if (!str_starts_with(strtolower($this->header('content-type')), 'application/json')) throw new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Envoyez un corps JSON.');
        try { $data = json_decode($this->body, true, 64, JSON_THROW_ON_ERROR); }
        catch (\JsonException) { throw new HttpError(400, 'INVALID_JSON', 'Le JSON envoyé est invalide.'); }
        if (!is_array($data) || array_is_list($data) && $data !== []) throw new HttpError(400, 'INVALID_JSON', 'Un objet JSON est attendu.');
        return $data;
    }
    public function cookie(string $name): string
    {
        foreach (explode(';', $this->header('cookie')) as $part) {
            [$k, $v] = array_pad(explode('=', trim($part), 2), 2, '');
            if ($k === $name) return $v;
        }
        return '';
    }
    public function checkOrigin(Config $config): void
    {
        if (in_array($this->method, ['GET', 'HEAD', 'OPTIONS'], true)) return;
        $origin = $this->header('origin');
        $expected = $config->appOrigin ?? ($this->https ? 'https://' : 'http://') . $this->header('host');
        // Native same-origin form submissions may omit Origin. Fetch metadata still rejects cross-site writes.
        if (($origin !== '' && $origin !== $expected) || strtolower($this->header('sec-fetch-site')) === 'cross-site') throw new HttpError(403, 'ORIGIN_REJECTED', 'Origine de requête non autorisée.');
        if ($config->production && !$this->https) throw new HttpError(403, 'HTTPS_REQUIRED', 'HTTPS est obligatoire.');
    }
}
final class Response
{
    public function __construct(public readonly int $status = 200, public readonly string $body = '', public readonly array $headers = []) {}
    public static function json(array $data, int $status = 200, array $headers = []): self
    {
        return new self($status, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), ['Content-Type' => 'application/json; charset=utf-8'] + $headers);
    }
    public static function html(string $body, int $status = 200, array $headers = []): self { return new self($status, $body, ['Content-Type' => 'text/html; charset=utf-8'] + $headers); }
    public static function redirect(string $location, int $status = 303): self { return new self($status, '', ['Location' => $location]); }
    public function send(): void
    {
        http_response_code($this->status);
        foreach ($this->headers as $name => $values) foreach ((array)$values as $value) header($name . ': ' . $value, false);
        echo $this->body;
    }
}
