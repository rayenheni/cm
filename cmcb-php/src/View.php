<?php
declare(strict_types=1);
namespace CMCB;

function e(mixed $value): string { return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
final class View
{
    public function __construct(private readonly string $root) {}
    public function render(string $template, array $data = []): string
    {
        $GLOBALS['cmcb_pe_counter'] ??= 0;
        extract($data, EXTR_SKIP);
        ob_start(); require $this->root . '/templates/' . $template . '.php'; return ob_get_clean();
    }
    public function page(string $template, Content $c, array $data = [], int $status = 200): Response
    {
        $content = $this->render($template, $data + ['c' => $c, 'v' => $this]);
        return Response::html($this->render('layout', ['c' => $c, 'v' => $this, 'content' => $content, 'title' => $data['title'] ?? '', 'path' => $data['path'] ?? '/']), $status);
    }
    public function part(string $template, array $data = []): string { return $this->render('partials/' . $template, $data); }
}
