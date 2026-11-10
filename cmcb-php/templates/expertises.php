<?php use function CMCB\e; use function CMCB\icon; use function CMCB\reveal; ?>
<?= $v->part('page-header', ['c' => $c, 'crumbs' => [['label' => $c->t('expertises.headerCrumb')]], 'image' => $c->images['lawBook'], 'eyebrow' => $c->t('expertises.headerEyebrow'), 'heading' => e($c->t('expertises.headerTitleA')) . ' <em class="text-gold-400 italic">' . e($c->t('expertises.headerTitleB')) . '</em>', 'subtitle' => $c->t('expertises.headerSub')]) ?>
<section class="practice-section" aria-labelledby="practice-directory-title"><div class="container-x">
<?php ob_start(); ?><div class="practice-section__heading"><div><p class="eyebrow"><?= e($c->t('expertises.dirEyebrow')) ?></p><h2 id="practice-directory-title"><?= e($c->t('expertises.dirTitleA')) ?> <em><?= e($c->t('expertises.dirTitleB')) ?></em></h2></div><div class="practice-section__intro"><p><?= e($c->t('expertises.dirText')) ?></p></div></div><?= reveal(ob_get_clean()) ?>
<?= $v->part('practice-explorer', ['c' => $c, 'detailed' => true]) ?>
</div></section>
<?= $v->part('cta', ['c' => $c, 'heading' => e($c->t('expertises.ctaTitleA')) . ' <em class="text-sand-300 italic">' . e($c->t('expertises.ctaTitleB')) . '</em>', 'text' => $c->t('expertises.ctaText')]) ?>
