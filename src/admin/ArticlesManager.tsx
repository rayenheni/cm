import { useState, useCallback } from "react";
import { useAdminArticles } from "./useAdminArticles";
import { EXPERTISES } from "@/data/content";
import type { Article } from "@/data/content";

/* ——— helpers ——— */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function newBlankArticle(): Omit<Article, "id"> & { id: string } {
  return {
    id: "",
    expertiseId: EXPERTISES[0]?.id ?? "",
    category: "",
    date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    readTime: "5 min",
    title: "",
    excerpt: "",
    image: "",
    imageAlt: "",
    intro: "",
    sections: [{ heading: "", paragraphs: [""] }],
    keyPoints: [""],
  };
}

/* ——— Section editor ——— */
interface SectionEditorProps {
  sections: { heading: string; paragraphs: string[] }[];
  onChange: (sections: { heading: string; paragraphs: string[] }[]) => void;
}
function SectionEditor({ sections, onChange }: SectionEditorProps) {
  const updateSection = (i: number, patch: Partial<{ heading: string; paragraphs: string[] }>) => {
    const updated = sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange(updated);
  };
  const removeSection = (i: number) => onChange(sections.filter((_, idx) => idx !== i));
  const addSection = () => onChange([...sections, { heading: "", paragraphs: [""] }]);

  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i} className="rounded-xl border border-sand-300 bg-cream-100/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium tracking-widest uppercase text-ink-400">Section {i + 1}</span>
            <button
              type="button"
              onClick={() => removeSection(i)}
              className="cursor-pointer text-xs text-red-500 hover:text-red-700"
            >
              Supprimer
            </button>
          </div>
          <input
            type="text"
            value={section.heading}
            onChange={(e) => updateSection(i, { heading: e.target.value })}
            placeholder="Titre de section"
            className="field mb-3"
          />
          <label className="mb-1.5 block text-[11px] font-medium tracking-[0.18em] uppercase text-ink-600">
            Paragraphes (un par ligne)
          </label>
          <textarea
            rows={4}
            value={section.paragraphs.join("\n")}
            onChange={(e) =>
              updateSection(i, {
                paragraphs: e.target.value.split("\n"),
              })
            }
            placeholder="Paragraphe 1&#10;Paragraphe 2&#10;..."
            className="field resize-y"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addSection}
        className="cursor-pointer rounded-lg border border-dashed border-sand-300 px-4 py-2 text-sm text-ink-400 hover:border-wine-600 hover:text-wine-700 transition-colors"
      >
        + Ajouter une section
      </button>
    </div>
  );
}

