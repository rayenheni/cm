<?php use function CMCB\e; use function CMCB\icon; $defaultOpen = $defaultOpen ?? 0; ?>
<div class="border-t border-sand-300" data-faq-accordion data-default-open="<?= (int)$defaultOpen ?>">
<?php foreach ($items as $i => $faq): $open = $i === $defaultOpen; ?>
<div class="border-b border-sand-300" data-faq-item>
<button type="button" aria-expanded="<?= $open ? 'true' : 'false' ?>" class="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left rtl:text-right" data-faq-toggle>
<span class="flex min-w-0 flex-1 items-baseline gap-4"><span class="font-serif text-lg text-gold-500 italic"><?= sprintf('%02d', $i + 1) ?></span><span class="min-w-0 font-serif text-[20px] leading-snug font-semibold transition-colors sm:text-[22px] <?= $open ? 'text-wine-700' : 'text-ink-900 group-hover:text-wine-700' ?>" data-faq-question><?= e($faq['q']) ?></span></span>
<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 <?= $open ? 'rotate-45 border-wine-600 bg-wine-600 text-cream-50' : 'border-sand-400 text-wine-700 group-hover:border-wine-600' ?>" data-faq-icon><?= icon('Plus', 'h-4 w-4') ?></span>
</button>
<div class="grid transition-[grid-template-rows] duration-500 ease-in-out" style="grid-template-rows:<?= $open ? '1fr' : '0fr' ?>" data-faq-panel><div class="overflow-hidden"><p class="max-w-3xl pb-7 pl-9 text-[15px] leading-[1.8] text-ink-600 sm:pl-10 rtl:pr-9 rtl:pl-0 rtl:sm:pr-10"><?= e($faq['a']) ?></p></div></div>
</div>
<?php endforeach; ?>
</div>
