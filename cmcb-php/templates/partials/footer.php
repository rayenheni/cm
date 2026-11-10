<?php use function CMCB\e; use function CMCB\icon; use function CMCB\logo; use function CMCB\tf; $cabinet = $c->cabinet; ?>
<footer class="relative overflow-hidden bg-wine-950 pt-18 pb-8 text-cream-200">
<div class="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" aria-hidden="true"></div>
<div class="pointer-events-none absolute inset-0" aria-hidden="true" style="background:radial-gradient(44rem 28rem at 100% 100%, rgb(124 31 46 / 0.35), transparent 60%)"></div>
<div class="container-x relative">
<div class="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1.1fr_1.2fr]">
<div><?= logo($c, true) ?><p class="mt-6 max-w-xs font-serif text-[19px] leading-snug text-cream-100/85 italic"><?= e(implode(' ', $cabinet['tagline'])) ?></p>
<div class="mt-6 flex items-center gap-3"><?php foreach ([[$cabinet['linkedin'], $c->t('footer.linkedin'), 'LinkedIn'], [$cabinet['facebook'], $c->t('footer.facebook'), 'Facebook'], [$cabinet['whatsappHref'], $c->t('footer.whatsapp'), 'WhatsApp']] as [$href, $label, $ic]): ?><a href="<?= e($href) ?>" target="_blank" rel="noreferrer" aria-label="<?= e($label) ?>" class="flex h-10 w-10 items-center justify-center rounded-full border border-cream-50/20 transition-all hover:-translate-y-0.5 hover:border-gold-400 hover:text-gold-400"><?= icon($ic, 'h-4 w-4') ?></a><?php endforeach; ?></div></div>
<nav aria-label="<?= e($c->t('footer.siteNav')) ?>"><p class="text-[11px] font-medium tracking-[0.28em] text-gold-400 uppercase"><?= e($c->t('footer.site')) ?></p><ul class="mt-5 space-y-3 text-sm"><?php foreach ([['/', $c->t('homeLabel')], ...$nav] as [$to, $label]): ?><li><a href="<?= e($c->url($to)) ?>" class="text-cream-200/75 transition-colors hover:text-gold-400"><?= e($label) ?></a></li><?php endforeach; ?></ul></nav>
<nav aria-label="<?= e($c->t('footer.expNav')) ?>"><p class="text-[11px] font-medium tracking-[0.28em] text-gold-400 uppercase"><?= e($c->t('footer.expertises')) ?></p><ul class="mt-5 space-y-3 text-sm"><?php foreach ($c->expertises as $exp): ?><li><a href="<?= e($c->url('/expertises/' . $exp['id'])) ?>" class="text-cream-200/75 transition-colors hover:text-gold-400"><?= e($exp['shortTitle']) ?></a></li><?php endforeach; ?></ul></nav>
<div><p class="text-[11px] font-medium tracking-[0.28em] text-gold-400 uppercase"><?= e($c->t('footer.cabinet')) ?></p><ul class="mt-5 space-y-4 text-sm text-cream-200/75">
<li><a href="<?= e($cabinet['mapsHref']) ?>" target="_blank" rel="noreferrer" class="flex gap-3 transition-colors hover:text-gold-400"><?= icon('MapPin', 'mt-0.5 h-4 w-4 shrink-0 text-gold-400') ?><span><?= e($cabinet['address']) ?><br><?= e($cabinet['city']) ?></span></a></li>
<li><a href="<?= e($cabinet['phoneHref']) ?>" class="flex gap-3 transition-colors hover:text-gold-400"><?= icon('Phone', 'mt-0.5 h-4 w-4 shrink-0 text-gold-400') ?> <span dir="ltr"><?= e($cabinet['phone']) ?></span></a></li>
<li><a href="<?= e($cabinet['emailHref']) ?>" class="ltr flex gap-3 break-all transition-colors hover:text-gold-400"><?= icon('Mail', 'mt-0.5 h-4 w-4 shrink-0 text-gold-400') ?> <?= e($cabinet['email']) ?></a></li>
<li class="flex gap-3"><?= icon('Globe', 'mt-0.5 h-4 w-4 shrink-0 text-gold-400') ?> <?= e($cabinet['domain']) ?></li>
</ul></div></div>
<div class="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-cream-50/10 pt-6 text-xs text-cream-200/55">
<p><?= e(tf($c, 'footer.rights', ['year' => date('Y'), 'lawyer' => $cabinet['lawyer'], 'role' => $cabinet['role']])) ?></p>
<div class="flex flex-wrap items-center gap-5"><a href="<?= e($c->url('/mentions-legales')) ?>" class="transition-colors hover:text-gold-400"><?= e($c->t('footer.legal')) ?></a><a href="<?= e($c->url('/confidentialite')) ?>" class="transition-colors hover:text-gold-400"><?= e($c->t('footer.privacy')) ?></a><span class="hidden text-cream-200/40 sm:inline"><?= e($c->t('footer.secret')) ?></span></div>
</div></div></footer>
