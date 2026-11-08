import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  CABINET,
  NAV_LINKS,
  EXPERTISES,
  ARTICLES,
  STEPS,
  COMMITMENTS,
  VALUES,
  AUDIENCES,
  FAQ_CATEGORIES,
  ALL_FAQS,
  type Article,
} from "@/data/content";
import {
  CABINET_AR,
  NAV_LINKS_AR,
  EXPERTISES_AR,
  ARTICLES_AR,
  STEPS_AR,
  COMMITMENTS_AR,
  VALUES_AR,
  AUDIENCES_AR,
  FAQ_CATEGORIES_AR,
  ALL_FAQS_AR,
} from "@/data/content.ar";

export type Lang = "fr" | "ar";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  isRTL: boolean;
}

const LangContext = createContext<LangContextValue>({ lang: "fr", setLang: () => {}, isRTL: false });

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem("cmcb-lang");
    if (saved === "ar" || saved === "fr") return saved;
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("ar")) return "ar";
  } catch {
    /* ignore */
  }
  return "fr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("cmcb-lang", l);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        lang === "ar"
          ? "مكتب CMCB — الأستاذة شيماء البحيري، محامية لدى الهيئة الوطنية للمحامين بتونس. قانون الأعمال والعائلة والشغل والجزائي والجرائم السيبرنية والوساطة. المشورة السليمة لإرشادك، والاستراتيجية الصحيحة لحمايتك، والمحامية المناسبة للدفاع عنك."
          : "Cabinet CMCB — Maître Chaima Bhiri, avocat au Barreau de Tunisie. Droit des affaires, famille, travail, pénal & cybercriminalité, médiation. Le bon conseil pour vous guider, la bonne stratégie pour vous protéger, le bon avocat pour vous défendre."
      );
    }
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang, isRTL: lang === "ar" }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/* ————————————————— Dictionnaire UI ————————————————— */

