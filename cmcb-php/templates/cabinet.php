<?php use function CMCB\e; use function CMCB\icon; use function CMCB\reveal; $cabinet = $c->cabinet; ?>
<?= $v->part('page-header', ['c' => $c, 'crumbs' => [['label' => $c->t('cabinet.headerCrumb')]], 'image' => $c->images['officeDetail'], 'eyebrow' => $c->t('cabinet.headerEyebrow'), 'heading' => e($c->t('cabinet.headerTitleA')) . ' <em class="text-gold-400 italic">' . e($c->t('cabinet.headerTitleB')) . '</em> ' . e($c->t('cabinet.headerTitleC')) . ' <em class="text-gold-400 italic">' . e($c->t('cabinet.headerTitleD')) . '</em>', 'subtitle' => $cabinet['lawyer'] . ' — ' . $cabinet['role'] . '. ' . $cabinet['specialty'] . '.']) ?>
<section class="py-24"><div class="container-x grid items-start gap-16 lg:grid-cols-12 lg:gap-12">
<?php ob_start(); ?><div class="relative mx-auto max-w-[430px] lg:sticky lg:top-28">
<div class="absolute -top-4 -left-4 h-28 w-28 border-t-2 border-l-2 border-gold-500/70 rtl:right-4 rtl:left-auto rtl:border-r-2 rtl:border-l-0" aria-hidden="true"></div>
<div class="absolute -right-4 -bottom-4 h-28 w-28 border-r-2 border-b-2 border-gold-500/70 rtl:right-auto rtl:-left-4 rtl:border-l-2 rtl:border-r-0" aria-hidden="true"></div>
<div class="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-sand-300 shadow-soft"><img src="/assets/chaima-bhiri.webp" alt="<?= e($c->t('cabinet.portraitAlt')) ?>" width="2240" height="1120" class="h-full w-full object-cover object-[82%_50%]" loading="lazy" decoding="async"><div class="pointer-events-none absolute inset-0 rounded-lg outline-1 outline-offset-[-12px] outline-cream-50/25" aria-hidden="true"></div></div>
<span class="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-cream-50/92 px-4 py-1.5 text-[11px] font-medium tracking-[0.16em] text-wine-700 uppercase backdrop-blur-sm rtl:right-5 rtl:left-auto"><?= icon('MapPin', 'h-3.5 w-3.5') ?> <?= e($c->t('cabinet.location')) ?></span>
</div><?= reveal(ob_get_clean(), 0, 'lg:col-span-5') ?>
<div class="lg:col-span-7">
<?php ob_start(); ?><p class="eyebrow"><?= e($c->t('cabinet.eyebrow')) ?></p><h2 class="mt-5 font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-ink-900 sm:text-5xl"><?= e($c->t('cabinet.titleA')) ?> <em class="text-wine-600 italic"><?= e($c->t('cabinet.titleB')) ?></em></h2>
<div class="mt-7 space-y-5 text-[16.5px] leading-[1.85] text-ink-600"><p class="dropcap"><?= e($c->t('cabinet.p1a')) ?> <strong class="font-medium text-ink-900"><?= e($c->t('cabinet.p1b')) ?></strong> <?= e($c->t('cabinet.p1c')) ?></p><p><?= e($c->t('cabinet.p2')) ?></p><p><?= e($c->t('cabinet.p3')) ?></p></div><?= reveal(ob_get_clean()) ?>
<?php ob_start(); ?><div class="mt-9 grid gap-3 sm:grid-cols-3"><?php foreach ($c->t('cabinet.pillars') as $item): ?><div class="rounded-xl border border-sand-300 bg-cream-100/70 p-4"><?= icon('Check', 'h-5 w-5 text-gold-500') ?><p class="mt-2 text-[14px] leading-snug font-medium text-ink-900"><?= e($item) ?></p></div><?php endforeach; ?></div><?= reveal(ob_get_clean(), 100) ?>
<?php ob_start(); ?><figure class="mt-10 rounded-lg bg-wine-700 p-8 text-cream-50 shadow-tile"><?= icon('Quote', 'h-8 w-8 text-gold-400') ?><blockquote class="mt-3 font-serif text-[24px] leading-snug italic"><?= e($c->t('cabinet.quote')) ?></blockquote><figcaption class="mt-5 border-t border-cream-50/20 pt-4 text-[12px] tracking-[0.2em] text-gold-400 uppercase"><?= e($cabinet['lawyer']) ?></figcaption></figure>
<div class="mt-8 flex flex-wrap gap-4"><a href="<?= e($c->url('/contact')) ?>" class="btn-wine"><?= e($c->t('cabinet.appointment')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a><a href="<?= e($cabinet['linkedin']) ?>" target="_blank" rel="noreferrer" class="btn-outline"><?= icon('LinkedIn', 'h-4 w-4') ?> <?= e($c->t('cabinet.linkedin')) ?></a></div><?= reveal(ob_get_clean(), 160) ?>
</div></div></section>

<section class="bg-cream-100 py-24"><div class="container-x">
<?= $v->part('section-heading', ['c' => $c, 'center' => true, 'eyebrow' => $c->t('cabinet.mottoEyebrow'), 'heading' => e($c->t('cabinet.mottoTitleA')) . ' <em class="text-wine-600 italic">' . e($c->t('cabinet.mottoTitleB')) . '</em>']) ?>
<div class="mt-14 grid gap-6 md:grid-cols-3"><?php foreach ($c->t('cabinet.motto') as $i => $m): ?><?php ob_start(); ?><article class="group relative h-full overflow-hidden rounded-lg border border-sand-300 bg-white p-8 text-center transition-colors duration-200 hover:border-wine-600/40 hover:shadow-tile">
<span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold-500/50 text-wine-600 transition-all duration-500 group-hover:bg-wine-600 group-hover:text-cream-50"><?= icon(['Compass', 'Shield', 'Handshake'][$i % 3], 'h-7 w-7') ?></span>
<p class="mt-6 font-serif text-4xl font-semibold text-wine-600"><?= e($m['verb']) ?></p><p class="mt-2 font-serif text-lg text-gold-600 italic"><?= e($m['line']) ?></p><p class="mt-4 text-[14.5px] leading-relaxed text-ink-600"><?= e($m['text']) ?></p></article><?= reveal(ob_get_clean(), $i * 120, 'h-full') ?><?php endforeach; ?></div>
</div></section>

<section class="py-24"><div class="container-x">
<?= $v->part('section-heading', ['c' => $c, 'eyebrow' => $c->t('cabinet.valuesEyebrow'), 'heading' => e($c->t('cabinet.valuesTitleA')) . ' <em class="text-wine-600 italic">' . e($c->t('cabinet.valuesTitleB')) . '</em>']) ?>
<div class="mt-12 divide-y divide-sand-300 border-y border-sand-300"><?php foreach ($c->values as $i => $value): ?><?php ob_start(); ?><div class="group grid items-center gap-4 py-9 md:grid-cols-[100px_300px_1fr] md:gap-10"><span class="font-serif text-xl text-gold-500 italic">0<?= $i + 1 ?></span><p class="font-serif text-5xl font-semibold text-ink-900 transition-colors duration-300 group-hover:text-wine-600"><?= e($value['word']) ?></p><p class="max-w-2xl text-[15.5px] leading-relaxed text-ink-600"><?= e($value['text']) ?></p></div><?= reveal(ob_get_clean(), $i * 80) ?><?php endforeach; ?></div>
</div></section>

<section class="bg-cream-100 py-24"><div class="container-x">
<?= $v->part('section-heading', ['c' => $c, 'eyebrow' => $c->t('cabinet.audEyebrow'), 'heading' => e($c->t('cabinet.audTitleA')) . ' <em class="text-wine-600 italic">' . e($c->t('cabinet.audTitleB')) . '</em>']) ?>
<div class="mt-12 grid gap-6 md:grid-cols-3"><?php foreach ($c->audiences as $i => $a): ?><?php ob_start(); ?><div class="h-full rounded-lg border border-sand-300 bg-white p-7"><span class="flex h-12 w-12 items-center justify-center rounded-xl bg-wine-600 text-cream-50"><?= icon($a['icon'], 'h-6 w-6') ?></span><h3 class="mt-5 font-serif text-2xl font-semibold text-ink-900"><?= e($a['title']) ?></h3><p class="mt-2 text-[14.5px] leading-relaxed text-ink-600"><?= e($a['text']) ?></p></div><?= reveal(ob_get_clean(), $i * 100, 'h-full') ?><?php endforeach; ?></div>
</div></section>

<?= $v->part('method', ['c' => $c]) ?>
<?= $v->part('cta', ['c' => $c, 'heading' => e($c->t('cabinet.ctaTitleA')) . ' <em class="text-sand-300 italic">' . e($c->t('cabinet.ctaTitleB')) . '</em>', 'text' => $c->t('cabinet.ctaText')]) ?>
