-- Ajoute un brouillon trilingue sans remplacer un article existant.
-- Faire valider le texte juridique et les traductions avant publication.
WITH nouvel_article AS (
  INSERT INTO cmcb_private.articles (id, expertise_id, image, status, published_at)
  VALUES ('divorce-franco-tunisien-enjeux', 'famille', '', 'draft', NULL)
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
  "title": "Divorce franco-tunisien : quels sont les principaux enjeux juridiques ?",
  "excerpt": "Juridiction compétente, enfants, obligations alimentaires et partage des biens : les questions à examiner dans un divorce franco-tunisien.",
  "imageAlt": "Illustration",
  "intro": "Un divorce présentant des liens avec la France et la Tunisie soulève plusieurs questions : quelle autorité est compétente pour statuer sur le divorce et ses conséquences ? Comment traiter les biens situés dans chaque pays ? Les réponses dépendent de la situation et des règles applicables.",
  "sections": [
    {
      "heading": "La compétence pour le divorce",
      "paragraphs": [
        "La nationalité des époux et leur résidence habituelle sont des éléments importants. La compétence doit toutefois être examinée au regard des règles applicables dans chaque État et des conventions pertinentes : la seule nationalité tunisienne des deux époux ne suffit pas à déterminer automatiquement une compétence exclusive.",
        "En France, lorsque le règlement européen applicable s’applique, la résidence habituelle des époux ou de l’un d’eux, dans les conditions prévues par le texte, et la nationalité commune des deux époux figurent parmi les critères possibles. La nationalité française d’un seul époux, prise isolément, ne suffit pas nécessairement ; d’autres règles peuvent s’appliquer selon le dossier.",
        "Le consentement mutuel n’est pas, à lui seul, un critère de compétence judiciaire. En France, le divorce par consentement mutuel peut prendre la forme d’une convention sans juge ou, dans certains cas, être homologué par un juge."
      ]
    },
    {
      "heading": "Les conséquences du divorce",
      "paragraphs": [
        "La contribution alimentaire, le droit de visite et les questions relatives aux enfants appellent chacun un examen de compétence adapté. Le fait qu’un juge soit compétent pour le divorce ne signifie pas automatiquement qu’il l’est pour toutes ces demandes. La résidence habituelle de l’enfant et les règles propres aux obligations alimentaires peuvent notamment être importantes."
      ]
    },
    {
      "heading": "Le partage des biens",
      "paragraphs": [
        "Le partage dépend notamment du régime matrimonial, de la nature et de la localisation des biens ainsi que des règles de compétence et de loi applicable. Pour les biens situés en Tunisie, il convient de vérifier les règles tunisiennes pertinentes et les éventuelles formalités locales. La compétence ne doit pas être déduite automatiquement de la seule localisation de tous les biens, mobiliers comme immobiliers."
      ]
    },
    {
      "heading": "Une analyse adaptée à chaque situation",
      "paragraphs": [
        "Il est important de vérifier les procédures déjà engagées, la reconnaissance des décisions entre les deux pays et les mesures concernant les enfants ou le patrimoine. Une consultation juridique permet d’examiner le dossier avant toute démarche."
      ]
    }
  ],
  "keyPoints": [
    "La compétence pour le divorce dépend des critères juridiques applicables au dossier.",
    "Les demandes relatives aux enfants et aux obligations alimentaires doivent être examinées séparément.",
    "Le partage des biens exige l’étude du régime matrimonial et des règles applicables dans chaque pays."
  ]
}
$article$::jsonb),
    ('ar', $article$
{
  "category": "قانون العائلة",
  "readTime": "4 دقائق",
  "title": "الطلاق الفرنسي التونسي: ما أبرز المسائل القانونية؟",
  "excerpt": "المحكمة المختصة والأطفال والالتزامات المالية وقسمة الممتلكات: مسائل يجب دراستها في الطلاق الفرنسي التونسي.",
  "imageAlt": "صورة توضيحية",
  "intro": "يثير الطلاق المرتبط بفرنسا وتونس عدة مسائل: ما الجهة المختصة بالبت في الطلاق وآثاره؟ وكيف تُعالج الممتلكات الموجودة في كل بلد؟ تتوقف الإجابة على وضعية الأطراف والقواعد الواجبة التطبيق.",
  "sections": [
    {
      "heading": "الاختصاص بالنظر في الطلاق",
      "paragraphs": [
        "تُعد جنسية الزوجين ومحل إقامتهما المعتادة من العناصر المهمة. لكن يجب فحص الاختصاص وفق القواعد المطبقة في كل دولة والاتفاقيات ذات الصلة؛ فلا تكفي الجنسية التونسية للزوجين وحدها لتحديد اختصاص حصري بصورة آلية.",
        "في فرنسا، عندما يكون النظام الأوروبي المعني واجب التطبيق، تشمل معايير الاختصاص الممكنة الإقامة المعتادة للزوجين أو أحدهما وفق شروط النص، والجنسية المشتركة للزوجين. ولا تكفي الجنسية الفرنسية لأحد الزوجين وحدها بالضرورة؛ وقد تنطبق قواعد أخرى بحسب الملف.",
        "التراضي وحده ليس معياراً للاختصاص القضائي. ففي فرنسا قد يأخذ الطلاق بالتراضي شكل اتفاق دون قاضٍ أو يصادق عليه قاضٍ في بعض الحالات."
      ]
    },
    {
      "heading": "آثار الطلاق",
      "paragraphs": [
        "تستوجب المطالب المتعلقة بالنفقة وحق الزيارة والأطفال فحصاً مستقلاً لقواعد الاختصاص. فاختصاص قاضٍ بالنظر في الطلاق لا يعني آلياً اختصاصه بجميع هذه المطالب. وقد تكون الإقامة المعتادة للطفل والقواعد الخاصة بالالتزامات الغذائية ذات أهمية."
      ]
    },
    {
      "heading": "قسمة الممتلكات",
      "paragraphs": [
        "تتوقف القسمة، من بين أمور أخرى، على النظام المالي للزوجين وطبيعة الممتلكات ومكان وجودها وقواعد الاختصاص والقانون الواجب التطبيق. وبالنسبة إلى الممتلكات الموجودة في تونس، ينبغي التثبت من القواعد التونسية والإجراءات المحلية المحتملة. ولا يُستنتج الاختصاص آلياً من مجرد مكان وجود جميع الممتلكات، المنقولة منها والعقارية."
      ]
    },
    {
      "heading": "دراسة ملائمة لكل وضعية",
      "paragraphs": [
        "من المهم التحقق من الإجراءات التي تم البدء فيها والاعتراف بالأحكام بين البلدين والتدابير المتعلقة بالأطفال أو الممتلكات. وتسمح الاستشارة القانونية بفحص الملف قبل اتخاذ أي إجراء."
      ]
    }
  ],
  "keyPoints": [
    "يتحدد الاختصاص في الطلاق وفق المعايير القانونية المطبقة على الملف.",
    "تُفحص مطالب الأطفال والالتزامات الغذائية على حدة.",
    "تستوجب قسمة الممتلكات دراسة النظام المالي وقواعد كل بلد."
  ]
}
$article$::jsonb),
    ('en', $article$
{
  "category": "Family law",
  "readTime": "4 min",
  "title": "Franco-Tunisian divorce: what are the main legal issues?",
  "excerpt": "Jurisdiction, children, maintenance and division of property: issues to examine in a Franco-Tunisian divorce.",
  "imageAlt": "Illustration",
  "intro": "A divorce connected to both France and Tunisia raises several questions: which authority can decide the divorce and its consequences, and how should property in each country be addressed? The answers depend on the circumstances and the applicable rules.",
  "sections": [
    {
      "heading": "Jurisdiction over the divorce",
      "paragraphs": [
        "The spouses’ nationalities and habitual residence are important factors. Jurisdiction must nevertheless be assessed under the rules applicable in each state and relevant conventions: the Tunisian nationality of both spouses does not by itself automatically establish exclusive jurisdiction.",
        "In France, where the relevant European regulation applies, possible grounds include the habitual residence of the spouses or one of them, subject to the conditions in the text, and the common nationality of both spouses. The French nationality of only one spouse does not necessarily suffice on its own; other rules may apply depending on the case.",
        "Mutual consent is not by itself a ground for a court’s jurisdiction. In France, a mutual-consent divorce may take the form of an agreement without a judge or, in certain cases, be approved by a judge."
      ]
    },
    {
      "heading": "Consequences of divorce",
      "paragraphs": [
        "Maintenance, visitation and matters concerning children each require a separate jurisdictional assessment. A court’s jurisdiction over the divorce does not automatically mean it can decide all of these claims. The child’s habitual residence and the rules specific to maintenance obligations may be important."
      ]
    },
    {
      "heading": "Division of property",
      "paragraphs": [
        "Division depends in particular on the matrimonial property regime, the nature and location of the assets, and the rules on jurisdiction and applicable law. For property in Tunisia, the relevant Tunisian rules and any local formalities should be checked. Jurisdiction should not automatically be inferred solely from the location of all assets, whether movable or immovable."
      ]
    },
    {
      "heading": "An assessment tailored to each situation",
      "paragraphs": [
        "It is important to check any proceedings already started, recognition of decisions between the two countries, and measures concerning children or property. Legal advice can help assess the case before any steps are taken."
      ]
    }
  ],
  "keyPoints": [
    "Jurisdiction over divorce depends on the legal criteria applicable to the case.",
    "Claims concerning children and maintenance must be assessed separately.",
    "Division of property requires examination of the matrimonial regime and the rules applicable in each country."
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