const fr = {
  dir: "ltr",
  skipLink: "Aller au contenu",
  homeLabel: "Accueil",
  nav: {
    appointment: "Rendez-vous",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    menu: "Menu",
    mobileMenu: "Menu mobile",
    showExpertises: "Afficher les expertises",
    fiveDomains: "5 domaines",
    rigorLine: "Une même exigence de rigueur.",
    overview: "Vue d'ensemble",
    bookAppointment: "Prendre rendez-vous",
    mainNav: "Navigation principale",
  },
  hero: {
    phrases: [
      { lead: "Le bon conseil", tail: "pour vous guider.", label: "Conseil" },
      { lead: "La bonne stratégie", tail: "pour vous protéger.", label: "Stratégie" },
      { lead: "Le bon avocat", tail: "pour vous défendre.", label: "Avocat" },
    ],
    srOnly: "Le bon conseil pour vous guider. La bonne stratégie pour vous protéger. Le bon avocat pour vous défendre.",
    introSuffix: "Le cabinet accompagne les particuliers et les entreprises, à Msaken et partout en Tunisie.",
    ctaPrimary: "Prendre rendez-vous",
    ctaSecondary: "Découvrir le cabinet",
    stats: [
      { value: "24 h", label: "Délai de réponse" },
      { value: "05", label: "Domaines d'expertise" },
      { value: "100%", label: "Confidentialité" },
    ],
    marquee: [
      "Droit des affaires",
      "Famille & statut personnel",
      "Droit du travail",
      "Pénal & cybercriminalité",
      "Médiation & règlement amiable",
      "Rigueur",
      "Intégrité",
      "Efficacité stratégique",
    ],
    vertical: "Cabinet · Msaken · Sousse",
    portraitAlt: "Maître Chaima Bhiri, avocat au Barreau de Tunisie, à son bureau",
  },
  logo: {
    sub: "avocat et conseils",
    seal: "CABINET CMCB · AVOCAT ET CONSEILS · MSAKEN ·",
  },
  footer: {
    site: "Le site",
    expertises: "Expertises",
    cabinet: "Le cabinet",
    linkedin: "LinkedIn du cabinet",
    facebook: "Page Facebook du cabinet",
    whatsapp: "WhatsApp du cabinet",
    siteNav: "Navigation pied de page",
    expNav: "Expertises pied de page",
    legal: "Mentions légales",
    privacy: "Politique de confidentialité",
    secret: "Secret professionnel garanti",
    rights: (year: number, lawyer: string, role: string) =>
      `© ${year} CMCB avocat et conseils — ${lawyer}, ${role}.`,
  },
  blocks: {
    breadcrumb: "Fil d'Ariane",
    home: "Accueil",
    methodEyebrow: "La méthode CMCB",
    methodTitleA: "Une méthode claire,",
    methodTitleB: "un engagement constant.",
    methodSub:
      "Chaque dossier suit un parcours structuré : vous savez à chaque instant où vous en êtes, ce qui est fait et ce qui vient ensuite.",
    ctaEyebrow: "Première consultation",
    ctaDefaultTitleA: "Votre situation mérite",
    ctaDefaultTitleB: "une analyse rigoureuse.",
    ctaDefaultText:
      "Exposez votre dossier au cabinet : vous recevez une réponse sous 24 heures ouvrées, dans le strict respect du secret professionnel.",
    appointment: "Prendre rendez-vous",
    whatsapp: "WhatsApp",
    call: "Appeler",
    readArticle: "Lire l'article",
    readTimeSuffix: "",
  },
  explorer: {
    choose: "Choisir un domaine",
    hint: "Particuliers, entrepreneurs et entreprises",
    listLabel: "Domaines d'intervention",
    overline: (num: string) => `Expertise ${num}`,
    servicesTitle: "Le cabinet vous accompagne",
    discover: "Découvrir ce domaine",
    appointment: "Prendre rendez-vous",
    notes: {
      affaires: "Entreprendre & sécuriser",
      famille: "Protéger les liens & le patrimoine",
      travail: "Employeurs & salariés",
      penal: "Défendre & représenter",
      mediation: "Dialoguer & trouver une issue",
    } as Record<string, string>,
  },
  form: {
    title: "Demande de consultation",
    subtitle: "Tous les échanges sont couverts par le secret professionnel de l'avocat.",
    name: "Nom complet *",
    namePh: "Votre nom et prénom",
    phone: "Téléphone",
    phonePh: "+216 …",
    email: "Adresse e-mail *",
    emailPh: "vous@exemple.com",
    domain: "Domaine concerné *",
    domainPh: "Choisissez un domaine…",
    otherDomain: "Autre demande",
    urgency: "Degré d'urgence",
    urgencies: ["Normale", "Sous 48 h", "Urgente (délai / convocation)"],
    message: "Votre situation *",
    messagePh: "Décrivez les faits, les parties concernées, les délais éventuels et vos objectifs…",
    chars: (n: number) => `${n} caractères`,
    consentA: "J'ai pris connaissance de la",
    consentLink: "politique de confidentialité",
    consentB: ". Ce site ne stocke aucune donnée : mon message est transmis directement via WhatsApp ou ma messagerie.",
    submit: "Préparer ma demande",
    sending: "Préparation…",
    errName: "Veuillez indiquer votre nom complet.",
    errEmail: "Adresse e-mail invalide.",
    errPhone: "Numéro de téléphone invalide.",
    errDomain: "Choisissez le domaine concerné.",
    errMessage: "Décrivez votre situation en quelques phrases (15 caractères minimum).",
    errConsent: "Merci de confirmer avoir pris connaissance de la politique de confidentialité.",
    readyTitle: "Votre demande est prête.",
    readyTextA: "Choisissez comment la transmettre au cabinet. Une réponse vous sera adressée sous",
    readyTextB: "24 heures ouvrées",
    readyName: "Nom : ",
    readyDomain: "Domaine : ",
    readyUrgency: "Urgence : ",
    readyMessage: "Message : ",
    viaWhatsapp: "Transmettre via WhatsApp",
    viaEmail: "Envoyer par e-mail",
    edit: "Modifier ma demande",
    waGreeting: "Bonjour Maître Bhiri,",
    waName: "Nom",
    waPhone: "Téléphone",
    waEmail: "E-mail",
    waDomain: "Domaine",
    waUrgency: "Urgence",
    waSubject: (d: string) => `Demande de consultation — ${d}`,
  },
  home: {
    cabinetEyebrow: "Le Cabinet",
    cabinetTitleA: "Rigueur, intégrité &",
    cabinetTitleB: "efficacité stratégique.",
    cabinetTextA: "Fondé sur ces valeurs, le",
    cabinetTextB: "Cabinet Maître Chaima Bhiri (CMCB)",
    cabinetTextC: "accompagne les particuliers et les entreprises dans la défense de leurs droits, la gestion de leurs contentieux et la sécurisation de leurs intérêts juridiques.",
    libraryAlt: "Bibliothèque d'ouvrages juridiques",
    domainsLabel: "Domaines d'expertise",
    quote: "« Le bon avocat pour vous défendre. »",
    quoteAuthor: "Maître Chaima Bhiri",
    pillars: [
      "Analyse stratégique & rigueur argumentaire",
      "Résolution amiable & contentieuse",
      "Sécurité contractuelle & des affaires",
    ],
    discoverCabinet: "Découvrir le cabinet",
    signature: "Chaima Bhiri",
    practiceEyebrow: "Domaines d'intervention",
    practiceTitleA: "À chaque situation,",
    practiceTitleB: "sa stratégie.",
    practiceText: "Du conseil à la défense, le cabinet accompagne les particuliers et les entreprises.",
    practiceAll: "Tous les domaines",
    articlesEyebrow: "Publications",
    articlesTitleA: "Regards juridiques",
    articlesTitleB: "& actualités.",
    articlesText: "Des analyses concrètes pour comprendre vos droits et anticiper les risques.",
    articlesAll: "Tous les articles",
    faqEyebrow: "Questions fréquentes",
    faqTitleA: "Vos questions,",
    faqTitleB: "nos réponses.",
    faqText: "Première consultation, honoraires, suivi à distance : l'essentiel à savoir avant de confier votre dossier.",
    faqAll: "Toutes les questions",
    urgent: "Une question urgente ?",
    ctaTitleA: "Parlons de votre situation,",
    ctaTitleB: "en toute confiance.",
    ctaText: "Premier rendez-vous au cabinet ou à distance — réponse sous 24 heures ouvrées, dans le strict respect du secret professionnel.",
  },
  cabinet: {
    docTitle: "Le Cabinet",
    headerEyebrow: "Le Cabinet",
    headerCrumb: "Le Cabinet",
    headerTitleA: "Un cabinet fondé sur la",
    headerTitleB: "rigueur",
    headerTitleC: "et l'",
    headerTitleD: "intégrité.",
    eyebrow: "Maître Chaima Bhiri",
    titleA: "Avocat au Barreau de Tunisie,",
    titleB: "au service de vos droits.",
    p1a: "Fondé sur des valeurs de rigueur, d'intégrité et d'efficacité stratégique, le",
    p1b: "Cabinet Maître Chaima Bhiri (CMCB)",
    p1c: "accompagne les particuliers et les entreprises dans la défense de leurs droits, la gestion de leurs contentieux et la sécurisation de leurs intérêts juridiques.",
    p2: "Spécialisée en droit privé et en conseil juridique, Maître Bhiri intervient en droit des affaires et des sociétés, en droit de la famille et du statut personnel, en droit du travail, en droit pénal et en cybercriminalité, ainsi qu'en médiation et règlement amiable des conflits.",
    p3: "Installé à Msaken, au cœur du Sahel, le cabinet accompagne ses clients dans toute la région de Sousse et partout en Tunisie, et suit à distance les dossiers des Tunisiens résidant à l'étranger.",
    pillars: [
      "Analyse stratégique et rigueur argumentaire",
      "Résolution amiable et contentieuse",
      "Sécurité contractuelle et des affaires",
    ],
    quote:
      "« Chaque dossier est unique. Il mérite une écoute attentive, une analyse rigoureuse et une stratégie pensée pour les intérêts de celui qui me fait confiance. »",
    appointment: "Prendre rendez-vous",
    linkedin: "Profil LinkedIn",
    portraitAlt: "Maître Chaima Bhiri, avocat au Barreau de Tunisie, à son bureau",
    location: "Msaken · Sousse",
    mottoEyebrow: "Notre devise",
    mottoTitleA: "Guider, protéger,",
    mottoTitleB: "défendre.",
    motto: [
      { verb: "Guider", line: "Le bon conseil pour vous guider.", text: "Comprendre votre situation, vous expliquer vos droits et éclairer chaque décision avant qu'elle ne soit prise." },
      { verb: "Protéger", line: "La bonne stratégie pour vous protéger.", text: "Anticiper les risques, sécuriser vos contrats et vos intérêts, privilégier les solutions durables." },
      { verb: "Défendre", line: "Le bon avocat pour vous défendre.", text: "Porter votre voix avec fermeté devant les juridictions lorsque le contentieux devient nécessaire." },
    ],
    valuesEyebrow: "Nos valeurs",
    valuesTitleA: "Trois valeurs,",
    valuesTitleB: "un engagement.",
    audEyebrow: "Pour qui ?",
    audTitleA: "Un accompagnement",
    audTitleB: "pour chacun.",
    ctaTitleA: "Rencontrez",
    ctaTitleB: "votre avocat.",
    ctaText: "Le premier rendez-vous permet de faire connaissance, de comprendre votre situation et de définir ensemble la stratégie adaptée.",
  },
  expertises: {
    docTitle: "Domaines d'expertise",
    headerEyebrow: "Domaines d'intervention",
    headerCrumb: "Expertises",
    headerTitleA: "Cinq expertises,",
    headerTitleB: "une même exigence.",
    headerSub:
      "Conseil, négociation et contentieux : le cabinet intervient en droit privé auprès des particuliers et des entreprises, avec une approche à la fois stratégique et humaine.",
    dirEyebrow: "Notre intervention",
    dirTitleA: "Le droit, au service",
    dirTitleB: "de vos intérêts.",
    dirText: "Sélectionnez un domaine pour découvrir comment le cabinet peut vous accompagner.",
    ctaTitleA: "Un doute sur",
    ctaTitleB: "la marche à suivre ?",
    ctaText: "Décrivez votre situation en quelques lignes : le cabinet vous oriente vers la bonne démarche, amiable ou contentieuse.",
  },
  expDetail: {
    notFound: "Page introuvable",
    domain: (num: string) => `Domaine ${num}`,
    expertisesCrumb: "Expertises",
    consult: "Demander une consultation",
    approachTitle: "L'approche du cabinet",
    servicesEyebrow: "Nos prestations",
    servicesTitle: "Ce que le cabinet fait pour vous",
    situationsEyebrow: "Vous êtes concerné si…",
    situationsTitle: "Situations fréquentes",
    approachEyebrow: "Notre démarche",
    approachSectionTitle: "Comment nous intervenons",
    docsEyebrow: "Préparer le rendez-vous",
    docsTitle: "Documents utiles",
    docsNote: "En cas de doute, apportez tout : le tri fait partie de notre travail.",
    faqEyebrow: "Questions fréquentes",
    faqTitle: "Vos questions sur ce domaine",
    articlesEyebrow: "Pour aller plus loin",
    articlesTitle: "Articles liés",
    sideEyebrow: "Consultation",
    sideTitle: (s: string) => `Un dossier en ${s.toLowerCase()} ?`,
    sideText: "Réponse sous 24 heures ouvrées. Confidentialité absolue.",
    sideCta: "Prendre rendez-vous",
    sideWa: "Écrire sur WhatsApp",
    sideNavTitle: "Toutes les expertises",
    sideNavLabel: "Autres expertises",
    prev: "Expertise précédente",
    next: "Expertise suivante",
    ctaTitle: (s: string) => `${s} : parlons de votre dossier.`,
    ctaText: "Exposez les faits en quelques lignes : le cabinet étudie votre situation et vous répond sous 24 heures ouvrées.",
  },
  articles: {
    docTitle: "Articles juridiques",
    headerEyebrow: "Publications",
    headerCrumb: "Articles",
    headerTitleA: "Regards juridiques",
    headerTitleB: "& actualités.",
    headerSub:
      "Des analyses concrètes pour comprendre vos droits, anticiper les risques et prendre les bonnes décisions — publiées également sur LinkedIn.",
    follow: "Suivre sur LinkedIn",
    categoriesLabel: "Catégories",
    all: "Tous",
    searchPh: "Rechercher un article…",
    searchLabel: "Rechercher un article",
    found: (n: number) => `${n} article${n > 1 ? "s" : ""} trouvé${n > 1 ? "s" : ""}`,
    emptyTitle: "Aucun article ne correspond.",
    emptyText: "Essayez un autre mot-clé ou une autre catégorie.",
    reset: "Réinitialiser",
    ctaTitleA: "Une question sur",
    ctaTitleB: "votre situation ?",
    ctaText: "Les articles donnent des repères généraux. Pour une analyse adaptée à votre dossier, contactez le cabinet.",
  },
  articleDetail: {
    notFound: "Page introuvable",
    breadcrumb: "Fil d'Ariane",
    home: "Accueil",
    articles: "Articles",
    readSuffix: "de lecture",
    toc: "Sommaire",
    remember: "À retenir",
    disclaimer:
      "Cet article constitue une information générale à jour de sa date de publication ; il ne remplace pas une consultation juridique. Chaque situation mérite une analyse personnalisée.",
    prev: "Précédent",
    next: "Suivant",
    share: "Partager",
    shareOn: (label: string) => `Partager sur ${label}`,
    copyLink: "Copier le lien",
    copied: "Lien copié dans le presse-papiers.",
    similar: "Une situation similaire ?",
    similarText: "Le cabinet analyse votre dossier en toute confidentialité.",
    consult: "Consulter",
    alsoTitleA: "À lire",
    alsoTitleB: "également.",
    allArticles: "Tous les articles",
    ctaTitle: "Cet article vous concerne ?",
    ctaText: "Chaque situation est particulière : faites analyser la vôtre par le cabinet, en toute confidentialité.",
  },
  faq: {
    docTitle: "Questions fréquentes",
    headerEyebrow: "Questions fréquentes",
    headerCrumb: "FAQ",
    headerTitleA: "Vos questions,",
    headerTitleB: "nos réponses.",
    headerSub:
      "Consultation, honoraires, suivi du dossier, confidentialité : l'essentiel à savoir avant de confier votre affaire au cabinet.",
    searchPh: "Rechercher une question…",
    searchLabel: "Rechercher dans la FAQ",
    categories: "Catégories",
    all: "Toutes les questions",
    otherQ: "Une autre question ?",
    otherT: "Réponse sous 24 heures ouvrées.",
    emptyTitle: "Aucune réponse trouvée.",
    emptyText: "Posez directement votre question au cabinet.",
    emptyCta: "Contacter le cabinet",
    ctaTitle: "Votre question n'y figure pas ?",
    ctaText: "Posez-la directement au cabinet — réponse personnalisée sous 24 heures ouvrées, en toute confidentialité.",
  },
  contact: {
    docTitle: "Contact & rendez-vous",
    headerEyebrow: "Contact & rendez-vous",
    headerCrumb: "Contact",
    headerTitleA: "Parlons de",
    headerTitleB: "votre dossier.",
    headerSub:
      "Décrivez brièvement votre situation, les parties concernées et les délais éventuels. Première consultation sur rendez-vous, au cabinet ou à distance.",
    phone: "Téléphone",
    phoneSub: "Lun – Ven, 9h – 17h30",
    whatsapp: "WhatsApp",
    whatsappSub: "Réponse rapide",
    email: "E-mail",
    emailSub: "Réponse sous 24 h ouvrées",
    address: "Adresse",
    hoursTitle: "Horaires",
    privacyTitle: "Confidentialité",
    privacyText: "Vos échanges sont couverts par le secret professionnel.",
    mapTitle: "Localisation du cabinet CMCB — Rue des Fleurs, Msaken, Sousse",
    route: "Itinéraire",
  },
  legal: {
    mentionsTitle: "Mentions légales",
    privacyTitle: "Politique de confidentialité",
    eyebrow: "Informations légales",
    mentionsSub: "Informations relatives à l'éditeur du site et à son utilisation.",
    privacySub: "Comment vos informations sont traitées lorsque vous utilisez ce site ou contactez le cabinet.",
    updated: "Dernière mise à jour : mars 2026.",
    mentions: [
      { title: "Éditeur du site", body: ["__EDITOR1__", "__EDITOR2__", "__EDITOR3__"] },
      {
        title: "Profession réglementée",
        body: [
          "Maître Chaima Bhiri exerce la profession d'avocat, régie par la législation tunisienne relative à l'organisation de la profession d'avocat et par les règles déontologiques de l'Ordre National des Avocats de Tunisie.",
          "Les informations présentées sur ce site ont une vocation exclusivement informative, dans le respect des règles déontologiques de la profession.",
        ],
      },
      {
        title: "Propriété intellectuelle",
        body: [
          "Le nom CMCB, le monogramme, l'identité visuelle et l'ensemble des contenus rédactionnels de ce site sont la propriété exclusive du cabinet. Toute reproduction, représentation ou diffusion, même partielle, sans autorisation écrite préalable est interdite.",
          "Crédits photographiques : photographies d'illustration libres de droits — Pexels (Pavel Danilyuk, Ekaterina Bolovtsova, Mikhail Nilov, Alexander Mass, Sora Shimazaki, Thirdman). Les photographies du cabinet et de Maître Bhiri, une fois intégrées, sont la propriété exclusive du cabinet.",
        ],
      },
      {
        title: "Contenus juridiques",
        body: [
          "Les articles et informations publiés sur ce site constituent une information générale, à jour à la date de leur publication. Ils ne constituent pas une consultation juridique et ne sauraient engager la responsabilité du cabinet. Chaque situation requiert une analyse personnalisée.",
        ],
      },
      {
        title: "Liens externes",
        body: [
          "Le site peut contenir des liens vers des sites tiers (LinkedIn, Facebook, WhatsApp, services de cartographie). Le cabinet n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.",
        ],
      },
    ] as { title: string; body: string[] }[],
    privacy: [
      {
        title: "Principe : aucune collecte par le site",
        body: [
          "Ce site ne dispose d'aucune base de données et n'enregistre aucune des informations que vous saisissez. Il n'utilise pas de cookies publicitaires ni d'outils de suivi.",
        ],
      },
      {
        title: "Le formulaire de contact",
        body: [
          "Le formulaire prépare simplement votre message dans votre navigateur. Vous choisissez ensuite de le transmettre vous-même via WhatsApp ou via votre propre messagerie électronique. Les données ne transitent par aucun serveur du cabinet avant cet envoi.",
          "Une fois reçu, votre message est traité exclusivement par le cabinet, dans le seul but de répondre à votre demande et, le cas échéant, d'assurer la gestion de votre dossier.",
        ],
      },
      {
        title: "Secret professionnel",
        body: [
          "Tous les échanges avec le cabinet — messages, documents, entretiens — sont couverts par le secret professionnel de l'avocat, général, absolu et illimité dans le temps.",
        ],
      },
      {
        title: "Vos droits",
        body: [
          "Conformément à la loi organique n° 2004-63 du 27 juillet 2004 portant sur la protection des données à caractère personnel, vous disposez d'un droit d'accès, de rectification et d'opposition concernant les données vous concernant détenues par le cabinet.",
          "__RIGHTS2__",
        ],
      },
      {
        title: "Services tiers",
        body: [
          "L'utilisation de WhatsApp, de votre messagerie électronique, de LinkedIn, de Facebook ou de la carte intégrée (OpenStreetMap) est soumise aux politiques de confidentialité propres à ces services.",
        ],
      },
    ] as { title: string; body: string[] }[],
  },
  notFound: {
    docTitle: "Page introuvable",
    eyebrow: "Erreur 404",
    titleA: "Cette page est",
    titleB: "introuvable.",
    text: "Le lien que vous avez suivi est peut-être erroné ou la page a été déplacée. Voici quelques pistes pour retrouver votre chemin.",
    home: "Retour à l'accueil",
    contact: "Contacter le cabinet",
  },
  app: {
    top: "Revenir en haut de page",
    whatsapp: "Écrire au cabinet sur WhatsApp",
    whatsappTip: "Écrire sur WhatsApp",
  },
  mobileActions: {
    label: "Contact rapide",
    appointment: "Rendez-vous",
    appointmentLabel: "Prendre rendez-vous avec le cabinet",
    call: "Appeler",
    callLabel: "Appeler le cabinet au",
  },
  lang: {
    label: "Langue",
    fr: "FR",
    ar: "عربي",
    switchToAr: "Passer à l'arabe",
    switchToFr: "التبديل إلى الفرنسية",
  },
};

