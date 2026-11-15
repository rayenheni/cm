import { useAdminText, adminError } from './useAdminText';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { navigate, setNavigationGuard, useRoute } from '@/router';
import { useAdminArticles } from './useAdminArticles';
import { EXPERTISES } from '@/data/content';
import { EXPERTISES_AR } from '@/data/content.ar';
import { EXPERTISES_EN } from '@/content.en';
import { SEED_ENGLISH } from '@/seed-english';
import { useLang } from '@/i18n';
import type { ArticleInput, ArticleTranslation, Lang, StoredArticle } from '@/lib/api-types';
import { api, ApiError } from '@/lib/api';
import { Close, FileText, Pencil, Plus, Trash } from '@/components/Icons';

const blankTranslation = (): ArticleTranslation => ({ category: '', readTime: '5 min', title: '', excerpt: '', imageAlt: '', intro: '', sections: [{ heading: '', paragraphs: [''] }], keyPoints: [''] });
const blankArticle = (): ArticleInput => ({ id: '', expertiseId: 'affaires', image: '', status: 'draft', translations: { fr: blankTranslation(), ar: blankTranslation(), en: blankTranslation() } });
const slugify = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
function fromStored(article: StoredArticle): ArticleInput {
  return { id: article.id, expertiseId: article.expertiseId, image: article.image, status: article.status, translations: { fr: structuredClone(article.translations.fr), ar: structuredClone(article.translations.ar ?? blankTranslation()), en: structuredClone(article.translations.en ?? blankTranslation()) } };
}

