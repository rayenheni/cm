-- Ajoute un brouillon trilingue sans remplacer un article existant.
-- Faire valider le texte juridique et les traductions avant publication.
WITH nouvel_article AS (
  INSERT INTO cmcb_private.articles (id, expertise_id, image, status, published_at)
  VALUES ('startup-label-tunisie', 'affaires', '', 'draft', NULL)
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
  "title": "Qu’est-ce qu’une startup en Tunisie ?",
  "excerpt": "Définition, conditions, dossier et durée : les points essentiels pour comprendre le label Startup en Tunisie.",
  "imageAlt": "Illustration",
  "intro": "En Tunisie, la loi n° 2018-20 du 17 avril 2018 considère comme startup une société commerciale constituée conformément à la législation en vigueur et ayant obtenu le label Startup. Ce label est attribué sous certaines conditions et ouvre l’accès aux encouragements prévus par la loi pendant sa validité.",
  "sections": [
    {
      "heading": "Un modèle innovant et un potentiel de croissance",
      "paragraphs": [
        "La société doit notamment présenter un modèle économique à forte dimension innovante, en particulier technologique, ainsi qu’une activité à fort potentiel de croissance économique."
      ]
    },
    {
      "heading": "Quels éléments présenter dans la demande ?",
      "paragraphs": [
        "La demande comporte notamment les aspects d’innovation et les facteurs différenciants du projet.",
        "Elle présente également les facteurs permettant de concrétiser son fort potentiel de développement économique.",
        "Le demandeur précise les qualifications scientifiques et techniques ainsi que l’expérience de l’équipe en charge du projet.",
        "Le cas échéant, il indique les prix ou récompenses obtenus et les brevets d’invention déposés."
      ]
    },
    {
      "heading": "D’autres conditions à vérifier",
      "paragraphs": [
        "L’octroi du label est également soumis à des conditions concernant notamment l’ancienneté de la société, ses effectifs, son total bilan, son chiffre d’affaires annuel et la composition de son capital. Les seuils et les modalités applicables doivent être vérifiés lors de la demande."
      ]
    },
    {
      "heading": "Avantages et durée du label",
      "paragraphs": [
        "Le label permet de bénéficier d’encouragements et d’avantages prévus par la loi, sous réserve des conditions applicables. Sa validité ne peut pas dépasser huit ans à compter de la constitution de la société. Il ne s’agit donc pas d’un label permanent."
      ]
    }
  ],
  "keyPoints": [
    "Une startup au sens de la loi est une société commerciale ayant obtenu le label Startup.",
    "Le projet doit notamment présenter une dimension innovante et un fort potentiel de croissance.",
    "Les conditions de taille, d’ancienneté et de capital doivent aussi être vérifiées.",
    "La validité du label ne peut dépasser huit ans à compter de la constitution de la société."
  ]
}
$article$::jsonb),
    ('ar', $article$
{
  "category": "قانون الأعمال",
  "readTime": "3 دقائق",
  "title": "ما هي المؤسسة الناشئة في تونس؟",
  "excerpt": "التعريف والشروط وملف الطلب ومدة الصلاحية: أهم النقاط لفهم علامة المؤسسة الناشئة في تونس.",
  "imageAlt": "صورة توضيحية",
  "intro": "في تونس، يعتبر القانون عدد 20 لسنة 2018 المؤرخ في 17 أفريل 2018 مؤسسة ناشئة كل شركة تجارية مكوّنة طبقاً للتشريع الجاري به العمل ومتحصلة على علامة المؤسسة الناشئة. وتُسند هذه العلامة وفق شروط معينة وتتيح الانتفاع بالتشجيعات المنصوص عليها في القانون خلال مدة صلاحيتها.",
  "sections": [
    {
      "heading": "منوال مبتكر وإمكانية للنمو",
      "paragraphs": [
        "يجب خصوصاً أن يقوم المنوال الاقتصادي للشركة على صبغة مجددة، لا سيما تكنولوجية، وأن ينطوي نشاطها على إمكانية هامة للنمو الاقتصادي."
      ]
    },
    {
      "heading": "ما العناصر التي يتضمنها الطلب؟",
      "paragraphs": [
        "يتضمن الطلب خصوصاً جوانب الابتكار والعوامل التي تميز المشروع.",
        "كما يعرض العوامل التي تسمح بتحقيق إمكانية التطور الاقتصادي الهامة للمشروع.",
        "ويبيّن طالب العلامة المؤهلات العلمية والتقنية وخبرة الفريق المكلف بالمشروع.",
        "وعند الاقتضاء، يذكر الجوائز أو المكافآت المتحصل عليها وبراءات الاختراع المودعة."
      ]
    },
    {
      "heading": "شروط أخرى يجب التثبت منها",
      "paragraphs": [
        "يخضع إسناد العلامة أيضاً لشروط تتعلق خصوصاً بأقدمية الشركة وعدد العاملين ومجموع الموازنة ورقم المعاملات السنوي وتركيبة رأس المال. ويجب التثبت من السقوف والإجراءات المطبقة عند تقديم الطلب."
      ]
    },
    {
      "heading": "مزايا العلامة ومدة صلاحيتها",
      "paragraphs": [
        "تتيح العلامة الانتفاع بالتشجيعات والامتيازات المنصوص عليها في القانون، مع مراعاة الشروط المطبقة. ولا يمكن أن تتجاوز مدة صلاحيتها ثماني سنوات من تاريخ تكوين الشركة؛ فهي ليست علامة دائمة."
      ]
    }
  ],
  "keyPoints": [
    "المؤسسة الناشئة في معنى القانون شركة تجارية متحصلة على علامة المؤسسة الناشئة.",
    "يجب أن يتميز المشروع بالابتكار وإمكانية هامة للنمو.",
    "يجب أيضاً التثبت من شروط الحجم والأقدمية ورأس المال.",
    "لا تتجاوز صلاحية العلامة ثماني سنوات من تاريخ تكوين الشركة."
  ]
}
$article$::jsonb),
    ('en', $article$
{
  "category": "Business law",
  "readTime": "3 min",
  "title": "What is a startup in Tunisia?",
  "excerpt": "Definition, conditions, application and validity: the essentials of the Tunisian Startup Label.",
  "imageAlt": "Illustration",
  "intro": "In Tunisia, Law No. 2018-20 of 17 April 2018 defines a startup as a commercial company established in accordance with the applicable legislation that has obtained the Startup Label. The label is granted subject to conditions and gives access to incentives provided by law while it is valid.",
  "sections": [
    {
      "heading": "An innovative model and growth potential",
      "paragraphs": [
        "The company must in particular have a business model with a strong innovative dimension, especially technological, and an activity with significant economic growth potential."
      ]
    },
    {
      "heading": "What should the application present?",
      "paragraphs": [
        "The application includes the innovative aspects and differentiating factors of the project.",
        "It also presents the factors enabling the project’s significant economic development potential to be realised.",
        "The applicant specifies the scientific and technical qualifications and experience of the team responsible for the project.",
        "Where applicable, the applicant mentions any prizes or awards received and patent applications filed."
      ]
    },
    {
      "heading": "Other conditions to check",
      "paragraphs": [
        "The label is also subject to conditions concerning, among other things, the company’s age, workforce, balance-sheet total, annual turnover and capital structure. The applicable thresholds and procedures should be checked when applying."
      ]
    },
    {
      "heading": "Benefits and validity of the label",
      "paragraphs": [
        "The label provides access to incentives and benefits established by law, subject to the applicable conditions. Its validity cannot exceed eight years from the company’s incorporation. It is therefore not a permanent label."
      ]
    }
  ],
  "keyPoints": [
    "A startup under the law is a commercial company that has obtained the Startup Label.",
    "The project must in particular be innovative and have significant growth potential.",
    "The conditions concerning size, age and capital must also be checked.",
    "The label cannot remain valid for more than eight years from incorporation."
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
