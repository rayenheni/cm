<?php
declare(strict_types=1);
namespace CMCB;

/** Helpers de présentation : tracés et micro-composants du design React. */
function icon(string $name = 'ArrowRight', string $class = 'h-4 w-4'): string
{
    static $icons = null;
    $icons ??= require __DIR__ . '/icons.php';
    $map = ['arrow'=>'ArrowRight','check'=>'Check','phone'=>'Phone','mail'=>'Mail','pin'=>'MapPin','lock'=>'Lock','clock'=>'Clock','file'=>'FileText','scales'=>'Scales','globe'=>'Globe','briefcase'=>'Briefcase','family'=>'Family','work'=>'Work','gavel'=>'Gavel','handshake'=>'Handshake','compass'=>'Compass','shield'=>'Shield','calendar'=>'Calendar','send'=>'Send','plus'=>'Plus','close'=>'Close','menu'=>'Menu','search'=>'Search','copy'=>'Copy','quote'=>'Quote','user'=>'User','whatsapp'=>'WhatsApp','linkedin'=>'LinkedIn','facebook'=>'Facebook','chevron-down'=>'ChevronDown','chevron-right'=>'ChevronRight','arrow-up-right'=>'ArrowUpRight','pencil'=>'Pencil','trash'=>'Trash','logout'=>'LogOut','refresh'=>'Refresh','inbox'=>'Inbox'];
    $key = $map[$name] ?? $name; $icon = $icons[$key] ?? $icons['Scales'];
    $fill = $icon['filled'] ? 'currentColor' : 'none'; $stroke = $icon['filled'] ? 'none' : 'currentColor';
    return '<svg viewBox="0 0 24 24" fill="' . $fill . '" stroke="' . $stroke . '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="' . e($class) . '" aria-hidden="true">' . $icon['body'] . '</svg>';
}
function monogram(string $class = 'h-11 w-11'): string
{
    return '<img src="/assets/cmcb-monogram.png" alt="Monogramme CMCB" width="290" height="290" class="' . e($class) . '" style="background:linear-gradient(135deg,#ece1c9,#d6c29d)">';
}
function logo(Content $c, bool $dark = false, bool $compact = false): string
{
    $ar = $c->lang === 'ar';
    return '<span class="inline-flex items-center gap-3">' . monogram('shrink-0 rounded-[5px] shadow-tile ' . ($compact ? 'h-11 w-11' : 'h-13 w-13')) . '<span class="flex flex-col leading-none"><span class="font-serif font-medium tracking-[0.04em] ' . ($compact ? 'text-[24px]' : 'text-[28px]') . ' ' . ($dark ? 'text-cream-50' : 'text-wine-600') . '">CMCB</span><span class="mt-1 border-b pb-1 font-normal ' . ($ar ? 'text-[12px] tracking-normal' : 'text-[10.5px] tracking-[0.2em]') . ' ' . ($dark ? 'border-gold-400/50 text-gold-400' : 'border-gold-500/60 text-gold-600') . '">' . e($c->t('logo.sub')) . '</span></span></span>';
}
function language_switcher(Content $c, string $path, bool $dark = false, string $class = ''): string
{
    $ar = $c->lang === 'ar'; $query = $_GET ?? [];
    $url = function (string $lang) use ($path, $query) { $q = $query; if ($lang === 'ar') $q['lang'] = 'ar'; else unset($q['lang']); return e($path . ($q ? '?' . http_build_query($q) : '')); };
    $base = 'cursor-pointer rounded-md px-3 py-1.5 transition-all duration-200';
    $active = 'bg-wine-600 text-cream-50 shadow-tile'; $idle = $dark ? 'text-cream-200/70 hover:text-cream-50' : 'text-ink-600 hover:text-wine-700';
    $display = str_contains($class, 'hidden') ? '' : 'inline-flex ';
    return '<div role="group" aria-label="' . e($c->t('lang.label')) . '" class="' . $display . 'items-center rounded-lg border p-0.5 text-[11px] font-semibold tracking-wider ' . ($dark ? 'border-cream-50/25 bg-cream-50/5' : 'border-sand-300 bg-cream-100/70') . ' ' . e($class) . '">'
        . '<a href="' . $url('fr') . '" hreflang="fr" data-language="fr" aria-pressed="' . ($ar ? 'false' : 'true') . '" title="' . e($c->t('lang.switchToFr')) . '" class="' . $base . ' ' . ($ar ? $idle : $active) . '">FR</a>'
        . '<a href="' . $url('ar') . '" hreflang="ar" data-language="ar" aria-pressed="' . ($ar ? 'true' : 'false') . '" title="' . e($c->t('lang.switchToAr')) . '" class="' . $base . ' font-[family-name:var(--font-arabic-sans)] ' . ($ar ? $active : $idle) . '">عربي</a></div>';
}
function nav_links(Content $c): array
{
    return [['/cabinet', $c->t('cabinet.headerCrumb')], ['/expertises', $c->t('expertises.headerCrumb')], ['/articles', $c->t('articles.headerCrumb')], ['/faq', $c->t('faq.headerCrumb')], ['/contact', $c->t('contact.headerCrumb')]];
}
function is_active(string $path, string $to): bool { return $to === '/' ? $path === '/' : str_starts_with($path, $to); }
function tf(Content $c, string $path, array $vars = []): string
{
    $text = (string)$c->t($path);
    if ($path === 'articles.found' && $c->lang === 'ar' && (int)($vars['n'] ?? 0) === 1) return (string)$c->t('articles.foundOne');
    if ($path === 'articles.found') $vars['plural'] = (int)($vars['n'] ?? 0) > 1 ? 's' : '';
    if ($path === 'expDetail.sideTitle' && $c->lang === 'fr') $vars['s'] = mb_strtolower((string)($vars['s'] ?? ''));
    foreach ($vars as $k => $v) $text = str_replace('{' . $k . '}', (string)$v, $text);
    return $text;
}
function reveal(string $content, int $delay = 0, string $class = ''): string
{
    return '<div class="reveal' . ($class !== '' ? ' ' . e($class) : '') . '" style="--rv-delay:' . $delay . 'ms">' . $content . '</div>';
}
