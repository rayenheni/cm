-- Article publié en trois langues ; aucun article existant n'est écrasé.
-- Relire les traductions et valider le contenu juridique avant exécution.
WITH nouvel_article AS (
  INSERT INTO cmcb_private.articles (id, expertise_id, image, status, published_at)
  VALUES ('preuve-avant-litige-affaires', 'affaires', '', 'published', now())
  ON CONFLICT (id) DO NOTHING
  RETURNING id
), traductions AS (
  INSERT INTO cmcb_private.article_translations (article_id, lang, body)
  SELECT a.id, t.lang, t.body
  FROM nouvel_article AS a
  CROSS JOIN (VALUES
    ('fr', $article$
{
  "category": "Droit des affaires",
  "readTime": "3 min",
  "title": "En droit des affaires, la preuve se constitue avant le litige",
  "excerpt": "Accords écrits, preuves d’exécution et mises en demeure : trois réflexes pour préparer sa défense avant un litige commercial.",
  "imageAlt": "Illustration",
  "intro": "En droit des affaires, les procès ne se gagnent pas devant le juge. Ils se gagnent en amont.\n\nOn entend souvent : « S’il y a un problème, on verra avec les avocats. » C’est une erreur stratégique majeure ! En matière commerciale et contractuelle, un adage fondamental guide toute stratégie de défense : la preuve se constitue avant le litige.",
  "sections": [
    {
      "heading": "Tracer chaque étape clé",
      "paragraphs": [
        "Un accord verbal ou une modification de projet en cours de route ? Confirmez-le systématiquement par écrit : e-mail de synthèse, avenant ou compte-rendu signé."
      ]
    },
    {
      "heading": "Conserver les preuves d’exécution",
      "paragraphs": [
        "Livrables, validations intermédiaires, réserves émises… Assurez-vous que la traçabilité de votre prestation soit irréprochable."
      ]
    },
    {
      "heading": "Formaliser les mises en demeure",
      "paragraphs": [
        "En cas d’inexécution ou de retard de votre cocontractant, actez le manquement immédiatement dans les formes requises. Ne laissez pas s’installer un silence qui pourrait être interprété comme une tolérance."
      ]
    },
    {
      "heading": "La règle d’or",
      "paragraphs": [
        "Et n’oubliez pas la règle d’or : « La preuve incombe à celui qui allègue. »"
      ]
    }
  ],
  "keyPoints": [
    "Confirmez par écrit les accords et modifications clés.",
    "Conservez les preuves d’exécution et les validations.",
    "Formalisez les mises en demeure dans les formes requises.",
    "La preuve se constitue avant le litige."
  ]
}
$article$::jsonb),
    ('ar', $article$
{
  "category": "قانون الأعمال",
  "readTime": "3 دقائق",
  "title": "في قانون الأعمال، تُعدّ الأدلة قبل نشوء النزاع",
  "excerpt": "توثيق الاتفاقات وحفظ أدلة التنفيذ وتوجيه الإنذارات: ثلاث ممارسات لإعداد الدفاع قبل نشوء النزاع التجاري.",
  "imageAlt": "صورة توضيحية",
  "intro": "في قانون الأعمال، لا تُكسب القضايا أمام القاضي، بل يُمهَّد لكسبها مسبقاً.\n\nكثيراً ما نسمع: «إذا حدثت مشكلة، سنتحدث مع المحامين حينها». وهذا خطأ استراتيجي كبير! ففي المسائل التجارية والتعاقدية، يوجّه مبدأ أساسي كل استراتيجية دفاع: تُعدّ الأدلة قبل نشوء النزاع.",
  "sections": [
    {
      "heading": "توثيق كل مرحلة أساسية",
      "paragraphs": [
        "هل أُبرم اتفاق شفهي أو وقع تعديل للمشروع أثناء تنفيذه؟ أكّد ذلك دائماً كتابةً، عبر رسالة إلكترونية تلخيصية أو ملحق للعقد أو محضر ممضى."
      ]
    },
    {
      "heading": "الاحتفاظ بأدلة التنفيذ",
      "paragraphs": [
        "المخرجات والموافقات المرحلية والتحفظات المعبّر عنها… احرص على توثيق مراحل تنفيذ خدماتك بدقة."
      ]
    },
    {
      "heading": "توجيه الإنذارات بالصيغة المطلوبة",
      "paragraphs": [
        "في حالة عدم تنفيذ الطرف المتعاقد الآخر لالتزامه أو تأخره، وثّق الإخلال فوراً وفق الأشكال المطلوبة. لا تدع الصمت يستمر بما قد يُفسَّر على أنه تسامح."
      ]
    },
    {
      "heading": "القاعدة الذهبية",
      "paragraphs": [
        "ولا تنسَ القاعدة الذهبية: «البينة على من ادعى»."
      ]
    }
  ],
  "keyPoints": [
    "أكّد الاتفاقات والتعديلات الأساسية كتابةً.",
    "احتفظ بأدلة التنفيذ والموافقات.",
    "وجّه الإنذارات وفق الأشكال المطلوبة.",
    "تُعدّ الأدلة قبل نشوء النزاع."
  ]
}
$article$::jsonb),
    ('en', $article$
{
  "category": "Business law",
  "readTime": "3 min",
  "title": "In business law, evidence is prepared before a dispute",
  "excerpt": "Written records, evidence of performance and formal notices: three practices for preparing a defence before a commercial dispute arises.",
  "imageAlt": "Illustration",
  "intro": "In business law, cases are not won before the judge. They are won beforehand.\n\nPeople often say, “If there is a problem, we will speak to the lawyers then.” That is a major strategic mistake! In commercial and contractual matters, a fundamental principle guides every defence strategy: evidence is prepared before the dispute arises.",
  "sections": [
    {
      "heading": "Document every key stage",
      "paragraphs": [
        "A verbal agreement or a change to a project along the way? Always confirm it in writing, for example in a summary email, a contract amendment or signed meeting minutes."
      ]
    },
    {
      "heading": "Preserve evidence of performance",
      "paragraphs": [
        "Deliverables, interim approvals and reservations raised: make sure the performance of your services is thoroughly documented."
      ]
    },
    {
      "heading": "Formalise notices of default",
      "paragraphs": [
        "If the other contracting party fails to perform or is late, record the breach promptly in the required form. Do not allow a silence to develop that might be interpreted as tolerance."
      ]
    },
    {
      "heading": "The golden rule",
      "paragraphs": [
        "And do not forget the golden rule: “The burden of proof lies with the party making the allegation.”"
      ]
    }
  ],
  "keyPoints": [
    "Confirm key agreements and changes in writing.",
    "Keep evidence of performance and approvals.",
    "Formalise notices of default in the required form.",
    "Evidence is prepared before a dispute arises."
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
