import { useEffect, useState } from 'react';
import { useLang } from '@/i18n';
import { Link } from '@/router';

const CHOICE = 'cmcb-analytics-choice';
const TOKEN = 'cmcb-analytics-token';
const EVENT = 'cmcb-analytics-choice-changed';
const DAY = 86400000;
export function analyticsAllowed(): boolean {
  try { return localStorage.getItem(CHOICE) === 'yes'; } catch { return false; }
}
export function trackArticle(articleId: string) {
  try {
    if (!analyticsAllowed() || !crypto.getRandomValues) return;
    let token: { id: string; created: number } | undefined;
    try { token = JSON.parse(localStorage.getItem(TOKEN) ?? 'null') ?? undefined; } catch { /* regenerate */ }
    if (!token || !/^[a-f0-9]{64}$/.test(token.id) || !Number.isFinite(token.created) || Date.now() - token.created >= 30 * DAY || token.created > Date.now()) {
      token = {id: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2,'0')).join(''), created: Date.now()};
      localStorage.setItem(TOKEN, JSON.stringify(token));
    }
    void fetch('/api/analytics/article', {method:'POST', credentials:'omit', headers:{'Content-Type':'application/json'}, body:JSON.stringify({articleId,visitor:token.id}), keepalive:true}).catch(()=>{});
  } catch { /* analytics must never interfere with reading */ }
}
export function useArticleAnalytics(articleId: string | undefined) {
  useEffect(() => {
    if (!articleId) return;
    const track = () => trackArticle(articleId);
    track(); window.addEventListener(EVENT, track);
    return () => window.removeEventListener(EVENT, track);
  }, [articleId]);
}
export function AnalyticsConsent() {
  const {lang} = useLang();
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem(CHOICE); } catch { return false; } });
  const text = lang === 'en' ? {
    title:'Article statistics', description:'May we count your browser as an estimated unique visitor to each article over the last 30 days? A random identifier is stored on your device and a per-article hash on our server. No tracking occurs before you agree. You can change your choice at any time.', accept:'Accept', refuse:'Decline', settings:'Article statistics settings', privacy:'Privacy policy', error:'Your choice could not be saved in this browser.'
  } : lang === 'ar' ? {
    title:'إحصائيات المقالات', description:'هل توافق على احتساب متصفحك كزائر فريد تقديري لكل مقال خلال آخر 30 يوماً؟ يُحفظ معرّف عشوائي على جهازك وبصمة منفصلة لكل مقال على الخادم. لا يبدأ القياس قبل موافقتك ويمكنك تغيير اختيارك في أي وقت.', accept:'أوافق', refuse:'أرفض', settings:'إعدادات إحصائيات المقالات', privacy:'سياسة الخصوصية', error:'تعذر حفظ اختيارك في هذا المتصفح.'
  } : {
    title:'Statistiques des articles', description:'Acceptez-vous que votre navigateur soit compté comme visiteur unique estimé de chaque article sur les 30 derniers jours ? Un identifiant aléatoire est conservé sur votre appareil et une empreinte distincte par article sur notre serveur. Aucun comptage avant votre accord ; vous pouvez changer votre choix à tout moment.', accept:'Accepter', refuse:'Refuser', settings:'Paramètres des statistiques', privacy:'Politique de confidentialité', error:'Votre choix n’a pas pu être enregistré dans ce navigateur.'
  };
  const [error,setError] = useState(false);
  function choose(allow:boolean) {
    try {
      localStorage.setItem(CHOICE, allow ? 'yes' : 'no');
      if (!allow) localStorage.removeItem(TOKEN);
      setError(false); setOpen(false); window.dispatchEvent(new Event(EVENT));
    } catch { setError(true); }
  }
  return <>
    <button type="button" className="text-left transition-colors hover:text-gold-400" onClick={() => setOpen(true)}>{text.settings}</button>
    {open && <section role="region" aria-label={text.title} className="fixed inset-x-3 bottom-20 z-[80] mx-auto max-w-2xl rounded-xl border border-sand-300 bg-white p-5 text-ink-900 shadow-xl sm:bottom-5">
      <h2 className="font-serif text-xl font-semibold text-wine-800">{text.title}</h2>
      <p className="mt-2 text-sm leading-relaxed">{text.description}</p>
      <Link to="/confidentialite" className="mt-2 inline-block text-sm text-wine-700 underline">{text.privacy}</Link>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{text.error}</p>}
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" className="btn-outline px-5! py-2!" onClick={() => choose(false)}>{text.refuse}</button><button type="button" className="btn-wine px-5! py-2!" onClick={() => choose(true)}>{text.accept}</button></div>
    </section>}
  </>;
}
