import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PageKey, Locale, Prisma } from "./generated/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function seedSiteSetting() {
  await db.siteSetting.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      companyName: "GeoExplorer Services",
      tagline:
        "Explorer le sol et le sous-sol. Révéler leurs richesses. Valoriser leur potentiel.",
      address: "37 Ext. F-NORD, Secteur 2, Tevragh Zeina, Nouakchott, Mauritanie",
      // Tevragh-Zeïna district center — a reasoned default, to recalibrate
      // against the real premises once surveyed.
      latitude: 18.1097,
      longitude: -15.978,
      phones: ["+222 22 00 20 04", "+222 20 28 00 00"],
      email: "contact@geoexplorerservices.com",
      siteUrl: "https://geoexplorerservices.com/",
      contactRecipients: ["contact@geoexplorerservices.com"],
    },
    update: {
      companyName: "GeoExplorer Services",
      tagline:
        "Explorer le sol et le sous-sol. Révéler leurs richesses. Valoriser leur potentiel.",
      address: "37 Ext. F-NORD, Secteur 2, Tevragh Zeina, Nouakchott, Mauritanie",
      latitude: 18.1097,
      longitude: -15.978,
      phones: ["+222 22 00 20 04", "+222 20 28 00 00"],
      email: "contact@geoexplorerservices.com",
      siteUrl: "https://geoexplorerservices.com/",
      contactRecipients: ["contact@geoexplorerservices.com"],
    },
  });
}

