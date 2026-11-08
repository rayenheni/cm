export const CABINET = {
  name: "CMCB",
  fullName: "CMCB avocat et conseils",
  lawyer: "Maître Chaima Bhiri",
  domain: "cmcbavocat.tn",
  role: "Avocat au Barreau de Tunisie",
  specialty: "Spécialisée en Droit Privé & Conseil Juridique",
  tagline: [
    "Le bon conseil pour vous guider.",
    "La bonne stratégie pour vous protéger.",
    "Le bon avocat pour vous défendre.",
  ],
  phone: "+216 92 166 466",
  phoneHref: "tel:+21692166466",
  whatsapp: "21692166466",
  whatsappHref:
    "https://wa.me/21692166466?text=" +
    encodeURIComponent("Bonjour Maître Bhiri, je souhaite prendre rendez-vous au cabinet CMCB."),
  email: "maitrechaimabhiri@gmail.com",
  emailHref: "mailto:maitrechaimabhiri@gmail.com",
  address: "Rue des Fleurs, Msaken 4070",
  city: "Sousse — Tunisie",
  mapsHref: "https://www.google.com/maps/search/?api=1&query=Rue+des+Fleurs+Msaken+4070+Sousse+Tunisie",
  mapsEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=10.5450%2C35.7050%2C10.6250%2C35.7550&layer=mapnik&marker=35.7292%2C10.5806",
  hours: "Lun – Ven : 9h00 – 17h30",
  hoursSat: "Samedi : 9h00 – 13h00 (sur rendez-vous)",
  linkedin: "https://www.linkedin.com/in/chaima-bhiri",
  facebook: "https://www.facebook.com/cmcbavocat",
};

/* Photographies d'illustration (Pexels, licences libres).
   Aucun de ces visuels ne représente le cabinet ni Maître Bhiri. */
export const IMAGES = {
  heroJustice:
    "https://images.pexels.com/photos/8112195/pexels-photo-8112195.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=900",
  library:
    "https://images.pexels.com/photos/6077091/pexels-photo-6077091.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=900&w=1200",
  officeDetail:
    "https://images.pexels.com/photos/8112198/pexels-photo-8112198.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1400",
  lawBook:
    "https://images.pexels.com/photos/8731037/pexels-photo-8731037.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1400",
};

