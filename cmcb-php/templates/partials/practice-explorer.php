<?php use function CMCB\e; use function CMCB\icon; use function CMCB\tf; $detailed = !empty($detailed); $id = 'pe' . (++$GLOBALS['cmcb_pe_counter']); $images = ['affaires'=>'https://images.pexels.com/photos/8112136/pexels-photo-8112136.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200','famille'=>'https://images.pexels.com/photos/30015473/pexels-photo-30015473.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200','travail'=>'https://images.pexels.com/photos/5668494/pexels-photo-5668494.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200','penal'=>'https://images.pexels.com/photos/8112199/pexels-photo-8112199.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200','mediation'=>'https://images.pexels.com/photos/5256820/pexels-photo-5256820.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200']; ?>
<div class="practice-explorer<?= $detailed ? ' practice-explorer--detailed' : '' ?>" data-practice-explorer>
<div class="practice-explorer__desktop">
<div class="practice-explorer__index">
<div class="practice-explorer__index-heading"><span><?= e($c->t('explorer.choose')) ?></span><span aria-hidden="true" data-pe-count>01 / 05</span></div>
<div role="tablist" aria-label="<?= e($c->t('explorer.listLabel')) ?>" aria-orientation="vertical">
<?php foreach ($c->expertises as $i => $exp): ?>
<button id="<?= $id ?>-tab-<?= e($exp['id']) ?>" type="button" role="tab" aria-selected="<?= $i === 0 ? 'true' : 'false' ?>" aria-controls="<?= $id ?>-panel-<?= e($exp['id']) ?>" tabindex="<?= $i === 0 ? '0' : '-1' ?>" class="practice-explorer__tab<?= $i === 0 ? ' is-active' : '' ?>" data-pe-tab data-index="<?= $i ?>" data-num="<?= e($exp['num']) ?>">
<span class="practice-explorer__number"><?= e($exp['num']) ?></span><span class="practice-explorer__tab-copy"><span class="practice-explorer__tab-title"><?= e($exp['shortTitle']) ?></span><span class="practice-explorer__tab-note"><?= e($c->t('explorer.notes')[$exp['id']]) ?></span></span><?= icon('ArrowRight', 'practice-explorer__tab-arrow') ?>
</button>
<?php endforeach; ?>
</div><p class="practice-explorer__hint"><?= e($c->t('explorer.hint')) ?></p>
</div>
<div class="practice-explorer__panels">
<?php foreach ($c->expertises as $i => $exp): ?>
<section id="<?= $id ?>-panel-<?= e($exp['id']) ?>" role="tabpanel" aria-labelledby="<?= $id ?>-tab-<?= e($exp['id']) ?>" <?= $i !== 0 ? 'hidden' : '' ?> class="practice-explorer__panel" data-pe-panel>
<div class="practice-explorer__image"><img src="<?= e($images[$exp['id']] ?? $exp['image']) ?>" alt="" loading="lazy" decoding="async" width="1200" height="627" data-fallback-src="<?= e($exp['image']) ?>"></div>
<div class="practice-explorer__content"><p class="practice-explorer__overline">CMCB <span aria-hidden="true">/</span> <?= e(tf($c, 'explorer.overline', ['num' => $exp['num']])) ?></p><h3><?= e($exp['title']) ?></h3><p class="practice-explorer__description"><?= e($detailed ? $exp['intro'] : $exp['short']) ?></p>
<div class="practice-explorer__services"><p><?= e($c->t('explorer.servicesTitle')) ?></p><ul><?php foreach ($exp['services'] as $service): ?><li><?= e($service['title']) ?></li><?php endforeach; ?></ul></div>
<div class="practice-explorer__actions"><a href="<?= e($c->url('/expertises/' . $exp['id'])) ?>" class="practice-explorer__discover"><?= e($c->t('explorer.discover')) ?> <?= icon('ArrowRight', 'h-4 w-4') ?></a><a href="<?= e($c->url('/contact') . (str_contains($c->url('/contact'), '?') ? '&' : '?') . 'domaine=' . $exp['id']) ?>" class="practice-explorer__contact"><?= e($c->t('explorer.appointment')) ?></a></div>
</div></section>
<?php endforeach; ?>
</div></div>
<div class="practice-explorer__mobile">
<div class="practice-explorer__index-heading"><span><?= e($c->t('explorer.choose')) ?></span><span aria-hidden="true" data-pe-count>01 / 05</span></div>
<?php foreach ($c->expertises as $i => $exp): ?>
<div class="practice-explorer__mobile-item">
<button id="<?= $id ?>-mobile-button-<?= e($exp['id']) ?>" type="button" class="practice-explorer__tab<?= $i === 0 ? ' is-active' : '' ?>" aria-expanded="<?= $i === 0 ? 'true' : 'false' ?>" aria-controls="<?= $id ?>-mobile-panel-<?= e($exp['id']) ?>" data-pe-mobile data-index="<?= $i ?>" data-num="<?= e($exp['num']) ?>">
<span class="practice-explorer__number"><?= e($exp['num']) ?></span><span class="practice-explorer__tab-copy"><span class="practice-explorer__tab-title"><?= e($exp['shortTitle']) ?></span><span class="practice-explorer__tab-note"><?= e($c->t('explorer.notes')[$exp['id']]) ?></span></span><?= icon('Plus', 'practice-explorer__mobile-toggle') ?>
</button>
<section id="<?= $id ?>-mobile-panel-<?= e($exp['id']) ?>" role="region" aria-labelledby="<?= $id ?>-mobile-button-<?= e($exp['id']) ?>" <?= $i !== 0 ? 'hidden' : '' ?> class="practice-explorer__panel practice-explorer__mobile-panel" data-pe-mobile-panel>
<div class="practice-explorer__image"><img src="<?= e($images[$exp['id']] ?? $exp['image']) ?>" alt="" loading="lazy" decoding="async" width="1200" height="627" data-fallback-src="<?= e($exp['image']) ?>"></div>
<div class="practice-explorer__content"><p class="practice-explorer__overline">CMCB <span aria-hidden="true">/</span> <?= e(tf($c, 'explorer.overline', ['num' => $exp['num']])) ?></p><h3><?= e($exp['title']) ?></h3><p class="practice-explorer__description"><?= e($detailed ? $exp['intro'] : $exp['short']) ?></p>
<div class="practice-explorer__services"><p><?= e($c->t('explorer.servicesTitle')) ?></p><ul><?php foreach ($exp['services'] as $service): ?><li><?= e($service['title']) ?></li><?php endforeach; ?></ul></div>
<div class="practice-explorer__actions"><a href="<?= e($c->url('/expertises/' . $exp['id'])) ?>" class="practice-explorer__discover"><?= e($c->t('explorer.discover')) ?> <?= icon('ArrowRight', 'h-4 w-4') ?></a><a href="<?= e($c->url('/contact') . (str_contains($c->url('/contact'), '?') ? '&' : '?') . 'domaine=' . $exp['id']) ?>" class="practice-explorer__contact"><?= e($c->t('explorer.appointment')) ?></a></div>
</div></section></div>
<?php endforeach; ?>
</div></div>