function ArticleForm({ initial, onSave, onClose }: { initial?: StoredArticle; onSave: (article: ArticleInput, editing: boolean) => Promise<void>; onClose: () => void }) {
  const a = useAdminText();
  const { lang: uiLang } = useLang();
  const textRef = useRef(a);
  textRef.current = a;
  const [form, setForm] = useState<ArticleInput>(() => initial ? fromStored(initial) : blankArticle());
  const [lang, setLang] = useState<Lang>('fr');
  const [autoSlug, setAutoSlug] = useState(!initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const initialForm = useRef(JSON.stringify(form));
  const dirty = useRef(false);
  const savingRef = useRef(false);
  const savedRef = useRef(false);
  dirty.current = !savedRef.current && JSON.stringify(form) !== initialForm.current;
  savingRef.current = !savedRef.current && saving;
  useEffect(() => {
    titleRef.current?.focus();
    const guard = () => !savingRef.current && (!dirty.current || window.confirm(textRef.current("Vous avez des modifications non enregistrées. Quitter cette page ?", "You have unsaved changes. Leave this page?")));
    setNavigationGuard(guard);
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.current || savingRef.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { setNavigationGuard(null); window.removeEventListener('beforeunload', beforeUnload); };
  }, []);
  const tr = form.translations[lang]!;
  const enStarted = (v: ArticleTranslation) => !!(v.title.trim() || v.category.trim() || v.intro.trim() || v.excerpt.trim() || v.imageAlt.trim() || v.sections.some(s => s.heading.trim() || s.paragraphs.some(p => p.trim())) || v.keyPoints.some(p => p.trim()));
  const translationRequired = lang !== 'en' || enStarted(tr);
  const setTranslation = <K extends keyof ArticleTranslation>(key: K, value: ArticleTranslation[K]) => {
    setForm(f => ({ ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang]!, [key]: value } }, ...(key === 'title' && lang === 'fr' && autoSlug ? { id: slugify(String(value)) } : {}) }));
  };
  const updateSection = (index: number, patch: Partial<ArticleTranslation['sections'][number]>) => setTranslation('sections', tr.sections.map((s, i) => i === index ? { ...s, ...patch } : s));
  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError(a("Choisissez une image JPEG, PNG ou WebP de 2 Mo maximum.", "Choose a JPEG, PNG or WebP image no larger than 2 MB.")); return; }
    setSaving(true); setUploading(true); setError('');
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onerror = () => reject(new Error(a("Impossible de lire ce fichier.", "Unable to read this file.")));
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result.split(',')[1]) : reject(new Error(a("Impossible de lire ce fichier.", "Unable to read this file.")));
        reader.readAsDataURL(file);
      });
      const result = await api<{ url: string }>('/admin/media', { method: 'POST', body: { data } });
      setForm(f => ({ ...f, image: result.url }));
    } catch (err) { setError(adminError(err)); }
    finally { setSaving(false); setUploading(false); }
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (form.status === 'published' && (!form.translations.ar?.title.trim() || !form.translations.ar.intro.trim() || !form.translations.ar.category.trim() || form.translations.ar.sections.some(s => !s.heading.trim() || s.paragraphs.some(p => !p.trim())))) {
      setLang('ar'); setError(a("Complétez la traduction arabe avant de publier, ou enregistrez comme brouillon.", "Complete the Arabic translation before publishing, or save as a draft.")); return;
    }
    setSaving(true); setError('');
    const body = { ...form, translations: { ...form.translations, fr: { ...form.translations.fr, keyPoints: form.translations.fr.keyPoints.filter(p => p.trim()) }, ar: form.translations.ar ? { ...form.translations.ar, keyPoints: form.translations.ar.keyPoints.filter(p => p.trim()) } : undefined, en: form.translations.en && enStarted(form.translations.en) ? { ...form.translations.en, keyPoints: form.translations.en.keyPoints.filter(p => p.trim()) } : undefined } };
    const arabic = body.translations.ar;
    if (body.status === 'draft' && arabic && !arabic.title.trim() && !arabic.category.trim() && !arabic.intro.trim() && !arabic.excerpt.trim() && arabic.sections.every(s => !s.heading.trim() && s.paragraphs.every(p => !p.trim()))) body.translations.ar = undefined;
    try { await onSave(body, !!initial); savedRef.current = true; dirty.current = false; savingRef.current = false; onClose(); }
    catch (err) {
      setError(adminError(err));
      const field = err instanceof ApiError ? Object.keys(err.fields ?? {})[0] : undefined;
      if (field?.startsWith('translations.ar')) setLang('ar');
      if (field?.startsWith('translations.fr')) setLang('fr');
      if (field?.startsWith('translations.en')) setLang('en');
    } finally { setSaving(false); }
  };
  return (
    <section aria-labelledby="article-form-title" className="mx-auto max-w-3xl">
      <button type="button" onClick={onClose} disabled={saving} className="mb-5 cursor-pointer text-sm font-medium text-wine-700 hover:underline">{"← " + a("Retour aux articles", "Back to articles")}</button>
      <div className="rounded-xl border border-sand-300 bg-white shadow-tile">
        <header className="border-b border-sand-300 px-6 py-5">
          <h2 ref={titleRef} tabIndex={-1} id="article-form-title" className="font-serif text-3xl font-semibold text-wine-800 outline-none">{initial ? a("Modifier l’article", "Edit article") : a("Nouvel article", "New article")}</h2>
          <p className="mt-2 text-sm text-ink-600">{a("Rédigez les versions française et arabe. La traduction anglaise est facultative et apparaîtra uniquement lorsqu’elle sera complète.", "Write the French and Arabic versions. English is optional and appears only when complete.")}</p>
        </header>
        {uploading && <p role="status" className="px-6 pt-4 text-sm text-ink-600">{a("Téléversement de l’image…", "Uploading image…")}</p>}
        <form id="article-form" onSubmit={submit} inert={saving}>
          <div className="space-y-5 px-6 py-6">
            {error && <p role="alert" className="rounded-lg border border-danger/25 bg-red-50 p-4 text-sm text-danger">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="article-slug" className="field-label">{a("Identifiant / slug *", "Identifier / slug *")}</label><input id="article-slug" className="field font-mono" required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={120} readOnly={!!initial} value={form.id} onChange={e => { setAutoSlug(false); setForm(f => ({ ...f, id: e.target.value })); }} />{initial && <p className="mt-1 text-xs text-ink-400">{a("Conservé pour ne pas casser les liens existants.", "Kept unchanged to preserve existing links.")}</p>}</div>
              <div><label htmlFor="article-status" className="field-label">{a("Publication", "Publication")}</label><select id="article-status" className="field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ArticleInput['status'] }))}><option value="draft">{a("Brouillon — privé", "Draft — private")}</option><option value="published">{a("Publié — français et arabe", "Published — French and Arabic")}</option></select></div>
              <div><label htmlFor="article-expertise" className="field-label">{a("Domaine *", "Practice area *")}</label><select id="article-expertise" className="field" value={form.expertiseId} onChange={e => setForm(f => ({ ...f, expertiseId: e.target.value }))}>{(uiLang === 'en' ? EXPERTISES_EN : EXPERTISES).map(exp => <option key={exp.id} value={exp.id}>{exp.shortTitle}</option>)}</select></div>
              <div className="sm:col-span-2"><label htmlFor="article-image" className="field-label">{a("Image par lien HTTPS (facultative)", "Image via HTTPS link (optional)")}</label><input id="article-image" type="text" inputMode="url" className="field" value={form.image} maxLength={2048} placeholder="https://…" onChange={e => setForm(f => ({ ...f, image: e.target.value }))} /><label htmlFor="article-image-file" className="field-label mt-4">{a("Ou téléverser une image", "Or upload an image")}</label><input id="article-image-file" type="file" accept="image/jpeg,image/png,image/webp" className="field" onChange={e => void uploadImage(e)} /><p className="mt-2 text-xs text-ink-600">{a("JPEG, PNG ou WebP · 2 Mo maximum. Une image téléversée peut être accessible par son lien, même avant publication.", "JPEG, PNG or WebP · maximum 2 MB. An uploaded image may be accessible by its link even before publication.")}</p>{form.image && (/^https:\/\//.test(form.image) || /^\/media\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(form.image)) && <img src={form.image} alt={a("Aperçu de l’image", "Image preview")} referrerPolicy="no-referrer" className="mt-4 h-36 max-w-full rounded-lg object-cover" />}</div>
            </div>
            <div className="flex gap-2 border-b border-sand-300 pb-3" role="tablist" aria-label={a("Langue de l’article", "Article language")}>{(['fr', 'ar', 'en'] as const).map(l => <button key={l} type="button" role="tab" aria-selected={lang === l} onClick={() => setLang(l)} className={`cursor-pointer rounded-md px-5 py-2 text-sm font-medium ${lang === l ? 'bg-wine-600 text-white' : 'bg-cream-200 text-ink-600'}`}>{l === 'fr' ? 'Français' : l === 'ar' ? 'العربية' : 'English'}</button>)}</div>
            <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="space-y-5">
              {lang === 'en' && initial && SEED_ENGLISH[initial.id] && <div className="rounded-lg border border-sand-300 bg-cream-50 p-4 text-sm text-ink-600"><p>{a("Traduction proposée pour l’article de départ. Vérifiez qu’elle correspond à votre version française avant de l’enregistrer.", "Suggested translation of the original article. Check it against your French version before saving.")}</p><button type="button" className="btn-outline mt-3 px-4! py-2!" onClick={() => { if (!enStarted(tr) || window.confirm(a("Remplacer le texte anglais actuel par la traduction proposée ?", "Replace the current English text with the suggested translation?"))) setForm(f => ({ ...f, translations: { ...f.translations, en: structuredClone(SEED_ENGLISH[initial.id]) } })); }}>{a("Insérer la traduction proposée", "Insert suggested translation")}</button></div>}
              <div><label htmlFor="article-title" className="field-label">{a("Titre *", "Title *")}</label><input id="article-title" className="field" required={translationRequired} maxLength={240} value={tr.title} onChange={e => setTranslation('title', e.target.value)} /></div>
              <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="article-category" className="field-label">{a("Catégorie *", "Category *")}</label><input id="article-category" className="field" required={translationRequired} maxLength={120} value={tr.category} onChange={e => setTranslation('category', e.target.value)} list="article-categories" /><datalist id="article-categories">{(lang === 'ar' ? EXPERTISES_AR : lang === 'en' ? EXPERTISES_EN : EXPERTISES).map(exp => <option key={exp.id} value={exp.shortTitle} />)}</datalist></div><div><label htmlFor="article-read-time" className="field-label">{a("Temps de lecture *", "Reading time *")}</label><input id="article-read-time" className="field" required={translationRequired} maxLength={40} value={tr.readTime} onChange={e => setTranslation('readTime', e.target.value)} /></div></div>
              <div><label htmlFor="article-excerpt" className="field-label">{a("Résumé *", "Summary *")}</label><textarea id="article-excerpt" className="field" rows={3} required={translationRequired} maxLength={1200} value={tr.excerpt} onChange={e => setTranslation('excerpt', e.target.value)} /></div>
              <div><label htmlFor="article-alt" className="field-label">{a("Description de l’image", "Image description")}</label><input id="article-alt" className="field" maxLength={300} value={tr.imageAlt} onChange={e => setTranslation('imageAlt', e.target.value)} /></div>
              <div><label htmlFor="article-intro" className="field-label">{a("Introduction *", "Introduction *")}</label><textarea id="article-intro" className="field" rows={4} required={translationRequired} maxLength={10000} value={tr.intro} onChange={e => setTranslation('intro', e.target.value)} /></div>
              <fieldset><legend className="field-label mb-3">{a("Sections *", "Sections *")}</legend><div className="space-y-4">{tr.sections.map((section, i) => <div key={i} className="rounded-lg border border-sand-300 bg-cream-50 p-4"><div className="mb-3 flex items-center justify-between"><span className="text-xs text-ink-400">Section {i + 1}</span><button type="button" className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-danger" disabled={tr.sections.length === 1} onClick={() => setTranslation('sections', tr.sections.filter((_, j) => i !== j))}><Trash className="h-3.5 w-3.5" /> {a("Supprimer", "Delete")}</button></div><label className="field-label" htmlFor={`section-heading-${i}`}>{a("Titre de section *", "Section title *")}</label><input id={`section-heading-${i}`} className="field mb-3" required={translationRequired} value={section.heading} onChange={e => updateSection(i, { heading: e.target.value })} /><label className="field-label" htmlFor={`section-body-${i}`}>{a("Paragraphes — un par ligne *", "Paragraphs — one per line *")}</label><textarea id={`section-body-${i}`} className="field" rows={5} required={translationRequired} value={section.paragraphs.join('\n')} onChange={e => updateSection(i, { paragraphs: e.target.value.split('\n') })} /></div>)}</div><button type="button" className="btn-outline mt-4 px-4! py-2.5!" disabled={tr.sections.length >= 30} onClick={() => setTranslation('sections', [...tr.sections, { heading: '', paragraphs: [''] }])}><Plus className="h-4 w-4" /> {a("Ajouter une section", "Add a section")}</button></fieldset>
              <fieldset><legend className="field-label mb-3">{a("Points clés", "Key points")}</legend>{tr.keyPoints.map((point, i) => <div key={i} className="mb-2 flex gap-2"><input className="field" aria-label={a(`Point clé ${i + 1}`, `Key point ${i + 1}`)} value={point} maxLength={1000} onChange={e => setTranslation('keyPoints', tr.keyPoints.map((p, j) => i === j ? e.target.value : p))} /><button type="button" aria-label={a(`Supprimer le point clé ${i + 1}`, `Delete key point ${i + 1}`)} className="cursor-pointer rounded-md border border-sand-300 px-3 text-danger hover:bg-red-50" onClick={() => setTranslation('keyPoints', tr.keyPoints.filter((_, j) => i !== j))}><Close className="h-4 w-4" /></button></div>)}<button type="button" className="btn-outline mt-2 px-4! py-2.5!" disabled={tr.keyPoints.length >= 20} onClick={() => setTranslation('keyPoints', [...tr.keyPoints, ''])}><Plus className="h-4 w-4" /> {a("Ajouter un point", "Add a point")}</button></fieldset>
            </div>
          </div>
          <footer className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-sand-300 bg-cream-50 px-6 py-4"><button type="button" className="btn-outline px-5! py-2.5!" disabled={saving} onClick={onClose}>{a("Annuler", "Cancel")}</button><button type="submit" className="btn-wine px-5! py-2.5!" disabled={saving}>{saving ? a("Enregistrement…", "Saving…") : form.status === 'published' ? a("Enregistrer et publier", "Save and publish") : a("Enregistrer le brouillon", "Save draft")}</button></footer>
        </form>
      </div>
    </section>
  );
}

export function ArticlesManager() {
  const a = useAdminText();
  const { lang: uiLang } = useLang();
  const { articles, loading, error, refresh, saveArticle, deleteArticle } = useAdminArticles();
  const route = useRoute();
  const isNew = route.path === '/admin/articles/new';
  const editMatch = route.path.match(/^\/admin\/articles\/([a-z0-9-]+)\/edit$/);
  const editing = editMatch ? articles.find(article => article.id === editMatch[1]) : undefined;
  const showForm = isNew || !!editMatch;
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const remove = async (id: string) => {
    setBusy(true); setActionError('');
    try { await deleteArticle(id); setDeleteConfirm(null); } catch (err) { setActionError(adminError(err)); } finally { setBusy(false); }
  };
  if (showForm) {
    if (editMatch && loading) return <p role="status">{a("Chargement de l’article…", "Loading article…")}</p>;
    if (editMatch && (error || !editing)) return <div role="alert" className="space-y-4"><p>{error || a("Article introuvable.", "Article not found.")}</p><button className="btn-outline" onClick={() => navigate('/admin')}>{a("Retour aux articles", "Back to articles")}</button></div>;
    return <ArticleForm key={editing?.id ?? 'new'} initial={editing} onSave={saveArticle} onClose={() => navigate('/admin')} />;
  }
  return <div>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-serif text-3xl font-semibold text-wine-800">Articles</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-600">{a("Gérez les publications françaises, arabes et anglaises du site. Les brouillons restent privés ; les articles publiés sont visibles par tous les visiteurs.", "Manage French, Arabic and English articles. Drafts are private; published articles are visible to visitors.")}</p></div><button className="btn-wine" onClick={() => navigate('/admin/articles/new')}><Plus className="h-4 w-4" /> {a("Nouvel article", "New article")}</button></div>
    {loading && <p role="status" className="mb-5 text-sm text-ink-600">{a("Chargement des articles…", "Loading articles…")}</p>}
    {(error || actionError) && <div role="alert" className="mb-5 rounded-lg border border-danger/25 bg-red-50 p-4 text-sm text-danger">{error || actionError} {error && <button className="ml-3 underline" onClick={refresh}>{a("Réessayer", "Try again")}</button>}</div>}
    {!loading && !error && <div className="overflow-x-auto rounded-xl border border-sand-300 bg-white shadow-tile"><table className="w-full text-sm"><thead><tr className="border-b border-sand-300 bg-cream-50 text-left text-[11px] font-semibold tracking-[0.08em] text-ink-600 uppercase"><th className="px-5 py-4">{a("Article", "Article")}</th><th className="px-4 py-4">{a("Statut", "Status")}</th><th className="hidden px-4 py-4 md:table-cell">{a("Langues", "Languages")}</th><th className="px-5 py-4 text-right">{a("Actions", "Actions")}</th></tr></thead><tbody className="divide-y divide-sand-300">{articles.map(article => <tr key={article.id}><td className="max-w-sm px-5 py-4"><p className="font-medium text-ink-900">{(uiLang === 'en' ? article.translations.en : undefined)?.title ?? article.translations.fr.title}</p><p className="mt-1 break-all font-mono text-xs text-ink-400">{article.id}</p></td><td className="px-4 py-4"><span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${article.status === 'published' ? 'border-success/20 bg-success/10 text-success' : 'border-gold-500/25 bg-gold-500/10 text-gold-600'}`}>{article.status === 'published' ? a("Publié", "Published") : a("Brouillon", "Draft")}</span></td><td className="hidden px-4 py-4 text-ink-600 md:table-cell">FR{article.translations.ar ? ' · AR' : ''}{article.translations.en ? ' · EN' : ''}</td><td className="px-5 py-4"><div className="flex flex-wrap justify-end gap-2"><button className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-wine-700 hover:bg-cream-50" onClick={() => navigate(`/admin/articles/${encodeURIComponent(article.id)}/edit`)}><Pencil className="h-3.5 w-3.5" /> {a("Modifier", "Edit")}</button>{deleteConfirm === article.id ? <><button disabled={busy} className="cursor-pointer rounded-md bg-danger px-3 py-2 text-xs font-medium text-white" onClick={() => void remove(article.id)}>{busy ? a("Suppression…", "Deleting…") : a("Confirmer", "Confirm")}</button><button disabled={busy} className="px-2 text-xs" onClick={() => setDeleteConfirm(null)}>{a("Annuler", "Cancel")}</button></> : <button className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-sand-300 px-3 py-2 text-xs font-medium text-danger hover:bg-red-50" onClick={() => setDeleteConfirm(article.id)}><Trash className="h-3.5 w-3.5" /> {a("Supprimer", "Delete")}</button>}</div></td></tr>)}</tbody></table>{articles.length === 0 && <div className="p-12 text-center"><FileText className="mx-auto h-8 w-8 text-ink-400" /><p className="mt-3 text-ink-600">{a("Aucun article. Créez votre premier article.", "No articles yet. Create your first article.")}</p></div>}</div>}
  </div>;
}
