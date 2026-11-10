<?php use function CMCB\e; use function CMCB\icon; use function CMCB\reveal; $cabinet = $c->cabinet; $tones = ['text-gold-600', 'text-wine-600', 'text-gold-600']; $allFaqs = array_merge(...array_map(fn($g) => $g['items'], $c->faq)); ?>
<section id="accueil" class="relative overflow-hidden">
<div class="relative">
<div class="pointer-events-none absolute inset-0" aria-hidden="true"><div class="absolute inset-0" style="background:linear-gradient(180deg, #faf6ec 0%, #f5eedf 100%)"></div><div class="absolute top-0 bottom-0 left-[8%] hidden w-px bg-wine-600/[0.06] lg:block rtl:right-[8%] rtl:left-auto"></div></div>
<div class="relative grid lg:min-h-[664px] lg:grid-cols-[54%_46%]">
<div class="relative h-[440px] w-full sm:h-[540px] lg:order-last lg:h-auto">
<div class="absolute inset-0 overflow-hidden"><img src="/assets/chaima-bhiri.webp" alt="<?= e($c->t('hero.portraitAlt')) ?>" width="2240" height="1120" decoding="async" class="absolute inset-0 h-full w-full object-cover object-[84%_50%] sm:object-[100%_50%] lg:object-[78%_50%] 2xl:object-[84%_50%]"><div class="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-gold-400/60 to-transparent lg:block rtl:right-0 rtl:left-auto" aria-hidden="true"></div></div>
<span class="absolute top-1/2 left-0 hidden -translate-x-1/2 -translate-y-1/2 rotate-180 text-[10px] font-medium tracking-[0.34em] text-ink-400 uppercase [writing-mode:vertical-rl] lg:block rtl:right-0 rtl:left-auto rtl:translate-x-1/2"><?= e($c->t('hero.vertical')) ?></span>
</div>
<div class="relative z-10 min-w-0 px-5 py-14 sm:px-8 lg:py-24 lg:pr-14 lg:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] rtl:lg:pr-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] rtl:lg:pl-14">
<div class="max-w-xl min-w-0">
<p class="rise-in eyebrow" style="--rise-delay:0ms"><?= e($cabinet['lawyer']) ?> · <?= e($cabinet['role']) ?></p>
<div data-hero-rotator>
<h1 class="hero-title mt-8 font-serif text-[clamp(2rem,5vw,4.25rem)] leading-[1.1] font-semibold tracking-tight" style="--hero-play-state:running" data-hero-title>
<span class="sr-only"><?= e($c->t('hero.srOnly')) ?></span>
<span aria-hidden="true" class="hero-promise" data-hero-phrase><span class="hero-promise-line text-ink-900"><?= e($c->t('hero.phrases')[0]['lead']) ?></span><em class="hero-promise-line hero-promise-line--tail font-medium italic <?= $tones[0] ?>"><?= e($c->t('hero.phrases')[0]['tail']) ?></em></span>
</h1>
<script type="application/json" data-hero-phrases><?= json_encode(array_map(fn($p, $i) => $p + ['tone' => $tones[$i % 3]], $c->t('hero.phrases'), array_keys($c->t('hero.phrases'))), JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP) ?></script>
</div>
<p class="rise-in mt-8 max-w-lg text-[16px] leading-relaxed text-ink-600" style="--rise-delay:300ms"><strong class="font-medium text-wine-700"><?= e($cabinet['specialty']) ?>.</strong> <?= e($c->t('hero.introSuffix')) ?></p>
<div class="rise-in mt-9 flex flex-wrap items-center gap-4" style="--rise-delay:420ms"><a href="<?= e($c->url('/contact')) ?>" class="btn-wine"><?= e($c->t('hero.ctaPrimary')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a><a href="<?= e($c->url('/cabinet')) ?>" class="btn-outline"><?= e($c->t('hero.ctaSecondary')) ?></a></div>
<dl class="rise-in mt-12 flex max-w-lg items-center gap-4 border-t border-sand-300/80 pt-7 sm:gap-9" style="--rise-delay:540ms">
<?php foreach ($c->t('hero.stats') as $i => $s): ?><div class="flex min-w-0 items-center gap-4 sm:gap-9"><?php if ($i > 0): ?><span class="h-9 w-px shrink-0 bg-sand-400/70" aria-hidden="true"></span><?php endif; ?><div class="min-w-0"><dt class="font-serif text-2xl leading-none font-semibold text-wine-700 sm:text-4xl"><span dir="ltr" class="inline-block"><?= e($s['value']) ?></span></dt><dd class="mt-2 text-[9.5px] font-medium tracking-[0.1em] text-ink-400 uppercase sm:text-[10.5px] sm:tracking-[0.16em]"><?= e($s['label']) ?></dd></div></div><?php endforeach; ?>
</dl>
</div></div>
</div></div>
<div class="border-y border-sand-300 bg-cream-100/85 py-4"><div class="hero-marquee" role="group" aria-label="<?= e($c->t('hero.marqueeLabel')) ?>"><div class="hero-marquee__track marquee-track"><?php for ($copy = 0; $copy < 2; $copy++): ?><div class="hero-marquee__group"<?= $copy === 1 ? ' aria-hidden="true"' : '' ?>><?php foreach (array_slice($c->t('hero.marquee'), 0, 5) as $item): ?><span class="hero-marquee__item"><?= e($item) ?></span><?php endforeach; ?></div><?php endfor; ?></div></div></div>
</section>

<section class="relative overflow-hidden py-24">
<div class="container-x grid items-center gap-16 lg:grid-cols-2 lg:gap-14">
<?php ob_start(); ?><figure class="max-w-[590px]"><div class="overflow-hidden rounded-[8px] bg-wine-950"><img src="<?= e($c->images['library']) ?>" alt="<?= e($c->t('home.libraryAlt')) ?>" width="1200" height="900" loading="lazy" decoding="async" class="aspect-[4/3] w-full object-cover"></div>
<figcaption class="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-5 border-t border-sand-300 pt-5 sm:gap-8"><span class="font-serif text-[56px] leading-[0.8] font-medium text-wine-700 sm:text-[68px]">05</span><div><p class="text-[11px] font-medium tracking-[0.18em] text-gold-600 uppercase"><?= e($c->t('home.domainsLabel')) ?></p><blockquote class="mt-2 font-serif text-[22px] leading-[1.15] text-ink-900 italic sm:text-[25px]"><?= e($c->t('home.quote')) ?></blockquote><p class="mt-2 text-[11px] tracking-[0.14em] text-ink-600 uppercase"><?= e($c->t('home.quoteAuthor')) ?></p></div></figcaption></figure><?= reveal(ob_get_clean()) ?>
<div>
<?= $v->part('section-heading', ['c' => $c, 'eyebrow' => $c->t('home.cabinetEyebrow'), 'heading' => e($c->t('home.cabinetTitleA')) . ' <em class="text-wine-600 italic">' . e($c->t('home.cabinetTitleB')) . '</em>', 'text' => e($c->t('home.cabinetTextA')) . ' <strong class="font-medium text-ink-900">' . e($c->t('home.cabinetTextB')) . '</strong> ' . e($c->t('home.cabinetTextC'))]) ?>
<?php ob_start(); ?><ul class="mt-8 space-y-3"><?php foreach ($c->t('home.pillars') as $i => $title): ?><li class="flex items-center gap-4 rounded-xl border border-sand-300/80 bg-cream-100/60 px-4 py-3.5"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-wine-600 text-cream-50"><?= icon(['Compass', 'Handshake', 'Shield'][$i % 3], 'h-5 w-5') ?></span><span class="font-serif text-[19px] font-semibold text-ink-900"><?= e($title) ?></span></li><?php endforeach; ?></ul>
<div class="mt-8 flex flex-wrap items-center gap-4"><a href="<?= e($c->url('/cabinet')) ?>" class="btn-wine"><?= e($c->t('home.discoverCabinet')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a><span class="font-serif text-2xl text-gold-600 italic"><?= e($c->lang === 'ar' ? $cabinet['lawyerShort'] : 'Chaima Bhiri') ?></span></div><?= reveal(ob_get_clean(), 120) ?>
</div></div></section>

<section class="practice-section" aria-labelledby="home-practices-title"><div class="container-x">
<?php ob_start(); ?><div class="practice-section__heading"><div><p class="eyebrow"><?= e($c->t('home.practiceEyebrow')) ?></p><h2 id="home-practices-title"><?= e($c->t('home.practiceTitleA')) ?> <em><?= e($c->t('home.practiceTitleB')) ?></em></h2></div><div class="practice-section__intro"><p><?= e($c->t('home.practiceText')) ?></p><a href="<?= e($c->url('/expertises')) ?>" class="practice-section__all"><?= e($c->t('home.practiceAll')) ?> <?= icon('ArrowRight', 'h-4 w-4') ?></a></div></div><?= reveal(ob_get_clean()) ?>
<?= $v->part('practice-explorer', ['c' => $c]) ?>
</div></section>

<?= $v->part('method', ['c' => $c]) ?>

<section class="py-24"><div class="container-x">
<?php ob_start(); ?><a href="<?= e($c->url('/articles')) ?>" class="btn-outline"><?= e($c->t('home.articlesAll')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a><?php $action = ob_get_clean(); ?>
<?= $v->part('section-heading', ['c' => $c, 'eyebrow' => $c->t('home.articlesEyebrow'), 'heading' => e($c->t('home.articlesTitleA')) . ' <em class="text-wine-600 italic">' . e($c->t('home.articlesTitleB')) . '</em>', 'text' => e($c->t('home.articlesText')), 'action' => $action]) ?>
<div class="mt-12 grid gap-6 lg:grid-cols-3" data-article-feed>
<?php foreach ($articles as $i => $article): ?>
<?php if ($i === 0): ?><div class="lg:col-span-3"><?= $v->part('article-card', ['c' => $c, 'article' => $article, 'featured' => true]) ?></div><?php else: ?><?= $v->part('article-card', ['c' => $c, 'article' => $article, 'index' => $i]) ?><?php endif; ?>
<?php endforeach; ?>
</div></div></section>

<section class="bg-cream-100 py-24"><div class="container-x grid gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
<div><?= $v->part('section-heading', ['c' => $c, 'eyebrow' => $c->t('home.faqEyebrow'), 'heading' => e($c->t('home.faqTitleA')) . ' <em class="text-wine-600 italic">' . e($c->t('home.faqTitleB')) . '</em>']) ?>
<?php ob_start(); ?><p class="mt-5 text-[15.5px] leading-relaxed text-ink-600"><?= e($c->t('home.faqText')) ?></p><a href="<?= e($c->url('/faq')) ?>" class="btn-outline mt-8"><?= e($c->t('home.faqAll')) ?> <?= icon('ArrowRight', 'h-4 w-4 rtl:rotate-180') ?></a><p class="mt-8 text-sm text-ink-600"><?= e($c->t('home.urgent')) ?> <a href="<?= e($cabinet['phoneHref']) ?>" class="font-medium text-wine-700 underline decoration-gold-500/60 underline-offset-4"><span dir="ltr" class="inline-block"><?= e($cabinet['phone']) ?></span></a></p><?= reveal(ob_get_clean(), 100) ?>
</div>
<?= reveal($v->part('faq-accordion', ['c' => $c, 'items' => [$allFaqs[0], $allFaqs[3], $allFaqs[6], $allFaqs[9]]]), 120) ?>
</div></section>

<?= $v->part('cta', ['c' => $c, 'heading' => e($c->t('home.ctaTitleA')) . ' <em class="text-sand-300 italic">' . e($c->t('home.ctaTitleB')) . '</em>', 'text' => $c->t('home.ctaText')]) ?>