export const NAV_LINKS = [
  { to: "/cabinet", label: "Le Cabinet" },
  { to: "/expertises", label: "Expertises" },
  { to: "/articles", label: "Articles" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export type IconName =
  | "briefcase"
  | "family"
  | "work"
  | "gavel"
  | "handshake"
  | "compass"
  | "shield"
  | "scales"
  | "lock"
  | "file"
  | "clock"
  | "globe"
  | "user";

export interface Expertise {
  id: string;
  num: string;
  title: string;
  shortTitle: string;
  short: string;
  icon: IconName;
  image: string;
  intro: string;
  services: { title: string; text: string }[];
  situations: string[];
  approach: { title: string; text: string }[];
  documents: string[];
  faqs: { q: string; a: string }[];
  tags: string[];
}

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1400`;

export const EXPERTISES: Expertise[] = [
  {
    id: "affaires",
    num: "01",
    title: "Droit des Affaires, des Sociétés & Commercial",
    shortTitle: "Droit des affaires",
    short: "Création, structuration, contrats et contentieux commerciaux.",
    icon: "briefcase",
    image: px(261621),
    intro:
      "Entreprendre, investir, contracter : chaque décision d'affaires engage votre responsabilité et votre patrimoine. Le cabinet accompagne entrepreneurs, PME, commerçants et investisseurs à chaque étape de la vie de leur entreprise — du choix de la structure juridique jusqu'à la résolution des litiges commerciaux.",
    services: [
      {
        title: "Création & structuration de sociétés",
        text: "Accompagnement complet des entrepreneurs et investisseurs dans la rédaction des statuts, le choix de la forme juridique et l'accomplissement des formalités de constitution.",
      },
      {
        title: "Droit commercial & contrats",
        text: "Rédaction, négociation et validation juridique des contrats commerciaux, des conventions d'actionnaires et des documents corporatifs.",
      },
      {
        title: "Baux commerciaux & litiges",
        text: "Gestion des négociations de baux, renouvellements, résiliations et résolution des contentieux commerciaux.",
      },
    ],
    situations: [
      "Vous créez votre société et hésitez entre SUARL, SARL ou SA.",
      "Vous devez négocier ou signer un contrat commercial à fort enjeu.",
      "Un associé bloque les décisions ou souhaite céder ses parts.",
      "Votre bailleur refuse le renouvellement de votre bail commercial.",
      "Un client ou un fournisseur ne respecte pas ses engagements.",
    ],
    approach: [
      { title: "Audit", text: "Analyse de votre projet, de vos statuts ou de vos contrats existants pour identifier les risques." },
      { title: "Rédaction sur mesure", text: "Statuts, pactes d'associés, contrats et conditions générales adaptés à votre activité réelle." },
      { title: "Négociation", text: "Sécurisation des clauses sensibles : responsabilité, paiement, résiliation, non-concurrence." },
      { title: "Contentieux", text: "Représentation devant les juridictions commerciales lorsque la voie amiable échoue." },
    ],
    documents: [
      "Projet d'activité, répartition envisagée du capital",
      "Statuts et procès-verbaux existants",
      "Contrats, bons de commande, factures et échanges écrits",
      "Bail commercial et correspondances avec le bailleur",
    ],
    faqs: [
      {
        q: "Combien de temps faut-il pour constituer une société ?",
        a: "Une fois les statuts finalisés et le capital déposé, les formalités d'immatriculation peuvent être accomplies rapidement. Le délai global dépend surtout de la préparation du dossier : c'est pourquoi le cabinet vérifie chaque pièce en amont.",
      },
      {
        q: "Faut-il vraiment un pacte d'associés ?",
        a: "Il n'est pas obligatoire, mais il est vivement recommandé dès qu'il y a plusieurs associés : il organise les cessions, les sorties, la gouvernance et le règlement des différends, et prévient l'essentiel des blocages.",
      },
    ],
    tags: ["Statuts", "Contrats", "Baux", "Contentieux"],
  },
  {
    id: "famille",
    num: "02",
    title: "Droit de la Famille & Statut Personnel",
    shortTitle: "Famille & statut personnel",
    short: "Un accompagnement humain, discret et rigoureux des affaires familiales.",
    icon: "family",
    image: px(13821255),
    intro:
      "Les affaires familiales touchent à ce que vous avez de plus précieux. Elles exigent autant de rigueur juridique que d'écoute et de discrétion. Le cabinet vous accompagne dans les procédures du Code du statut personnel, le règlement des successions et les démarches liées à la nationalité, avec un objectif constant : protéger vos droits et ceux de vos enfants.",
    services: [
      {
        title: "Accompagnement juridique",
        text: "Gestion des procédures de divorce, de garde d'enfants, de pensions alimentaires et de régimes matrimoniaux avec écoute et discrétion.",
      },
      {
        title: "Successions & patrimoine",
        text: "Conseil et assistance dans le règlement des successions et la protection du patrimoine familial.",
      },
      {
        title: "Nationalité tunisienne & droit des étrangers",
        text: "Assistance administrative et juridique dans les démarches d'acquisition, de réintégration ou de vérification de la nationalité tunisienne, ainsi que l'accompagnement des résidents étrangers.",
      },
    ],
    situations: [
      "Vous envisagez un divorce, par consentement mutuel ou contentieux.",
      "Vous souhaitez fixer ou réviser une garde, un droit de visite ou une pension.",
      "Vous devez régler une succession ou un partage entre héritiers.",
      "Vous résidez à l'étranger et devez agir en Tunisie à distance.",
      "Vous engagez une démarche de nationalité ou de séjour.",
    ],
    approach: [
      { title: "Écoute", text: "Un entretien confidentiel pour comprendre votre histoire, vos priorités et celles de vos enfants." },
      { title: "Information claire", text: "Vos droits, les procédures possibles, leurs délais et leurs conséquences, sans jargon." },
      { title: "Recherche d'accord", text: "La voie amiable est privilégiée chaque fois qu'elle préserve vos intérêts." },
      { title: "Défense ferme", text: "Représentation devant le juge de la famille lorsque le dialogue n'est plus possible." },
    ],
    documents: [
      "Contrat de mariage et extraits d'actes d'état civil",
      "Justificatifs de revenus et de charges",
      "Documents relatifs aux enfants (scolarité, santé)",
      "Acte de décès, titres de propriété, relevés bancaires (succession)",
    ],
    faqs: [
      {
        q: "Puis-je divorcer si je vis à l'étranger ?",
        a: "Oui, dans de nombreux cas. Le cabinet accompagne régulièrement des Tunisiens résidant à l'étranger : la procédure peut être suivie à distance, avec une procuration encadrée et des comptes rendus réguliers.",
      },
      {
        q: "La garde des enfants peut-elle être modifiée ?",
        a: "Oui. Les mesures relatives aux enfants restent révisables si les circonstances évoluent (déménagement, situation professionnelle, besoins de l'enfant). L'intérêt supérieur de l'enfant guide toujours la décision du juge.",
      },
    ],
    tags: ["Divorce", "Garde", "Successions", "Nationalité"],
  },
  {
    id: "travail",
    num: "03",
    title: "Droit du Travail & Relations Sociales",
    shortTitle: "Droit du travail",
    short: "Conseil et défense des employeurs comme des salariés, à preuve égale.",
    icon: "work",
    image: px(5257756),
    intro:
      "La relation de travail repose sur un équilibre fragile entre les droits du salarié et les impératifs de l'entreprise. Le cabinet conseille les employeurs dans la gestion sécurisée de leurs ressources humaines et défend les salariés face aux ruptures abusives — avec la même rigueur, quel que soit le côté.",
    services: [
      {
        title: "Conseil aux entreprises & salariés",
        text: "Rédaction et révision des contrats de travail, gestion des procédures de licenciement et conformité à la réglementation.",
      },
      {
        title: "Contentieux prud'homaux",
        text: "Représentation et défense avec fermeté devant le Conseil des Prud'hommes en cas de litige de travail.",
      },
    ],
    situations: [
      "Vous avez reçu une notification de licenciement que vous jugez injustifiée.",
      "Votre employeur ne verse pas vos salaires ou vos indemnités.",
      "Vous êtes employeur et devez engager une procédure disciplinaire.",
      "Vous souhaitez mettre à jour vos contrats ou votre règlement intérieur.",
      "Un litige vous oppose à un salarié ou ex-salarié.",
    ],
    approach: [
      { title: "Diagnostic", text: "Analyse du contrat, de la procédure suivie et des pièces disponibles." },
      { title: "Préservation des preuves", text: "Constitution méthodique du dossier : bulletins, courriers, attestations, échanges écrits." },
      { title: "Conciliation", text: "Négociation et conciliation devant l'inspection du travail lorsque c'est pertinent." },
      { title: "Prud'hommes", text: "Plaidoirie devant le Conseil des prud'hommes et suivi jusqu'à l'exécution." },
    ],
    documents: [
      "Contrat de travail et avenants",
      "Bulletins de paie des derniers mois",
      "Lettre de licenciement, convocations, avertissements",
      "Règlement intérieur et échanges écrits avec l'employeur ou le salarié",
    ],
    faqs: [
      {
        q: "Dois-je signer le reçu pour solde de tout compte ?",
        a: "Ne signez jamais dans la précipitation. Ce document peut avoir des conséquences sur vos recours : faites-le analyser avant toute signature, ou signez avec des réserves expresses.",
      },
      {
        q: "Le cabinet conseille-t-il aussi les employeurs ?",
        a: "Oui. Le cabinet accompagne les entreprises en prévention — contrats, procédures disciplinaires, conformité — afin d'éviter des contentieux coûteux et un climat social dégradé.",
      },
    ],
    tags: ["Contrats de travail", "Licenciement", "Prud'hommes"],
  },
  {
    id: "penal",
    num: "04",
    title: "Droit Pénal & Cybercriminalité",
    shortTitle: "Pénal & cybercriminalité",
    short: "Une défense engagée, de l'instruction à la plaidoirie, y compris face au numérique.",
    icon: "gavel",
    image: px(30483129),
    intro:
      "Être mis en cause ou victime d'une infraction est une épreuve. Chaque heure compte, chaque déclaration pèse. Le cabinet assure une défense pénale réactive et rigoureuse, de l'enquête jusqu'à l'audience, et vous accompagne face aux nouvelles formes de délinquance numérique : diffamation en ligne, usurpation d'identité, atteintes aux données personnelles.",
    services: [
      {
        title: "Défense pénale",
        text: "Assistance et représentation devant les juridictions pénales, de la phase d'instruction jusqu'à la plaidoirie.",
      },
      {
        title: "Cybercriminalité & droit du numérique",
        text: "Accompagnement et protection juridique face aux infractions numériques : diffamation en ligne, usurpation d'identité et atteintes aux données personnelles.",
      },
    ],
    situations: [
      "Vous êtes convoqué par la police, la garde nationale ou un juge d'instruction.",
      "Un proche fait l'objet d'une garde à vue ou d'une poursuite pénale.",
      "Vous êtes victime d'une infraction et souhaitez déposer plainte.",
      "Vous êtes diffamé ou harcelé sur les réseaux sociaux.",
      "Votre identité ou vos données personnelles ont été usurpées.",
    ],
    approach: [
      { title: "Réactivité", text: "Une intervention rapide dès la convocation ou la garde à vue." },
      { title: "Étude du dossier", text: "Analyse minutieuse de la procédure et identification des nullités éventuelles." },
      { title: "Preuve numérique", text: "Constitution et conservation des preuves en ligne : captures, constats, réquisitions." },
      { title: "Plaidoirie", text: "Une défense argumentée et déterminée devant la juridiction compétente." },
    ],
    documents: [
      "Convocation, procès-verbaux ou décisions reçues",
      "Captures d'écran datées avec URL (infractions en ligne)",
      "Toute pièce ou témoignage utile à la défense",
      "Pièce d'identité",
    ],
    faqs: [
      {
        q: "Que faire si je reçois une convocation pénale ?",
        a: "Contactez un avocat avant de vous présenter. Il est essentiel de connaître vos droits et de préparer vos déclarations : ce qui est dit lors de l'audition est versé au dossier.",
      },
      {
        q: "Peut-on agir contre un auteur anonyme sur internet ?",
        a: "Oui. Les investigations techniques permettent d'identifier les auteurs via des réquisitions auprès des opérateurs et des plateformes. L'anonymat en ligne n'est pas une impunité acquise.",
      },
    ],
    tags: ["Défense pénale", "Diffamation", "Données personnelles"],
  },
  {
    id: "mediation",
    num: "05",
    title: "Médiation & Règlement Amiable",
    shortTitle: "Médiation & amiable",
    short: "Résoudre vite, confidentiellement et économiquement, avant les tribunaux.",
    icon: "handshake",
    image: px(33175650),
    intro:
      "Tous les litiges ne gagnent pas à être portés devant un tribunal. Une négociation bien menée ou une médiation encadrée permet souvent d'obtenir une solution plus rapide, moins coûteuse et plus durable — tout en préservant les relations commerciales, professionnelles ou familiales.",
    services: [
      {
        title: "Modes alternatifs de règlement des conflits",
        text: "Négociation et médiation pour résoudre vos litiges de manière rapide, confidentielle et économique, avant de recourir aux tribunaux.",
      },
      {
        title: "Rédaction de protocoles d'accord",
        text: "Formalisation sécurisée des accords trouvés : transactions, protocoles transactionnels et conventions de règlement.",
      },
    ],
    situations: [
      "Un différend commercial menace une relation d'affaires que vous souhaitez préserver.",
      "Un conflit familial ou successoral gagnerait à être apaisé.",
      "Vous voulez éviter la durée et le coût d'une procédure judiciaire.",
      "Vous recherchez une solution confidentielle, loin de la publicité des audiences.",
    ],
    approach: [
      { title: "Évaluation", text: "Analyse objective de votre position, de vos risques et de vos marges de négociation." },
      { title: "Stratégie", text: "Définition d'objectifs réalistes et d'une stratégie de négociation." },
      { title: "Médiation", text: "Échanges structurés et confidentiels avec la partie adverse ou son conseil." },
      { title: "Accord sécurisé", text: "Rédaction d'un protocole d'accord juridiquement solide et exécutable." },
    ],
    documents: [
      "Historique du différend et échanges avec l'autre partie",
      "Contrats et pièces justificatives",
      "Vos attentes et vos limites de négociation",
    ],
    faqs: [
      {
        q: "Un accord amiable a-t-il une valeur juridique ?",
        a: "Oui, s'il est correctement rédigé. Une transaction bien formalisée a autorité entre les parties et peut, selon les cas, être homologuée pour devenir exécutoire.",
      },
      {
        q: "Et si la médiation échoue ?",
        a: "Vous conservez tous vos droits d'agir en justice. Le travail préparatoire réalisé reste utile pour la suite de la procédure.",
      },
    ],
    tags: ["Négociation", "Médiation", "Accords"],
  },
];

export interface Article {
  id: string;
  expertiseId: string;
  category: string;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  keyPoints: string[];
}

export const ARTICLES: Article[] = [
  {
    id: "creer-sa-societe-suarl-sarl",
    expertiseId: "affaires",
    category: "Droit des affaires",
    date: "12 janvier 2026",
    readTime: "5 min",
    title: "Créer sa société en Tunisie : SUARL ou SARL, comment choisir ?",
    excerpt:
      "Forme juridique, capital, gérance, responsabilité : les critères concrets pour choisir la structure adaptée à votre projet avant de signer les statuts.",
    image: px(261621),
    imageAlt: "Signature d'un contrat commercial sur un bureau en bois",
    intro:
      "C'est la première question que pose tout entrepreneur : faut-il créer une SUARL, seul aux commandes, ou une SARL à plusieurs associés ? Derrière ces sigles se cachent des choix qui engagent votre patrimoine, votre fiscalité et votre liberté de décision pour des années. Le Code des sociétés commerciales tunisien offre un cadre souple, mais chaque détail des statuts compte.",
    sections: [
      {
        heading: "SUARL ou SARL : deux logiques différentes",
        paragraphs: [
          "La SUARL (société unipersonnelle à responsabilité limitée) séduit les fondateurs qui souhaitent entreprendre seuls tout en séparant leur patrimoine personnel de celui de l'entreprise. La SARL, elle, permet d'accueillir des associés et d'organiser la répartition du capital, des pouvoirs et des bénéfices.",
          "Dans les deux cas, la responsabilité est en principe limitée aux apports : encore faut-il que la gestion reste irréprochable, car un gérant fautif peut voir sa responsabilité personnelle recherchée.",
        ],
      },
      {
        heading: "Capital social et statuts : là où tout se joue",
        paragraphs: [
          "Le capital social est librement fixé par les statuts. En pratique, un capital crédible rassure les banques, les bailleurs et les partenaires commerciaux : il ne s'agit pas d'un simple chiffre déclaratif.",
          "La rédaction des statuts mérite une attention particulière : objet social, pouvoirs de la gérance, clauses d'agrément, majorités renforcées pour les décisions importantes… autant de dispositions qui préviennent les blocages futurs.",
        ],
      },
      {
        heading: "Les étapes de la constitution",
        paragraphs: [
          "Vient ensuite le parcours de constitution : signature et enregistrement des statuts, dépôt du capital, immatriculation au Registre national des entreprises, identifiant fiscal, affiliation sociale et publication. Chaque étape a ses délais et ses pièges.",
          "Une convention d'associés, bien que non obligatoire, est vivement recommandée dès qu'il y a plusieurs associés : elle organise les sorties, les cessions de parts et le règlement des différends avant qu'ils ne deviennent des contentieux.",
        ],
      },
      {
        heading: "Le conseil du cabinet",
        paragraphs: [
          "Ne téléchargez pas des statuts génériques. Une structure pensée dès le départ pour votre activité réelle vous évitera des modifications coûteuses — et parfois des litiges entre associés que rien ne pourra réparer. Une heure de conseil en amont vaut souvent plusieurs années de procédure.",
        ],
      },
    ],
    keyPoints: [
      "SUARL pour entreprendre seul, SARL pour s'associer : la responsabilité reste limitée aux apports.",
      "Le capital est libre, mais il doit être crédible face aux banques et partenaires.",
      "Des statuts sur mesure et une convention d'associés préviennent la majorité des conflits.",
      "Faites valider chaque étape de constitution avant le dépôt.",
    ],
  },
  {
    id: "divorce-consentement-mutuel",
    expertiseId: "famille",
    category: "Famille & patrimoine",
    date: "28 janvier 2026",
    readTime: "4 min",
    title: "Divorce par consentement mutuel en Tunisie : les étapes clés",
    excerpt:
      "Accord sur les effets, audience, transcription : comment se déroule la procédure la plus apaisée du Code du statut personnel, et comment protéger les enfants.",
    image: px(18689100),
    imageAlt: "Parents marchant main dans la main avec leur enfant au coucher du soleil",
    intro:
      "Le Code du statut personnel tunisien prévoit trois voies de divorce. Parmi elles, le divorce par consentement mutuel est la plus rapide et la moins éprouvante : les époux conviennent ensemble du principe de la séparation et, surtout, de ses conséquences. C'est une démarche exigeante, qui suppose un accord véritable — pas un accord arraché sous pression.",
    sections: [
      {
        heading: "Une convention qui règle tous les effets",
        paragraphs: [
          "Le cœur de la procédure est l'accord réglant les effets du divorce : garde des enfants et droit de visite, pension alimentaire et frais de scolarité, logement, sort des biens communs.",
          "Chaque clause doit être précise et réaliste, car elle s'imposera aux deux parties après le jugement. Un accord vague aujourd'hui devient un contentieux demain.",
        ],
      },
      {
        heading: "Le rôle du juge",
        paragraphs: [
          "La requête est déposée auprès du tribunal compétent, accompagnée des pièces d'état civil. Le juge de la famille entend les époux, examine l'accord et vérifie qu'il préserve les intérêts des enfants — c'est son rôle essentiel — avant de prononcer le divorce.",
          "Les enfants ne sont jamais une variable d'ajustement : leur intérêt supérieur guide l'ensemble du contrôle judiciaire.",
        ],
      },
      {
        heading: "Après le jugement",
        paragraphs: [
          "La transcription sur les registres de l'état civil rend le divorce opposable à tous. Les obligations fixées (pension, droit de visite) restent modifiables si les circonstances changent : revenus, déménagement, besoins de l'enfant.",
          "Il est donc inutile de « sur-négocier » dans l'urgence ; mieux vaut un accord équilibré et durable.",
        ],
      },
      {
        heading: "Le rôle de l'avocat",
        paragraphs: [
          "Dans ces dossiers, le rôle de l'avocat est double : sécuriser juridiquement chaque clause et désamorcer les tensions. Un divorce bien préparé, c'est une page qui se tourne proprement — pour les parents comme pour les enfants.",
        ],
      },
    ],
    keyPoints: [
      "L'accord doit porter sur le principe du divorce ET sur l'ensemble de ses effets.",
      "L'intérêt des enfants est contrôlé par le juge : il prime sur les arrangements des parents.",
      "Un accord précis évite les contentieux après le divorce.",
      "Les mesures restent révisables si la situation évolue.",
    ],
  },
  {
    id: "licenciement-abusif-reflexes",
    expertiseId: "travail",
    category: "Droit du travail",
    date: "16 février 2026",
    readTime: "5 min",
    title: "Licenciement abusif : les réflexes pour défendre vos droits",
    excerpt:
      "Procédure, preuves, délais : ce que le Code du travail tunisien exige de l'employeur — et ce que le salarié doit faire dès la notification.",
    image: px(7054510),
    imageAlt: "Personne tenant un stylo et signant un document de travail",
    intro:
      "Recevoir une notification de licenciement est un choc. Pourtant, les premiers jours qui suivent sont décisifs : ce qui est fait — ou pas fait — dans les premières semaines conditionne souvent l'issue du dossier. Le Code du travail tunisien encadre strictement la rupture du contrat : motif réel et sérieux, respect de la procédure, délais.",
    sections: [
      {
        heading: "Premier réflexe : tout conserver",
        paragraphs: [
          "Contrat de travail, bulletins de paie, courriers, e-mails, messages professionnels, attestations de collègues : chaque pièce compte.",
          "En matière disciplinaire, l'employeur doit respecter une procédure précise — notification des griefs, possibilité de se défendre, intervention des instances prévues. Chaque manquement se documente.",
        ],
      },
      {
        heading: "Deuxième réflexe : ne rien signer dans la précipitation",
        paragraphs: [
          "Une « démission » proposée pour éviter un licenciement, un reçu pour solde de tout compte signé sans réserves, une transaction déséquilibrée : ces documents peuvent vous priver de recours. Prenez le temps de faire analyser chaque pièce avant toute signature.",
        ],
      },
      {
        heading: "Troisième réflexe : agir dans les délais",
        paragraphs: [
          "L'inspection du travail peut tenter une conciliation ; à défaut, le Conseil des prud'hommes est compétent pour qualifier la rupture et allouer des dommages-intérêts, l'indemnité de préavis et les sommes dues.",
          "Les délais de recours sont encadrés : les laisser filer est la principale cause de dossiers perdus d'avance.",
        ],
      },
      {
        heading: "Côté employeur : anticiper",
        paragraphs: [
          "La meilleure défense reste l'anticipation : procédures disciplinaires documentées, contrats à jour, règlement intérieur conforme. Un licenciement bien préparé protège l'entreprise d'un contentieux coûteux et d'un climat social dégradé.",
        ],
      },
    ],
    keyPoints: [
      "Conservez immédiatement contrat, bulletins, courriers et échanges écrits.",
      "Ne signez ni démission, ni solde de tout compte sans analyse juridique.",
      "Conciliation puis prud'hommes : surveillez les délais de recours.",
      "Employeurs : une procédure disciplinaire documentée évite l'essentiel des condamnations.",
    ],
  },
  {
    id: "diffamation-en-ligne-usurpation-identite",
    expertiseId: "penal",
    category: "Numérique & pénal",
    date: "5 mars 2026",
    readTime: "6 min",
    title: "Diffamation en ligne, usurpation d'identité : que dit la loi tunisienne ?",
    excerpt:
      "Captures, constat, plainte, INPDP : la marche à suivre concrète lorsque votre réputation ou vos données personnelles sont attaquées sur internet.",
    image: px(37787963),
    imageAlt: "Ordinateur portable affichant du code, ambiance cybersécurité",
    intro:
      "Une publication diffamatoire, un faux profil, des photos détournées : la violence numérique est réelle, et ses conséquences — professionnelles, familiales, psychologiques — le sont tout autant. Le droit tunisien n'est pas démuni : entre le Code pénal, la législation sur les données personnelles et le décret-loi n° 2022-54 relatif aux infractions visant les systèmes d'information et de communication, plusieurs fondements permettent d'agir.",
    sections: [
      {
        heading: "L'urgence : constituer la preuve",
        paragraphs: [
          "Sur internet, tout peut disparaître en un clic. Capturez les publications avec leur URL, la date et le contexte ; faites établir un constat par huissier de justice lorsque l'enjeu le justifie ; conservez notifications et messages.",
          "Une preuve bien constituée dès le premier jour vaut mieux qu'un dossier reconstitué des mois plus tard.",
        ],
      },
      {
        heading: "Choisir la bonne stratégie",
        paragraphs: [
          "Signalement à la plateforme, mise en demeure, plainte pénale pour diffamation, injure, usurpation d'identité ou atteinte aux données personnelles : ces voies se combinent, elles ne s'excluent pas.",
          "Lorsque des données à caractère personnel sont traitées illicitement, l'Instance nationale de protection des données personnelles (INPDP) peut également être saisie.",
        ],
      },
      {
        heading: "L'anonymat n'est pas l'impunité",
        paragraphs: [
          "« L'auteur se cache derrière un pseudo, est-ce inutile ? » Non. Les investigations techniques permettent d'identifier les auteurs via des réquisitions auprès des opérateurs et des plateformes. C'est parfois plus long, mais l'anonymat en ligne n'est pas une impunité acquise.",
        ],
      },
      {
        heading: "Obtenir réparation",
        paragraphs: [
          "Au-delà de la sanction pénale, la victime peut obtenir des dommages-intérêts et la suppression des contenus. Agir vite, agir méthodiquement, et résister à la tentation de répondre soi-même : c'est ainsi que la victime redevient actrice de son propre dossier.",
        ],
      },
    ],
    keyPoints: [
      "Constituez la preuve immédiatement : captures datées, URL, constat d'huissier si nécessaire.",
      "Signalement, mise en demeure, plainte pénale et saisine de l'INPDP se combinent.",
      "Le pseudo-anonymat n'empêche pas l'identification technique des auteurs.",
      "La réparation civile complète la sanction pénale : ne répondez jamais par la diffamation.",
    ],
  },
];

export const STEPS = [
  {
    num: "01",
    title: "Écoute & consultation",
    text: "Un premier rendez-vous pour comprendre les faits, les parties et vos objectifs — au cabinet, par téléphone ou en visioconférence, sans jargon.",
  },
  {
    num: "02",
    title: "Analyse & stratégie",
    text: "Une étude rigoureuse de votre dossier : pièces, risques, chances de succès et voies possibles — amiable avant tout, contentieuse si nécessaire.",
  },
  {
    num: "03",
    title: "Action & négociation",
    text: "Rédaction des actes, mises en demeure, négociations et médiation. Chaque démarche est validée avec vous, honoraires convenus à l'avance.",
  },
  {
    num: "04",
    title: "Défense & suivi",
    text: "Représentation devant les juridictions compétentes, plaidoirie et compte rendu après chaque audience, jusqu'à l'exécution de la décision.",
  },
];

export const COMMITMENTS: { icon: IconName; title: string; text: string }[] = [
  { icon: "lock", title: "Confidentialité absolue", text: "Le secret professionnel de l'avocat couvre chacun de vos échanges." },
  { icon: "file", title: "Honoraires transparents", text: "Un accord écrit avant toute intervention. Aucune surprise." },
  { icon: "clock", title: "Réactivité", text: "Une réponse à votre demande sous 24 heures ouvrées." },
  { icon: "scales", title: "Rigueur & intégrité", text: "Une analyse stratégique et une argumentation exigeantes." },
];

export const VALUES = [
  {
    word: "Rigueur",
    text: "Chaque dossier est étudié dans le détail. Aucune pièce n'est négligée, aucun argument n'est laissé au hasard : la précision est la première forme de respect dû au client.",
  },
  {
    word: "Intégrité",
    text: "Un conseil honnête, même lorsqu'il n'est pas celui que l'on espérait entendre. Le cabinet vous dit clairement vos chances, vos risques et le coût de chaque option.",
  },
  {
    word: "Efficacité",
    text: "Une stratégie orientée résultats : la voie amiable quand elle est la plus rapide, le contentieux quand il est nécessaire — toujours au service de vos intérêts.",
  },
];

export const AUDIENCES: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "user",
    title: "Particuliers",
    text: "Famille, succession, travail, défense pénale, atteintes en ligne : un accompagnement humain et discret.",
  },
  {
    icon: "briefcase",
    title: "Entreprises & entrepreneurs",
    text: "Création de sociétés, contrats, baux, relations sociales et contentieux commerciaux.",
  },
  {
    icon: "globe",
    title: "Tunisiens à l'étranger & étrangers",
    text: "Suivi des dossiers à distance, nationalité, droit des étrangers et démarches administratives.",
  },
];

export interface FaqCategory {
  id: string;
  label: string;
  items: { q: string; a: string }[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "consultation",
    label: "Consultation",
    items: [
      {
        q: "Comment se déroule la première consultation ?",
        a: "Sur rendez-vous, au cabinet à Msaken ou à distance (téléphone, visioconférence). Nous écoutons votre situation, qualifions juridiquement les faits et vous présentons les options possibles ainsi que la stratégie recommandée.",
      },
      {
        q: "Quelles pièces apporter au premier rendez-vous ?",
        a: "Toute pièce utile à la compréhension du dossier : contrats, courriers, décisions de justice, mises en demeure, échanges écrits, pièces d'identité ou documents d'état civil. En cas de doute, apportez tout : le tri fait partie de notre travail.",
      },
      {
        q: "Combien de temps faut-il pour obtenir un rendez-vous ?",
        a: "Le cabinet répond à chaque demande sous 24 heures ouvrées. En cas d'urgence (convocation, garde à vue, délai qui expire), précisez-le dans votre message ou appelez directement.",
      },
    ],
  },
  {
    id: "honoraires",
    label: "Honoraires",
    items: [
      {
        q: "Comment sont fixés les honoraires ?",
        a: "Les honoraires sont convenus par écrit dès le départ, selon la nature et la complexité du dossier : forfait, taux horaire ou honoraire complémentaire de résultat, dans les limites permises par la réglementation de la profession.",
      },
      {
        q: "Recevrai-je une estimation avant de m'engager ?",
        a: "Oui. Une estimation claire vous est remise avant toute intervention, ainsi qu'une convention d'honoraires. Aucune prestation n'est engagée sans votre accord.",
      },
      {
        q: "Les frais de procédure sont-ils inclus ?",
        a: "Les frais annexes (huissier, enregistrement, expertise, frais de greffe) sont distincts des honoraires. Ils sont identifiés et annoncés à l'avance.",
      },
    ],
  },
  {
    id: "procedure",
    label: "Suivi du dossier",
    items: [
      {
        q: "Puis-je suivre mon dossier depuis l'étranger ?",
        a: "Oui. Le cabinet accompagne régulièrement des Tunisiens résidant à l'étranger et des résidents étrangers : échanges sécurisés des pièces, points d'avancement réguliers, comptes rendus après chaque audience et procurations encadrées.",
      },
      {
        q: "Serai-je informé de l'avancement de mon affaire ?",
        a: "Systématiquement. Vous recevez un compte rendu après chaque audience et à chaque étape importante. Vous pouvez à tout moment joindre le cabinet pour faire le point.",
      },
      {
        q: "Faut-il toujours aller au tribunal ?",
        a: "Non. Le cabinet privilégie la négociation et la médiation chaque fois qu'elles servent vos intérêts. Le contentieux est engagé lorsqu'il est nécessaire ou plus efficace.",
      },
    ],
  },
  {
    id: "confidentialite",
    label: "Confidentialité",
    items: [
      {
        q: "Mes échanges avec le cabinet restent-ils confidentiels ?",
        a: "Absolument. Le secret professionnel de l'avocat est général et absolu en vertu de la loi régissant la profession en Tunisie. Il couvre l'ensemble de vos échanges, documents et rendez-vous.",
      },
      {
        q: "Le site conserve-t-il mes données ?",
        a: "Non. Ce site ne dispose d'aucune base de données : le formulaire prépare votre message, que vous transmettez ensuite vous-même via WhatsApp ou votre messagerie électronique.",
      },
    ],
  },
];

export const ALL_FAQS = FAQ_CATEGORIES.flatMap((c) => c.items);
