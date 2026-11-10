<?php use function CMCB\e; use function CMCB\icon; use function CMCB\monogram; $notFound = $error->status === 404; ?>
<?php if ($notFound): ?>
<section class="relative overflow-hidden py-28">
<span class="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-[16rem] leading-none font-bold text-wine-600/10 select-none" aria-hidden="true">404</span>
<div class="container-x relative text-center">
<?= monogram('rise-in mx-auto h-20 w-20 rounded-md shadow-tile') ?>
<p class="rise-in eyebrow mt-8 justify-center" style="--rise-delay:80ms"><?= e($c->t('notFound.eyebrow')) ?></p>
<h1 class="rise-in mx-auto mt-5 max-w-2xl font-serif text-5xl leading-tight font-semibold text-ink-900 sm:text-6xl" style="--rise-delay:160ms"><?= e($c->t('notFound.titleA')) ?> <em class="text-wine-600 italic"><?= e($c->t('notFound.titleB')) ?></em></h1>
<p class="rise-in mx-auto mt-5 max-w-lg text-[16px] leading-relaxed text-ink-600" style="--rise-delay:240ms"><?= e($c->t('notFound.text')) ?></p>
<div class="rise-in mt-9 flex flex-wrap justify-center gap-3" style="--rise-delay:320ms"><a href="<?= e($c->url()) ?>" class="btn-wine"><?= e($c->t('notFound.home')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a><a href="<?= e($c->url('/contact')) ?>" class="btn-outline"><?= e($c->t('notFound.contact')) ?></a></div>
<div class="rise-in mt-12 flex flex-wrap justify-center gap-2" style="--rise-delay:400ms"><?php foreach ($c->expertises as $exp): ?><a href="<?= e($c->url('/expertises/' . $exp['id'])) ?>" class="chip transition-colors hover:border-wine-600 hover:text-wine-700"><?= e($exp['shortTitle']) ?></a><?php endforeach; ?></div>
</div></section>
<?php else: ?>
<section class="py-28"><div class="container-x max-w-2xl text-center"><p class="eyebrow justify-center">CMCB · <?= $error->status ?></p><h1 class="mt-5 font-serif text-5xl font-semibold text-ink-900"><?= e($error->getMessage()) ?></h1><p class="mt-5 text-ink-600"><?= e($c->t('notFound.text')) ?></p><div class="mt-9 flex flex-wrap justify-center gap-3"><a href="<?= e($c->url()) ?>" class="btn-wine"><?= e($c->t('notFound.home')) ?></a><a href="<?= e($c->url('/contact')) ?>" class="btn-outline"><?= e($c->t('notFound.contact')) ?></a></div></div></section>
<?php endif; ?>
