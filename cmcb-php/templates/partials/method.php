<?php use function CMCB\e; use function CMCB\icon; use function CMCB\reveal; ?>
<section class="relative overflow-hidden bg-wine-950 py-24 text-cream-100">
<div class="pointer-events-none absolute inset-0" aria-hidden="true"><div class="absolute inset-0" style="background:radial-gradient(50rem 34rem at 12% 0%, rgb(160 128 90 / 0.16), transparent 58%), radial-gradient(46rem 32rem at 95% 90%, rgb(124 31 46 / 0.4), transparent 60%)"></div><div class="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent"></div></div>
<div class="container-x relative">
<?php ob_start(); ?><p class="flex items-center justify-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold-400 uppercase"><span class="h-px w-10 bg-gold-500"></span> <?= e($c->t('blocks.methodEyebrow')) ?> <span class="h-px w-10 bg-gold-500"></span></p>
<h2 class="mx-auto mt-5 max-w-3xl font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-cream-50 sm:text-5xl"><?= e($c->t('blocks.methodTitleA')) ?> <em class="text-gold-400 italic"><?= e($c->t('blocks.methodTitleB')) ?></em></h2>
<p class="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-cream-200/75"><?= e($c->t('blocks.methodSub')) ?></p><?= reveal(ob_get_clean(), 0, 'text-center') ?>
<div class="relative mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
<div class="absolute top-[52px] right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-gold-500/0 via-gold-500/40 to-gold-500/0 xl:block" aria-hidden="true"></div>
<?php foreach ($c->steps as $i => $step): ?><?php ob_start(); ?><article class="group relative h-full rounded-lg border border-cream-50/10 bg-wine-950/60 p-7 transition-colors duration-200 hover:border-gold-400/40 hover:bg-cream-50/[0.06]">
<span class="flex h-12 w-12 items-center justify-center rounded-full border border-gold-400/50 bg-wine-950 font-serif text-lg font-semibold text-gold-400 italic transition-colors duration-500 group-hover:bg-gold-500 group-hover:text-wine-950"><?= e($step['num']) ?></span>
<h3 class="mt-6 font-serif text-2xl font-semibold text-cream-50"><?= e($step['title']) ?></h3><p class="mt-3 text-[14px] leading-relaxed text-cream-200/70"><?= e($step['text']) ?></p></article><?= reveal(ob_get_clean(), $i * 120) ?><?php endforeach; ?>
</div>
<div class="mt-16 grid gap-8 border-t border-cream-50/10 pt-12 sm:grid-cols-2 xl:grid-cols-4">
<?php foreach ($c->commitments as $i => $commit): ?><?php ob_start(); ?><div class="flex gap-4"><span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-400/40 text-gold-400"><?= icon($commit['icon'], 'h-5 w-5') ?></span><div><h3 class="text-[15px] font-medium text-cream-50"><?= e($commit['title']) ?></h3><p class="mt-1 text-[13px] leading-relaxed text-cream-200/60"><?= e($commit['text']) ?></p></div></div><?= reveal(ob_get_clean(), $i * 100) ?><?php endforeach; ?>
</div></div></section>