const pageSections: {
  page: PageKey;
  key: string;
  locale?: Locale;
  order: number;
  data: Prisma.InputJsonValue;
}[] = [
  // ───────────────────────── HOME ─────────────────────────
  {
    page: PageKey.HOME,
    key: "hero",
    order: 0,
    data: {
      title: "Révéler le potentiel du sous-sol. Sécuriser vos décisions.",
      subtitle:
        "GeoExplorer Services accompagne les acteurs du secteur minier en Mauritanie à chaque étape — de l'exploration à la valorisation durable des ressources.",
      ctaLabel: "Discutons de votre projet",
      ctaHref: "/contact",
    },
  },
  {
    page: PageKey.HOME,
    key: "values",
    order: 1,
    data: {
      items: [
        {
          label: "Expertise",
          description:
            "Des compétences géoscientifiques complètes, éprouvées sur le terrain mauritanien.",
        },
        {
          label: "Intégrité",
          description:
            "Des données traçables et des conclusions qui disent ce que montrent les résultats.",
        },
        {
          label: "Innovation",
          description:
            "Drones, télédétection et modélisation au service de décisions mieux informées.",
        },
        {
          label: "Engagement",
          description:
            "Un accompagnement continu, du cadrage initial à la décision finale.",
        },
      ],
    },
  },
  {
    page: PageKey.HOME,
    key: "whoWeAre",
    order: 2,
    data: {
      heading: "Qui sommes-nous",
      lead: "Le partenaire géoscience de référence en Mauritanie, depuis 2008.",
      body: "Depuis 2008, GeoExplorer Services transforme la donnée de terrain en décisions techniques solides pour les opérateurs miniers, les institutions publiques et les investisseurs. Notre équipe d'experts qualifiés maîtrise l'ensemble du cycle d'un projet géoscientifique — exploration, cartographie, SIG, gestion de projet, études technico-économiques et environnementales — pour livrer des solutions fiables, innovantes et sur mesure.",
      linkLabel: "En savoir plus",
      linkHref: "/a-propos",
    },
  },
  {
    page: PageKey.HOME,
    key: "expertiseTeaser",
    order: 3,
    data: {
      heading: "Ce que nous faisons",
      intro: "Cinq expertises, une même exigence : la rigueur.",
    },
  },
  {
    page: PageKey.HOME,
    key: "strengths",
    order: 4,
    data: {
      heading: "Pourquoi GeoExplorer",
      items: [
        {
          title: "Une expertise éprouvée",
          description:
            "Géologie, géophysique, géochimie, hydrogéologie, géotechnique, SIG et environnement, réunis dans une seule équipe.",
        },
        {
          title: "Une connaissance intime du terrain",
          description:
            "Une maîtrise fine des réalités géologiques, minières et logistiques mauritaniennes, acquise projet après projet.",
        },
        {
          title: "Une technologie de pointe",
          description:
            "Drones, photogrammétrie, équipements géophysiques et géochimiques, modélisation avancée.",
        },
        {
          title: "Un réseau solide",
          description:
            "Une coordination établie avec administrations, laboratoires, consultants et prestataires, pour anticiper les démarches plutôt que les subir.",
        },
      ],
    },
  },
  {
    page: PageKey.HOME,
    key: "partnersTeaser",
    order: 5,
    data: {
      heading: "Ils nous font confiance",
      subheading:
        "Une expertise reconnue par des acteurs publics, privés, techniques et académiques — sur des projets miniers concrets, partout en Mauritanie.",
      note:
        "Aperçu de nos collaborations. Les informations historiques obsolètes ont été actualisées ou exclues.",
    },
  },
  {
    page: PageKey.HOME,
    key: "closingBanner",
    order: 6,
    data: {
      quote:
        "Explorer le sol et le sous-sol. Révéler leurs richesses. Valoriser leur potentiel.",
    },
  },

  // ───────────────────────── ABOUT ─────────────────────────
  {
    page: PageKey.ABOUT,
    key: "intro",
    order: 0,
    data: {
      heading:
        "Un bureau mauritanien, une ambition : faire progresser le secteur minier par la rigueur scientifique.",
      subheading: "Notre histoire",
      body: [
        "Depuis 2008, GeoExplorer Services accompagne les structures publiques et privées, les opérateurs miniers et les investisseurs à chaque étape de leurs projets — de la planification initiale à l'interprétation finale des données. Cette expérience s'est construite projet après projet, aux côtés d'acteurs publics, privés, techniques et académiques.",
        "Aujourd'hui, notre équipe d'experts qualifiés met ce savoir-faire au service de nos clients à travers l'exploration minière, la cartographie géologique, le SIG, la gestion de projets, les études technico-économiques et environnementales, le conseil, l'assistance technique et la formation. Une seule ambition : des solutions fiables, innovantes, et pensées pour les besoins réels de chaque projet.",
      ],
    },
  },
  {
    page: PageKey.ABOUT,
    key: "mission",
    order: 1,
    data: {
      heading: "Notre mission",
      body:
        "Faire progresser le secteur minier aux côtés des opérateurs publics et privés — en réduisant les risques techniques, en renforçant la qualité des décisions, et en sécurisant les investissements.",
    },
  },
  {
    page: PageKey.ABOUT,
    key: "vision",
    order: 2,
    data: {
      heading: "Notre vision",
      body:
        "Anticiper les nouveaux enjeux des ressources minérales et bâtir des stratégies durables, fondées sur la connaissance, l'exigence des données et le respect de l'environnement.",
    },
  },
  {
    page: PageKey.ABOUT,
    key: "strengths",
    order: 3,
    data: {
      heading: "Ce qui nous distingue",
      items: [
        {
          title: "Une expertise complète, sous un même toit",
          description:
            "Géologie, exploration, SIG, géophysique, géochimie, environnement, hydrogéologie, géotechnique, conseil, assistance et suivi administratif — toutes les compétences nécessaires à votre projet, réunies dans une seule équipe.",
        },
        {
          title: "Une connaissance du terrain qui fait la différence",
          description:
            "Une maîtrise fine des contextes géologiques, miniers et logistiques propres à la Mauritanie — un atout décisif pour anticiper les contraintes réelles du terrain.",
        },
        {
          title: "Des outils à la hauteur des enjeux",
          description:
            "Drones, photogrammétrie, équipements géophysiques et géochimiques de pointe, bases de données spatiales, modélisation et logiciels spécialisés.",
        },
        {
          title: "Un réseau qui accélère vos projets",
          description:
            "Une coordination fluide avec administrations, laboratoires, consultants et prestataires : des autorisations préparées en amont et des délais tenus.",
        },
      ],
    },
  },
  {
    page: PageKey.ABOUT,
    key: "team",
    order: 4,
    data: {
      heading: "Une équipe à votre image",
      body:
        "GeoExplorer Services mobilise géologues, géomaticiens, experts en environnement, spécialistes de l'exploration et consultants associés, selon les besoins précis de chaque mission. Cette organisation flexible permet d'associer compétences locales et internationales, en français, en arabe et en anglais — les trois langues de vos interlocuteurs, du terrain à l'administration.",
    },
  },
  {
    page: PageKey.ABOUT,
    key: "approach",
    order: 5,
    data: {
      heading: "Notre méthode : une approche intégrée, du besoin à la décision",
      intro:
        "Chaque mission suit un fil conducteur clair, de la compréhension du besoin à la livraison de résultats exploitables :",
      steps: [
        { number: 1, title: "Cadrage", description: "comprendre vos objectifs" },
        {
          number: 2,
          title: "Acquisition",
          description: "collecter la donnée sur le terrain",
        },
        {
          number: 3,
          title: "QA/QC",
          description: "garantir la fiabilité de chaque donnée",
        },
        {
          number: 4,
          title: "Interprétation",
          description: "donner du sens aux résultats",
        },
        {
          number: 5,
          title: "Décision",
          description: "vous fournir des bases solides pour agir",
        },
      ],
    },
  },
  {
    page: PageKey.ABOUT,
    key: "referenceDomains",
    order: 6,
    data: {
      heading: "Ils nous ont fait confiance",
      subheading:
        "Une expertise reconnue par des acteurs publics, privés, techniques et académiques — sur des projets miniers concrets, partout en Mauritanie.",
      items: [
        {
          title: "Sables minéraux lourds",
          description:
            "Levé drone, tarière, échantillonnage, analyses et modélisation.",
        },
        {
          title: "Or et métaux de base",
          description: "Cartographie structurale, géochimie, ciblage et supervision.",
        },
        {
          title: "Matériaux industriels",
          description:
            "Calcaire, kaolin et matériaux de carrière : ciblage et sélection.",
        },
        {
          title: "Infrastructures et promotion",
          description:
            "Environnement, topographie, matériaux, benchmarking et stratégie.",
        },
      ],
      note:
        "Aperçu de nos collaborations. Les informations historiques obsolètes ont été actualisées ou exclues.",
    },
  },

  // ───────────────────────── SERVICES ─────────────────────────
  {
    page: PageKey.SERVICES,
    key: "intro",
    order: 0,
    data: {
      heading:
        "Des solutions intégrées, pensées pour chaque étape de votre projet.",
      body:
        "De l'exploration initiale à la valorisation des ressources, GeoExplorer Services vous accompagne avec la rigueur scientifique et la réactivité terrain que vos projets exigent.",
    },
  },
  {
    page: PageKey.SERVICES,
    key: "intro",
    locale: Locale.EN,
    order: 0,
    data: {
      heading: "Integrated solutions, designed for every stage of your project.",
      body:
        "From initial exploration to resource development, GeoExplorer Services supports you with the scientific rigour and field responsiveness your projects demand.",
    },
  },
  {
    page: PageKey.SERVICES,
    key: "intro",
    locale: Locale.AR,
    order: 0,
    data: {
      heading: "حلول متكاملة، مصمّمة لكل مرحلة من مراحل مشروعكم.",
      body:
        "من الاستكشاف الأولي إلى تثمين الموارد، يرافقكم GeoExplorer Services بالصرامة العلمية والاستجابة الميدانية التي تتطلبها مشاريعكم.",
    },
  },

  // ───────────────────────── CONTACT ─────────────────────────
  {
    page: PageKey.CONTACT,
    key: "hero",
    order: 0,
    data: {
      heading: "Un projet géoscientifique en tête ? Parlons-en.",
      body:
        "GeoExplorer Services, votre partenaire technique en Mauritanie — au cœur de vos projets, nous transformons la donnée de terrain en décisions solides.",
      values: ["Expertise", "Intégrité", "Innovation", "Engagement"],
    },
  },
  {
    page: PageKey.CONTACT,
    key: "formIntro",
    order: 1,
    data: {
      body:
        "Décrivez votre besoin en quelques lignes — nature du projet, localisation, échéance envisagée. Nous revenons vers vous avec un premier avis technique et les prochaines étapes.",
    },
  },
  {
    page: PageKey.CONTACT,
    key: "projectTypes",
    order: 2,
    data: {
      items: [
        "Géologie et exploration minière",
        "Ingénierie minière et études",
        "SIG et télédétection",
        "Environnement",
        "Formation et renforcement de capacités",
        "Autre",
      ],
    },
  },

  // ───────────────────────── GLOBAL ─────────────────────────
  // A starting draft built only from facts already confirmed (identity,
  // address, contact, self-hosting); no registration number or named
  // individual is invented. Editable from /admin/pages/mentions-legales
  // like every other structural section.
  {
    page: PageKey.GLOBAL,
    key: "legal",
    order: 0,
    data: {
      heading: "Mentions légales",
      intro:
        "Conformément aux dispositions en vigueur, les présentes mentions légales précisent l'identité de l'éditeur du site et les conditions d'utilisation du contenu publié.",
      sections: [
        {
          title: "Éditeur du site",
          body:
            "GeoExplorer Services — 37 Ext. F-NORD, Secteur 2, Tevragh Zeina, Nouakchott, Mauritanie. Téléphone : +222 22 00 20 04 / +222 20 28 00 00. E-mail : contact@geoexplorerservices.com. La publication du site est assurée par la direction de GeoExplorer Services.",
        },
        {
          title: "Hébergement",
          body:
            "Le site est hébergé et exploité par GeoExplorer Services sur une infrastructure propre, accessible via une connexion chiffrée (TLS).",
        },
        {
          title: "Propriété intellectuelle",
          body:
            "L'ensemble des contenus publiés sur ce site — textes, études, images et éléments graphiques — est la propriété de GeoExplorer Services ou de ses partenaires, sauf mention contraire, et ne peut être reproduit sans autorisation préalable.",
        },
        {
          title: "Données personnelles",
          body:
            "Les informations transmises via le formulaire de contact sont utilisées exclusivement pour traiter votre demande et ne sont communiquées à aucun tiers. Vous pouvez demander leur consultation, leur correction ou leur suppression en écrivant à contact@geoexplorerservices.com.",
        },
        {
          title: "Cookies",
          body:
            "Ce site n'utilise pas de cookies de suivi publicitaire. Seuls les cookies strictement nécessaires à son fonctionnement (choix de la langue) peuvent être déposés.",
        },
      ],
    },
  },
];

