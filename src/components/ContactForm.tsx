import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/utils/cn";
import { useCabinet, useExpertises, useLang, useT, type Strings } from "@/i18n";
import { Check, ChevronDown, Mail, Send, WhatsApp } from "./Icons";
import { api, errorMessage } from "@/lib/api";
import type { Urgency } from "@/lib/api-types";

interface FormState {
  name: string;
  email: string;
  phone: string;
  domain: string;
  urgency: string;
  message: string;
  consent: boolean;
}

type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState, t: Strings): Errors {
  const errors: Errors = {};
  if (form.name.trim().length < 2) errors.name = t.form.errName;
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = t.form.errEmail;
  if (form.phone.trim() && !/^[+\d][\d\s.\-()]{7,}$/.test(form.phone.trim())) errors.phone = t.form.errPhone;
  if (!form.domain) errors.domain = t.form.errDomain;
  if (form.message.trim().length < 15) errors.message = t.form.errMessage;
  if (!form.consent) errors.consent = t.form.errConsent;
  return errors;
}

export function ContactForm({ presetDomain = "" }: { presetDomain?: string }) {
  const t = useT();
  const cabinet = useCabinet();
  const { lang } = useLang();
  const submissionKey = useRef(crypto.randomUUID());
  const [submitError, setSubmitError] = useState("");
  const expertises = useExpertises();
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "", domain: presetDomain, urgency: t.form.urgencies[0], message: "", consent: false });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "ready">("idle");

  useEffect(() => {
    if (presetDomain) setForm((f) => ({ ...f, domain: presetDomain }));
  }, [presetDomain]);

  useEffect(() => {
    setForm((f) => ({ ...f, urgency: t.form.urgencies[0] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.form.urgencies[0]]);

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form, t);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = Object.keys(errs)[0];
      document.getElementById(`c-${first}`)?.focus();
      return;
    }
    if (status === "sending") return;
    setStatus("sending"); setSubmitError("");
    try {
      await api<{ id: string; persisted: boolean }>("/reservations", {
        method: "POST", headers: { "Idempotency-Key": submissionKey.current },
        body: { ...form, lang, urgency: (["normal", "48h", "urgent"] as Urgency[])[t.form.urgencies.indexOf(form.urgency)] ?? "normal", website: "" },
      });
      setStatus("ready");
    } catch (error) { setSubmitError(errorMessage(error)); setStatus("idle"); }
  };

  const text = `${t.form.waGreeting}\n\n${t.form.waName} : ${form.name}\n${t.form.waPhone} : ${form.phone || "—"}\n${t.form.waEmail} : ${form.email}\n${t.form.waDomain} : ${form.domain}\n${t.form.waUrgency} : ${form.urgency}\n\n${form.message}`;
  const waHref = `https://wa.me/${cabinet.whatsapp}?text=${encodeURIComponent(text)}`;
  const mailHref = `${cabinet.emailHref}?subject=${encodeURIComponent(t.form.waSubject(form.domain))}&body=${encodeURIComponent(text)}`;

  if (status === "ready") {
    return (
      <div className="panel-in" role="status">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/12 text-success">
          <Check className="h-8 w-8" />
        </span>
        <p className="mt-5 font-serif text-3xl font-semibold text-ink-900">{t.form.readyTitle}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          {t.form.readyTextA} <strong className="font-medium text-ink-900">{t.form.readyTextB}</strong>.
        </p>
        <dl className="mt-6 space-y-1.5 rounded-lg border border-sand-300 bg-cream-100/70 p-5 text-sm leading-relaxed text-ink-600">
          <div><dt className="inline font-medium text-ink-900">{t.form.readyName}</dt><dd className="inline">{form.name}</dd></div>
          <div><dt className="inline font-medium text-ink-900">{t.form.readyDomain}</dt><dd className="inline">{form.domain}</dd></div>
          <div><dt className="inline font-medium text-ink-900">{t.form.readyUrgency}</dt><dd className="inline">{form.urgency}</dd></div>
          <div className="line-clamp-3"><dt className="inline font-medium text-ink-900">{t.form.readyMessage}</dt><dd className="inline">{form.message}</dd></div>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-ink-600">{lang === "ar" ? "هذا طلب استشارة وليس موعداً مؤكداً. سيتواصل معك المكتب لتأكيد الموعد." : "Ceci est une demande de consultation, pas un rendez-vous confirmé. Le cabinet vous contactera pour confirmer le créneau."}</p>
        <p className="mt-4 text-xs text-ink-600">{lang === "ar" ? "التواصل مباشرة أيضاً:" : "Ou contactez directement le cabinet :"}</p>
        <div className="mt-3 flex flex-col gap-3">
          <a href={waHref} target="_blank" rel="noreferrer" className="btn w-full bg-whatsapp text-white hover:bg-success">
            <WhatsApp className="h-4.5 w-4.5" /> {t.form.viaWhatsapp}
          </a>
          <a href={mailHref} className="btn-outline w-full">
            <Mail className="h-4 w-4" /> {t.form.viaEmail}
          </a>
          <button
            type="button"
            onClick={() => { submissionKey.current = crypto.randomUUID(); setStatus("idle"); }}
            className="mt-1 cursor-pointer text-sm font-medium text-ink-600 underline decoration-gold-500/60 underline-offset-4 transition-colors hover:text-wine-700"
          >
            {t.form.edit}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={status === "sending"}>
      <input type="text" name="website" autoComplete="off" tabIndex={-1} aria-hidden="true" className="hidden" defaultValue="" />
      <p className="font-serif text-[28px] leading-tight font-semibold text-ink-900">{t.form.title}</p>
      <p className="mt-1.5 text-sm text-ink-600">{t.form.subtitle}</p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">{t.form.name}</label>
          <input id="c-name" type="text" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t.form.namePh} className={cn("field", errors.name && "field-error")} aria-invalid={!!errors.name} />
          {errors.name && <p className="mt-1.5 text-xs text-danger">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-phone" className="field-label">{t.form.phone}</label>
          <input id="c-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder={t.form.phonePh} className={cn("field", errors.phone && "field-error")} aria-invalid={!!errors.phone} />
          {errors.phone && <p className="mt-1.5 text-xs text-danger">{errors.phone}</p>}
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="c-email" className="field-label">{t.form.email}</label>
        <input id="c-email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder={t.form.emailPh} className={cn("field", errors.email && "field-error")} aria-invalid={!!errors.email} />
        {errors.email && <p className="mt-1.5 text-xs text-danger">{errors.email}</p>}
      </div>

      <div className="mt-5">
        <label htmlFor="c-domain" className="field-label">{t.form.domain}</label>
        <div className="relative">
          <select id="c-domain" value={form.domain} onChange={(e) => set("domain", e.target.value)} className={cn("field cursor-pointer appearance-none pr-11 rtl:pr-4 rtl:pl-11", !form.domain && "text-ink-400", errors.domain && "field-error")} aria-invalid={!!errors.domain}>
            <option value="" disabled>{t.form.domainPh}</option>
            {expertises.map((exp) => (
              <option key={exp.id} value={exp.title}>{exp.title}</option>
            ))}
            <option value={t.form.otherDomain}>{t.form.otherDomain}</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-wine-600 rtl:right-auto rtl:left-4" />

        </div>
        {errors.domain && <p className="mt-1.5 text-xs text-danger">{errors.domain}</p>}
      </div>

      <fieldset className="mt-5">
        <legend className="field-label">{t.form.urgency}</legend>
        <div className="flex flex-wrap gap-2">
          {t.form.urgencies.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => set("urgency", u)}
              aria-pressed={form.urgency === u}
              className={cn(
                "cursor-pointer rounded-md border px-4 py-2 text-[13px] transition-all duration-200",
                form.urgency === u ? "border-wine-600 bg-wine-600 text-cream-50" : "border-sand-300 bg-cream-100/70 text-ink-600 hover:border-wine-600/50"
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="c-message" className="field-label">{t.form.message}</label>
        <textarea id="c-message" rows={5} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder={t.form.messagePh} className={cn("field resize-none", errors.message && "field-error")} aria-invalid={!!errors.message} />
        <div className="mt-1.5 flex justify-between gap-4">
          {errors.message ? <p className="text-xs text-danger">{errors.message}</p> : <span />}
          <span className="text-xs text-ink-400">{t.form.chars(form.message.length)}</span>
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-600">
        <input id="c-consent" type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-wine-600" />
        <span>
          {t.form.consentA}{" "}
          <a href="#/confidentialite" className="text-wine-700 underline decoration-gold-500/60 underline-offset-2">{t.form.consentLink}</a>
          {t.form.consentB}
        </span>
      </label>
      {errors.consent && <p className="mt-1.5 text-xs text-danger">{errors.consent}</p>}

      {submitError && <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-red-50 p-4 text-sm text-danger">{submitError}</p>}
      <button type="submit" disabled={status === "sending"} className="btn-wine mt-7 w-full disabled:cursor-wait disabled:opacity-80">
        {status === "sending" ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {t.form.sending}
          </>
        ) : (
          <>
            {t.form.submit} <Send className="h-4 w-4 rtl:-scale-x-100" />
          </>
        )}
      </button>
    </form>
  );
}
