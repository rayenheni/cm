<?php use function CMCB\e; use function CMCB\reveal; $center = !empty($center); ob_start(); ?>
<div class="flex flex-wrap items-end <?= $center ? 'justify-center' : 'justify-between' ?> gap-6<?= $center ? ' text-center' : '' ?>">
<div class="max-w-2xl<?= $center ? ' mx-auto' : '' ?>">
<p class="eyebrow<?= $center ? ' justify-center' : '' ?>"><?= e($eyebrow) ?></p>
<h2 class="mt-5 font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-ink-900 sm:text-5xl"><?= $heading ?></h2>
<?php if (!empty($text)): ?><p class="mt-5 text-[16px] leading-relaxed text-ink-600"><?= $text ?></p><?php endif; ?>
</div>
<?php if (!empty($action)): ?><div class="shrink-0"><?= $action ?></div><?php endif; ?>
</div>
<?= reveal(ob_get_clean()) ?>
