-- Ajoute un brouillon trilingue sans remplacer un article existant.
-- Faire valider les textes et la procédure juridique avant publication.
WITH nouvel_article AS (
  INSERT INTO cmcb_private.articles (id, expertise_id, image, status, published_at)
  VALUES ('reconnaissance-divorce-france-tunisie', 'famille', '', 'draft', NULL)
  ON CONFLICT (id) DO NOTHING
  RETURNING id
), traductions AS (
  INSERT INTO cmcb_private.article_translations (article_id, lang, body)
  SELECT a.id, t.lang, t.body
  FROM nouvel_article AS a
  CROSS JOIN (VALUES
    ('fr', $article$
{
  "category": "Droit de la famille",
  "readTime": "4 min",
  "title": "Divorcé en France : comment faire reconnaître son divorce en Tunisie ?",
  "excerpt": "Jugement de divorce ou convention déposée chez un notaire : les démarches de reconnaissance en Tunisie dépendent du document obtenu en France.",
  "imageAlt": "Illustration",
  "intro": "Une personne divorcée en France peut constater que son état civil tunisien n’a pas encore été mis à jour. La démarche à envisager dépend notamment de la nature du document constatant le divorce : jugement rendu par un tribunal ou convention de divorce sans juge déposée chez un notaire.",
  "sections": [
    {
      "heading": "La convention franco-tunisienne de 1972",
      "paragraphs": [
        "La convention du 28 juin 1972 entre la France et la Tunisie porte notamment sur la reconnaissance des décisions judiciaires en matière civile et commerciale. Les décisions relatives à l’état des personnes peuvent donner lieu à transcription sous réserve des conditions prévues par cette convention.",
        "La distinction importante porte sur la nature judiciaire ou non du document, et non uniquement sur le fait que les époux aient divorcé par consentement mutuel. En France, un divorce par consentement mutuel peut, dans certains cas, être homologué par un juge."
      ]
    },
    {
      "heading": "Si le divorce résulte d’un jugement français",
      "paragraphs": [
        "Une demande de transcription du jugement peut être présentée auprès des services consulaires tunisiens, sous réserve des conditions applicables et des pièces requises. Il convient de vérifier le dossier et la situation auprès du consulat compétent."
      ]
    },
    {
      "heading": "Si le divorce résulte d’une convention sans juge",
      "paragraphs": [
        "En France, un divorce par consentement mutuel sans juge prend la forme d’une convention signée par les époux, contresignée par leurs avocats et déposée au rang des minutes d’un notaire. Cette convention n’est pas un jugement de divorce.",
        "Le site eConsulat tunisien indique que ce divorce sans signature d’un juge ne peut pas être transcrit directement auprès des consulats tunisiens à l’étranger et mentionne l’obtention d’un jugement d’exequatur auprès du tribunal tunisien compétent. La voie procédurale et les pièces à réunir doivent être vérifiées selon la situation et la pratique de la juridiction saisie."
      ]
    },
    {
      "heading": "Vérifier la situation avant toute démarche",
      "paragraphs": [
        "La reconnaissance du divorce et ses effets éventuels, notamment sur les enfants ou les obligations financières, méritent une analyse adaptée. Une consultation juridique permet de vérifier la nature de l’acte français, les conditions applicables et la procédure appropriée."
      ]
    }
  ],
  "keyPoints": [
    "La distinction essentielle est celle entre un jugement et une convention de divorce sans juge.",
    "Un divorce par consentement mutuel peut, dans certains cas, donner lieu à un jugement en France.",
    "Les démarches et les documents requis doivent être vérifiés auprès des autorités compétentes."
  ]
}
$article$::jsonb),
    ('ar', $article$
{
  "category": "قانون العائلة",
  "readTime": "4 دقائق",
  "title": "الطلاق في فرنسا: كيف يُعترف به في تونس؟",
  "excerpt": "حكم طلاق أم اتفاق مودع لدى موثق: تختلف إجراءات الاعتراف في تونس بحسب الوثيقة الصادرة في فرنسا.",
  "imageAlt": "صورة توضيحية",
  "intro": "قد يكتشف شخص مطلّق في فرنسا أن وضعه المدني في تونس لم يُحيَّن بعد. ويتوقف الإجراء المناسب، خصوصاً، على طبيعة الوثيقة التي تثبت الطلاق: حكم صادر عن محكمة أو اتفاق طلاق دون قاضٍ مودع لدى موثق.",
  "sections": [
    {
      "heading": "الاتفاقية الفرنسية التونسية لسنة 1972",
      "paragraphs": [
        "تتعلق اتفاقية 28 جوان 1972 بين فرنسا وتونس، من بين أمور أخرى، بالاعتراف بالأحكام القضائية في المواد المدنية والتجارية. ويمكن ترسيم الأحكام المتعلقة بالحالة الشخصية مع مراعاة الشروط المنصوص عليها في الاتفاقية.",
        "التمييز المهم يتعلق بالطبيعة القضائية أو غير القضائية للوثيقة، لا بمجرد كون الطلاق بالتراضي. ففي فرنسا، قد يصادق القاضي على طلاق بالتراضي في بعض الحالات."
      ]
    },
    {
      "heading": "إذا صدر الطلاق بحكم فرنسي",
      "paragraphs": [
        "يمكن تقديم طلب ترسيم حكم الطلاق لدى المصالح القنصلية التونسية، مع مراعاة الشروط والوثائق المطلوبة. ويُنصح بالتحقق من الملف والوضعية لدى القنصلية المختصة."
      ]
    },
    {
      "heading": "إذا نتج الطلاق عن اتفاق دون قاضٍ",
      "paragraphs": [
        "في فرنسا، يأخذ الطلاق بالتراضي دون قاضٍ شكل اتفاق يمضيه الزوجان ويؤشر عليه محامياهما، ثم يُودع ضمن أصول عقود موثق. وهذا الاتفاق ليس حكماً بالطلاق.",
        "يشير موقع القنصلية الإلكترونية التونسية إلى أن هذا الطلاق دون إمضاء قاضٍ لا يمكن ترسيمه مباشرة لدى القنصليات التونسية بالخارج، ويذكر ضرورة الحصول على حكم بالصيغة التنفيذية من المحكمة التونسية المختصة. ويجب التحقق من الإجراء والوثائق المطلوبة بحسب كل حالة والممارسة لدى المحكمة المعنية."
      ]
    },
    {
      "heading": "التحقق من الوضعية قبل اتخاذ الإجراءات",
      "paragraphs": [
        "يستوجب الاعتراف بالطلاق وآثاره المحتملة، خاصة في ما يتعلق بالأطفال أو الالتزامات المالية، دراسة ملائمة للحالة. وتسمح الاستشارة القانونية بالتحقق من طبيعة الوثيقة الفرنسية والشروط والإجراء المناسب."
      ]
    }
  ],
  "keyPoints": [
    "التمييز الأساسي هو بين الحكم واتفاق الطلاق دون قاضٍ.",
    "قد يصدر في فرنسا حكم بالطلاق بالتراضي في بعض الحالات.",
    "يجب التثبت من الإجراءات والوثائق المطلوبة لدى الجهات المختصة."
  ]
}
$article$::jsonb),
    ('en', $article$
{
  "category": "Family law",
  "readTime": "4 min",
  "title": "Divorced in France: how can the divorce be recognised in Tunisia?",
  "excerpt": "A court judgment or an agreement filed with a notary: the steps for recognition in Tunisia depend on the document obtained in France.",
  "imageAlt": "Illustration",
  "intro": "Someone divorced in France may find that their Tunisian civil-status record has not yet been updated. The appropriate steps depend in particular on the document establishing the divorce: a court judgment or a divorce agreement filed with a notary without a judge.",
  "sections": [
    {
      "heading": "The 1972 Franco-Tunisian convention",
      "paragraphs": [
        "The convention of 28 June 1972 between France and Tunisia concerns, among other things, the recognition of judicial decisions in civil and commercial matters. Decisions relating to personal status may be recorded in civil-status registers subject to the conditions of the convention.",
        "The key distinction is whether the document is a judicial decision, not simply whether the spouses divorced by mutual consent. In France, a mutual-consent divorce may in certain cases be approved by a judge."
      ]
    },
    {
      "heading": "If the divorce is based on a French judgment",
      "paragraphs": [
        "An application to record the judgment may be submitted to Tunisian consular services, subject to the applicable conditions and required documents. The applicant should check the file and circumstances with the competent consulate."
      ]
    },
    {
      "heading": "If the divorce is based on an agreement without a judge",
      "paragraphs": [
        "In France, a mutual-consent divorce without a judge takes the form of an agreement signed by the spouses, countersigned by their lawyers and filed in the records of a notary. This agreement is not a divorce judgment.",
        "The Tunisian eConsulat website states that this divorce without a judge’s signature cannot be recorded directly by Tunisian consulates abroad and refers to obtaining an exequatur judgment from the competent Tunisian court. The procedural route and required documents should be checked in light of the circumstances and the practice of the court concerned."
      ]
    },
    {
      "heading": "Check the circumstances before proceeding",
      "paragraphs": [
        "Recognition of the divorce and its possible effects, particularly concerning children or financial obligations, require an assessment adapted to the case. Legal advice can help establish the nature of the French document, the applicable conditions and the appropriate procedure."
      ]
    }
  ],
  "keyPoints": [
    "The key distinction is between a court judgment and a divorce agreement without a judge.",
    "In certain cases, mutual-consent divorce in France can result in a court judgment.",
    "Check the procedure and required documents with the competent authorities."
  ]
}
$article$::jsonb)
  ) AS t(lang, body)
  RETURNING lang
)
SELECT CASE WHEN EXISTS (SELECT 1 FROM nouvel_article)
       THEN 'brouillon ajoute'
       ELSE 'identifiant deja existant : aucune modification' END AS resultat,
  (SELECT count(*) FROM traductions) AS traductions_ajoutees;
