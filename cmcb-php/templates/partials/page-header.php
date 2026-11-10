<?php use function CMCB\e; use function CMCB\icon; ?>
<section class="relative overflow-hidden bg-wine-950 text-cream-100">
<?php if (!empty($image)): ?><img src="<?= e($image) ?>" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"><?php endif; ?>
<div class="pointer-events-none absolute inset-0" aria-hidden="true" style="background:linear-gradient(100deg, rgb(36 7 14 / 0.96) 25%, rgb(36 7 14 / 0.7) 70%, rgb(36 7 14 / 0.5)), radial-gradient(40rem 26rem at 90% 0%, rgb(160 128 90 / 0.25), transparent 60%)"></div>
<div class="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" aria-hidden="true"></div>
<div class="container-x relative py-16 sm:py-20 lg:py-24">
<nav aria-label="<?= e($c->t('blocks.breadcrumb')) ?>" class="rise-in"><ol class="flex flex-wrap items-center gap-1.5 text-[12px] tracking-[0.08em] text-cream-200/60">
<li><a href="<?= e($c->url()) ?>" class="transition-colors hover:text-gold-400"><?= e($c->t('blocks.home')) ?></a></li>
<?php foreach ($crumbs as $crumb): ?><li class="flex items-center gap-1.5"><?= icon('ChevronRight', 'h-3 w-3 text-gold-500 rtl:rotate-180') ?><?php if (!empty($crumb['to'])): ?><a href="<?= e($c->url($crumb['to'])) ?>" class="transition-colors hover:text-gold-400"><?= e($crumb['label']) ?></a><?php else: ?><span class="text-cream-100" aria-current="page"><?= e($crumb['label']) ?></span><?php endif; ?></li><?php endforeach; ?>
</ol></nav>
<p class="rise-in mt-8 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold-400 uppercase" style="--rise-delay:80ms"><span class="h-px w-10 bg-gold-500"></span> <?= e($eyebrow) ?></p>
<h1 class="rise-in mt-5 max-w-4xl font-serif text-[clamp(2.3rem,5vw,4rem)] leading-[1.06] font-semibold tracking-tight text-cream-50" style="--rise-delay:160ms"><?= $heading ?></h1>
<?php if (!empty($subtitle)): ?><p class="rise-in mt-6 max-w-2xl text-[16.5px] leading-relaxed text-cream-200/80" style="--rise-delay:240ms"><?= e($subtitle) ?></p><?php endif; ?>
<?php if (!empty($children)): ?><div class="rise-in mt-8" style="--rise-delay:320ms"><?= $children ?></div><?php endif; ?>
</div></section>
