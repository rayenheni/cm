<?php use function CMCB\e; use function CMCB\icon; use function CMCB\reveal; $cabinet = $c->cabinet; ob_start(); ?>
<div class="relative overflow-hidden rounded-xl bg-wine-700 px-7 py-14 text-cream-50 shadow-soft sm:px-14 lg:py-16">
<div class="pointer-events-none absolute inset-0" aria-hidden="true" style="background:linear-gradient(120deg, rgb(160 128 90 / 0.18), transparent 55%)"></div>
<div class="relative grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
<div><p class="text-[11px] font-medium tracking-[0.32em] text-gold-400 uppercase"><?= e($c->t('blocks.ctaEyebrow')) ?></p>
<h2 class="mt-4 font-serif text-3xl leading-[1.1] font-semibold sm:text-[44px]"><?= $heading ?? e($c->t('blocks.ctaDefaultTitleA')) . ' <em class="text-sand-300 italic">' . e($c->t('blocks.ctaDefaultTitleB')) . '</em>' ?></h2>
<p class="mt-4 max-w-xl text-[15.5px] leading-relaxed text-cream-100/80"><?= e($text ?? $c->t('blocks.ctaDefaultText')) ?></p></div>
<div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
<a href="<?= e($c->url('/contact')) ?>" class="btn flex-1 bg-cream-50 text-wine-700 shadow-tile hover:bg-cream-100"><?= e($c->t('blocks.appointment')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a>
<div class="flex flex-1 gap-3"><a href="<?= e($cabinet['whatsappHref']) ?>" target="_blank" rel="noreferrer" class="btn-cream flex-1 px-4!"><?= icon('WhatsApp', 'h-4 w-4') ?> <?= e($c->t('blocks.whatsapp')) ?></a><a href="<?= e($cabinet['phoneHref']) ?>" class="btn-cream flex-1 px-4!"><?= icon('Phone', 'h-4 w-4') ?> <?= e($c->t('blocks.call')) ?></a></div>
</div></div></div>
<?php $inner = ob_get_clean(); ?>
<section class="py-20"><div class="container-x"><?= reveal($inner) ?></div></section>