// Seed content is French by default — a row becomes the FR row unless it
// declares its own `locale`, matching how the existing-data migration
// treated Article/News/Service. EN/AR content for most sections is still a
// translation task for the client; the Services page intro is an
// exception — its EN/AR text is confirmed client copy, so it's seeded
// alongside FR.
async function seedPageSections() {
  for (const section of pageSections) {
    const locale = section.locale ?? Locale.FR;
    await db.pageSection.upsert({
      where: { page_key_locale: { page: section.page, key: section.key, locale } },
      create: {
        page: section.page,
        key: section.key,
        locale,
        order: section.order,
        data: section.data,
      },
      update: {
        order: section.order,
        data: section.data,
      },
    });
  }
}

type ServiceTranslationSeed = { title: string; tagline: string; summary: string };
type ServiceBlockSeed = {
  title: { fr: string; en: string; ar: string };
  items: { fr: string[]; en: string[]; ar: string[] };
};

// EN/AR text below comes from client-confirmed translated copy (Fiches
// services section) — unlike the rest of pageSections/services' FR-only
// rows, this is translated copy, not a fabrication.
const services: {
  slug: string;
  order: number;
  icon: string;
  translations: { fr: ServiceTranslationSeed; en: ServiceTranslationSeed; ar: ServiceTranslationSeed };
  blocks: ServiceBlockSeed[];
}[] = [
  {
    slug: "geologie-exploration-miniere",
    order: 0,
    icon: "mountain",
    translations: {
      fr: {
        title: "Géologie et exploration minière",
        tagline: "Une donnée maîtrisée, à chaque étape du projet.",
        summary:
          "Planifier, acquérir, contrôler et interpréter : nous couvrons l'intégralité du cycle d'exploration, avec la même exigence de qualité à chaque phase.",
      },
      en: {
        title: "Geology and mining exploration",
        tagline: "Data mastered, at every stage of the project.",
        summary:
          "Plan, acquire, control and interpret: we cover the entire exploration cycle, with the same quality standard at every phase.",
      },
      ar: {
        title: "الجيولوجيا والاستكشاف التعديني",
        tagline: "بيانات محكمة، في كل مرحلة من مراحل المشروع.",
        summary:
          "التخطيط، الجمع، المراقبة والتفسير: نغطي دورة الاستكشاف بأكملها، بنفس معايير الجودة في كل مرحلة.",
      },
    },
    blocks: [
      {
        title: {
          fr: "Planification et terrain",
          en: "Planning and fieldwork",
          ar: "التخطيط والعمل الميداني",
        },
        items: {
          fr: [
            "Planification et exécution des programmes d'exploration",
            "Reconnaissance et cartographie géologique 2D/3D, échantillonnage roche, sol et sédiments",
            "Tranchées, puits, tarière et contrôle des travaux",
          ],
          en: [
            "Planning and execution of exploration programmes",
            "2D/3D geological reconnaissance and mapping, rock, soil and sediment sampling",
            "Trenching, pitting, auger drilling and works supervision",
          ],
          ar: [
            "تخطيط وتنفيذ برامج الاستكشاف",
            "الاستطلاع ورسم الخرائط الجيولوجية ثنائية وثلاثية الأبعاد، أخذ عينات من الصخور والتربة والرواسب",
            "الخنادق، الآبار، الحفر بالمثقاب ومراقبة الأشغال",
          ],
        },
      },
      {
        title: {
          fr: "Données géoscientifiques",
          en: "Geoscience data",
          ar: "البيانات الجيولوجية",
        },
        items: {
          fr: [
            "Compilation de données géologiques, géochimiques et géophysiques",
            "Création et gestion de géodatabases SIG",
            "Acquisition, traitement et interprétation des données",
          ],
          en: [
            "Compilation of geological, geochemical and geophysical data",
            "Creation and management of GIS geodatabases",
            "Data acquisition, processing and interpretation",
          ],
          ar: [
            "تجميع البيانات الجيولوجية والجيوكيميائية والجيوفيزيائية",
            "إنشاء وإدارة قواعد بيانات جغرافية (SIG)",
            "جمع البيانات ومعالجتها وتفسيرها",
          ],
        },
      },
      {
        title: {
          fr: "Forages et contrôle qualité (QA/QC)",
          en: "Drilling and quality control (QA/QC)",
          ar: "الحفر ومراقبة الجودة (QA/QC)",
        },
        items: {
          fr: [
            "Contrôle et supervision des forages RC et DD",
            "Description lithologique et structurale des forages",
            "Évaluation des procédures, traçabilité et contrôle QA/QC — pour une donnée sur laquelle vous pouvez bâtir vos décisions",
          ],
          en: [
            "Control and supervision of RC and DD drilling",
            "Lithological and structural logging of drill holes",
            "Evaluation of procedures, traceability and QA/QC control — for data you can build your decisions on",
          ],
          ar: [
            "مراقبة والإشراف على الحفر بطريقتي RC وDD",
            "الوصف الليثولوجي والبنيوي لسبر الآبار",
            "تقييم الإجراءات، التتبع ومراقبة الجودة (QA/QC) — لبيانات يمكنكم بناء قراراتكم عليها",
          ],
        },
      },
      {
        title: {
          fr: "Modélisation et évaluation",
          en: "Modelling and evaluation",
          ar: "النمذجة والتقييم",
        },
        items: {
          fr: [
            "Modélisation géologique et estimation des ressources",
            "Ciblage et hiérarchisation des zones prospectives",
            "Rapports techniques et recommandations opérationnelles claires",
          ],
          en: [
            "Geological modelling and resource estimation",
            "Targeting and prioritisation of prospective zones",
            "Technical reports and clear operational recommendations",
          ],
          ar: [
            "النمذجة الجيولوجية وتقدير الموارد",
            "تحديد وترتيب أولويات المناطق الواعدة",
            "تقارير تقنية وتوصيات عملياتية واضحة",
          ],
        },
      },
    ],
  },
  {
    slug: "ingenierie-miniere-etudes",
    order: 1,
    icon: "settings",
    translations: {
      fr: {
        title: "Ingénierie minière et études",
        tagline: "De l'idée au projet viable.",
        summary:
          "Des études qui transforment un gisement en projet bancable, et un projet en exploitation performante.",
      },
      en: {
        title: "Mining engineering and studies",
        tagline: "From idea to viable project.",
        summary:
          "Studies that turn a deposit into a bankable project, and a project into a high-performing operation.",
      },
      ar: {
        title: "الهندسة التعدينية والدراسات",
        tagline: "من الفكرة إلى المشروع القابل للتحقيق.",
        summary:
          "دراسات تحوّل الرواسب إلى مشروع قابل للتمويل، والمشروع إلى استغلال عالي الأداء.",
      },
    },
    blocks: [
      {
        title: {
          fr: "Études minières",
          en: "Mining studies",
          ar: "الدراسات التعدينية",
        },
        items: {
          fr: [
            "Évaluation technique et due diligence",
            "Pré-faisabilité et faisabilité technico-économique",
            "Planification, optimisation et analyse de scénarios",
            "Appui aux standards internationaux JORC et NI 43-101",
            "Cartographie géologique",
          ],
          en: [
            "Technical assessment and due diligence",
            "Technical-economic pre-feasibility and feasibility studies",
            "Planning, optimisation and scenario analysis",
            "Support with JORC and NI 43-101 international standards",
            "Geological mapping",
          ],
          ar: [
            "التقييم التقني والفحص النافي للجهالة (Due Diligence)",
            "دراسات الجدوى الأولية والجدوى التقنية الاقتصادية",
            "التخطيط والتحسين وتحليل السيناريوهات",
            "الدعم في اعتماد المعايير الدولية JORC وNI 43-101",
            "رسم الخرائط الجيولوجية",
          ],
        },
      },
      {
        title: {
          fr: "Exploitation et assistance",
          en: "Operations and assistance",
          ar: "الاستغلال والمساعدة",
        },
        items: {
          fr: [
            "Sélection des méthodes d'exploitation les mieux adaptées",
            "Assistance technique à l'exploitation semi-industrielle et industrielle",
            "Suivi technique des opérations et production de rapports",
          ],
          en: [
            "Selection of the most suitable mining methods",
            "Technical assistance for semi-industrial and industrial operations",
            "Technical monitoring of operations and reporting",
          ],
          ar: [
            "اختيار طرق الاستغلال الأنسب",
            "المساعدة التقنية للاستغلال شبه الصناعي والصناعي",
            "المتابعة التقنية للعمليات وإعداد التقارير",
          ],
        },
      },
      {
        title: {
          fr: "Traitement et valorisation",
          en: "Processing and beneficiation",
          ar: "المعالجة والتثمين",
        },
        items: {
          fr: [
            "Appui à la définition des unités de traitement",
            "Analyse de variantes techniques et des besoins en essais",
            "Coordination avec laboratoires et spécialistes des procédés",
          ],
          en: [
            "Support in defining processing units",
            "Analysis of technical variants and testing needs",
            "Coordination with laboratories and process specialists",
          ],
          ar: [
            "الدعم في تحديد وحدات المعالجة",
            "تحليل البدائل التقنية واحتياجات الاختبارات",
            "التنسيق مع المخابر ومختصي المسارات الصناعية",
          ],
        },
      },
      {
        title: {
          fr: "Carrières et matériaux",
          en: "Quarries and materials",
          ar: "المقالع والمواد",
        },
        items: {
          fr: [
            "Reconnaissance et caractérisation des matériaux",
            "Études de carrières et appui aux infrastructures",
            "Suivi des volumes, de la stabilité et de la conformité technique",
          ],
          en: [
            "Reconnaissance and characterisation of materials",
            "Quarry studies and infrastructure support",
            "Monitoring of volumes, stability and technical compliance",
          ],
          ar: [
            "استطلاع وتوصيف المواد",
            "دراسات المقالع ودعم البنى التحتية",
            "متابعة الأحجام والاستقرار والمطابقة التقنية",
          ],
        },
      },
    ],
  },
  {
    slug: "sig-teledetection",
    order: 2,
    icon: "map",
    translations: {
      fr: {
        title: "SIG et télédétection",
        tagline: "Voir plus loin, décider plus vite.",
        summary:
          "Des données géospatiales fiables pour éclairer vos décisions, sécuriser votre conformité et gagner du temps sur le terrain.",
      },
      en: {
        title: "GIS and remote sensing",
        tagline: "See further, decide faster.",
        summary:
          "Reliable geospatial data to inform your decisions, secure your compliance and save time in the field.",
      },
      ar: {
        title: "نظم المعلومات الجغرافية والاستشعار عن بُعد",
        tagline: "رؤية أبعد، وقرار أسرع.",
        summary:
          "بيانات جغرافية مكانية موثوقة لتنوير قراراتكم وتأمين مطابقتكم وكسب الوقت في الميدان.",
      },
    },
    blocks: [
      {
        title: {
          fr: "SIG et bases de données",
          en: "GIS and databases",
          ar: "نظم المعلومات الجغرافية وقواعد البيانات",
        },
        items: {
          fr: [
            "Création, gestion, visualisation et analyse de données thématiques et spatiales",
            "Bases de données géoscientifiques et intégration multi-formats",
            "Cartographie numérique, tableaux de bord et supports d'aide à la décision",
          ],
          en: [
            "Creation, management, visualisation and analysis of thematic and spatial data",
            "Geoscience databases and multi-format integration",
            "Digital mapping, dashboards and decision-support materials",
          ],
          ar: [
            "إنشاء وإدارة وتصور وتحليل البيانات الموضوعية والمكانية",
            "قواعد بيانات جيولوجية ودمج متعدد الصيغ",
            "الخرائط الرقمية، لوحات القيادة، ووسائل دعم اتخاذ القرار",
          ],
        },
      },
      {
        title: {
          fr: "Télédétection",
          en: "Remote sensing",
          ar: "الاستشعار عن بُعد",
        },
        items: {
          fr: [
            "Traitement d'images satellites et aériennes",
            "Calcul d'indices spectraux et analyses multivariées",
            "Cartographie des altérations, structures et occupations du sol",
          ],
          en: [
            "Satellite and aerial image processing",
            "Spectral index computation and multivariate analysis",
            "Mapping of alterations, structures and land cover",
          ],
          ar: [
            "معالجة الصور الفضائية والجوية",
            "حساب المؤشرات الطيفية والتحليلات متعددة المتغيرات",
            "رسم خرائط التغيرات والبنى واستخدامات الأراضي",
          ],
        },
      },
      {
        title: {
          fr: "Drone et photogrammétrie",
          en: "Drone and photogrammetry",
          ar: "الطائرات المسيّرة والتصوير الفوتوغرامتري",
        },
        items: {
          fr: [
            "Orthophotos, modèles numériques de terrain et calcul de volumes",
            "Cartographie et inspection de sites miniers et d'infrastructures",
            "Acquisition rapide, même en zones étendues ou difficiles d'accès",
          ],
          en: [
            "Orthophotos, digital terrain models and volume calculations",
            "Mapping and inspection of mining sites and infrastructure",
            "Fast data acquisition, even in extensive or hard-to-reach areas",
          ],
          ar: [
            "الصور المتعامدة، النماذج الرقمية للتضاريس وحساب الأحجام",
            "رسم الخرائط وتفقد المواقع التعدينية والبنى التحتية",
            "جمع سريع للبيانات، حتى في المناطق الشاسعة أو الوعرة",
          ],
        },
      },
    ],
  },
  {
    slug: "environnement",
    order: 3,
    icon: "leaf",
    translations: {
      fr: {
        title: "Environnement",
        tagline: "Concilier performance minière et responsabilité environnementale.",
        summary:
          "Anticiper les exigences réglementaires et sociales, documenter les impacts réels et sécuriser la conformité de vos opérations — du permis initial à la réhabilitation du site.",
      },
      en: {
        title: "Environment",
        tagline: "Reconciling mining performance with environmental responsibility.",
        summary:
          "Anticipating regulatory and social requirements, documenting real impacts and securing the compliance of your operations — from the initial permit to site rehabilitation.",
      },
      ar: {
        title: "البيئة",
        tagline: "التوفيق بين الأداء التعديني والمسؤولية البيئية.",
        summary:
          "استباق المتطلبات التنظيمية والاجتماعية، وتوثيق الآثار الفعلية، وتأمين مطابقة عملياتكم — من الرخصة الأولية إلى إعادة تأهيل الموقع.",
      },
    },
    blocks: [
      {
        title: {
          fr: "Études et conformité environnementales",
          en: "Environmental studies and compliance",
          ar: "الدراسات والمطابقة البيئية",
        },
        items: {
          fr: [
            "NIES, EIES et plans de gestion environnementale et sociale",
            "Évaluation des impacts, sites contaminés et déchets miniers",
            "Consultation des parties prenantes et engagement du public",
            "Suivi, réhabilitation et conformité réglementaire",
          ],
          en: [
            "Environmental and social impact notices (NIES) and studies (ESIA), and environmental and social management plans",
            "Impact assessment, contaminated sites and mining waste",
            "Stakeholder consultation and public engagement",
            "Monitoring, rehabilitation and regulatory compliance",
          ],
          ar: [
            "مذكرات وتقارير التأثير البيئي والاجتماعي (NIES وEIES) وخطط الإدارة البيئية والاجتماعية",
            "تقييم الآثار، المواقع الملوثة والنفايات التعدينية",
            "استشارة أصحاب المصلحة والتواصل مع الجمهور",
            "المتابعة، إعادة التأهيل والمطابقة التنظيمية",
          ],
        },
      },
    ],
  },
  {
    slug: "formation-renforcement-capacites",
    order: 4,
    icon: "graduation-cap",
    translations: {
      fr: {
        title: "Formation et renforcement de capacités",
        tagline: "Transmettre l'expertise, renforcer vos équipes.",
        summary:
          "Des programmes pratiques, construits autour de vos besoins réels et des données de vos propres projets.",
      },
      en: {
        title: "Training and capacity building",
        tagline: "Passing on expertise, strengthening your teams.",
        summary:
          "Practical programmes, built around your real needs and the data from your own projects.",
      },
      ar: {
        title: "التكوين وتعزيز القدرات",
        tagline: "نقل الخبرة، وتعزيز فرقكم.",
        summary:
          "برامج عملية، مصممة وفق احتياجاتكم الفعلية وبيانات مشاريعكم الخاصة.",
      },
    },
    blocks: [
      {
        title: {
          fr: "Exploration minière",
          en: "Mining exploration",
          ar: "الاستكشاف التعديني",
        },
        items: {
          fr: [
            "Principes fondamentaux de l'exploration",
            "Méthodes d'échantillonnage roche, sol et sédiments",
            "Gestion des programmes de forage RC et DD",
          ],
          en: [
            "Fundamental principles of exploration",
            "Rock, soil and sediment sampling methods",
            "Management of RC and DD drilling programmes",
          ],
          ar: [
            "المبادئ الأساسية للاستكشاف",
            "طرق أخذ العينات من الصخور والتربة والرواسب",
            "إدارة برامج الحفر بطريقتي RC وDD",
          ],
        },
      },
      {
        title: {
          fr: "SIG et télédétection",
          en: "GIS and remote sensing",
          ar: "نظم المعلومات الجغرافية والاستشعار عن بُعد",
        },
        items: {
          fr: [
            "ArcGIS, QGIS et gestion de bases de données spatiales",
            "Traitement et interprétation d'images",
            "Cartographie thématique et production de livrables",
          ],
          en: [
            "ArcGIS, QGIS and spatial database management",
            "Image processing and interpretation",
            "Thematic mapping and deliverables production",
          ],
          ar: [
            "ArcGIS وQGIS وإدارة قواعد البيانات المكانية",
            "معالجة الصور وتفسيرها",
            "رسم الخرائط الموضوعية وإعداد المخرجات",
          ],
        },
      },
      {
        title: {
          fr: "Modélisation et estimation des ressources",
          en: "Modelling and resource estimation",
          ar: "النمذجة وتقدير الموارد",
        },
        items: {
          fr: [
            "Bases de la géostatistique",
            "Construction de modèles géologiques 3D",
            "Estimation des ressources et contrôle qualité",
          ],
          en: [
            "Fundamentals of geostatistics",
            "Building 3D geological models",
            "Resource estimation and quality control",
          ],
          ar: [
            "أساسيات الإحصاء الجيولوجي",
            "بناء النماذج الجيولوجية ثلاثية الأبعاد",
            "تقدير الموارد ومراقبة الجودة",
          ],
        },
      },
      {
        title: {
          fr: "Gestion de projets miniers",
          en: "Mining project management",
          ar: "إدارة المشاريع التعدينية",
        },
        items: {
          fr: [
            "Planification, suivi de mission et reporting",
            "HSE, traçabilité et QA/QC",
            "Appui à la prise de décision et transfert de compétences",
          ],
          en: [
            "Planning, mission tracking and reporting",
            "HSE, traceability and QA/QC",
            "Decision-support and skills transfer",
          ],
          ar: [
            "التخطيط، متابعة المهام وإعداد التقارير",
            "الصحة والسلامة والبيئة، التتبع ومراقبة الجودة",
            "دعم اتخاذ القرار ونقل الكفاءات",
          ],
        },
      },
      {
        title: {
          fr: "Notre pédagogie",
          en: "Our teaching approach",
          ar: "منهجيتنا التعليمية",
        },
        items: {
          fr: [
            "Cours ciblés, études de cas, démonstrations, ateliers pratiques, exercices sur données réelles et accompagnement post-formation — pour une montée en compétence durable, pas seulement théorique.",
          ],
          en: [
            "Targeted lessons, case studies, demonstrations, hands-on workshops, exercises on real data and post-training follow-up — for lasting, not merely theoretical, skills development.",
          ],
          ar: [
            "دروس مركّزة، دراسات حالة، عروض توضيحية، ورشات عمل تطبيقية، تمارين على بيانات حقيقية، ومواكبة بعد التكوين — لبناء كفاءة مستدامة لا نظرية فقط.",
          ],
        },
      },
      {
        title: {
          fr: "Pour qui",
          en: "Who it's for",
          ar: "لمن هذا التكوين",
        },
        items: {
          fr: [
            "Géologues, ingénieurs des mines, techniciens, prospecteurs, petits exploitants, cadres de sociétés minières et agents d'institutions publiques.",
          ],
          en: [
            "Geologists, mining engineers, technicians, prospectors, small-scale operators, mining company managers and public institution staff.",
          ],
          ar: [
            "الجيولوجيون، مهندسو المناجم، التقنيون، المنقّبون، صغار المستغلين، إطارات الشركات التعدينية وموظفو المؤسسات العمومية.",
          ],
        },
      },
    ],
  },
];