/* ——— Key points editor ——— */
interface KeyPointsEditorProps {
  keyPoints: string[];
  onChange: (kp: string[]) => void;
}
function KeyPointsEditor({ keyPoints, onChange }: KeyPointsEditorProps) {
  const update = (i: number, val: string) => onChange(keyPoints.map((k, idx) => (idx === i ? val : k)));
  const remove = (i: number) => onChange(keyPoints.filter((_, idx) => idx !== i));
  const add = () => onChange([...keyPoints, ""]);

  return (
    <div className="space-y-2">
      {keyPoints.map((kp, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={kp}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Point clé ${i + 1}`}
            className="field flex-1"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="cursor-pointer shrink-0 rounded-lg border border-sand-300 px-3 py-2 text-sm text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="cursor-pointer rounded-lg border border-dashed border-sand-300 px-4 py-2 text-sm text-ink-400 hover:border-wine-600 hover:text-wine-700 transition-colors"
      >
        + Ajouter un point clé
      </button>
    </div>
  );
}

/* ——— Article form modal ——— */
interface ArticleFormProps {
  initial?: Article;
  adminArticleIds: Set<string>;
  onSave: (article: Article) => void;
  onClose: () => void;
}

function ArticleForm({ initial, adminArticleIds, onSave, onClose }: ArticleFormProps) {
  const [form, setForm] = useState<Article>(() =>
    initial ? { ...initial } : (newBlankArticle() as Article)
  );
  const [autoSlug, setAutoSlug] = useState(!initial);
  const [error, setError] = useState("");

  const set = <K extends keyof Article>(key: K, val: Article[K]) => {
    setForm((f) => {
      const updated = { ...f, [key]: val };
      if (key === "title" && autoSlug) {
        updated.id = slugify(String(val));
      }
      return updated;
    });
  };

  const categories = Array.from(new Set(["Droit des affaires", "Droit de la famille", "Droit du travail", "Droit pénal", "Médiation"]));

  const handleSubmit = () => {
    if (!form.title.trim()) return setError("Le titre est requis.");
    if (!form.id.trim()) return setError("L'identifiant (slug) est requis.");
    if (!form.expertiseId) return setError("Choisissez un domaine d'expertise.");
    if (!form.category.trim()) return setError("La catégorie est requise.");
    // Check for duplicate id if creating new
    if (!initial && adminArticleIds.has(form.id)) {
      return setError("Cet identifiant existe déjà. Modifiez le slug.");
    }
    setError("");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/50 backdrop-blur-sm p-4 py-8">
      <div className="relative w-full max-w-2xl rounded-2xl border border-sand-300 bg-cream-50 shadow-frame modal-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sand-300 px-6 py-4">
          <h2 className="font-serif text-xl font-semibold text-wine-800">
            {initial ? "Modifier l'article" : "Nouvel article"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-ink-400 hover:bg-cream-200 hover:text-ink-900 transition-colors"
            aria-label="Fermer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto px-6 py-6">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="field-label">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Titre de l'article"
              className="field"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="field-label">
              Identifiant (slug) *{" "}
              <span className="normal-case font-normal tracking-normal text-ink-400">— auto-généré depuis le titre</span>
            </label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => {
                setAutoSlug(false);
                set("id", e.target.value);
              }}
              placeholder="mon-article-slug"
              className="field font-mono text-sm"
            />
          </div>

          {/* Category + ExpertiseId row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Catégorie *</label>
              <input
                type="text"
                list="admin-categories"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Choisir ou saisir…"
                className="field"
              />
              <datalist id="admin-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="field-label">Domaine d'expertise *</label>
              <select
                value={form.expertiseId}
                onChange={(e) => set("expertiseId", e.target.value)}
                className="field cursor-pointer appearance-none"
              >
                {EXPERTISES.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.shortTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + ReadTime row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Date de publication</label>
              <input
                type="text"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                placeholder="12 janvier 2026"
                className="field"
              />
            </div>
            <div>
              <label className="field-label">Temps de lecture</label>
              <input
                type="text"
                value={form.readTime}
                onChange={(e) => set("readTime", e.target.value)}
                placeholder="5 min"
                className="field"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="field-label">Extrait / résumé</label>
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              placeholder="Court résumé affiché dans les listes…"
              className="field resize-none"
            />
          </div>

          {/* Image URL + Alt */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">URL de l'image</label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://…"
                className="field"
              />
            </div>
            <div>
              <label className="field-label">Texte alternatif</label>
              <input
                type="text"
                value={form.imageAlt}
                onChange={(e) => set("imageAlt", e.target.value)}
                placeholder="Description de l'image"
                className="field"
              />
            </div>
          </div>

          {/* Intro */}
          <div>
            <label className="field-label">Introduction</label>
            <textarea
              rows={4}
              value={form.intro}
              onChange={(e) => set("intro", e.target.value)}
              placeholder="Paragraphe d'introduction de l'article…"
              className="field resize-y"
            />
          </div>

          {/* Sections */}
          <div>
            <label className="field-label mb-3">Sections</label>
            <SectionEditor
              sections={form.sections}
              onChange={(sections) => set("sections", sections)}
            />
          </div>

          {/* Key Points */}
          <div>
            <label className="field-label mb-3">Points clés (À retenir)</label>
            <KeyPointsEditor
              keyPoints={form.keyPoints}
              onChange={(kp) => set("keyPoints", kp)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-sand-300 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full border border-wine-600/30 px-6 py-2.5 text-sm font-medium text-wine-700 transition-all hover:border-wine-600 hover:bg-wine-600 hover:text-cream-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="cursor-pointer rounded-full bg-wine-600 px-6 py-2.5 text-sm font-medium text-cream-50 shadow-tile transition-all hover:bg-wine-700"
          >
            {initial ? "Enregistrer les modifications" : "Publier l'article"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ——— Main component ——— */
export function ArticlesManager() {
  const { allArticles, adminArticles, addArticle, updateArticle, deleteArticle } = useAdminArticles();
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const adminIds = new Set(adminArticles.map((a) => a.id));

  const handleSave = useCallback(
    (article: Article) => {
      if (editingArticle) {
        updateArticle(article.id, article);
      } else {
        addArticle(article);
      }
      setShowForm(false);
      setEditingArticle(null);
    },
    [editingArticle, addArticle, updateArticle]
  );

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteArticle(id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-wine-800">Articles</h2>
          <p className="mt-0.5 text-sm text-ink-600">
            {allArticles.length} article{allArticles.length !== 1 ? "s" : ""} au total ·{" "}
            {adminArticles.length} ajouté{adminArticles.length !== 1 ? "s" : ""} via l'admin
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingArticle(null);
            setShowForm(true);
          }}
          className="cursor-pointer rounded-full bg-wine-600 px-5 py-2.5 text-sm font-medium text-cream-50 shadow-tile transition-all hover:bg-wine-700 active:scale-[0.98]"
        >
          + Nouvel article
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-tile">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-300 bg-cream-100/80">
                <th className="px-5 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400">Titre</th>
                <th className="hidden px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400 sm:table-cell">Catégorie</th>
                <th className="hidden px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400 md:table-cell">Date</th>
                <th className="hidden px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400 lg:table-cell">Lecture</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-medium tracking-widest uppercase text-ink-400">Source</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-medium tracking-widest uppercase text-ink-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-300/60">
              {allArticles.map((article) => {
                const isAdmin = adminIds.has(article.id);
                return (
                  <tr key={article.id} className="group hover:bg-cream-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-ink-900 line-clamp-1 max-w-[200px] sm:max-w-xs">
                        {article.title}
                      </div>
                      <div className="mt-0.5 text-xs text-ink-400 font-mono">{article.id}</div>
                    </td>
                    <td className="hidden px-4 py-4 sm:table-cell">
                      <span className="inline-flex items-center rounded-full border border-sand-300 bg-cream-100 px-2.5 py-1 text-[11px] font-medium text-ink-600">
                        {article.category}
                      </span>
                    </td>
                    <td className="hidden px-4 py-4 text-ink-600 md:table-cell">{article.date}</td>
                    <td className="hidden px-4 py-4 text-ink-600 lg:table-cell">{article.readTime}</td>
                    <td className="px-4 py-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center rounded-full border border-gold-500/40 bg-gold-400/10 px-2.5 py-1 text-[11px] font-medium text-gold-600">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-sand-300 bg-cream-100 px-2.5 py-1 text-[11px] font-medium text-ink-400">
                          Intégré
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEdit(article)}
                              className="cursor-pointer rounded-lg border border-sand-300 bg-cream-50 px-3 py-1.5 text-xs font-medium text-ink-600 hover:border-wine-600/40 hover:text-wine-700 transition-colors"
                            >
                              Modifier
                            </button>
                            {deleteConfirm === article.id ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDelete(article.id)}
                                  className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                                >
                                  Confirmer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirm(null)}
                                  className="cursor-pointer rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-cream-200 transition-colors"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(article.id)}
                                className="cursor-pointer rounded-lg border border-sand-300 bg-cream-50 px-3 py-1.5 text-xs font-medium text-red-500 hover:border-red-400 hover:bg-red-50 transition-colors"
                              >
                                Supprimer
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Article form modal */}
      {showForm && (
        <ArticleForm
          initial={editingArticle ?? undefined}
          adminArticleIds={adminIds}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
}
