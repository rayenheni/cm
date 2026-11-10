'use strict';
(() => {
  const root = document.getElementById('admin-app');
  const preview = document.body.dataset.preview === 'true';
  const state = { csrf: null, token: null, user: null, tab: 'articles', articles: [], reservationQuery: { page: 1, limit: 25, status: '', q: '' }, reservations: null, deleteConfirm: null, editorDirty: false, editorSaving: false, notice: '' };
  let currentHash = window.location.hash;
  let routeVersion = 0;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const date = value => value ? new Date(value).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const statuses = { new: 'Nouveau', contacted: 'Contacté', closed: 'Clôturé' };
  const mailStatuses = { disabled: 'E-mail non configuré', pending: 'E-mail en attente', sending: 'Envoi en cours', sent: 'E-mail envoyé', failed: 'Échec e-mail' };
  const urgencyLabels = { normal: 'Normale', '48h': 'Sous 48 h', urgent: 'Urgente' };
  const domains = { affaires: 'Droit des affaires', famille: 'Famille & statut personnel', travail: 'Droit du travail', penal: 'Pénal & cybercriminalité', mediation: 'Médiation' };
  const message = error => error?.message || 'Opération impossible. Vérifiez votre connexion et réessayez.';
  const paths = {
    FileText: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    Calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 5 2 2 5-5"/>',
    Lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>',
    LogOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    Menu: '<path d="M4 7h16M4 12h16M4 17h10"/>', Close: '<path d="M6 6l12 12M18 6 6 18"/>',
    Plus: '<path d="M12 5v14M5 12h14"/>', Pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    Trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    Refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/>', Search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    Inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>',
    Mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7.5 9 6 9-6"/>', Shield: '<path d="M12 3l7 3v5c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V6l7-3Z"/><circle cx="12" cy="10" r="1.6"/><path d="M12 11.6V14"/>',
    ChevronDown: '<path d="m6 9 6 6 6-6"/>',
  };
  const icon = (name, cls = 'h-4 w-4') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${paths[name] || ''}</svg>`;

  const monogram = (cls = 'h-11 w-11') => `<img src="/assets/cmcb-monogram.png" alt="Monogramme CMCB" width="290" height="290" class="${cls}" style="background:linear-gradient(135deg,#ece1c9,#d6c29d)">`;
  function headers(write = false) { const h = {}; if (state.csrf && write) h['X-CSRF-Token'] = state.csrf; if (state.token) h['X-CMCB-Session'] = state.token; return h; }
  async function api(path, options = {}) {
    const method = options.method || 'GET'; const h = headers(method !== 'GET');
    if (options.body !== undefined) h['Content-Type'] = 'application/json';
    if (options.headers) Object.assign(h, options.headers);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch('/api' + path, { method, headers: h, body: options.body === undefined ? undefined : JSON.stringify(options.body), credentials: 'same-origin', cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (!response.ok) { const fields = Object.entries(data.error?.fields || {}).map(([k, v]) => `${k} : ${v}`).join('\n'); const error = new Error((data.error?.message || 'La requête a échoué.') + (fields ? '\n' + fields : '')); error.status = response.status; error.fields = data.error?.fields || {}; throw error; }
      return data;
    } catch (error) { if (error.name === 'AbortError') throw new Error('Le serveur met trop de temps à répondre. Réessayez.'); throw error; }
    finally { clearTimeout(timer); }
  }
  function clear() { routeVersion++; state.csrf = null; state.token = null; state.user = null; state.editorDirty = false; state.editorSaving = false; }
  function feedback(text, kind = 'error') { const el = document.getElementById('feedback'); if (el) { el.className = `mb-5 rounded-lg border p-4 text-sm ${kind === 'success' ? 'border-success/25 bg-success/10 text-success' : 'border-danger/25 bg-red-50 text-danger'}`; el.textContent = text; el.hidden = false; el.scrollIntoView({ block: 'nearest' }); } }
  function login(error = '') {
    clear();
    root.innerHTML = `<div class="flex min-h-screen items-center justify-center bg-[#f6f3ec] px-4 py-12"><div class="w-full max-w-sm">
      <div class="mb-10 text-center">${monogram('mx-auto mb-5 h-16 w-16 rounded-md shadow-tile')}<h1 class="font-serif text-3xl font-semibold text-wine-800">Espace Admin</h1><p class="mt-2 flex items-center justify-center gap-2 text-xs text-ink-600">${icon('Lock', 'h-3.5 w-3.5')} Connexion sécurisée</p><p class="mt-1.5 text-sm tracking-wide text-ink-600">CMCB · Cabinet Bhiri</p></div>
      <div class="rounded-xl border border-sand-300 bg-white p-8 shadow-soft"><form id="login-form">
        <label for="admin-email" class="mb-1.5 block text-xs font-medium tracking-widest text-ink-600 uppercase">Adresse e-mail</label><input id="admin-email" name="email" type="email" autocomplete="username" required maxlength="254" class="field">
        <label for="admin-password" class="mt-5 mb-1.5 block text-xs font-medium tracking-widest text-ink-600 uppercase">Mot de passe</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required maxlength="128" class="field">
        <p id="login-error" role="alert" class="mt-4 text-sm leading-relaxed text-danger" ${error ? '' : 'hidden'}>${esc(error)}</p>
        <button type="submit" class="btn-wine mt-6 w-full disabled:cursor-wait">Se connecter</button>
      </form></div>
      <p class="mt-6 text-center text-xs leading-relaxed text-ink-600">Accès réservé. Premier lancement : créez votre compte avec <code>php bin/admin-create.php</code> sur le serveur.</p>
      <a href="/" class="mt-4 block text-center text-sm text-wine-700 hover:underline">Retour au site</a>
    </div></div>`;
    document.getElementById('login-form').addEventListener('submit', async event => {
      event.preventDefault(); const form = event.currentTarget, button = form.querySelector('button'); button.disabled = true; button.textContent = 'Vérification…';
      const errorBox = document.getElementById('login-error'); errorBox.hidden = true;
      try {
        const values = Object.fromEntries(new FormData(form)); if (preview) values.transport = 'bearer';
        const result = await api('/auth/login', { method: 'POST', body: values, headers: preview ? { 'X-Auth-Transport': 'bearer' } : {} });
        state.csrf = result.csrfToken; state.token = result.sessionToken || null; state.user = result.user;
        const verified = await api('/auth/session');
        if (!verified.authenticated || !verified.csrfToken) { clear(); throw new Error(preview ? 'Le proxy de la preview ne transmet pas la session. Rechargez le panneau Preview Arena et réessayez ici.' : 'Le navigateur a bloqué la session. Autorisez les cookies pour ce site, puis réessayez.'); }
        state.user = verified.user; state.csrf = verified.csrfToken; state.tab = 'articles'; shell(); await renderRoute();
      } catch (err) { errorBox.textContent = message(err); errorBox.hidden = false; button.disabled = false; button.textContent = 'Se connecter'; }
    });
  }
  const navItems = [['articles', 'Articles', 'Publications FR / AR', 'FileText'], ['reservations', 'Réservations', 'Demandes de consultation', 'Calendar'], ['settings', 'Sécurité', 'Compte et configuration', 'Lock']];
  function shell() {
    root.innerHTML = `<div class="flex min-h-screen bg-[#f6f3ec] text-ink-900">
      <button type="button" id="sidebar-backdrop" aria-label="Fermer le menu" class="fixed inset-0 z-20 bg-wine-950/50 lg:hidden" hidden></button>
      <aside id="sidebar" class="fixed inset-y-0 left-0 z-30 flex w-72 -translate-x-full flex-col border-r border-wine-900 bg-wine-950 text-cream-100 transition-transform duration-200 lg:static lg:translate-x-0">
        <div class="flex items-center gap-3 border-b border-cream-50/10 px-6 py-6">${monogram('h-11 w-11 shrink-0 rounded')}<div class="min-w-0"><p class="font-serif text-xl font-semibold tracking-wide text-cream-50">CMCB</p><p class="text-xs text-cream-200/65">Administration du cabinet</p></div><button type="button" id="sidebar-close" class="ml-auto rounded-md p-2 text-cream-200/70 hover:bg-cream-50/10 hover:text-cream-50 lg:hidden" aria-label="Fermer le menu">${icon('Close', 'h-5 w-5')}</button></div>
        <nav class="flex-1 overflow-y-auto px-4 py-6" aria-label="Navigation admin"><p class="px-3 text-[11px] font-medium tracking-[0.14em] text-cream-200/45 uppercase">Gestion</p><ul class="mt-3 space-y-1">${navItems.map(([id, label, desc, ic]) => `<li><button type="button" data-tab="${id}" class="flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors border-transparent text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50">${icon(ic, 'h-5 w-5 shrink-0 text-cream-200/50')}<span class="min-w-0"><span class="block text-sm font-medium">${label}</span><span class="block truncate text-xs text-cream-200/50">${desc}</span></span></button></li>`).join('')}</ul></nav>
        <div class="border-t border-cream-50/10 p-4"><a href="/" class="mb-2 block rounded-lg px-3 py-2.5 text-sm text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50">Voir le site public</a><button type="button" id="logout" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-cream-200/80 hover:bg-cream-50/5 hover:text-cream-50">${icon('LogOut')} Déconnexion</button></div>
      </aside>
      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-10 border-b border-sand-300 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-8"><div class="flex items-center gap-4"><button type="button" id="mobile-menu" class="rounded-md border border-sand-300 p-2 text-ink-600 hover:bg-cream-100 lg:hidden" aria-label="Ouvrir le menu" aria-expanded="false">${icon('Menu', 'h-5 w-5')}</button><div class="min-w-0"><p class="text-[11px] font-medium tracking-[0.12em] text-ink-400 uppercase">Espace administrateur</p><h1 id="page-title" class="truncate font-serif text-2xl font-semibold text-wine-800">Articles</h1></div><div class="ml-auto hidden items-center gap-3 sm:flex"><span class="rounded-md border border-sand-300 bg-cream-50 px-3 py-1.5 text-xs text-ink-600">Session sécurisée</span><button type="button" id="top-logout" class="rounded-lg border border-sand-300 px-4 py-2 text-sm font-medium text-ink-600 hover:border-wine-600/40 hover:text-wine-700">Déconnexion</button></div></div></header>
        <main class="flex-1 overflow-auto p-5 sm:p-8"><div class="mx-auto max-w-7xl"><div id="feedback" role="status" hidden></div><div id="panel"><p class="text-sm text-ink-600" role="status">Chargement…</p></div></div></main>
      </div></div>`;
    root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
    document.getElementById('logout').addEventListener('click', logout); document.getElementById('top-logout').addEventListener('click', logout);
    const sidebar = document.getElementById('sidebar'), backdrop = document.getElementById('sidebar-backdrop');
    const setSidebar = open => { sidebar.classList.toggle('-translate-x-full', !open); sidebar.classList.toggle('translate-x-0', open); backdrop.hidden = !open; document.getElementById('mobile-menu').setAttribute('aria-expanded', String(open)); };
    document.getElementById('mobile-menu').addEventListener('click', () => setSidebar(true)); document.getElementById('sidebar-close').addEventListener('click', () => setSidebar(false)); backdrop.addEventListener('click', () => setSidebar(false));
  }
  function mayLeaveEditor() { return !state.editorSaving && (!state.editorDirty || confirm('Vous avez des modifications non enregistrées. Quitter cette page ?')); }
  async function logout() { if (!mayLeaveEditor()) return; try { await api('/auth/logout', { method: 'POST', body: {} }); state.editorDirty = false; login(); } catch (error) { feedback(message(error)); } }
  function switchTab(tab) {
    const hash = tab === 'articles' ? '#/articles' : '#/' + tab;
    if (window.location.hash !== hash) {
      if (!mayLeaveEditor()) return;
      state.editorDirty = false;
      window.location.hash = hash;
    } else if (!state.editorDirty && !state.editorSaving) void renderRoute();
  }
  window.addEventListener('hashchange', () => {
    if (!mayLeaveEditor()) { history.replaceState(history.state, '', location.pathname + location.search + currentHash); return; }
    state.editorDirty = false; state.editorSaving = false; currentHash = location.hash;
    if (state.user) void renderRoute();
  });
  window.addEventListener('beforeunload', event => { if (state.editorDirty || state.editorSaving) { event.preventDefault(); event.returnValue = ''; } });
  async function renderRoute() {
    const version = ++routeVersion;
    const hash = window.location.hash;
    const match = hash.match(/^#\/articles\/([a-z0-9-]+)\/edit$/);
    if (hash === '#/articles/new' || match) {
      await renderTab('articles');
      if (version !== routeVersion || !state.user || window.location.hash !== hash || !document.getElementById('new-article')) return;
      if (match) {
        const article = state.articles.find(a => a.id === match[1]);
        if (!article) { panel().innerHTML = '<div role="alert" class="space-y-4"><p>Article introuvable.</p><button class="btn-outline" id="back-to-articles">Retour aux articles</button></div>'; document.getElementById('back-to-articles').addEventListener('click', () => switchTab('articles')); return; }
        editor(article);
      } else editor();
    } else await renderTab(hash === '#/reservations' ? 'reservations' : hash === '#/settings' ? 'settings' : 'articles');
    if (version === routeVersion && state.notice) { feedback(state.notice, 'success'); state.notice = ''; }
  }
  async function renderTab(tab) {
    const version = routeVersion;
    state.tab = tab; state.deleteConfirm = null; document.getElementById('sidebar').classList.add('-translate-x-full'); document.getElementById('sidebar').classList.remove('translate-x-0'); document.getElementById('sidebar-backdrop').hidden = true; document.getElementById('mobile-menu').setAttribute('aria-expanded', 'false');
    document.querySelectorAll('[data-tab]').forEach(b => { const active = b.dataset.tab === tab; b.className = `flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${active ? 'border-gold-500/30 bg-cream-50/10 text-cream-50' : 'border-transparent text-cream-200/70 hover:bg-cream-50/5 hover:text-cream-50'}`; b.querySelector('svg').setAttribute('class', `h-5 w-5 shrink-0 ${active ? 'text-gold-400' : 'text-cream-200/50'}`); if (active) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    document.getElementById('page-title').textContent = { articles: 'Articles', reservations: 'Réservations', settings: 'Sécurité' }[tab];
    document.getElementById('feedback').hidden = true; document.getElementById('panel').innerHTML = '<p class="text-sm text-ink-600" role="status">Chargement…</p>';
    try { if (tab === 'articles') await loadArticles(); else if (tab === 'reservations') await loadReservations(); else await loadSettings(); }
    catch (error) { if (version !== routeVersion || !state.user) return; if (error.status === 401) login('Votre session a expiré. Reconnectez-vous.'); else document.getElementById('panel').innerHTML = `<div role="alert" class="mb-5 rounded-lg border border-danger/25 bg-red-50 p-4 text-sm text-danger">${esc(message(error))} <button class="ml-2 underline" id="retry-load">Réessayer</button></div>`, document.getElementById('retry-load').addEventListener('click', () => switchTab(tab)); }
  }
  const panel = () => document.getElementById('panel');
  async function loadArticles() { const version = routeVersion; const result = await api('/admin/articles'); if (version !== routeVersion || !state.user) return; state.articles = result.articles; renderArticles(); }
  function renderArticles() {
    panel().innerHTML = `<div class="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 class="font-serif text-3xl font-semibold text-wine-800">Articles</h2><p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Gérez les publications françaises et arabes du site. Les brouillons restent privés ; les articles publiés sont visibles par tous les visiteurs.</p></div><button class="btn-wine" id="new-article">${icon('Plus')} Nouvel article</button></div>
    <div class="overflow-x-auto rounded-xl border border-sand-300 bg-white shadow-tile"><table class="w-full text-sm"><thead><tr class="border-b border-sand-300 bg-cream-50 text-left text-[11px] font-semibold tracking-[0.08em] text-ink-600 uppercase"><th class="px-5 py-4">Article</th><th class="px-4 py-4">Statut</th><th class="hidden px-4 py-4 md:table-cell">Langues</th><th class="px-5 py-4 text-right">Actions</th></tr></thead><tbody class="divide-y divide-sand-300">${state.articles.map(a => `<tr><td class="max-w-sm px-5 py-4"><p class="font-medium text-ink-900">${esc(a.translations.fr.title)}</p><p class="mt-1 break-all font-mono text-xs text-ink-400">${esc(a.id)}</p></td><td class="px-4 py-4"><span class="badge ${a.status} inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${a.status === 'published' ? 'border-success/20 bg-success/10 text-success' : 'border-gold-500/25 bg-gold-500/10 text-gold-600'}">${a.status === 'published' ? 'Publié' : 'Brouillon'}</span></td><td class="hidden px-4 py-4 text-ink-600 md:table-cell">FR${a.translations.ar ? ' · AR' : ''}</td><td class="px-5 py-4"><div class="flex flex-wrap justify-end gap-2"><button class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-wine-700 hover:bg-cream-50" data-edit="${esc(a.id)}">${icon('Pencil', 'h-3.5 w-3.5')} Modifier</button>${a.status === 'published' ? `<a class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-ink-600 hover:bg-cream-50" href="/articles/${esc(a.id)}" target="_blank" rel="noreferrer">Voir</a>` : ''}${state.deleteConfirm === a.id ? `<button class="cursor-pointer rounded-md bg-danger px-3 py-2 text-xs font-medium text-white" data-confirm-delete="${esc(a.id)}">Confirmer</button><button class="px-2 text-xs" data-cancel-delete>Annuler</button>` : `<button class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50" data-delete="${esc(a.id)}">${icon('Trash', 'h-3.5 w-3.5')} Supprimer</button>`}</div></td></tr>`).join('')}</tbody></table>${state.articles.length ? '' : `<div class="p-12 text-center">${icon('FileText', 'mx-auto h-8 w-8 text-ink-400')}<p class="mt-3 text-ink-600">Aucun article. Créez votre premier article.</p></div>`}</div>`;
    document.getElementById('new-article').addEventListener('click', () => { window.location.hash = '#/articles/new'; });
    panel().querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { window.location.hash = '#/articles/' + encodeURIComponent(b.dataset.edit) + '/edit'; }));
    panel().querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => { state.deleteConfirm = b.dataset.delete; renderArticles(); }));
    panel().querySelectorAll('[data-cancel-delete]').forEach(b => b.addEventListener('click', () => { state.deleteConfirm = null; renderArticles(); }));
    panel().querySelectorAll('[data-confirm-delete]').forEach(b => b.addEventListener('click', async () => { b.disabled = true; b.textContent = 'Suppression…'; try { await api('/admin/articles/' + encodeURIComponent(b.dataset.confirmDelete), { method: 'DELETE' }); state.deleteConfirm = null; await loadArticles(); feedback('Article supprimé.', 'success'); } catch (e) { feedback(message(e)); renderArticles(); } }));
  }
  function translationFields(lang, tr = {}) {
    const ar = lang === 'ar'; const field = (key, label, type = 'input', max = 240, required = true) => `<div><label class="field-label" for="${lang}-${key}">${label}</label>${type === 'textarea' ? `<textarea id="${lang}-${key}" name="${lang}-${key}" class="field" rows="${key === 'intro' ? 4 : 3}" maxlength="${max}" ${required ? 'required' : ''} ${ar ? 'dir="rtl"' : ''}>${esc(tr[key] || '')}</textarea>` : `<input id="${lang}-${key}" name="${lang}-${key}" class="field" value="${esc(tr[key] || '')}" maxlength="${max}" ${required ? 'required' : ''} ${ar ? 'dir="rtl"' : ''}>`}</div>`;
    return `<section data-translation="${lang}" dir="${ar ? 'rtl' : 'ltr'}" class="space-y-5">${field('title', 'Titre *')}${field('category', 'Catégorie *', 'input', 120)}${field('readTime', 'Temps de lecture *', 'input', 40)}${field('excerpt', 'Résumé *', 'textarea', 1200)}${field('imageAlt', 'Description de l’image', 'input', 300, false)}${field('intro', 'Introduction *', 'textarea', 10000)}<fieldset><legend class="field-label mb-3">Sections *</legend><div class="space-y-4" data-sections>${(tr.sections?.length ? tr.sections : [{ heading: '', paragraphs: [''] }]).map((s, i) => sectionFields(lang, i, s)).join('')}</div><button type="button" class="btn-outline mt-4 px-4! py-2.5!" data-add-section>${icon('Plus')} Ajouter une section</button></fieldset><div><label class="field-label" for="${lang}-keyPoints">Points clés</label><textarea id="${lang}-keyPoints" name="${lang}-keyPoints" class="field" rows="3" maxlength="20000" ${ar ? 'dir="rtl"' : ''}>${esc((tr.keyPoints || []).join('\n'))}</textarea><p class="mt-1 text-xs text-ink-400">Un point par ligne · 20 maximum.</p></div></section>`;
  }
  function sectionFields(lang, index, s = { heading: '', paragraphs: [''] }) {
    return `<div class="rounded-lg border border-sand-300 bg-cream-50 p-4" data-section><div class="mb-3 flex items-center justify-between"><span class="text-xs text-ink-400">Section ${index + 1}</span><button type="button" class="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-danger" data-remove-section>${icon('Trash', 'h-3.5 w-3.5')} Supprimer</button></div><label class="field-label">Titre de section *</label><input name="${lang}-heading" class="field mb-3" maxlength="240" required value="${esc(s.heading)}" ${lang === 'ar' ? 'dir="rtl"' : ''}><label class="field-label">Paragraphes — un par ligne *</label><textarea name="${lang}-paragraphs" class="field" rows="5" required ${lang === 'ar' ? 'dir="rtl"' : ''}>${esc(s.paragraphs.join('\n'))}</textarea></div>`;
  }
  function bindSections(container) {
    container.addEventListener('click', event => {
      const add = event.target.closest('[data-add-section]'), remove = event.target.closest('[data-remove-section]');
      if (add) { const list = container.querySelector('[data-sections]'); if (list.children.length >= 30) return; const lang = container.dataset.translation; list.insertAdjacentHTML('beforeend', sectionFields(lang, list.children.length)); }
      if (remove) { const list = container.querySelector('[data-sections]'); if (list.children.length <= 1) { const fields = remove.closest('[data-section]').querySelectorAll('input,textarea'); fields.forEach(x => x.value = ''); } else remove.closest('[data-section]').remove(); [...list.children].forEach((s, i) => s.querySelector('span').textContent = `Section ${i + 1}`); }
    });
  }
  function editor(article) {
    const edit = !!article; const a = article || { id: '', expertiseId: 'affaires', image: '', status: 'draft', translations: { fr: { readTime: '5 min' } } };
    const backdrop = panel();
    document.getElementById('page-title').textContent = edit ? 'Modifier l’article' : 'Nouvel article';
    backdrop.innerHTML = `<section aria-labelledby="article-form-title" class="mx-auto max-w-3xl"><button type="button" data-close class="mb-5 cursor-pointer text-sm font-medium text-wine-700 hover:underline">← Retour aux articles</button><div class="rounded-xl border border-sand-300 bg-white shadow-tile"><header class="border-b border-sand-300 px-6 py-5"><h2 tabindex="-1" id="article-form-title" class="font-serif text-3xl font-semibold text-wine-800 outline-none">${edit ? 'Modifier l’article' : 'Nouvel article'}</h2><p class="mt-2 text-sm text-ink-600">Rédigez et gérez les versions française et arabe de votre publication.</p></header>
    <p id="upload-status" role="status" class="px-6 pt-4 text-sm text-ink-600" hidden>Téléversement de l’image…</p><form id="article-form"><div class="space-y-5 px-6 py-6"><p id="editor-error" role="alert" class="rounded-lg border border-danger/25 bg-red-50 p-4 text-sm text-danger" hidden></p>
      <div class="grid gap-4 sm:grid-cols-2"><div><label class="field-label" for="article-slug">Identifiant / slug *</label><input id="article-slug" name="id" class="field font-mono" value="${esc(a.id)}" required maxlength="120" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" ${edit ? 'readonly' : ''}>${edit ? '<p class="mt-1 text-xs text-ink-400">Conservé pour ne pas casser les liens existants.</p>' : ''}</div><div><label class="field-label" for="article-status">Publication</label><select id="article-status" name="status" class="field"><option value="draft" ${a.status === 'draft' ? 'selected' : ''}>Brouillon — privé</option><option value="published" ${a.status === 'published' ? 'selected' : ''}>Publié — français et arabe</option></select></div><div><label class="field-label" for="article-expertise">Domaine *</label><select id="article-expertise" name="expertiseId" class="field">${Object.entries(domains).map(([id, label]) => `<option value="${id}" ${id === a.expertiseId ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="sm:col-span-2"><label class="field-label" for="article-image">Image par lien HTTPS (facultative)</label><input id="article-image" name="image" type="text" inputmode="url" placeholder="https://…" class="field" maxlength="2048" value="${esc(a.image)}"><label class="field-label mt-4" for="article-image-file">Ou téléverser une image</label><input id="article-image-file" type="file" accept="image/jpeg,image/png,image/webp" class="field"><p class="mt-2 text-xs text-ink-600">JPEG, PNG ou WebP · 2 Mo maximum. Une image téléversée peut être accessible par son lien, même avant publication.</p><img id="image-preview" alt="Aperçu de l’image" referrerpolicy="no-referrer" class="mt-4 h-36 max-w-full rounded-lg object-cover" hidden></div></div>
      <label class="flex cursor-pointer items-center gap-3 rounded-lg border border-sand-300 bg-cream-50 p-4 text-sm text-ink-600"><input type="checkbox" name="includeAr" class="h-4 w-4 accent-wine-600" ${a.translations.ar ? 'checked' : ''}> Inclure la traduction arabe (obligatoire pour publier)</label>
      <div class="flex gap-2 border-b border-sand-300 pb-3" role="tablist" aria-label="Langue de l’article"><button type="button" role="tab" aria-selected="true" data-lang-tab="fr" class="cursor-pointer rounded-md bg-wine-600 px-5 py-2 text-sm font-medium text-white">Français</button><button type="button" role="tab" aria-selected="false" data-lang-tab="ar" class="cursor-pointer rounded-md bg-cream-200 px-5 py-2 text-sm font-medium text-ink-600">العربية</button></div>
      <div data-lang-panel="fr">${translationFields('fr', a.translations.fr)}</div><div data-lang-panel="ar" id="ar-wrapper" ${a.translations.ar ? '' : 'hidden'}>${translationFields('ar', a.translations.ar || { readTime: '5 دقائق' })}</div>
    </div><footer class="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-sand-300 bg-cream-50 px-6 py-4"><button type="button" class="btn-outline px-5! py-2.5!" data-close>Annuler</button><button class="btn-wine px-5! py-2.5!" type="submit">${edit ? 'Enregistrer les modifications' : 'Enregistrer le brouillon'}</button></footer></form></div></section>`;
    const form = backdrop.querySelector('#article-form'), arWrapper = backdrop.querySelector('#ar-wrapper');
    const close = () => switchTab('articles');
    backdrop.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    backdrop.querySelector('#article-form-title').focus();
    form.addEventListener('input', () => { state.editorDirty = true; });
    form.addEventListener('change', () => { state.editorDirty = true; });
    form.addEventListener('click', event => { if (event.target.closest('[data-add-section],[data-remove-section]')) state.editorDirty = true; });
    const image = form.elements.image, preview = form.querySelector('#image-preview');
    const updatePreview = () => {
      const url = image.value.trim();
      const valid = /^https:\/\//.test(url) || /^\/media\/[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(url);
      preview.hidden = !valid;
      if (valid) preview.src = url; else preview.removeAttribute('src');
    };
    image.addEventListener('input', updatePreview); updatePreview();
    form.querySelector('#article-image-file').addEventListener('change', async event => {
      const file = event.currentTarget.files?.[0]; event.currentTarget.value = '';
      if (!file) return;
      const errorBox = form.querySelector('#editor-error'); errorBox.hidden = true;
      if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { errorBox.textContent = 'Choisissez une image JPEG, PNG ou WebP de 2 Mo maximum.'; errorBox.hidden = false; return; }
      state.editorSaving = true; form.inert = true; const status = backdrop.querySelector('#upload-status'); status.hidden = false;
      try {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader(); reader.onerror = () => reject(new Error('Impossible de lire ce fichier.'));
          reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject(new Error('Impossible de lire ce fichier.'));
          reader.readAsDataURL(file);
        });
        const result = await api('/admin/media', { method: 'POST', body: { data } });
        image.value = result.url; state.editorDirty = true; updatePreview();
      } catch (error) { errorBox.textContent = message(error); errorBox.hidden = false; }
      finally { state.editorSaving = false; form.inert = false; status.hidden = true; }
    });
    form.noValidate = true;
    const setLang = lang => { backdrop.querySelectorAll('[data-lang-panel]').forEach(p => p.hidden = p.dataset.langPanel !== lang); backdrop.querySelectorAll('[data-lang-tab]').forEach(b => { const on = b.dataset.langTab === lang; b.setAttribute('aria-selected', String(on)); b.className = `cursor-pointer rounded-md px-5 py-2 text-sm font-medium ${on ? 'bg-wine-600 text-white' : 'bg-cream-200 text-ink-600'}`; }); };
    backdrop.querySelectorAll('[data-lang-tab]').forEach(b => b.addEventListener('click', () => { if (b.dataset.langTab === 'ar') { form.elements.includeAr.checked = true; toggleAr(); } setLang(b.dataset.langTab); }));
    const toggleAr = () => { const on = form.elements.includeAr.checked; arWrapper.querySelectorAll('input,textarea,button').forEach(el => el.disabled = !on); backdrop.querySelector('[data-lang-tab="ar"]').disabled = !on; if (!on) setLang('fr'); };
    form.elements.includeAr.addEventListener('change', () => { toggleAr(); if (form.elements.includeAr.checked) setLang('ar'); }); toggleAr(); if (a.translations.ar) setLang('fr');
    form.querySelectorAll('[data-translation]').forEach(bindSections);
    form.elements.status.addEventListener('change', () => { if (form.elements.status.value === 'published') { form.elements.includeAr.checked = true; toggleAr(); setLang('ar'); } form.querySelector('[type=submit]').textContent = form.elements.status.value === 'published' ? 'Enregistrer et publier' : 'Enregistrer le brouillon'; });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const invalid = [...form.elements].find(el => el.willValidate && !el.validity.valid);
      if (invalid) { const translation = invalid.closest('[data-translation]'); if (translation) setLang(translation.dataset.translation); invalid.reportValidity(); invalid.focus(); return; }
      state.editorSaving = true; form.inert = true; const button = form.querySelector('[type=submit]'); button.disabled = true; const errorBox = backdrop.querySelector('#editor-error'); errorBox.hidden = true;
      const readTranslation = lang => { const get = key => form.elements.namedItem(`${lang}-${key}`).value.trim(); return { title: get('title'), category: get('category'), readTime: get('readTime'), excerpt: get('excerpt'), imageAlt: get('imageAlt'), intro: get('intro'), sections: [...form.querySelector(`[data-translation="${lang}"] [data-sections]`).children].map(s => ({ heading: s.querySelector('input').value.trim(), paragraphs: s.querySelector('textarea').value.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) })), keyPoints: get('keyPoints').split('\n').map(p => p.trim()).filter(Boolean) }; };
      const input = { id: form.elements.id.value.trim(), expertiseId: form.elements.expertiseId.value, image: form.elements.image.value.trim(), status: form.elements.status.value, translations: { fr: readTranslation('fr') } };
      if (form.elements.includeAr.checked) input.translations.ar = readTranslation('ar');
      try { await api('/admin/articles' + (edit ? '/' + encodeURIComponent(a.id) : ''), { method: edit ? 'PUT' : 'POST', body: input }); state.editorDirty = false; state.editorSaving = false; state.notice = edit ? 'Modifications enregistrées.' : 'Article créé.'; close(); }
      catch (e) { errorBox.textContent = message(e); errorBox.hidden = false; errorBox.scrollIntoView({ block: 'center' }); const field = Object.keys(e.fields || {})[0]; if (field?.startsWith('translations.ar')) { form.elements.includeAr.checked = true; toggleAr(); setLang('ar'); } else if (field?.startsWith('translations.fr')) setLang('fr'); }
      finally { state.editorSaving = false; form.inert = false; button.disabled = false; }
    });
  }
  async function loadReservations() { const version = routeVersion; const q = state.reservationQuery; const params = new URLSearchParams({ page: q.page, limit: q.limit }); if (q.status) params.set('status', q.status); if (q.q) params.set('q', q.q); const result = await api('/admin/reservations?' + params); if (version !== routeVersion || !state.user) return; state.reservations = result; renderReservations(); }
  function renderReservations() {
    const data = state.reservations, q = state.reservationQuery; const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
    panel().innerHTML = `<div class="mb-6"><h2 class="font-serif text-3xl font-semibold text-wine-800">Demandes de consultation</h2><p class="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">Suivez les demandes reçues, contactez les prospects et clôturez les dossiers. Un rendez-vous doit être confirmé par le cabinet.</p></div>
    <div class="mb-6 grid grid-cols-3 gap-3">${Object.entries(statuses).map(([key, label]) => `<button type="button" data-status-filter="${key}" aria-pressed="${q.status === key}" class="cursor-pointer rounded-xl border bg-white p-5 text-left shadow-tile transition-colors ${q.status === key ? 'border-wine-600 ring-2 ring-wine-600/10' : 'border-sand-300 hover:border-wine-600/40'}"><span class="block font-serif text-4xl font-semibold text-wine-700">${data.counts[key]}</span><span class="mt-2 text-xs font-medium tracking-[0.06em] text-ink-600 uppercase">${label}</span></button>`).join('')}</div>
    <form id="reservation-filters" class="mb-5 flex flex-wrap gap-3 rounded-xl border border-sand-300 bg-white p-4 shadow-tile"><div class="relative max-w-md min-w-64 flex-1">${icon('Search', 'pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400')}<input name="q" type="search" maxlength="200" value="${esc(q.q)}" class="field pl-10" placeholder="Rechercher un nom, e-mail, domaine…" aria-label="Rechercher les demandes"></div><select name="status" class="field w-auto" aria-label="Filtrer par statut"><option value="">Tous les statuts</option>${Object.entries(statuses).map(([key, label]) => `<option value="${key}" ${q.status === key ? 'selected' : ''}>${label}</option>`).join('')}</select><button class="btn-outline px-4! py-2.5!" type="submit">Filtrer</button><button class="btn-outline px-4! py-2.5!" type="button" id="refresh-reservations">${icon('Refresh')} Actualiser</button><button class="btn-outline px-4! py-2.5!" type="button" id="reset-filters">Réinitialiser</button></form>
    ${data.reservations.length ? `<div class="overflow-x-auto rounded-xl border border-sand-300 bg-white shadow-tile"><table class="w-full text-sm"><thead><tr class="border-b border-sand-300 bg-cream-50 text-left text-[11px] font-semibold tracking-[0.08em] text-ink-600 uppercase"><th class="px-5 py-4">Date</th><th class="px-4 py-4">Contact</th><th class="hidden px-4 py-4 lg:table-cell">Domaine / urgence</th><th class="px-4 py-4">Statut</th><th class="px-5 py-4 text-right">Actions</th></tr></thead><tbody class="divide-y divide-sand-300">${data.reservations.map(r => `<tr class="hover:bg-cream-50"><td class="whitespace-nowrap px-5 py-4 text-xs text-ink-600">${esc(date(r.createdAt))}</td><td class="px-4 py-4"><button type="button" class="cursor-pointer text-left" data-view="${esc(r.id)}"><span class="flex items-center gap-2 font-medium text-ink-900">${esc(r.name)}${icon('ChevronDown', 'h-3.5 w-3.5 text-ink-400')}</span><span class="text-xs text-ink-600">${esc(r.email)}</span></button></td><td class="hidden px-4 py-4 lg:table-cell"><p>${esc(r.domain)}</p><p class="mt-1 text-xs text-ink-400">${urgencyLabels[r.urgency]}</p></td><td class="px-4 py-4"><span class="badge ${r.status} inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${r.status === 'new' ? 'border-info/20 bg-info/10 text-info' : r.status === 'contacted' ? 'border-warning/25 bg-warning/10 text-warning' : 'border-success/20 bg-success/10 text-success'}">${statuses[r.status]}</span></td><td class="px-5 py-4"><div class="flex flex-wrap justify-end gap-2"><button class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-wine-700 hover:bg-cream-50" data-view="${esc(r.id)}">Consulter</button></div></td></tr>`).join('')}</tbody></table></div>` : `<div class="rounded-xl border border-dashed border-sand-400 bg-white p-12 text-center text-ink-600">${data.total === 0 && !q.status && !q.q ? `${icon('Inbox', 'mx-auto mb-3 h-8 w-8 text-ink-400')}<p>Aucune demande pour l’instant. Les demandes du formulaire apparaîtront ici.</p>` : '<p>Aucun résultat pour ces filtres.</p>'}</div>`}
    <div class="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-600"><span>${data.total} demande${data.total !== 1 ? 's' : ''} · page ${data.page} / ${totalPages}</span><div class="flex gap-2"><button class="btn-outline px-4! py-2!" id="previous" ${data.page <= 1 ? 'disabled' : ''}>Précédent</button><button class="btn-outline px-4! py-2!" id="next" ${data.page >= totalPages ? 'disabled' : ''}>Suivant</button></div></div>`;
    document.getElementById('refresh-reservations').addEventListener('click', () => loadReservations().catch(e => feedback(message(e))));
    document.getElementById('reservation-filters').addEventListener('submit', event => { event.preventDefault(); const values = new FormData(event.currentTarget); state.reservationQuery = { ...q, page: 1, q: values.get('q').trim(), status: values.get('status') }; loadReservations().catch(e => feedback(message(e))); });
    document.getElementById('reset-filters').addEventListener('click', () => { state.reservationQuery = { page: 1, limit: 25, status: '', q: '' }; loadReservations().catch(e => feedback(message(e))); });
    panel().querySelectorAll('[data-status-filter]').forEach(b => b.addEventListener('click', () => { state.reservationQuery = { ...q, page: 1, status: q.status === b.dataset.statusFilter ? '' : b.dataset.statusFilter }; loadReservations().catch(e => feedback(message(e))); }));
    ['previous', 'next'].forEach(id => document.getElementById(id).addEventListener('click', () => { q.page += id === 'next' ? 1 : -1; loadReservations().catch(e => feedback(message(e))); }));
    panel().querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => reservationDetail(data.reservations.find(r => r.id === b.dataset.view))));
  }
  function reservationDetail(r) {
    const previousFocus = document.activeElement;
    const backdrop = document.createElement('div'); backdrop.className = 'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-wine-950/45 p-4 py-8 backdrop-blur-sm';
    backdrop.innerHTML = `<section role="dialog" aria-modal="true" aria-labelledby="request-title" class="modal-in w-full max-w-3xl rounded-xl border border-sand-300 bg-white shadow-frame"><header class="flex items-center justify-between border-b border-sand-300 px-6 py-4"><h2 id="request-title" class="font-serif text-xl font-semibold text-wine-800">Demande de consultation</h2><button type="button" class="cursor-pointer rounded-md border border-sand-300 p-2 text-ink-600 hover:bg-cream-100" data-close aria-label="Fermer">${icon('Close')}</button></header><div class="space-y-5 px-6 py-6"><p class="font-mono text-xs text-ink-400">${esc(r.id)}</p><div class="grid gap-5 md:grid-cols-[220px_1fr]"><div><p class="text-xs font-medium text-ink-400 uppercase">Contact</p><p class="mt-2 font-medium">${esc(r.name)}</p><a class="block text-wine-700 underline" href="mailto:${esc(r.email)}">${esc(r.email)}</a>${r.phone ? `<a class="block text-wine-700 underline" href="tel:${esc(r.phone.replace(/[^\d+]/g, ''))}" dir="ltr">${esc(r.phone)}</a>` : ''}<p class="mt-3 text-xs text-ink-600">${esc(r.domain)} · ${urgencyLabels[r.urgency]} · ${r.lang.toUpperCase()}</p><p class="mt-2 text-xs text-ink-600">Consentement : ${esc(date(r.consentAt))}</p><p class="mt-3 text-xs text-ink-600" role="status">${mailStatuses[r.notification.status]} · ${r.notification.attempts} tentative(s)</p></div><div><p class="text-xs font-medium text-ink-400 uppercase">Message</p><p dir="auto" class="mt-2 leading-relaxed break-words whitespace-pre-wrap text-ink-900">${esc(r.message)}</p></div></div><div><label class="field-label" for="request-status">Suivi de la demande</label><select id="request-status" class="field">${Object.entries(statuses).map(([key, label]) => `<option value="${key}" ${r.status === key ? 'selected' : ''}>${label}</option>`).join('')}</select></div><p class="rounded-lg border border-danger/25 bg-red-50 p-4 text-sm text-danger" id="request-error" role="alert" hidden></p></div><footer class="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-sand-300 bg-cream-50 px-6 py-4"><button type="button" class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50" id="delete-request">${icon('Trash', 'h-3.5 w-3.5')} Supprimer</button>${['failed', 'disabled', 'pending'].includes(r.notification.status) ? `<button type="button" class="btn-outline px-4! py-2.5!" id="retry-mail">${icon('Refresh')} Réessayer l’e-mail</button>` : ''}<button type="button" class="btn-wine px-5! py-2.5!" id="save-request">Enregistrer le suivi</button></footer></section>`;
    document.body.append(backdrop); document.body.style.overflow = 'hidden';
    const close = () => { backdrop.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', keydown); previousFocus?.focus(); };
    const keydown = event => { if (event.key === 'Escape') close(); if (event.key === 'Tab') { const elements = [...backdrop.querySelectorAll('button,select,a[href]')].filter(x => !x.disabled); const first = elements[0], last = elements.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } } };
    document.addEventListener('keydown', keydown); backdrop.querySelector('[data-close]').addEventListener('click', close); backdrop.querySelector('[data-close]').focus();
    const action = async (id, fn) => { const b = backdrop.querySelector('#' + id); if (!b) return; b.disabled = true; try { await fn(); close(); await loadReservations(); feedback('Demande mise à jour.', 'success'); } catch (e) { const box = backdrop.querySelector('#request-error'); box.textContent = message(e); box.hidden = false; b.disabled = false; } };
    backdrop.querySelector('#save-request').addEventListener('click', () => action('save-request', () => api('/admin/reservations/' + r.id, { method: 'PATCH', body: { status: backdrop.querySelector('#request-status').value } })));
    backdrop.querySelector('#delete-request').addEventListener('click', () => { if (confirm('Supprimer définitivement cette demande et ses coordonnées ?')) action('delete-request', () => api('/admin/reservations/' + r.id, { method: 'DELETE' })); });
    backdrop.querySelector('#retry-mail')?.addEventListener('click', () => action('retry-mail', () => api('/admin/reservations/' + r.id + '/retry', { method: 'POST', body: {} })));
  }
  async function loadSettings() {
    const version = routeVersion;
    const system = await api('/admin/system');
    if (version !== routeVersion || !state.user) return;
    panel().innerHTML = `<div class="max-w-2xl"><h2 class="font-serif text-3xl font-semibold text-wine-800">Sécurité et configuration</h2><p class="mt-2 text-sm text-ink-600">Protégez l’accès au cabinet et vérifiez les paramètres techniques.</p>
    <div class="mt-6 rounded-xl border border-sand-300 bg-white p-6 shadow-tile"><h3 class="flex items-center gap-2 font-serif text-xl">${icon('Mail', 'h-5 w-5 text-gold-600')} Notifications e-mail</h3><p class="mt-2 text-sm text-ink-600" role="status">${system.smtpConfigured ? 'SMTP configuré. Les notifications sont envoyées automatiquement avec réessai en cas d’échec.' : 'SMTP non configuré. Les demandes sont conservées sur le serveur et visibles ici ; aucune notification e-mail n’est envoyée.'}</p><p class="mt-3 text-xs leading-relaxed text-ink-400">${esc(system.runtime)} · ${esc(system.storage)} · Session ${system.sessionHours} h. Configurez SMTP_HOST, SMTP_PORT, SMTP_FROM et NOTIFICATION_EMAIL dans .env, puis lancez bin/outbox-worker.php.</p></div>
    <form id="password-form" class="mt-6 rounded-xl border border-sand-300 bg-white p-6 shadow-tile"><h3 class="flex items-center gap-2 font-serif text-xl">${icon('Lock', 'h-5 w-5 text-gold-600')} Changer le mot de passe</h3><p class="mt-2 text-sm text-ink-600">12 caractères minimum. Toutes les sessions seront déconnectées.</p><label class="field-label mt-5" for="current-password">Mot de passe actuel</label><input id="current-password" name="currentPassword" class="field" type="password" autocomplete="current-password" required maxlength="128"><label class="field-label mt-4" for="new-password">Nouveau mot de passe</label><input id="new-password" name="newPassword" class="field" type="password" autocomplete="new-password" required minlength="12" maxlength="128"><label class="field-label mt-4" for="confirm-password">Confirmer le nouveau mot de passe</label><input id="confirm-password" name="confirm" class="field" type="password" autocomplete="new-password" required minlength="12" maxlength="128"><p class="mt-4 text-sm text-danger" id="password-error" role="alert" hidden></p><button class="btn-wine mt-5 px-5! py-2.5!" type="submit">Modifier le mot de passe</button></form>
    <div class="mt-6 rounded-xl border border-sand-300 bg-white p-6 text-sm shadow-tile leading-relaxed text-ink-600"><h3 class="flex items-center gap-2 font-serif text-xl text-ink-900">${icon('Shield', 'h-5 w-5 text-gold-600')} Sauvegardes</h3><p class="mt-2">Sauvegardez régulièrement la base MySQL avec les outils de votre hébergeur et testez la restauration. Conservez une copie chiffrée hors du serveur. Les détails figurent dans INSTALLATION.md.</p></div></div>`;
    document.getElementById('password-form').addEventListener('submit', async event => {
      event.preventDefault(); const form = event.currentTarget, values = Object.fromEntries(new FormData(form)), error = document.getElementById('password-error'); error.hidden = true;
      if (values.newPassword !== values.confirm) { error.textContent = 'Les nouveaux mots de passe ne correspondent pas.'; error.hidden = false; return; }
      const button = form.querySelector('button'); button.disabled = true;
      try { await api('/auth/password', { method: 'POST', body: { currentPassword: values.currentPassword, newPassword: values.newPassword } }); login(); }
      catch (e) { error.textContent = message(e); error.hidden = false; button.disabled = false; }
    });
  }
  async function boot() { root.innerHTML = '<div class="flex min-h-screen items-center justify-center bg-[#f6f3ec] text-ink-600" role="status">Vérification de la session…</div>'; try { const session = await api('/auth/session'); if (!session.authenticated) { login(); return; } state.user = session.user; state.csrf = session.csrfToken; shell(); await renderRoute(); } catch (error) { login('Le serveur est indisponible. Vérifiez votre connexion puis réessayez. ' + message(error)); } }
  setInterval(() => { if (state.tab === 'reservations' && state.user && document.visibilityState === 'visible') loadReservations().catch(() => {}); }, 30000);
  void boot();
})();
