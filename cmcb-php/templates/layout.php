<?php use function CMCB\e; use function CMCB\icon; use function CMCB\logo; use function CMCB\language_switcher; use function CMCB\nav_links; use function CMCB\is_active; use function CMCB\tf; $cabinet = $c->cabinet; $ar = $c->lang === 'ar'; $nav = nav_links($c); ?>
<!doctype html>
<html lang="<?= $c->lang ?>" dir="<?= $ar ? 'rtl' : 'ltr' ?>">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title><?= $title ? e($title) . ' | ' : '' ?>CMCB · <?= e($cabinet['lawyer']) ?> — <?= $ar ? 'محامية واستشارات بمساكن، سوسة' : 'Avocat et conseils à Msaken, Sousse' ?></title>
<meta name="description" content="<?= $ar ? 'مكتب CMCB — الأستاذة شيماء البحيري، محامية لدى الهيئة الوطنية للمحامين بتونس. قانون الأعمال، الأسرة، الشغل، الجزائي والجريمة الإلكترونية، الوساطة.' : 'Cabinet CMCB — Maître Chaima Bhiri, avocat au Barreau de Tunisie. Droit des affaires, famille, travail, pénal & cybercriminalité, médiation. Le bon conseil pour vous guider, la bonne stratégie pour vous protéger, le bon avocat pour vous défendre.' ?>">
<meta property="og:title" content="CMCB — <?= $ar ? 'محامية واستشارات' : 'Avocat et conseils' ?> | <?= e($cabinet['lawyer']) ?>">
<meta property="og:description" content="<?= $ar ? 'قانون خاص واستشارات قانونية بمساكن، سوسة.' : 'Droit privé & conseil juridique à Msaken, Sousse.' ?> cmcbavocat.tn">
<meta property="og:type" content="website"><meta property="og:locale" content="<?= $ar ? 'ar_TN' : 'fr_FR' ?>"><meta property="og:locale:alternate" content="<?= $ar ? 'fr_FR' : 'ar_TN' ?>">
<meta name="theme-color" content="#24070e"><link rel="canonical" href="https://cmcbavocat.tn<?= e($path === '/' ? '/' : $path) ?>">
<link rel="icon" type="image/png" href="/assets/cmcb-favicon.png">
<link rel="preload" href="/assets/fonts/cormorant-garamond-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/jost-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/theme.css?v=hero-mobile-20261108"><script src="/assets/site.js" defer></script>
</head>
<body>
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:rounded-full focus:bg-wine-600 focus:px-5 focus:py-2.5 focus:text-cream-50 rtl:focus:right-3 rtl:focus:left-auto"><?= e($c->t('skipLink')) ?></a>
<div class="site-shell flex min-h-screen flex-col">
<?= $v->part('navbar', compact('c', 'path', 'nav')) ?>
<main id="main" tabindex="-1" class="page-in flex-1 outline-none"><?= $content ?></main>
<?= $v->part('footer', compact('c', 'nav')) ?>
<div class="floating-actions fixed z-40 flex flex-col items-end gap-3">
<button type="button" data-back-top aria-label="<?= e($c->t('app.top')) ?>" class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-sand-300 bg-cream-50 text-wine-700 shadow-tile transition-all duration-300 hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50 pointer-events-none translate-y-3 opacity-0"><?= icon('ArrowRight', 'h-4.5 w-4.5 -rotate-90') ?></button>
<a href="<?= e($cabinet['whatsappHref']) ?>" target="_blank" rel="noreferrer" aria-label="<?= e($c->t('app.whatsapp')) ?>" class="group relative flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-tile transition-colors hover:bg-success"><?= icon('WhatsApp', 'relative h-6.5 w-6.5') ?><span class="pointer-events-none absolute right-full mr-3 hidden rounded-md bg-wine-950 px-4 py-2 text-xs font-medium whitespace-nowrap text-cream-50 opacity-0 shadow-tile transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100 sm:block rtl:right-auto rtl:left-full rtl:mr-0 rtl:ml-3 rtl:group-hover:translate-x-1"><?= e($c->t('app.whatsappTip')) ?></span></a>
</div>
<?php $mobileQuery = ['rendezvous' => '1']; if (preg_match('#^/expertises/([a-z]+)$#', $path, $mq)) $mobileQuery['domaine'] = $mq[1]; ?>
<nav class="mobile-contact-bar" aria-label="<?= e($c->t('mobileActions.label')) ?>">
<a href="<?= e($c->url('/contact') . (str_contains($c->url('/contact'), '?') ? '&' : '?') . http_build_query($mobileQuery)) ?>" class="mobile-contact-bar__link mobile-contact-bar__link--appointment" aria-label="<?= e($c->t('mobileActions.appointmentLabel')) ?>" data-focus-consultation><?= icon('Calendar', 'h-[18px] w-[18px] shrink-0') ?><span><?= e($c->t('mobileActions.appointment')) ?></span></a>
<a href="<?= e($cabinet['phoneHref']) ?>" class="mobile-contact-bar__link mobile-contact-bar__link--call" aria-label="<?= e($c->t('mobileActions.callLabel') . ' ' . $cabinet['phone']) ?>" style="direction:<?= $ar ? 'rtl' : 'ltr' ?>"><?= icon('Phone', 'h-[18px] w-[18px] shrink-0') ?><span><?= e($c->t('mobileActions.call')) ?></span></a>
</nav>
</div>
</body></html>
