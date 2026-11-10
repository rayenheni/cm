<?php use function CMCB\e; use function CMCB\icon; use function CMCB\reveal; use function CMCB\tf; $cabinet = $c->cabinet; $all = $allArticles ?? $articles; $allLabel = $c->t('articles.all'); $categories = array_values(array_unique(array_column($all, 'category'))); $activeCategory = in_array($category ?? '', $categories, true) ? $category : ''; $filtered = $activeCategory !== '' || trim($q ?? '') !== ''; $count = $resultCount ?? count($all);
ob_start(); ?><a href="<?= e($cabinet['linkedin']) ?>" target="_blank" rel="noreferrer" class="btn-cream"><?= icon('LinkedIn', 'h-4 w-4') ?> <?= e($c->t('articles.follow')) ?></a><?php $children = ob_get_clean(); ?>
<?= $v->part('page-header', ['c' => $c, 'crumbs' => [['label' => $c->t('articles.headerCrumb')]], 'image' => $all[0]['image'] ?? null, 'eyebrow' => $c->t('articles.headerEyebrow'), 'heading' => e($c->t('articles.headerTitleA')) . ' <em class="text-gold-400 italic">' . e($c->t('articles.headerTitleB')) . '</em>', 'subtitle' => $c->t('articles.headerSub'), 'children' => $children]) ?>
<section class="py-20"><div class="container-x">
<?php ob_start(); ?><form id="article-filters" method="get" action="/articles" class="flex flex-col gap-5 rounded-xl border border-sand-300 bg-white p-4 shadow-tile lg:flex-row lg:items-center lg:justify-between" data-article-filters>
<input type="hidden" name="lang" value="<?= $c->lang ?>">
<div class="flex flex-wrap gap-2" role="tablist" aria-label="<?= e($c->t('articles.categoriesLabel')) ?>">
<?php foreach (['', ...$categories] as $cat): $label = $cat === '' ? $allLabel : $cat; $active = $activeCategory === $cat; $n = $cat === '' ? count($all) : count(array_filter($all, fn($a) => $a['category'] === $cat)); ?>
<button type="submit" name="category" value="<?= e($cat) ?>" role="tab" aria-selected="<?= $active ? 'true' : 'false' ?>" data-category="<?= e($cat) ?>" class="cursor-pointer rounded-md px-4 py-2 text-[13px] font-medium transition-all duration-200 <?= $active ? 'bg-wine-600 text-cream-50 shadow-tile' : 'text-ink-600 hover:bg-cream-50 hover:text-wine-700' ?>"><?= e($label) ?><span class="ml-2 text-[11px] rtl:mr-2 rtl:ml-0 <?= $active ? 'text-gold-400' : 'text-ink-400' ?>"><?= $n ?></span></button>
<?php endforeach; ?>
</div>
<div class="relative lg:w-80"><?= icon('Search', 'pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-ink-400 rtl:right-4 rtl:left-auto') ?><input type="search" name="q" id="article-search" value="<?= e($q ?? '') ?>" placeholder="<?= e($c->t('articles.searchPh')) ?>" aria-label="<?= e($c->t('articles.searchLabel')) ?>" class="field pl-11 rtl:pr-11 rtl:pl-4"><noscript><button type="submit" class="btn-outline mt-2"><?= e($c->t('articles.searchLabel')) ?></button></noscript></div>
</form><?= reveal(ob_get_clean()) ?>
<p id="article-count" class="mt-6 text-sm text-ink-600" role="status" <?= $filtered ? '' : 'hidden' ?>><?= e(tf($c, 'articles.found', ['n' => $count])) ?></p>
<div id="article-empty" class="panel-in mt-10 rounded-lg border border-dashed border-sand-400 py-16 text-center" <?= $count > 0 ? 'hidden' : '' ?>>
<p class="font-serif text-3xl font-semibold text-ink-900"><?= e($c->t('articles.emptyTitle')) ?></p><p class="mt-2 text-ink-600"><?= e($c->t('articles.emptyText')) ?></p><button type="button" data-article-reset class="btn-outline mt-6"><?= icon('Close', 'h-4 w-4') ?> <?= e($c->t('articles.reset')) ?></button>
</div>
<div id="article-results" class="mt-10 grid gap-6 md:grid-cols-2" data-filtered="<?= $filtered ? 'true' : 'false' ?>">
<?php foreach ($all as $i => $article): $show = $matches[$article['id']] ?? true; $featured = !$filtered && $i === 0; ?>
<div class="<?= $featured ? 'md:col-span-2' : '' ?>" data-article-item data-category="<?= e($article['category']) ?>" data-search="<?= e(mb_strtolower($article['title'] . ' ' . $article['excerpt'] . ' ' . $article['category'])) ?>" <?= $show ? '' : 'hidden' ?>><?= $v->part('article-card', ['c' => $c, 'article' => $article, 'index' => $i, 'featured' => $featured]) ?></div>
<?php endforeach; ?>
</div></div></section>
<?= $v->part('cta', ['c' => $c, 'heading' => e($c->t('articles.ctaTitleA')) . ' <em class="text-sand-300 italic">' . e($c->t('articles.ctaTitleB')) . '</em>', 'text' => $c->t('articles.ctaText')]) ?>
