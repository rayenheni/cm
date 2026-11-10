<?php use function CMCB\e; use function CMCB\icon; use function CMCB\reveal; $featured = !empty($featured); $index = $index ?? 0; ob_start(); ?>
<a href="<?= e($c->url('/articles/' . $article['id'])) ?>" class="group flex h-full overflow-hidden rounded-lg border border-sand-300 bg-white transition-colors duration-200 hover:border-wine-600/40 hover:shadow-tile <?= $featured ? 'flex-col lg:flex-row' : 'flex-col' ?>" data-article-link>
<span class="relative block shrink-0 overflow-hidden <?= $featured ? 'h-60 lg:h-auto lg:w-[52%]' : 'h-48' ?>" data-card-image>
<img src="<?= e($article['image']) ?>" alt="<?= e($article['imageAlt']) ?>" loading="lazy" class="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-95">
<span class="absolute inset-0 bg-gradient-to-t from-wine-950/40 to-transparent"></span>
<span class="absolute top-4 left-4 rounded-md bg-cream-50/95 px-3 py-1 text-[10px] font-medium tracking-[0.08em] text-wine-700 uppercase backdrop-blur-sm rtl:right-4 rtl:left-auto" data-card-category><?= e($article['category']) ?></span>
</span>
<span class="flex flex-1 flex-col <?= $featured ? 'p-8 lg:p-10' : 'p-6' ?>" data-card-body>
<span class="flex items-center gap-2 text-[11px] tracking-[0.14em] text-ink-400 uppercase"><?= e($article['date']) ?> <span class="text-gold-500">·</span><?= icon('Clock', 'h-3 w-3') ?> <?= e($article['readTime']) ?></span>
<span class="mt-3 font-serif font-semibold text-ink-900 transition-colors group-hover:text-wine-700 <?= $featured ? 'text-[30px] lg:text-[34px]' : 'line-clamp-3 text-[21px]' ?>" data-card-title><?= e($article['title']) ?></span>
<span class="mt-3 text-[14px] leading-relaxed text-ink-600<?= $featured ? '' : ' line-clamp-3' ?>" data-card-excerpt><?= e($article['excerpt']) ?></span>
<span class="mt-auto inline-flex items-center gap-2 pt-6 text-[12px] font-medium tracking-[0.16em] text-wine-700 uppercase"><?= e($c->t('blocks.readArticle')) ?><?= icon('ArrowRight', 'h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5 rtl:rotate-180 rtl:group-hover:-translate-x-1.5') ?></span>
</span></a>
<?= reveal(ob_get_clean(), $index * 90, 'h-full') ?>
