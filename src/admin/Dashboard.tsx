import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAdminText, adminError } from './useAdminText';
import { navigate } from '@/router';
import { useLang } from '@/i18n';

type DashboardData = { reservations:{new:number;contacted:number;closed:number}; published:number; drafts:number; articles:{id:string;title:string;englishTitle:string;visitors:number}[] };
export function Dashboard() {
  const a = useAdminText();
  const { lang } = useLang();
  const [data,setData] = useState<DashboardData|null>(null);
  const [error,setError] = useState<unknown>(null);
  const [revision,setRevision] = useState(0);
  useEffect(() => { const c = new AbortController(); setError(null); setData(null); api<DashboardData>('/admin/dashboard',{signal:c.signal}).then(setData).catch(e=>{if (!c.signal.aborted) setError(e)}); return ()=>c.abort(); },[revision]);
  if (error) return <div role="alert" className="rounded-xl border border-danger/20 bg-red-50 p-5 text-danger"><p>{adminError(error)}</p><button className="mt-3 underline" onClick={()=>setRevision(n=>n+1)}>{a('Réessayer','Try again')}</button></div>;
  if (!data) return <p role="status">{a('Chargement du tableau de bord…','Loading dashboard…')}</p>;
  const total = data.reservations.new + data.reservations.contacted + data.reservations.closed;
  const cards = [
    {label:a('Demandes enregistrées','Saved requests'), value:total},
    {label:a('Nouvelles demandes','New requests'), value:data.reservations.new},
    {label:a('Demandes contactées','Contacted requests'), value:data.reservations.contacted},
    {label:a('Demandes clôturées','Closed requests'), value:data.reservations.closed},
    {label:a('Articles publiés','Published articles'), value:data.published},
    {label:a('Brouillons','Drafts'), value:data.drafts},
  ];
  return <div className="space-y-8">
    <div><h2 className="font-serif text-3xl font-semibold text-wine-800">{a('Vue d’ensemble','Overview')}</h2><p className="mt-2 text-sm text-ink-600">{a('Les demandes supprimées ne sont plus comptabilisées.','Deleted requests are not included.')}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(card=><div key={card.label} className="rounded-xl border border-sand-300 bg-white p-5 shadow-tile"><p className="text-sm text-ink-600">{card.label}</p><p className="mt-3 font-serif text-4xl font-semibold text-wine-800">{card.value}</p></div>)}</div>
    <section className="rounded-xl border border-sand-300 bg-white p-5 shadow-tile sm:p-6"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-serif text-2xl font-semibold text-wine-800">{a('Articles les plus consultés','Most-read articles')}</h3><p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-600">{a('Visiteurs uniques estimés par article sur les 30 derniers jours, uniquement avec leur accord. Un navigateur peut compter plusieurs fois après renouvellement ou suppression de son identifiant. Comptage à partir de l’activation.','Estimated unique visitors per article in the last 30 days, only with their consent. A browser may be counted again after its identifier is renewed or deleted. Counting starts when enabled.')}</p></div><button type="button" className="text-sm text-wine-700 underline" onClick={()=>setRevision(n=>n+1)}>{a('Actualiser','Refresh')}</button></div>
      {data.articles.length === 0 ? <p className="mt-6 text-sm text-ink-600">{a('Aucun article publié.','No published articles.')}</p> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-sand-300 text-ink-600"><th className="py-3 pr-4">{a('Article','Article')}</th><th className="py-3 text-right">{a('Visiteurs estimés','Estimated visitors')}</th></tr></thead><tbody>{data.articles.map(article=><tr key={article.id} className="border-b border-sand-300/70"><td className="py-4 pr-4"><button type="button" className="text-left text-wine-700 underline" onClick={()=>navigate(`/admin/articles/${encodeURIComponent(article.id)}/edit`)}>{lang === 'en' ? article.englishTitle : article.title}</button></td><td className="py-4 text-right font-semibold">{article.visitors}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