export type UIStrings = typeof fr;

const ar: UIStrings = {
  dir: "rtl",
  skipLink: "تخطَّ إلى المحتوى",
  homeLabel: "الرئيسية",
  nav: {
    appointment: "موعد",
    openMenu: "فتح القائمة",
    closeMenu: "غلق القائمة",
    menu: "القائمة",
    mobileMenu: "قائمة الجوال",
    showExpertises: "عرض مجالات الممارسة",
    fiveDomains: "5 مجالات",
    rigorLine: "نفس الصرامة المطلوبة.",
    overview: "نظرة شاملة",
    bookAppointment: "أخذ موعد",
    mainNav: "التنقل الرئيسي",
  },
  hero: {
    phrases: [
      { lead: "المشورة السليمة", tail: "لإرشادك.", label: "المشورة" },
      { lead: "الاستراتيجية الصحيحة", tail: "لحمايتك.", label: "الاستراتيجية" },
      { lead: "المحامية المناسبة", tail: "للدفاع عنك.", label: "المحامية" },
    ],
    srOnly: "المشورة السليمة لإرشادك. الاستراتيجية الصحيحة لحمايتك. المحامية المناسبة للدفاع عنك.",
    introSuffix: "يرافق المكتب الأفراد والمؤسسات، في مساكن وفي كامل تونس.",
    ctaPrimary: "أخذ موعد",
    ctaSecondary: "اكتشف المكتب",
    stats: [
      { value: "24 سا", label: "أجل الرد" },
      { value: "05", label: "مجالات الممارسة" },
      { value: "100%", label: "السرية" },
    ],
    marquee: [
      "قانون الأعمال",
      "العائلة والأحوال الشخصية",
      "قانون الشغل",
      "الجزائي والجرائم السيبرنية",
      "الوساطة والتسوية الودية",
      "الصرامة",
      "النزاهة",
      "الفعالية الاستراتيجية",
    ],
    vertical: "المكتب · مساكن · سوسة",
    portraitAlt: "الأستاذة شيماء البحيري، محامية لدى الهيئة الوطنية للمحامين بتونس، في مكتبها",
  },
  logo: {
    sub: "محاماة واستشارات",
    seal: "مكتب CMCB · محاماة واستشارات · مساكن ·",
  },
  footer: {
    site: "الموقع",
    expertises: "مجالات الممارسة",
    cabinet: "المكتب",
    linkedin: "حساب المكتب على لينكدإن",
    facebook: "صفحة المكتب على فيسبوك",
    whatsapp: "واتساب المكتب",
    siteNav: "تنقل تذييل الموقع",
    expNav: "مجالات التذييل",
    legal: "إشعار قانوني",
    privacy: "سياسة الخصوصية",
    secret: "سر مهني مضمون",
    rights: (year: number, lawyer: string, role: string) => `© ${year} مكتب CMCB للمحاماة والاستشارات — ${lawyer}، ${role}.`,
  },
  blocks: {
    breadcrumb: "مسار التنقل",
    home: "الرئيسية",
    methodEyebrow: "منهجية CMCB",
    methodTitleA: "منهجية واضحة،",
    methodTitleB: "والتزام ثابت.",
    methodSub: "يسير كل ملف وفق مسار منظم: تعرف في كل لحظة أين وصلت وما تم وما سيأتي.",
    ctaEyebrow: "الاستشارة الأولى",
    ctaDefaultTitleA: "وضعيتك تستحق",
    ctaDefaultTitleB: "تحليلاً دقيقاً.",
    ctaDefaultText: "اعرض ملفك على المكتب: تتلقى رداً خلال 24 ساعة عمل، في كنف الاحترام التام للسر المهني.",
    appointment: "أخذ موعد",
    whatsapp: "واتساب",
    call: "اتصال",
    readArticle: "قراءة المقال",
    readTimeSuffix: "",
  },
  explorer: {
    choose: "اختر مجالاً",
    hint: "الأفراد ورواد الأعمال والمؤسسات",
    listLabel: "مجالات الممارسة",
    overline: (num: string) => `المجال ${num}`,
    servicesTitle: "يرافقك المكتب في",
    discover: "اكتشف هذا المجال",
    appointment: "أخذ موعد",
    notes: {
      affaires: "التأسيس والتأمين",
      famille: "حماية الروابط والممتلكات",
      travail: "المؤجرون والأجراء",
      penal: "الدفاع والتمثيل",
      mediation: "الحوار وإيجاد مخرج",
    } as Record<string, string>,
  },
  form: {
    title: "طلب استشارة",
    subtitle: "جميع التبادلات مشمولة بالسر المهني للمحامي.",
    name: "الاسم الكامل *",
    namePh: "اسمك ولقبك",
    phone: "الهاتف",
    phonePh: "+216 …",
    email: "البريد الإلكتروني *",
    emailPh: "vous@exemple.com",
    domain: "المجال المعني *",
    domainPh: "اختر مجالاً…",
    otherDomain: "طلب آخر",
    urgency: "درجة الاستعجال",
    urgencies: ["عادية", "خلال 48 ساعة", "مستعجلة (أجل / استدعاء)"],
    message: "وضعيتك *",
    messagePh: "صِف الوقائع والأطراف المعنية والآجال المحتملة وأهدافك…",
    chars: (n: number) => `${n} حرفاً`,
    consentA: "اطلعت على",
    consentLink: "سياسة الخصوصية",
    consentB: ". لا يخزن هذا الموقع أي معطيات: تُرسَل رسالتك مباشرة عبر واتساب أو بريدك.",
    submit: "تجهيز طلبي",
    sending: "جارٍ التجهيز…",
    errName: "يرجى إدخال الاسم الكامل.",
    errEmail: "البريد الإلكتروني غير صالح.",
    errPhone: "رقم الهاتف غير صالح.",
    errDomain: "اختر المجال المعني.",
    errMessage: "صِف وضعيتك في بضع جمل (15 حرفاً على الأقل).",
    errConsent: "يرجى تأكيد الاطلاع على سياسة الخصوصية.",
    readyTitle: "طلبك جاهز.",
    readyTextA: "اختر طريقة إرساله إلى المكتب. سيصلك رد خلال",
    readyTextB: "24 ساعة عمل",
    readyName: "الاسم : ",
    readyDomain: "المجال : ",
    readyUrgency: "الاستعجال : ",
    readyMessage: "الرسالة : ",
    viaWhatsapp: "الإرسال عبر واتساب",
    viaEmail: "الإرسال بالبريد الإلكتروني",
    edit: "تعديل طلبي",
    waGreeting: "مرحباً أستاذة البحيري،",
    waName: "الاسم",
    waPhone: "الهاتف",
    waEmail: "البريد",
    waDomain: "المجال",
    waUrgency: "الاستعجال",
    waSubject: (d: string) => `طلب استشارة — ${d}`,
  },
  home: {
    cabinetEyebrow: "المكتب",
    cabinetTitleA: "الصرامة والنزاهة",
    cabinetTitleB: "والفعالية الاستراتيجية.",
    cabinetTextA: "انطلاقاً من هذه القيم، يرافق",
    cabinetTextB: "مكتب الأستاذة شيماء البحيري (CMCB)",
    cabinetTextC: "الأفراد والمؤسسات في الدفاع عن حقوقهم وإدارة منازعاتهم وتأمين مصالحهم القانونية.",
    libraryAlt: "مكتبة كتب قانونية",
    domainsLabel: "مجالات الممارسة",
    quote: "« المحامية المناسبة للدفاع عنك. »",
    quoteAuthor: "الأستاذة شيماء البحيري",
    pillars: [
      "التحليل الاستراتيجي والصرامة في الحجاج",
      "الحل الودي والنزاعي",
      "الأمان التعاقدي وأمان الأعمال",
    ],
    discoverCabinet: "اكتشف المكتب",
    signature: "شيماء البحيري",
    practiceEyebrow: "مجالات الممارسة",
    practiceTitleA: "لكل وضعية،",
    practiceTitleB: "استراتيجيتها.",
    practiceText: "من الاستشارة اليومية للمؤسسات إلى الدفاع عن الأفراد، يتدخل المكتب في القانون الخاص بمقاربة استراتيجية وإنسانية.",
    practiceAll: "كل المجالات",
    articlesEyebrow: "منشورات",
    articlesTitleA: "نظرات قانونية",
    articlesTitleB: "ومستجدات.",
    articlesText: "تحاليل عملية لفهم حقوقك واستباق المخاطر.",
    articlesAll: "كل المقالات",
    faqEyebrow: "أسئلة شائعة",
    faqTitleA: "أسئلتكم،",
    faqTitleB: "أجوبتنا.",
    faqText: "الاستشارة الأولى والأتعاب والمتابعة عن بُعد: الأساسيات قبل تكليفنا بملفك.",
    faqAll: "كل الأسئلة",
    urgent: "سؤال مستعجل ؟",
    ctaTitleA: "لنتحدث عن وضعيتك،",
    ctaTitleB: "بكل ثقة.",
    ctaText: "موعد أول في المكتب أو عن بُعد — رد خلال 24 ساعة عمل، في كنف الاحترام التام للسر المهني.",
  },
  cabinet: {
    docTitle: "المكتب",
    headerEyebrow: "المكتب",
    headerCrumb: "المكتب",
    headerTitleA: "مكتب مؤسس على",
    headerTitleB: "الصرامة",
    headerTitleC: "و",
    headerTitleD: "النزاهة.",
    eyebrow: "الأستاذة شيماء البحيري",
    titleA: "محامية لدى الهيئة الوطنية للمحامين بتونس،",
    titleB: "في خدمة حقوقك.",
    p1a: "انطلاقاً من قيم الصرامة والنزاهة والفعالية الاستراتيجية، يرافق",
    p1b: "مكتب الأستاذة شيماء البحيري (CMCB)",
    p1c: "الأفراد والمؤسسات في الدفاع عن حقوقهم وإدارة منازعاتهم وتأمين مصالحهم القانونية.",
    p2: "بصفتها مختصة في القانون الخاص والاستشارات القانونية، تتدخل الأستاذة البحيري في قانون الأعمال والشركات، وقانون العائلة والأحوال الشخصية، وقانون الشغل، والقانون الجزائي والجرائم السيبرنية، وفي الوساطة والتسوية الودية للنزاعات.",
    p3: "يقع المكتب بمساكن، في قلب الساحل، ويرافق حرفاءه في كامل جهة سوسة وفي تونس، ويتابع عن بُعد ملفات التونسيين المقيمين بالخارج.",
    pillars: [
      "التحليل الاستراتيجي والصرامة في الحجاج",
      "الحل الودي والنزاعي",
      "الأمان التعاقدي وأمان الأعمال",
    ],
    quote: "« كل ملف فريد. يستحق إصغاءً منتبهاً وتحليلاً دقيقاً واستراتيجية مدروسة لمصلحة من يضع ثقته فيّ. »",
    appointment: "أخذ موعد",
    linkedin: "حساب لينكدإن",
    portraitAlt: "الأستاذة شيماء البحيري، محامية لدى الهيئة الوطنية للمحامين بتونس، في مكتبها",
    location: "مساكن · سوسة",
    mottoEyebrow: "شعارنا",
    mottoTitleA: "نرشد، نحمي،",
    mottoTitleB: "ندافع.",
    motto: [
      { verb: "نرشد", line: "المشورة السليمة لإرشادك.", text: "فهم وضعيتك وشرح حقوقك وإنارة كل قرار قبل اتخاذه." },
      { verb: "نحمي", line: "الاستراتيجية الصحيحة لحمايتك.", text: "استباق المخاطر وتأمين عقودك ومصالحك وتفضيل الحلول الدائمة." },
      { verb: "ندافع", line: "المحامية المناسبة للدفاع عنك.", text: "حمل صوتك بحزم أمام المحاكم عندما يصبح النزاع ضرورياً." },
    ],
    valuesEyebrow: "قيمنا",
    valuesTitleA: "ثلاث قيم،",
    valuesTitleB: "والتزام واحد.",
    audEyebrow: "لمن ؟",
    audTitleA: "مرافقة",
    audTitleB: "لكل واحد.",
    ctaTitleA: "تعرّف على",
    ctaTitleB: "محاميتك.",
    ctaText: "يتيح اللقاء الأول التعارف وفهم وضعيتك وتحديد الاستراتيجية المناسبة معاً.",
  },
  expertises: {
    docTitle: "مجالات الممارسة",
    headerEyebrow: "مجالات الممارسة",
    headerCrumb: "مجالات الممارسة",
    headerTitleA: "خمسة مجالات،",
    headerTitleB: "ونفس الصرامة.",
    headerSub: "الاستشارة والتفاوض والتقاضي: يتدخل المكتب في القانون الخاص لفائدة الأفراد والمؤسسات، بمقاربة استراتيجية وإنسانية.",
    dirEyebrow: "تدخلنا",
    dirTitleA: "القانون في خدمة",
    dirTitleB: "مصالحكم.",
    dirText: "اختر مجالاً لاكتشاف كيف يمكن للمكتب مرافقتك.",
    ctaTitleA: "شك حول",
    ctaTitleB: "الخطوة الواجبة ؟",
    ctaText: "صِف وضعيتك في بضعة أسطر: يوجهك المكتب نحو المسار الصحيح، الودي أو النزاعي.",
  },
  expDetail: {
    notFound: "صفحة غير موجودة",
    domain: (num: string) => `المجال ${num}`,
    expertisesCrumb: "مجالات الممارسة",
    consult: "طلب استشارة",
    approachTitle: "مقاربة المكتب",
    servicesEyebrow: "خدماتنا",
    servicesTitle: "ماذا يفعل المكتب لأجلك",
    situationsEyebrow: "أنت معني إذا…",
    situationsTitle: "وضعيات شائعة",
    approachEyebrow: "منهجيتنا",
    approachSectionTitle: "كيف نتدخل",
    docsEyebrow: "تحضير الموعد",
    docsTitle: "وثائق مفيدة",
    docsNote: "عند الشك، أحضر كل شيء: فالفرز من عملنا.",
    faqEyebrow: "أسئلة شائعة",
    faqTitle: "أسئلتكم حول هذا المجال",
    articlesEyebrow: "للتعمق أكثر",
    articlesTitle: "مقالات مرتبطة",
    sideEyebrow: "استشارة",
    sideTitle: (s: string) => `ملف في ${s} ؟`,
    sideText: "رد خلال 24 ساعة عمل. سرية مطلقة.",
    sideCta: "أخذ موعد",
    sideWa: "الكتابة على واتساب",
    sideNavTitle: "كل المجالات",
    sideNavLabel: "مجالات أخرى",
    prev: "المجال السابق",
    next: "المجال التالي",
    ctaTitle: (s: string) => `${s} : لنتحدث عن ملفك.`,
    ctaText: "اعرض الوقائع في بضعة أسطر: يدرس المكتب وضعيتك ويرد عليك خلال 24 ساعة عمل.",
  },
  articles: {
    docTitle: "مقالات قانونية",
    headerEyebrow: "منشورات",
    headerCrumb: "مقالات",
    headerTitleA: "نظرات قانونية",
    headerTitleB: "ومستجدات.",
    headerSub: "تحاليل عملية لفهم حقوقك واستباق المخاطر واتخاذ القرارات الصحيحة — منشورة أيضاً على لينكدإن.",
    follow: "المتابعة على لينكدإن",
    categoriesLabel: "الأصناف",
    all: "الكل",
    searchPh: "ابحث عن مقال…",
    searchLabel: "البحث عن مقال",
    found: (n: number) => (n === 1 ? "مقال واحد موجود" : `${n} مقالات موجودة`),
    emptyTitle: "لا يوجد مقال مطابق.",
    emptyText: "جرّب كلمة أخرى أو صنفاً آخر.",
    reset: "إعادة الضبط",
    ctaTitleA: "سؤال حول",
    ctaTitleB: "وضعيتك ؟",
    ctaText: "المقالات تقدم معالم عامة. لتحليل ملائم لملفك، اتصل بالمكتب.",
  },
  articleDetail: {
    notFound: "صفحة غير موجودة",
    breadcrumb: "مسار التنقل",
    home: "الرئيسية",
    articles: "مقالات",
    readSuffix: "للقراءة",
    toc: "الفهرس",
    remember: "تذكّر",
    disclaimer:
      "يشكل هذا المقال معلومة عامة محيَّنة بتاريخ نشره؛ ولا يغني عن استشارة قانونية. فكل وضعية تستحق تحليلاً شخصياً.",
    prev: "السابق",
    next: "التالي",
    share: "مشاركة",
    shareOn: (label: string) => `مشاركة على ${label}`,
    copyLink: "نسخ الرابط",
    copied: "تم نسخ الرابط.",
    similar: "وضعية مشابهة ؟",
    similarText: "يحلل المكتب ملفك بسرية تامة.",
    consult: "استشارة",
    alsoTitleA: "اقرأ",
    alsoTitleB: "أيضاً.",
    allArticles: "كل المقالات",
    ctaTitle: "هل يعنيك هذا المقال ؟",
    ctaText: "كل وضعية خاصة: اعرض وضعيتك على المكتب لتحليلها، بسرية تامة.",
  },
  faq: {
    docTitle: "أسئلة شائعة",
    headerEyebrow: "أسئلة شائعة",
    headerCrumb: "أسئلة شائعة",
    headerTitleA: "أسئلتكم،",
    headerTitleB: "أجوبتنا.",
    headerSub: "الاستشارة والأتعاب ومتابعة الملف والسرية: الأساسيات قبل تكليف المكتب بقضيتك.",
    searchPh: "ابحث عن سؤال…",
    searchLabel: "البحث في الأسئلة الشائعة",
    categories: "الأصناف",
    all: "كل الأسئلة",
    otherQ: "سؤال آخر ؟",
    otherT: "رد خلال 24 ساعة عمل.",
    emptyTitle: "لا توجد إجابة.",
    emptyText: "اطرح سؤالك مباشرة على المكتب.",
    emptyCta: "اتصل بالمكتب",
    ctaTitle: "سؤالك غير موجود ؟",
    ctaText: "اطرحه مباشرة على المكتب — إجابة شخصية خلال 24 ساعة عمل، بسرية تامة.",
  },
  contact: {
    docTitle: "اتصل بنا وخذ موعداً",
    headerEyebrow: "اتصل بنا وخذ موعداً",
    headerCrumb: "اتصل بنا",
    headerTitleA: "لنتحدث عن",
    headerTitleB: "ملفك.",
    headerSub: "صِف باختصار وضعيتك والأطراف المعنية والآجال المحتملة. الاستشارة الأولى بموعد، في المكتب أو عن بُعد.",
    phone: "الهاتف",
    phoneSub: "الإثنين – الجمعة، 9 – 17:30",
    whatsapp: "واتساب",
    whatsappSub: "رد سريع",
    email: "البريد الإلكتروني",
    emailSub: "رد خلال 24 ساعة عمل",
    address: "العنوان",
    hoursTitle: "أوقات العمل",
    privacyTitle: "السرية",
    privacyText: "تبادلاتك مشمولة بالسر المهني.",
    mapTitle: "موقع مكتب CMCB — نهج الزهور، مساكن، سوسة",
    route: "الاتجاهات",
  },
  legal: {
    mentionsTitle: "إشعار قانوني",
    privacyTitle: "سياسة الخصوصية",
    eyebrow: "معلومات قانونية",
    mentionsSub: "معلومات عن ناشر الموقع واستعماله.",
    privacySub: "كيف تُعالَج معلوماتك عند استعمال هذا الموقع أو الاتصال بالمكتب.",
    updated: "آخر تحيين : مارس 2026.",
    mentions: [
      { title: "ناشر الموقع", body: ["__EDITOR1__", "__EDITOR2__", "__EDITOR3__"] },
      {
        title: "مهنة منظمة",
        body: [
          "تمارس الأستاذة شيماء البحيري مهنة المحاماة، المنظمة بالتشريع التونسي المتعلق بتنظيم مهنة المحاماة وقواعد أخلاقيات الهيئة الوطنية للمحامين بتونس.",
          "المعلومات المعروضة على هذا الموقع إعلامية حصراً، في احترام لقواعد أخلاقيات المهنة.",
        ],
      },
      {
        title: "الملكية الفكرية",
        body: [
          "اسم CMCB والشعار والهوية البصرية وكامل المحتويات التحريرية لهذا الموقع ملك حصري للمكتب. يمنع أي نسخ أو عرض أو نشر، ولو جزئياً، دون إذن كتابي مسبق.",
          "حقوق الصور: صور توضيحية حرة الحقوق — Pexels. وصور المكتب والأستاذة البحيري، متى أُدرجت، ملك حصري للمكتب.",
        ],
      },
      {
        title: "المحتويات القانونية",
        body: [
          "تشكل المقالات والمعلومات المنشورة على هذا الموقع معلومة عامة محيَّنة بتاريخ نشرها. وهي لا تعدّ استشارة قانونية ولا ترتب مسؤولية المكتب. فكل وضعية تتطلب تحليلاً شخصياً.",
        ],
      },
      {
        title: "روابط خارجية",
        body: [
          "قد يتضمن الموقع روابط لمواقع الغير (لينكدإن وفيسبوك وواتساب وخدمات الخرائط). لا يمارس المكتب أي رقابة على هذه المواقع ولا يتحمل أي مسؤولية عن محتواها.",
        ],
      },
    ] as { title: string; body: string[] }[],
    privacy: [
      {
        title: "المبدأ: لا جمع للمعطيات من الموقع",
        body: [
          "لا يتوفر هذا الموقع على أي قاعدة بيانات ولا يسجل أي معلومة تدخلها. ولا يستعمل ملفات تتبع إعلانية ولا أدوات تتبع.",
        ],
      },
      {
        title: "استمارة الاتصال",
        body: [
          "تجهّز الاستمارة رسالتك ببساطة في متصفحك. ثم ترسلها بنفسك عبر واتساب أو بريدك الإلكتروني. ولا تعبر المعطيات أي خادم للمكتب قبل هذا الإرسال.",
          "بعد التوصل بالرسالة، يعالجها المكتب حصرياً لغرض الرد على طلبك، وعند الاقتضاء لإدارة ملفك.",
        ],
      },
      {
        title: "السر المهني",
        body: [
          "جميع التبادلات مع المكتب — الرسائل والوثائق واللقاءات — مشمولة بالسر المهني للمحامي، العام والمطلق وغير المحدود في الزمن.",
        ],
      },
      {
        title: "حقوقك",
        body: [
          "طبقاً للقانون الأساسي عدد 63 لسنة 2004 المؤرخ في 27 جويلية 2004 المتعلق بحماية المعطيات الشخصية، لك حق النفاذ والتصحيح والاعتراض في ما يتعلق بمعطياتك لدى المكتب.",
          "__RIGHTS2__",
        ],
      },
      {
        title: "خدمات الغير",
        body: [
          "يخضع استعمال واتساب وبريدك الإلكتروني ولينكدإن وفيسبوك والخريطة المدمجة (OpenStreetMap) لسياسات الخصوصية الخاصة بهذه الخدمات.",
        ],
      },
    ] as { title: string; body: string[] }[],
  },
  notFound: {
    docTitle: "صفحة غير موجودة",
    eyebrow: "خطأ 404",
    titleA: "هذه الصفحة",
    titleB: "غير موجودة.",
    text: "ربما كان الرابط الذي اتبعته خاطئاً أو نُقلت الصفحة. إليك بعض المسارات لاستعادة طريقك.",
    home: "العودة إلى الرئيسية",
    contact: "اتصل بالمكتب",
  },
  app: {
    top: "العودة إلى أعلى الصفحة",
    whatsapp: "الكتابة إلى المكتب على واتساب",
    whatsappTip: "الكتابة على واتساب",
  },
  mobileActions: {
    label: "تواصل سريع",
    appointment: "حجز موعد",
    appointmentLabel: "طلب موعد مع المكتب",
    call: "اتصال",
    callLabel: "الاتصال بالمكتب على الرقم",
  },
  lang: {
    label: "اللغة",
    fr: "FR",
    ar: "عربي",
    switchToAr: "Passer à l'arabe",
    switchToFr: "التبديل إلى الفرنسية",
  },
};