async function seedServices() {
  for (const service of services) {
    const record = await db.service.upsert({
      where: { slug: service.slug },
      create: { slug: service.slug, order: service.order, icon: service.icon },
      update: { order: service.order, icon: service.icon },
    });

    for (const locale of [Locale.FR, Locale.EN, Locale.AR]) {
      const t = service.translations[locale.toLowerCase() as "fr" | "en" | "ar"];
      await db.serviceTranslation.upsert({
        where: { serviceId_locale: { serviceId: record.id, locale } },
        create: {
          serviceId: record.id,
          locale,
          title: t.title,
          tagline: t.tagline,
          summary: t.summary,
        },
        update: { title: t.title, tagline: t.tagline, summary: t.summary },
      });
    }

    // No stable natural key on ServiceBlock: replace the set on every run.
    await db.$transaction([
      db.serviceBlock.deleteMany({ where: { serviceId: record.id } }),
      db.serviceBlock.createMany({
        data: service.blocks.map((block, index) => ({
          serviceId: record.id,
          title: block.title as Prisma.InputJsonValue,
          items: block.items as Prisma.InputJsonValue,
          order: index,
        })),
      }),
    ]);
  }
}

async function main() {
  await seedSiteSetting();
  await seedPageSections();
  await seedServices();
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
