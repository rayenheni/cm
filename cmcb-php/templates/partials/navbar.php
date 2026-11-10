<?php use function CMCB\e; use function CMCB\icon; use function CMCB\logo; use function CMCB\language_switcher; use function CMCB\is_active; $cabinet = $c->cabinet; ?>
<div class="hidden bg-wine-900 text-cream-200 lg:block">
<div class="container-x flex h-10 items-center justify-between text-[12px] tracking-wide">
<div class="flex items-center gap-6">
<a href="<?= e($cabinet['phoneHref']) ?>" class="ltr flex items-center gap-2 transition-colors hover:text-gold-400"><?= icon('Phone', 'h-3.5 w-3.5') ?> <span dir="ltr"><?= e($cabinet['phone']) ?></span></a>
<a href="<?= e($cabinet['emailHref']) ?>" class="ltr flex items-center gap-2 transition-colors hover:text-gold-400"><?= icon('Mail', 'h-3.5 w-3.5') ?> <?= e($cabinet['email']) ?></a>
</div>
<div class="flex items-center gap-5">
<span class="flex items-center gap-2 text-cream-200/80"><?= icon('Clock', 'h-3.5 w-3.5') ?> <?= e($cabinet['hours']) ?></span>
<span class="h-4 w-px bg-cream-50/20"></span>
<span class="flex items-center gap-2 text-gold-400"><?= icon('Globe', 'h-3.5 w-3.5') ?> <?= e($cabinet['domain']) ?></span>
<span class="h-4 w-px bg-cream-50/20"></span>
<div class="flex items-center gap-3">
<a href="<?= e($cabinet['linkedin']) ?>" target="_blank" rel="noreferrer" aria-label="LinkedIn" class="transition-colors hover:text-gold-400"><?= icon('LinkedIn', 'h-3.5 w-3.5') ?></a>
<a href="<?= e($cabinet['facebook']) ?>" target="_blank" rel="noreferrer" aria-label="Facebook" class="transition-colors hover:text-gold-400"><?= icon('Facebook', 'h-3.5 w-3.5') ?></a>
</div></div></div></div>
<header class="sticky top-0 z-50 transition-all duration-300 border-b border-transparent bg-cream-50/80 backdrop-blur-sm" data-site-header>
<div class="container-x flex h-20 items-center justify-between gap-4">
<a href="<?= e($c->url()) ?>" aria-label="CMCB" class="shrink-0"><?= logo($c, false, true) ?></a>
<nav class="hidden h-full items-center gap-7 lg:flex xl:gap-8" aria-label="<?= e($c->t('nav.mainNav')) ?>">
<?php foreach ($nav as [$to, $label]): ?>
<?php if ($to === '/expertises'): ?>
<div class="relative flex h-full items-center" data-mega>
<a href="<?= e($c->url($to)) ?>" class="nav-link flex items-center gap-1.5<?= is_active($path, $to) ? ' active' : '' ?>" aria-haspopup="true" aria-expanded="false" data-mega-link><?= e($label) ?><?= icon('ChevronDown', 'h-3.5 w-3.5 transition-transform duration-300') ?></a>
<div class="panel-in absolute top-full left-1/2 w-[760px] max-w-[90vw] -translate-x-1/2 pt-1" data-mega-panel hidden>
<div class="grid grid-cols-[1fr_230px] overflow-hidden rounded-lg border border-sand-300 bg-cream-50 shadow-soft">
<div class="grid grid-cols-1 gap-1 p-3">
<?php foreach ($c->expertises as $exp): $active = $path === '/expertises/' . $exp['id']; ?>
<a href="<?= e($c->url('/expertises/' . $exp['id'])) ?>" class="group flex items-center gap-4 rounded-xl p-3 transition-colors <?= $active ? 'bg-cream-200' : 'hover:bg-cream-100' ?>">
<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold-500/40 bg-cream-100 text-wine-600 transition-colors group-hover:border-wine-600 group-hover:bg-wine-600 group-hover:text-cream-50"><?= icon($exp['icon'], 'h-5 w-5') ?></span>
<span class="min-w-0"><span class="block font-serif text-[17px] leading-tight font-semibold text-ink-900"><?= e($exp['shortTitle']) ?></span><span class="mt-0.5 block truncate text-[12.5px] text-ink-600"><?= e($exp['short']) ?></span></span>
</a>
<?php endforeach; ?>
</div>
<div class="relative flex flex-col justify-end overflow-hidden bg-wine-900 p-5 text-cream-50">
<div class="absolute inset-0 opacity-90" style="background:radial-gradient(18rem 14rem at 100% 0%, rgb(160 128 90 / 0.35), transparent 60%)" aria-hidden="true"></div>
<p class="relative font-serif text-sm tracking-[0.2em] text-gold-400 uppercase"><?= e($c->t('nav.fiveDomains')) ?></p>
<p class="relative mt-2 font-serif text-2xl leading-tight"><?= e($c->t('nav.rigorLine')) ?></p>
<a href="<?= e($c->url('/expertises')) ?>" class="relative mt-5 inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.14em] text-gold-400 uppercase hover:text-cream-50"><?= e($c->t('nav.overview')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a>
</div></div></div></div>
<?php else: ?>
<a href="<?= e($c->url($to)) ?>" class="nav-link<?= is_active($path, $to) ? ' active' : '' ?>"><?= e($label) ?></a>
<?php endif; ?>
<?php endforeach; ?>
</nav>
<div class="flex items-center gap-3">
<?= language_switcher($c, $path, false, 'hidden md:inline-flex') ?>
<a href="<?= e($c->url('/contact')) ?>" class="btn-wine hidden px-5! py-2.5! md:inline-flex"><?= e($c->t('nav.appointment')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a>
<button type="button" data-menu-open aria-label="<?= e($c->t('nav.openMenu')) ?>" class="menu-toggle flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-sand-300 text-wine-700 transition-colors hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50 lg:hidden"><?= icon('Menu', 'h-5 w-5') ?></button>
</div></div>
<div class="absolute bottom-0 left-0 h-[2px] bg-gold-500 transition-[width] duration-150 rtl:right-0 rtl:left-auto" style="width:0%" data-scroll-progress></div>
</header>
<div class="fade-in fixed inset-0 z-[70] flex flex-col bg-wine-950 text-cream-100 lg:hidden" role="dialog" aria-modal="true" aria-label="<?= e($c->t('nav.menu')) ?>" data-mobile-menu hidden>
<div class="pointer-events-none absolute inset-0" style="background:radial-gradient(40rem 30rem at 90% 0%, rgb(160 128 90 / 0.18), transparent 60%), radial-gradient(36rem 28rem at 0% 100%, rgb(124 31 46 / 0.35), transparent 60%)"></div>
<div class="container-x relative flex h-20 shrink-0 items-center justify-between">
<?= logo($c, true, true) ?>
<div class="flex items-center gap-2"><?= language_switcher($c, $path, true) ?><button type="button" data-menu-close aria-label="<?= e($c->t('nav.closeMenu')) ?>" class="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-cream-50/25 text-cream-100 transition-colors hover:border-gold-400 hover:text-gold-400"><?= icon('Close', 'h-5 w-5') ?></button></div>
</div>
<nav id="navigation" class="container-x relative mt-4 flex flex-1 flex-col overflow-y-auto" aria-label="<?= e($c->t('nav.mobileMenu')) ?>">
<?php foreach ([['/', $c->t('homeLabel')], ...$nav] as $i => [$to, $label]): ?>
<div class="rise-in border-b border-cream-50/10" style="--rise-delay:<?= 100 + $i * 60 ?>ms">
<div class="flex items-center">
<a href="<?= e($c->url($to)) ?>" class="group flex flex-1 items-baseline gap-4 py-4"><span class="font-serif text-sm text-gold-400 italic">0<?= $i + 1 ?></span><span class="font-serif text-[30px] leading-none font-medium transition-colors group-hover:text-gold-400 <?= is_active($path, $to) ? 'text-gold-400' : 'text-cream-50' ?>"><?= e($label) ?></span></a>
<?php if ($to === '/expertises'): ?><button type="button" data-mobile-exp aria-label="<?= e($c->t('nav.showExpertises')) ?>" aria-expanded="false" class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-cream-50/20 text-gold-400"><?= icon('ChevronDown', 'h-4 w-4 transition-transform') ?></button><?php endif; ?>
</div>
<?php if ($to === '/expertises'): ?><div class="panel-in mb-4 ml-9 flex flex-col gap-1 border-l border-gold-500/30 pl-4 rtl:mr-9 rtl:ml-0 rtl:border-r rtl:border-l-0 rtl:pr-4 rtl:pl-0" data-mobile-exp-panel hidden><?php foreach ($c->expertises as $exp): ?><a href="<?= e($c->url('/expertises/' . $exp['id'])) ?>" class="py-1.5 text-[15px] text-cream-200/85 hover:text-gold-400"><?= e($exp['shortTitle']) ?></a><?php endforeach; ?></div><?php endif; ?>
</div>
<?php endforeach; ?>
<div class="rise-in mt-8 pb-10" style="--rise-delay:520ms">
<a href="<?= e($c->url('/contact')) ?>" class="btn-gold w-full"><?= e($c->t('nav.bookAppointment')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a>
<div class="mt-6 flex flex-col gap-2 text-sm text-cream-200/80">
<a href="<?= e($cabinet['phoneHref']) ?>" class="flex items-center gap-3 hover:text-gold-400"><?= icon('Phone', 'h-4 w-4 text-gold-400') ?> <span dir="ltr"><?= e($cabinet['phone']) ?></span></a>
<a href="<?= e($cabinet['emailHref']) ?>" class="flex items-center gap-3 break-all hover:text-gold-400"><?= icon('Mail', 'h-4 w-4 shrink-0 text-gold-400') ?> <?= e($cabinet['email']) ?></a>
</div>
<div class="mt-6 flex items-center gap-4">
<a href="<?= e($cabinet['linkedin']) ?>" target="_blank" rel="noreferrer" aria-label="LinkedIn" class="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/20 hover:border-gold-400 hover:text-gold-400"><?= icon('LinkedIn', 'h-4 w-4') ?></a>
<a href="<?= e($cabinet['facebook']) ?>" target="_blank" rel="noreferrer" aria-label="Facebook" class="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/20 hover:border-gold-400 hover:text-gold-400"><?= icon('Facebook', 'h-4 w-4') ?></a>
<span class="ml-auto text-xs tracking-[0.2em] text-gold-400 uppercase rtl:mr-auto rtl:ml-0"><?= e($cabinet['domain']) ?></span>
</div></div></nav></div>
