-- Ajoute un article publié et ses trois traductions, sans écraser un article existant.
-- Relire et valider les traductions juridiques avant exécution.
WITH nouvel_article AS (
  INSERT INTO cmcb_private.articles (id, expertise_id, image, status, published_at)
  VALUES ('contrat-prevention-des-litiges', 'affaires', '', 'published', now())
  ON CONFLICT (id) DO NOTHING
  RETURNING id
), traductions AS (
  INSERT INTO cmcb_private.article_translations (article_id, lang, body)
  SELECT a.id, t.lang, t.body
  FROM nouvel_article AS a
  CROSS JOIN (VALUES
    ('ar', $article$
{
  "category": "قانون الأعمال",
  "readTime": "3 دقائق",
  "title": "العقد أداة لتنظيم الالتزامات والوقاية من النزاعات",
  "excerpt": "لا يقتصر دور العقد على تنظيم الالتزامات المتبادلة، بل يساعد أيضاً على توقع الصعوبات والحد من النزاعات المحتملة.",
  "imageAlt": "صورة توضيحية",
  "intro": "العقد لا ينظم الالتزامات التعاقدية فحسب، بل يشكّل أداة للوقاية من النزاعات المحتملة.\n\nغالباً ما يُنظر إلى العقد باعتباره مجرد وسيلة لتنظيم الالتزامات المتبادلة بين الأطراف وتحديد حقوق كل طرف وواجباته، غير أن وظيفة العقد تتجاوز ذلك بكثير.",
  "sections": [
    {
      "heading": "العقد الجيد يستبق الصعوبات",
      "paragraphs": [
        "✔️ فالعقد الجيد لا يقتصر على تنظيم ما اتفق عليه الأطراف، بل يستبق أيضاً ما قد يطرأ من صعوبات أو إخلالات أثناء تنفيذه، ويحدد الآثار القانونية المترتبة عنها.",
        "💡 وهنا تبرز أهمية الصياغة القانونية الدقيقة؛ إذ إن وضوح البنود وتحديد الالتزامات والآجال وشروط التنفيذ والفسخ من شأنه الحد من مواطن الغموض والتأويل، وبالتالي تقليص احتمالات نشوب النزاعات."
      ]
    },
    {
      "heading": "الغموض قد يكون مصدر نزاع",
      "paragraphs": [
        "ففي الواقع العملي، لا تنشأ العديد من النزاعات بالضرورة نتيجة سوء نية الأطراف منذ البداية، وإنما قد تكون نتيجة غياب التوقع المسبق، أو عدم دقة الصياغة، أو سكوت العقد عن مسائل كان من الممكن توقعها وتنظيمها مسبقاً.",
        "❌ فالبند الغامض اليوم قد يتحول إلى مصدر نزاع والالتزام الذي لم يقع تحديده بدقة قد يجعل تنفيذه أو إثبات الإخلال به أمراً صعباً.",
        "أما غياب الالتزامات التعاقدية الواضحة، فقد يفتح المجال أمام تأويلات متباينة ومصالح متعارضة."
      ]
    },
    {
      "heading": "الاستشارة القانونية المسبقة",
      "paragraphs": [
        "لذلك، فإن جودة العقد لا تُقاس فقط بما يتضمنه من حقوق والتزامات، بل أيضاً بقدرته على استباق المخاطر وتنظيم آثارها القانونية.",
        "💡 ومن هنا تتجلى أهمية الاستشارة القانونية المسبقة؛ إذ لا ينبغي انتظار نشوء النزاع للبحث عن حل، بل يتعين بناء إطار تعاقدي سليم منذ البداية، يراعي مصالح الأطراف ويحد من المخاطر القانونية المحتملة.",
        "ففي المادة التعاقدية، لا تتمثل أفضل استراتيجية دائماً في معرفة كيفية كسب القضية، بل في معرفة كيفية تجنب الوصول إلى القضاء من الأساس.",
        "#القانون_التونسي #القانون_التعاقدي #صياغة_العقود #الاستشارة_القانونية #الوقاية_من_النزاعات #الأمن_القانوني #المحاماة"
      ]
    }
  ],
  "keyPoints": [
    "العقد الجيد يستبق الصعوبات والإخلالات المحتملة.",
    "وضوح الالتزامات والآجال وشروط التنفيذ والفسخ يقلّص الغموض.",
    "الاستشارة القانونية المسبقة تساعد على الوقاية من النزاعات."
  ]
}
$article$::jsonb),
    ('fr', $article$
{
  "category": "Droit des affaires",
  "readTime": "3 min",
  "title": "Le contrat : organiser les obligations et prévenir les litiges",
  "excerpt": "Un contrat ne se limite pas à organiser les obligations réciproques : il aide aussi à anticiper les difficultés et à réduire les risques de litige.",
  "imageAlt": "Illustration",
  "intro": "Le contrat ne se contente pas d’organiser les obligations contractuelles : il constitue aussi un outil de prévention des litiges potentiels.\n\nOn considère souvent le contrat comme un simple moyen d’organiser les obligations réciproques des parties et de définir les droits et devoirs de chacune. Pourtant, sa fonction va bien au-delà.",
  "sections": [
    {
      "heading": "Un bon contrat anticipe les difficultés",
      "paragraphs": [
        "Un bon contrat ne se limite pas à organiser ce dont les parties sont convenues. Il anticipe également les difficultés ou les manquements susceptibles de survenir lors de son exécution et en précise les conséquences juridiques.",
        "C’est ici que la rédaction juridique précise prend toute son importance : la clarté des clauses et la définition des obligations, des délais, des conditions d’exécution et de résiliation permettent de réduire les zones d’incertitude et d’interprétation, et donc les risques de litige."
      ]
    },
    {
      "heading": "L’ambiguïté peut devenir une source de litige",
      "paragraphs": [
        "Dans la pratique, de nombreux litiges ne naissent pas nécessairement de la mauvaise foi initiale des parties. Ils peuvent résulter d’un manque d’anticipation, d’une rédaction imprécise ou du silence du contrat sur des questions qui auraient pu être prévues et organisées à l’avance.",
        "Une clause ambiguë aujourd’hui peut devenir une source de conflit. Une obligation insuffisamment définie peut rendre son exécution ou la preuve de son inexécution difficile.",
        "L’absence d’obligations contractuelles claires peut également ouvrir la voie à des interprétations divergentes et à des intérêts opposés."
      ]
    },
    {
      "heading": "L’importance du conseil juridique préalable",
      "paragraphs": [
        "La qualité d’un contrat ne se mesure donc pas seulement aux droits et obligations qu’il contient, mais aussi à sa capacité à anticiper les risques et à organiser leurs conséquences juridiques.",
        "D’où l’importance du conseil juridique préalable : plutôt que d’attendre la naissance d’un litige pour chercher une solution, il convient de construire dès le départ un cadre contractuel solide, qui tient compte des intérêts des parties et limite les risques juridiques potentiels.",
        "En matière contractuelle, la meilleure stratégie ne consiste pas toujours à savoir comment gagner un procès, mais à savoir comment éviter d’aller en justice dès le départ."
      ]
    }
  ],
  "keyPoints": [
    "Un bon contrat anticipe les difficultés et les manquements possibles.",
    "La clarté des obligations, des délais et des conditions d’exécution et de résiliation réduit les ambiguïtés.",
    "Un conseil juridique préalable aide à prévenir les litiges."
  ]
}
$article$::jsonb),
    ('en', $article$
{
  "category": "Business law",
  "readTime": "3 min",
  "title": "Contracts: organising obligations and preventing disputes",
  "excerpt": "A contract does more than organise mutual obligations: it also helps anticipate difficulties and reduce the risk of disputes.",
  "imageAlt": "Illustration",
  "intro": "A contract does more than organise contractual obligations: it is also a tool for preventing potential disputes.\n\nA contract is often seen as merely a way to organise the parties’ mutual obligations and define each party’s rights and duties. Its function, however, goes much further.",
  "sections": [
    {
      "heading": "A good contract anticipates difficulties",
      "paragraphs": [
        "A good contract does not simply set out what the parties have agreed. It also anticipates difficulties or breaches that may arise during performance and specifies their legal consequences.",
        "This is where precise legal drafting matters: clear clauses and defined obligations, deadlines, performance conditions and termination terms can reduce ambiguity and competing interpretations, thereby reducing the likelihood of disputes."
      ]
    },
    {
      "heading": "Ambiguity can become a source of disputes",
      "paragraphs": [
        "In practice, many disputes do not necessarily arise because the parties acted in bad faith from the outset. They may result from a failure to anticipate, imprecise drafting, or a contract’s silence on issues that could have been anticipated and addressed in advance.",
        "An ambiguous clause today may become a source of dispute. An obligation that is not precisely defined may be difficult to perform or to prove has been breached.",
        "The absence of clear contractual obligations may also give rise to differing interpretations and conflicting interests."
      ]
    },
    {
      "heading": "The importance of early legal advice",
      "paragraphs": [
        "The quality of a contract is therefore measured not only by the rights and obligations it contains, but also by its ability to anticipate risks and organise their legal consequences.",
        "That is why early legal advice matters: rather than waiting for a dispute to arise before seeking a solution, the parties should establish a sound contractual framework from the outset, taking their interests into account and limiting potential legal risks.",
        "In contractual matters, the best strategy is not always knowing how to win a case, but knowing how to avoid going to court in the first place."
      ]
    }
  ],
  "keyPoints": [
    "A good contract anticipates possible difficulties and breaches.",
    "Clear obligations, deadlines, performance conditions and termination terms reduce ambiguity.",
    "Early legal advice helps prevent disputes."
  ]
}
$article$::jsonb)
  ) AS t(lang, body)
  RETURNING lang
)
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM nouvel_article)
       THEN 'article ajoute et publie'
       ELSE 'identifiant deja existant : aucune modification' END AS resultat,
  (SELECT count(*) FROM traductions) AS traductions_ajoutees;