export type Strings = typeof fr;

export function useT(): Strings {
  const { lang } = useLang();
  return lang === "ar" ? ar : fr;
}

export function useCabinet() {
  const { lang } = useLang();
  if (lang === "fr") return CABINET;
  return {
    ...CABINET,
    fullName: CABINET_AR.fullName,
    lawyer: CABINET_AR.lawyer,
    role: CABINET_AR.role,
    specialty: CABINET_AR.specialty,
    tagline: CABINET_AR.tagline,
    address: CABINET_AR.address,
    city: CABINET_AR.city,
    hours: CABINET_AR.hours,
    hoursSat: CABINET_AR.hoursSat,
    whatsappHref:
      "https://wa.me/21692166466?text=" + encodeURIComponent(CABINET_AR.whatsappMsg),
  };
}

export function useNavLinks() {
  const { lang } = useLang();
  return lang === "ar" ? NAV_LINKS_AR : NAV_LINKS;
}
export function useExpertises() {
  const { lang } = useLang();
  return lang === "ar" ? EXPERTISES_AR : EXPERTISES;
}
const ADMIN_ARTICLES_KEY = "cmcb-admin-articles";

function loadAdminArticlesFromStorage(): Article[] {
  try {
    const raw = localStorage.getItem(ADMIN_ARTICLES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Article[];
  } catch {
    return [];
  }
}

export function useArticles() {
  const { lang } = useLang();
  const [adminArticles, setAdminArticles] = useState<Article[]>(loadAdminArticlesFromStorage);

  useEffect(() => {
    // Initial sync and re-sync on storage events (cross-tab and same-tab via custom event)
    const refresh = () => setAdminArticles(loadAdminArticlesFromStorage());

    // Cross-tab updates
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_ARTICLES_KEY) refresh();
    };
    // Same-tab updates dispatched by useAdminArticles
    window.addEventListener("storage", onStorage);
    window.addEventListener("cmcb-articles-updated", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cmcb-articles-updated", refresh);
    };
  }, []);

  const baseArticles = lang === "ar" ? ARTICLES_AR : ARTICLES;
  return [...baseArticles, ...adminArticles];
}
export function useSteps() {
  const { lang } = useLang();
  return lang === "ar" ? STEPS_AR : STEPS;
}
export function useCommitments() {
  const { lang } = useLang();
  return lang === "ar" ? COMMITMENTS_AR : COMMITMENTS;
}
export function useValues() {
  const { lang } = useLang();
  return lang === "ar" ? VALUES_AR : VALUES;
}
export function useAudiences() {
  const { lang } = useLang();
  return lang === "ar" ? AUDIENCES_AR : AUDIENCES;
}
export function useFaqCategories() {
  const { lang } = useLang();
  return lang === "ar" ? FAQ_CATEGORIES_AR : FAQ_CATEGORIES;
}
export function useAllFaqs() {
  const { lang } = useLang();
  return lang === "ar" ? ALL_FAQS_AR : ALL_FAQS;
}
export function useCabinetAr() {
  return CABINET_AR;
}
