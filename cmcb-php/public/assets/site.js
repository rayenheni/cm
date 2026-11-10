'use strict';
(() => {
  document.documentElement.classList.add('js');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const language = document.documentElement.lang;
  const ar = language === 'ar';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const normalize = s => s.toLocaleLowerCase(ar ? 'ar' : 'fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
  const uuid = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };
  try { localStorage.setItem('cmcb-lang', language); } catch {}
  $$('[data-language]').forEach(a => a.addEventListener('click', () => { try { localStorage.setItem('cmcb-lang-override', a.dataset.language); } catch {} }));
  if (!new URLSearchParams(location.search).has('lang')) {
    try { if (localStorage.getItem('cmcb-lang-override') === 'ar' && !ar) { const u = new URL(location.href); u.searchParams.set('lang', 'ar'); location.replace(u); } } catch {}
  }
  if (location.hash.startsWith('#/') && !$('[data-consultation]')) { const target = location.hash.slice(1); if (/^\/[a-z0-9/-]*$/i.test(target)) { const u = new URL(target, location.origin); if (ar) u.searchParams.set('lang', 'ar'); location.replace(u); } }

  // ——— Navbar : progression, mega menu, dialog mobile ———
  const header = $('[data-site-header]'), progress = $('[data-scroll-progress]'), backTop = $('[data-back-top]');
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header?.classList.toggle('border-sand-300/80', y > 10); header?.classList.toggle('bg-cream-50/95', y > 10); header?.classList.toggle('shadow-[0_8px_30px_-18px_rgb(53_11_20/0.35)]', y > 10); header?.classList.toggle('backdrop-blur-md', y > 10);
    header?.classList.toggle('border-transparent', y <= 10); header?.classList.toggle('bg-cream-50/80', y <= 10); header?.classList.toggle('backdrop-blur-sm', y <= 10);
    if (progress) progress.style.width = `${max > 0 ? Math.min(1, y / max) * 100 : 0}%`;
    if (backTop) { const show = y > 700; backTop.classList.toggle('translate-y-0', show); backTop.classList.toggle('opacity-100', show); backTop.classList.toggle('pointer-events-none', !show); backTop.classList.toggle('translate-y-3', !show); backTop.classList.toggle('opacity-0', !show); }
  };
  onScroll(); addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' }));
  const mega = $('[data-mega]'), megaLink = $('[data-mega-link]'), megaPanel = $('[data-mega-panel]'); let megaTimer;
  const setMega = open => { if (!megaPanel) return; megaPanel.hidden = !open; megaLink.setAttribute('aria-expanded', String(open)); megaLink.querySelector('svg')?.classList.toggle('rotate-180', open); };
  mega?.addEventListener('mouseenter', () => { clearTimeout(megaTimer); setMega(true); });
  mega?.addEventListener('mouseleave', () => { megaTimer = setTimeout(() => setMega(false), 140); });
  mega?.addEventListener('focusin', () => { clearTimeout(megaTimer); setMega(true); });
  mega?.addEventListener('focusout', e => { if (!mega.contains(e.relatedTarget)) megaTimer = setTimeout(() => setMega(false), 140); });
  const mobileMenu = $('[data-mobile-menu]'), menuOpen = $('[data-menu-open]'), menuClose = $('[data-menu-close]'); let previousOverflow = '';
  const setMenu = open => { if (!mobileMenu) return; mobileMenu.hidden = !open; menuOpen?.setAttribute('aria-expanded', String(open)); if (open) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; menuClose?.focus(); } else { document.body.style.overflow = previousOverflow; menuOpen?.focus(); } };
  menuOpen?.addEventListener('click', () => setMenu(true)); menuClose?.addEventListener('click', () => setMenu(false));
  mobileMenu?.addEventListener('keydown', e => { if (e.key !== 'Tab') return; const items = $$('a[href],button:not([hidden])', mobileMenu).filter(x => x.offsetParent !== null); const first = items[0], last = items.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } });
  const mobileExp = $('[data-mobile-exp]'), mobileExpPanel = $('[data-mobile-exp-panel]');
  mobileExp?.addEventListener('click', () => { const open = mobileExpPanel.hidden; mobileExpPanel.hidden = !open; mobileExp.setAttribute('aria-expanded', String(open)); mobileExp.querySelector('svg')?.classList.toggle('rotate-180', open); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { setMega(false); if (mobileMenu && !mobileMenu.hidden) setMenu(false); } });

  // ——— Reveal ———
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }); reveals.forEach(el => io.observe(el)); } else reveals.forEach(el => el.classList.add('is-in'));

  // ——— Hero : promesse rotative ———
  const rotator = $('[data-hero-rotator]'), heroTitle = $('[data-hero-title]'), phrasesEl = $('[data-hero-phrases]');
  if (rotator && heroTitle && phrasesEl) {
    const phrases = JSON.parse(phrasesEl.textContent); let index = 0, timer, leaveTimer, paused = false;
    const phraseNode = (p, leaving = false) => { const span = document.createElement('span'); span.setAttribute('aria-hidden', 'true'); span.className = 'hero-promise' + (leaving ? ' hero-promise--leaving' : ''); span.dataset.heroPhrase = ''; span.innerHTML = `<span class="hero-promise-line text-ink-900"></span><em class="hero-promise-line hero-promise-line--tail font-medium italic ${p.tone}"></em>`; span.children[0].textContent = p.lead; span.children[1].textContent = p.tail; return span; };
    const renderStatic = () => { clearTimeout(timer); clearTimeout(leaveTimer); heroTitle.classList.add('hero-title--static'); $$('[data-hero-phrase]', heroTitle).forEach(x => x.remove()); phrases.forEach(p => heroTitle.append(phraseNode(p))); };
    const schedule = () => { clearTimeout(timer); if (reduced.matches || paused) return; timer = setTimeout(() => { const old = $('[data-hero-phrase]:not(.hero-promise--leaving)', heroTitle); if (old) { old.classList.add('hero-promise--leaving'); leaveTimer = setTimeout(() => old.remove(), 600); } index = (index + 1) % phrases.length; heroTitle.append(phraseNode(phrases[index])); schedule(); }, 6000); };
    const applyMotion = () => { if (reduced.matches) renderStatic(); else { heroTitle.classList.remove('hero-title--static'); $$('[data-hero-phrase]', heroTitle).forEach(x => x.remove()); index = 0; heroTitle.append(phraseNode(phrases[0])); schedule(); } };
    rotator.addEventListener('mouseenter', () => { paused = true; clearTimeout(timer); heroTitle.style.setProperty('--hero-play-state', 'paused'); });
    rotator.addEventListener('mouseleave', () => { paused = false; heroTitle.style.setProperty('--hero-play-state', 'running'); schedule(); });
    rotator.addEventListener('focusin', () => { paused = true; clearTimeout(timer); heroTitle.style.setProperty('--hero-play-state', 'paused'); });
    rotator.addEventListener('focusout', () => { paused = false; heroTitle.style.setProperty('--hero-play-state', 'running'); schedule(); });
    reduced.addEventListener('change', applyMotion); applyMotion();
  }

  // ——— PracticeExplorer ———
  $$('[data-practice-explorer]').forEach(explorer => {
    const tabs = $$('[data-pe-tab]', explorer), panels = $$('[data-pe-panel]', explorer), mobiles = $$('[data-pe-mobile]', explorer), mobilePanels = $$('[data-pe-mobile-panel]', explorer), counts = $$('[data-pe-count]', explorer);
    const select = (i, mobileOpen = true) => { tabs.forEach((t, j) => { const active = j === i; t.classList.toggle('is-active', active); t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; panels[j].hidden = !active; }); mobiles.forEach((m, j) => { const open = mobileOpen && j === i; m.classList.toggle('is-active', open); m.setAttribute('aria-expanded', String(open)); mobilePanels[j].hidden = !open; }); counts.forEach(c => c.textContent = `${tabs[i].dataset.num} / 05`); };
    tabs.forEach((tab, i) => { tab.addEventListener('click', () => select(i)); tab.addEventListener('focus', () => select(i)); tab.addEventListener('keydown', e => { let next = i; if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabs.length; else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length; else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = tabs.length - 1; else return; e.preventDefault(); select(next); tabs[next].focus(); }); });
    mobiles.forEach((m, i) => m.addEventListener('click', () => { const open = m.getAttribute('aria-expanded') !== 'true'; select(i, open); }));
    $$('img[data-fallback-src]', explorer).forEach(img => img.addEventListener('error', () => { if (img.dataset.fallback) img.style.visibility = 'hidden'; else { img.dataset.fallback = 'true'; img.src = img.dataset.fallbackSrc; } }));
  });

  // ——— Accordéons FAQ ———
  const setOpen = (item, open) => { const toggle = $('[data-faq-toggle]', item), question = $('[data-faq-question]', item), icon = $('[data-faq-icon]', item), panel = $('[data-faq-panel]', item); toggle.setAttribute('aria-expanded', String(open)); panel.style.gridTemplateRows = open ? '1fr' : '0fr'; question.classList.toggle('text-wine-700', open); question.classList.toggle('text-ink-900', !open); question.classList.toggle('group-hover:text-wine-700', !open); icon.classList.toggle('rotate-45', open); icon.classList.toggle('border-wine-600', open); icon.classList.toggle('bg-wine-600', open); icon.classList.toggle('text-cream-50', open); icon.classList.toggle('border-sand-400', !open); icon.classList.toggle('text-wine-700', !open); icon.classList.toggle('group-hover:border-wine-600', !open); };
  const initAccordion = acc => { const items = $$('[data-faq-item]', acc); const def = Number(acc.dataset.defaultOpen ?? 0); items.forEach((item, i) => { setOpen(item, i === def); $('[data-faq-toggle]', item).addEventListener('click', () => { const open = $('[data-faq-toggle]', item).getAttribute('aria-expanded') !== 'true'; items.forEach((x, j) => setOpen(x, open && j === i)); }); }); };
  $$('[data-faq-accordion]').forEach(initAccordion);

  // ——— Filtres articles ———
  const articleFilters = $('[data-article-filters]');
  if (articleFilters) {
    const search = $('#article-search'), items = $$('[data-article-item]'), results = $('#article-results'), count = $('#article-count'), empty = $('#article-empty'); let category = $('[data-category][aria-selected="true"]', articleFilters)?.dataset.category || '';
    const setFeatured = (item, featured) => { item.classList.toggle('md:col-span-2', featured); const link = $('[data-article-link]', item), image = $('[data-card-image]', item), body = $('[data-card-body]', item), title = $('[data-card-title]', item), excerpt = $('[data-card-excerpt]', item); link.classList.toggle('lg:flex-row', featured); image.classList.toggle('h-60', featured); image.classList.toggle('lg:h-auto', featured); image.classList.toggle('lg:w-[52%]', featured); image.classList.toggle('h-48', !featured); body.classList.toggle('p-8', featured); body.classList.toggle('lg:p-10', featured); body.classList.toggle('p-6', !featured); title.classList.toggle('text-[30px]', featured); title.classList.toggle('lg:text-[34px]', featured); title.classList.toggle('line-clamp-3', !featured); title.classList.toggle('text-[21px]', !featured); excerpt.classList.toggle('line-clamp-3', !featured); };
    const filter = () => { const q = normalize(search.value.trim()); let n = 0, first = true; items.forEach(item => { const match = (!category || item.dataset.category === category) && (!q || normalize(item.dataset.search).includes(q)); item.hidden = !match; if (match) { setFeatured(item, first && !category && !q); first = false; n++; } }); const filtered = !!category || !!search.value.trim(); results.dataset.filtered = String(filtered); count.hidden = !filtered; count.textContent = ar ? (n === 1 ? 'مقال واحد موجود' : `${n} مقالات موجودة`) : `${n} article${n > 1 ? 's' : ''} trouvé${n > 1 ? 's' : ''}`; empty.hidden = n > 0; $$('[data-category]', articleFilters).forEach(b => { const active = b.dataset.category === category; b.setAttribute('aria-selected', String(active)); b.className = `cursor-pointer rounded-md px-4 py-2 text-[13px] font-medium transition-all duration-200 ${active ? 'bg-wine-600 text-cream-50 shadow-tile' : 'text-ink-600 hover:bg-cream-50 hover:text-wine-700'}`; b.querySelector('span').className = `ml-2 text-[11px] rtl:mr-2 rtl:ml-0 ${active ? 'text-gold-400' : 'text-ink-400'}`; }); };
    $$('[data-category]', articleFilters).forEach(b => b.addEventListener('click', e => { e.preventDefault(); category = b.dataset.category; filter(); }));
    search.addEventListener('input', filter); articleFilters.addEventListener('submit', e => { e.preventDefault(); filter(); });
    $('[data-article-reset]')?.addEventListener('click', () => { category = ''; search.value = ''; filter(); });
  }

  // ——— FAQ : catégories + recherche ———
  const faqSearch = $('#faq-search');
  if (faqSearch) {
    const groups = $$('[data-faq-group]'), buttons = $$('[data-faq-category]'), empty = $('#faq-empty'); let active = 'all';
    const filter = () => { const q = normalize(faqSearch.value.trim()); let total = 0; groups.forEach(group => { const acc = $('[data-faq-accordion]', group); const items = $$('[data-faq-item]', acc); let visible = 0, first = true; items.forEach(item => { const match = !q || normalize(item.textContent).includes(q); item.hidden = !match; if (match) { visible++; setOpen(item, q ? first : false); first = false; } }); const show = (active === 'all' || group.dataset.faqGroup === active) && visible > 0; group.hidden = !show; $('[data-faq-group-count]', group).textContent = `(${visible})`; if (show) total += visible; }); empty.hidden = total > 0; buttons.forEach(b => { const on = b.dataset.faqCategory === active; b.className = `shrink-0 cursor-pointer rounded-lg px-4 py-3 text-left text-[14px] font-medium whitespace-nowrap transition-all rtl:text-right ${on ? 'bg-wine-600 text-cream-50 shadow-tile' : 'border border-sand-300 text-ink-600 hover:border-wine-600/50 hover:text-wine-700 lg:border-transparent'}`; }); };
    buttons.forEach(b => b.addEventListener('click', () => { active = b.dataset.faqCategory; filter(); })); faqSearch.addEventListener('input', filter);
  }

  // ——— Article : sommaire + copie ———
  const toc = $('[data-toc]');
  if (toc && 'IntersectionObserver' in window) { const links = $$('[data-toc-link]', toc); const io = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) return; const i = Number(entry.target.id.replace('section-', '')) - 1; links.forEach((l, j) => { l.className = `-ml-px block w-full cursor-pointer border-l-2 py-2 pl-4 text-left text-[13.5px] leading-snug transition-colors rtl:mr-[-1px] rtl:ml-0 rtl:border-r-2 rtl:border-l-0 rtl:pr-4 rtl:pl-0 rtl:text-right ${j === i ? 'border-wine-600 font-medium text-wine-700' : 'border-transparent text-ink-600 hover:text-wine-700'}`; }); }), { rootMargin: '-30% 0px -60% 0px' }); $$('section[id^="section-"]').forEach(el => io.observe(el)); links.forEach(l => l.addEventListener('click', e => { e.preventDefault(); $(l.getAttribute('href'))?.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' }); })); }
  $('#copy-link')?.addEventListener('click', async e => { const b = e.currentTarget; try { await navigator.clipboard.writeText(b.dataset.copyUrl); } catch {} b.className = 'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all border-success bg-success text-white'; $('[data-copy-icon]', b).hidden = true; $('[data-check-icon]', b).hidden = false; $('#copy-status').hidden = false; setTimeout(() => { b.className = 'flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition-all border-sand-300 text-wine-700 hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50'; $('[data-copy-icon]', b).hidden = false; $('[data-check-icon]', b).hidden = true; $('#copy-status').hidden = true; }, 2200); });

  // ——— Formulaire de consultation ———
  const focusConsultation = () => { const target = $('#consultation-form'); if (!target) return; target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' }); };
  $$('[data-focus-consultation]').forEach(a => a.addEventListener('click', e => { if (location.pathname === '/contact' && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); focusConsultation(); } }));
  if (new URLSearchParams(location.search).get('rendezvous') === '1') requestAnimationFrame(focusConsultation);
  const form = $('[data-consultation]'); if (!form) return;
  const card = $('[data-form-card]'), submit = form.querySelector('[type=submit]'), submitLabel = $('[data-submit-label]', form), errorBox = $('#form-error'), success = $('#form-success'), urgencyInput = $('[data-urgency-input]', form);
  let key = form.dataset.key, sending = false;
  const payload = () => { const data = Object.fromEntries(new FormData(form)); delete data._csrf; delete data._key; data.consent = form.querySelector('[name=consent]').checked; return data; };
  let lastPayload = JSON.stringify(payload());
  const chars = n => form.dataset.chars.replace('{n}', String(n));
  $('#c-message').addEventListener('input', e => { $('#char-count').textContent = chars(e.target.value.length); });
  $('#c-domain').addEventListener('change', e => e.target.classList.toggle('text-ink-400', !e.target.value));
  $$('[data-urgency]', form).forEach(b => b.addEventListener('click', () => { urgencyInput.value = b.dataset.urgency; $$('[data-urgency]', form).forEach(x => { const on = x === b; x.setAttribute('aria-pressed', String(on)); x.className = `cursor-pointer rounded-md border px-4 py-2 text-[13px] transition-all duration-200 ${on ? 'border-wine-600 bg-wine-600 text-cream-50' : 'border-sand-300 bg-cream-100/70 text-ink-600 hover:border-wine-600/50'}`; }); lastPayload = JSON.stringify(payload()); }));
  form.addEventListener('input', e => { e.target.setAttribute('aria-invalid', 'false'); e.target.classList.remove('field-error'); const msg = form.querySelector(`[data-error-for="${e.target.name}"]`); if (msg) { msg.textContent = ''; msg.hidden = true; } errorBox.hidden = true; const next = JSON.stringify(payload()); if (next !== lastPayload) { key = uuid(); lastPayload = next; } });
  const invalid = (name, message) => { const el = form.elements.namedItem(name); el?.setAttribute('aria-invalid', 'true'); el?.classList.add('field-error'); const label = form.querySelector(`[data-error-for="${name}"]`); if (label) { label.textContent = message; label.hidden = false; } return el; };
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (sending) return;
    $$('[data-error-for]', form).forEach(x => { x.textContent = ''; x.hidden = true; }); $$('.field-error', form).forEach(x => x.classList.remove('field-error'));
    const data = payload(); let first;
    if (data.name.trim().length < 2) first ??= invalid('name', $('#c-name').dataset.error);
    if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) first ??= invalid('email', $('#c-email').dataset.error);
    if (data.phone.trim() && !/^[+\d][\d\s.\-()]{7,}$/.test(data.phone.trim())) first ??= invalid('phone', $('#c-phone').dataset.error);
    if (!data.domain) first ??= invalid('domain', $('#c-domain').dataset.error);
    if (data.message.trim().length < 15) first ??= invalid('message', $('#c-message').dataset.error);
    if (!data.consent) first ??= invalid('consent', $('#c-consent').dataset.error);
    if (first) { first.focus(); return; }
    sending = true; submit.disabled = true; form.setAttribute('aria-busy', 'true'); submitLabel.textContent = form.dataset.sending; errorBox.hidden = true;
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('/api/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(data), signal: controller.signal, credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok) { for (const [name, message] of Object.entries(result.error?.fields || {})) first ??= invalid(name, message); if (first) first.focus(); throw new Error(result.error?.message || (ar ? 'تعذر إرسال الطلب. حاول مجدداً.' : 'Envoi impossible. Veuillez réessayer.')); }
      if (!result.persisted) throw new Error('La persistence de la demande n’a pas été confirmée.');
      const urgencyLabel = $(`[data-urgency="${data.urgency}"]`, form)?.textContent || data.urgency;
      $('[data-summary-name]').textContent = data.name; $('[data-summary-domain]').textContent = data.domain; $('[data-summary-urgency]').textContent = urgencyLabel; $('[data-summary-message]').textContent = data.message; $('[data-success-summary]').hidden = false;
      const text = `${form.dataset.waGreeting}\n\n${form.dataset.waName} : ${data.name}\n${form.dataset.waPhone} : ${data.phone || '—'}\n${form.dataset.waEmail} : ${data.email}\n${form.dataset.waDomain} : ${data.domain}\n${form.dataset.waUrgency} : ${urgencyLabel}\n\n${data.message}`;
      $('[data-success-wa]').href = `https://wa.me/${card.dataset.whatsapp}?text=${encodeURIComponent(text)}`; $('[data-success-mail]').href = `${card.dataset.emailHref}?subject=${encodeURIComponent(form.dataset.waSubject.replace('{d}', data.domain))}&body=${encodeURIComponent(text)}`;
      form.hidden = true; success.hidden = false; success.setAttribute('tabindex', '-1'); success.focus();
    } catch (error) { errorBox.textContent = error.name === 'AbortError' ? (ar ? 'انتهت مهلة الاتصال. حاول مجدداً أو اتصل بالمكتب.' : 'La connexion a expiré. Réessayez ou appelez le cabinet.') : error.message; errorBox.hidden = false; errorBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    finally { clearTimeout(timeout); sending = false; submit.disabled = false; form.setAttribute('aria-busy', 'false'); submitLabel.textContent = form.dataset.submit; }
  });
  $('[data-success-edit]')?.addEventListener('click', () => { key = uuid(); form.reset(); urgencyInput.value = 'normal'; $$('[data-urgency]', form).forEach((x, i) => { x.setAttribute('aria-pressed', String(i === 0)); x.className = `cursor-pointer rounded-md border px-4 py-2 text-[13px] transition-all duration-200 ${i === 0 ? 'border-wine-600 bg-wine-600 text-cream-50' : 'border-sand-300 bg-cream-100/70 text-ink-600 hover:border-wine-600/50'}`; }); $('#char-count').textContent = chars(0); success.hidden = true; form.hidden = false; $('#c-name').focus(); });
})();
