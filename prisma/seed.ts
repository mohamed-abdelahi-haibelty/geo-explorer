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
  // EN/AR rows below are machine-translated placeholders, not client-
  // confirmed copy (unlike the SERVICES/intro and services translations
  // further down) — replace with real client-reviewed translations before
  // this is treated as production content.
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
    key: "hero",
    locale: Locale.EN,
    order: 0,
    data: {
      title: "Revealing the subsurface's potential. Securing your decisions.",
      subtitle:
        "GeoExplorer Services supports mining sector stakeholders in Mauritania at every stage — from exploration to the sustainable development of resources.",
      ctaLabel: "Let's discuss your project",
      ctaHref: "/contact",
    },
  },
  {
    page: PageKey.HOME,
    key: "hero",
    locale: Locale.AR,
    order: 0,
    data: {
      title: "الكشف عن إمكانات باطن الأرض. تأمين قراراتكم.",
      subtitle:
        "يرافق GeoExplorer Services الفاعلين في القطاع المنجمي في موريتانيا في كل مرحلة — من الاستكشاف إلى التثمين المستدام للموارد.",
      ctaLabel: "لنتحدث عن مشروعكم",
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
    key: "values",
    locale: Locale.EN,
    order: 1,
    data: {
      items: [
        {
          label: "Expertise",
          description:
            "Comprehensive geoscience skills, proven on the ground in Mauritania.",
        },
        {
          label: "Integrity",
          description:
            "Traceable data and conclusions that say what the results actually show.",
        },
        {
          label: "Innovation",
          description:
            "Drones, remote sensing and modelling in the service of better-informed decisions.",
        },
        {
          label: "Commitment",
          description:
            "Continuous support, from initial scoping through to the final decision.",
        },
      ],
    },
  },
  {
    page: PageKey.HOME,
    key: "values",
    locale: Locale.AR,
    order: 1,
    data: {
      items: [
        {
          label: "الخبرة",
          description: "كفاءات جيولوجية شاملة، مُثبتة ميدانياً في موريتانيا.",
        },
        {
          label: "النزاهة",
          description:
            "بيانات قابلة للتتبع واستنتاجات تعكس ما تُظهره النتائج فعلاً.",
        },
        {
          label: "الابتكار",
          description:
            "طائرات مسيّرة واستشعار عن بعد ونمذجة في خدمة قرارات أكثر استنارة.",
        },
        {
          label: "الالتزام",
          description:
            "مواكبة مستمرة، من التأطير الأولي إلى اتخاذ القرار النهائي.",
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
    key: "whoWeAre",
    locale: Locale.EN,
    order: 2,
    data: {
      heading: "Who we are",
      lead: "Mauritania's reference geoscience partner, since 2008.",
      body: "Since 2008, GeoExplorer Services has been turning field data into solid technical decisions for mining operators, public institutions and investors. Our team of qualified experts covers the full cycle of a geoscience project — exploration, mapping, GIS, project management, technical-economic and environmental studies — to deliver reliable, innovative and tailored solutions.",
      linkLabel: "Learn more",
      linkHref: "/a-propos",
    },
  },
  {
    page: PageKey.HOME,
    key: "whoWeAre",
    locale: Locale.AR,
    order: 2,
    data: {
      heading: "من نحن",
      lead: "الشريك المرجعي في علوم الأرض في موريتانيا، منذ عام 2008.",
      body: "منذ عام 2008، يحوّل GeoExplorer Services بيانات الميدان إلى قرارات تقنية متينة لفائدة المشغّلين المنجميين والمؤسسات العمومية والمستثمرين. يتحكّم فريقنا من الخبراء المؤهلين في كامل دورة المشروع الجيولوجي — الاستكشاف، رسم الخرائط، نظم المعلومات الجغرافية، إدارة المشاريع، الدراسات التقنية الاقتصادية والبيئية — لتقديم حلول موثوقة ومبتكرة ومصمّمة خصيصاً لاحتياجاتكم.",
      linkLabel: "اعرف المزيد",
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
    key: "expertiseTeaser",
    locale: Locale.EN,
    order: 3,
    data: {
      heading: "What we do",
      intro: "Five areas of expertise, one shared standard: rigour.",
    },
  },
  {
    page: PageKey.HOME,
    key: "expertiseTeaser",
    locale: Locale.AR,
    order: 3,
    data: {
      heading: "ما الذي نقوم به",
      intro: "خمس مجالات خبرة، ومطلب واحد: الصرامة العلمية.",
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
    key: "strengths",
    locale: Locale.EN,
    order: 4,
    data: {
      heading: "Why GeoExplorer",
      items: [
        {
          title: "Proven expertise",
          description:
            "Geology, geophysics, geochemistry, hydrogeology, geotechnics, GIS and environment, brought together in a single team.",
        },
        {
          title: "An intimate knowledge of the terrain",
          description:
            "A fine-grained command of Mauritania's geological, mining and logistical realities, built project after project.",
        },
        {
          title: "State-of-the-art technology",
          description:
            "Drones, photogrammetry, geophysical and geochemical equipment, advanced modelling.",
        },
        {
          title: "A strong network",
          description:
            "Established coordination with administrations, laboratories, consultants and service providers, to anticipate procedures rather than be slowed down by them.",
        },
      ],
    },
  },
  {
    page: PageKey.HOME,
    key: "strengths",
    locale: Locale.AR,
    order: 4,
    data: {
      heading: "لماذا GeoExplorer",
      items: [
        {
          title: "خبرة مثبتة",
          description:
            "جيولوجيا، جيوفيزياء، جيوكيمياء، هيدروجيولوجيا، جيوتقنية، نظم معلومات جغرافية وبيئة، ضمن فريق واحد.",
        },
        {
          title: "معرفة دقيقة بالميدان",
          description:
            "إتقان دقيق للواقع الجيولوجي والمنجمي واللوجستي الموريتاني، مكتسب مشروعاً تلو الآخر.",
        },
        {
          title: "تقنية متطورة",
          description:
            "طائرات مسيّرة، تصوير فوتوغرامتري، معدات جيوفيزيائية وجيوكيميائية، نمذجة متقدمة.",
        },
        {
          title: "شبكة علاقات متينة",
          description:
            "تنسيق راسخ مع الإدارات والمخابر والاستشاريين ومقدّمي الخدمات، لاستباق الإجراءات بدل التعامل معها كعائق.",
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
    key: "partnersTeaser",
    locale: Locale.EN,
    order: 5,
    data: {
      heading: "They trust us",
      subheading:
        "Expertise recognised by public, private, technical and academic stakeholders — on concrete mining projects, across Mauritania.",
      note:
        "An overview of our collaborations. Outdated historical information has been updated or excluded.",
    },
  },
  {
    page: PageKey.HOME,
    key: "partnersTeaser",
    locale: Locale.AR,
    order: 5,
    data: {
      heading: "يثقون بنا",
      subheading:
        "خبرة معترف بها من قِبل فاعلين عموميين وخواص وتقنيين وأكاديميين — في مشاريع منجمية ملموسة، في مختلف أنحاء موريتانيا.",
      note:
        "لمحة عن تعاوننا. تم تحديث أو استبعاد المعلومات التاريخية غير المحدّثة.",
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
  {
    page: PageKey.HOME,
    key: "closingBanner",
    locale: Locale.EN,
    order: 6,
    data: {
      quote:
        "Exploring the ground and subsurface. Revealing their wealth. Developing their potential.",
    },
  },
  {
    page: PageKey.HOME,
    key: "closingBanner",
    locale: Locale.AR,
    order: 6,
    data: {
      quote: "استكشاف سطح الأرض وباطنها. الكشف عن ثرواتهما. تثمين إمكاناتهما.",
    },
  },

  // ───────────────────────── ABOUT ─────────────────────────
  // EN/AR rows below are machine-translated placeholders, not client-
  // confirmed copy — see the note above the HOME section.
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
    key: "intro",
    locale: Locale.EN,
    order: 0,
    data: {
      heading:
        "A Mauritanian firm, one ambition: advancing the mining sector through scientific rigour.",
      subheading: "Our story",
      body: [
        "Since 2008, GeoExplorer Services has supported public and private organisations, mining operators and investors at every stage of their projects — from initial planning through to the final interpretation of data. This experience has been built project after project, alongside public, private, technical and academic stakeholders.",
        "Today, our team of qualified experts puts that know-how to work for our clients across mineral exploration, geological mapping, GIS, project management, technical-economic and environmental studies, consulting, technical assistance and training. One ambition: reliable, innovative solutions, designed around the real needs of each project.",
      ],
    },
  },
  {
    page: PageKey.ABOUT,
    key: "intro",
    locale: Locale.AR,
    order: 0,
    data: {
      heading:
        "مكتب موريتاني، وطموح واحد: النهوض بالقطاع المنجمي عبر الصرامة العلمية.",
      subheading: "قصتنا",
      body: [
        "منذ عام 2008، يرافق GeoExplorer Services الهياكل العمومية والخاصة والمشغّلين المنجميين والمستثمرين في كل مرحلة من مراحل مشاريعهم — من التخطيط الأولي إلى التفسير النهائي للبيانات. تشكّلت هذه الخبرة مشروعاً تلو الآخر، إلى جانب فاعلين عموميين وخواص وتقنيين وأكاديميين.",
        "اليوم، يضع فريقنا من الخبراء المؤهلين هذه الدراية في خدمة عملائنا في مجالات الاستكشاف المنجمي، رسم الخرائط الجيولوجية، نظم المعلومات الجغرافية، إدارة المشاريع، الدراسات التقنية الاقتصادية والبيئية، الاستشارة، المساعدة التقنية والتكوين. طموح واحد: حلول موثوقة ومبتكرة، مصمَّمة وفق الاحتياجات الفعلية لكل مشروع.",
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
    key: "mission",
    locale: Locale.EN,
    order: 1,
    data: {
      heading: "Our mission",
      body:
        "To advance the mining sector alongside public and private operators — by reducing technical risk, strengthening the quality of decisions, and securing investments.",
    },
  },
  {
    page: PageKey.ABOUT,
    key: "mission",
    locale: Locale.AR,
    order: 1,
    data: {
      heading: "مهمتنا",
      body:
        "النهوض بالقطاع المنجمي إلى جانب المشغّلين العموميين والخواص — عبر الحدّ من المخاطر التقنية، وتعزيز جودة القرارات، وتأمين الاستثمارات.",
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
    key: "vision",
    locale: Locale.EN,
    order: 2,
    data: {
      heading: "Our vision",
      body:
        "To anticipate emerging challenges in mineral resources and build sustainable strategies, grounded in knowledge, data rigour and respect for the environment.",
    },
  },
  {
    page: PageKey.ABOUT,
    key: "vision",
    locale: Locale.AR,
    order: 2,
    data: {
      heading: "رؤيتنا",
      body:
        "استباق التحديات الجديدة المرتبطة بالموارد المعدنية، وبناء استراتيجيات مستدامة، قائمة على المعرفة ودقة البيانات واحترام البيئة.",
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
    key: "strengths",
    locale: Locale.EN,
    order: 3,
    data: {
      heading: "What sets us apart",
      items: [
        {
          title: "Complete expertise, under one roof",
          description:
            "Geology, exploration, GIS, geophysics, geochemistry, environment, hydrogeology, geotechnics, consulting, assistance and administrative follow-up — every skill your project needs, brought together in a single team.",
        },
        {
          title: "Field knowledge that makes the difference",
          description:
            "A fine-grained command of Mauritania's own geological, mining and logistical contexts — a decisive asset in anticipating real conditions on the ground.",
        },
        {
          title: "Tools equal to the challenge",
          description:
            "Drones, photogrammetry, state-of-the-art geophysical and geochemical equipment, spatial databases, modelling and specialised software.",
        },
        {
          title: "A network that speeds up your projects",
          description:
            "Smooth coordination with administrations, laboratories, consultants and service providers: permits prepared ahead of time and deadlines kept.",
        },
      ],
    },
  },
  {
    page: PageKey.ABOUT,
    key: "strengths",
    locale: Locale.AR,
    order: 3,
    data: {
      heading: "ما يميّزنا",
      items: [
        {
          title: "خبرة شاملة تحت سقف واحد",
          description:
            "جيولوجيا، استكشاف، نظم معلومات جغرافية، جيوفيزياء، جيوكيمياء، بيئة، هيدروجيولوجيا، جيوتقنية، استشارة، مساعدة ومتابعة إدارية — كل الكفاءات التي يحتاجها مشروعكم، مجتمعة ضمن فريق واحد.",
        },
        {
          title: "معرفة ميدانية تصنع الفرق",
          description:
            "إتقان دقيق للسياقات الجيولوجية والمنجمية واللوجستية الخاصة بموريتانيا — ميزة حاسمة لاستباق الإكراهات الفعلية للميدان.",
        },
        {
          title: "أدوات في مستوى التحديات",
          description:
            "طائرات مسيّرة، تصوير فوتوغرامتري، معدات جيوفيزيائية وجيوكيميائية متطورة، قواعد بيانات مكانية، نمذجة وبرمجيات متخصصة.",
        },
        {
          title: "شبكة علاقات تُسرّع مشاريعكم",
          description:
            "تنسيق سلس مع الإدارات والمخابر والاستشاريين ومقدّمي الخدمات: تراخيص مُعدّة سلفاً وآجال محترمة.",
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
    key: "team",
    locale: Locale.EN,
    order: 4,
    data: {
      heading: "A team shaped around you",
      body:
        "GeoExplorer Services mobilises geologists, geomatics specialists, environmental experts, exploration specialists and associate consultants, according to the precise needs of each assignment. This flexible structure makes it possible to combine local and international skills, in French, Arabic and English — the three languages of your contacts, from the field to the administration.",
    },
  },
  {
    page: PageKey.ABOUT,
    key: "team",
    locale: Locale.AR,
    order: 4,
    data: {
      heading: "فريق على مقاسكم",
      body:
        "يعبّئ GeoExplorer Services جيولوجيين، متخصصين في المعلوماتية الجغرافية، خبراء بيئة، متخصصين في الاستكشاف واستشاريين شركاء، حسب الاحتياجات الدقيقة لكل مهمة. يتيح هذا التنظيم المرن الجمع بين الكفاءات المحلية والدولية، باللغات الفرنسية والعربية والإنجليزية — اللغات الثلاث لمخاطبيكم، من الميدان إلى الإدارة.",
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
    key: "approach",
    locale: Locale.EN,
    order: 5,
    data: {
      heading: "Our method: an integrated approach, from need to decision",
      intro:
        "Every assignment follows a clear thread, from understanding the need to delivering actionable results:",
      steps: [
        { number: 1, title: "Scoping", description: "understanding your objectives" },
        {
          number: 2,
          title: "Acquisition",
          description: "collecting data in the field",
        },
        {
          number: 3,
          title: "QA/QC",
          description: "guaranteeing the reliability of every data point",
        },
        {
          number: 4,
          title: "Interpretation",
          description: "making sense of the results",
        },
        {
          number: 5,
          title: "Decision",
          description: "giving you a solid basis for action",
        },
      ],
    },
  },
  {
    page: PageKey.ABOUT,
    key: "approach",
    locale: Locale.AR,
    order: 5,
    data: {
      heading: "منهجيتنا: مقاربة متكاملة، من الحاجة إلى القرار",
      intro:
        "تتبع كل مهمة مساراً واضحاً، من فهم الحاجة إلى تسليم نتائج قابلة للاستثمار:",
      steps: [
        { number: 1, title: "التأطير", description: "فهم أهدافكم" },
        {
          number: 2,
          title: "الاستحصال",
          description: "جمع البيانات ميدانياً",
        },
        {
          number: 3,
          title: "ضمان ومراقبة الجودة",
          description: "ضمان موثوقية كل معطى",
        },
        {
          number: 4,
          title: "التفسير",
          description: "إعطاء معنى للنتائج",
        },
        {
          number: 5,
          title: "القرار",
          description: "تزويدكم بأسس متينة لاتخاذ القرار",
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
  {
    page: PageKey.ABOUT,
    key: "referenceDomains",
    locale: Locale.EN,
    order: 6,
    data: {
      heading: "They have trusted us",
      subheading:
        "Expertise recognised by public, private, technical and academic stakeholders — on concrete mining projects, across Mauritania.",
      items: [
        {
          title: "Heavy mineral sands",
          description:
            "Drone survey, auger drilling, sampling, analysis and modelling.",
        },
        {
          title: "Gold and base metals",
          description: "Structural mapping, geochemistry, targeting and supervision.",
        },
        {
          title: "Industrial materials",
          description:
            "Limestone, kaolin and quarry materials: targeting and selection.",
        },
        {
          title: "Infrastructure and promotion",
          description:
            "Environment, topography, materials, benchmarking and strategy.",
        },
      ],
      note:
        "An overview of our collaborations. Outdated historical information has been updated or excluded.",
    },
  },
  {
    page: PageKey.ABOUT,
    key: "referenceDomains",
    locale: Locale.AR,
    order: 6,
    data: {
      heading: "وثقوا بنا",
      subheading:
        "خبرة معترف بها من قِبل فاعلين عموميين وخواص وتقنيين وأكاديميين — في مشاريع منجمية ملموسة، في مختلف أنحاء موريتانيا.",
      items: [
        {
          title: "الرمال المعدنية الثقيلة",
          description:
            "مسح بالطائرات المسيّرة، حفر بالمثقاب، أخذ عينات، تحاليل ونمذجة.",
        },
        {
          title: "الذهب والمعادن الأساسية",
          description: "رسم الخرائط البنيوية، الجيوكيمياء، الاستهداف والإشراف.",
        },
        {
          title: "المواد الصناعية",
          description:
            "الحجر الجيري، الكاولين ومواد المقالع: الاستهداف والانتقاء.",
        },
        {
          title: "البنية التحتية والترويج",
          description:
            "البيئة، الطبوغرافيا، المواد، المقارنة المرجعية والاستراتيجية.",
        },
      ],
      note:
        "لمحة عن تعاوننا. تم تحديث أو استبعاد المعلومات التاريخية غير المحدّثة.",
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
  // EN/AR rows below are machine-translated placeholders, not client-
  // confirmed copy — see the note above the HOME section.
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
    key: "hero",
    locale: Locale.EN,
    order: 0,
    data: {
      heading: "Have a geoscience project in mind? Let's talk.",
      body:
        "GeoExplorer Services, your technical partner in Mauritania — at the heart of your projects, we turn field data into solid decisions.",
      values: ["Expertise", "Integrity", "Innovation", "Commitment"],
    },
  },
  {
    page: PageKey.CONTACT,
    key: "hero",
    locale: Locale.AR,
    order: 0,
    data: {
      heading: "لديكم مشروع جيولوجي؟ لنتحدث عنه.",
      body:
        "GeoExplorer Services، شريككم التقني في موريتانيا — في صميم مشاريعكم، نحوّل بيانات الميدان إلى قرارات متينة.",
      values: ["الخبرة", "النزاهة", "الابتكار", "الالتزام"],
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
    key: "formIntro",
    locale: Locale.EN,
    order: 1,
    data: {
      body:
        "Describe your need in a few lines — the nature of the project, its location, the timeline you have in mind. We'll get back to you with an initial technical opinion and the next steps.",
    },
  },
  {
    page: PageKey.CONTACT,
    key: "formIntro",
    locale: Locale.AR,
    order: 1,
    data: {
      body:
        "صفوا احتياجكم في بضعة أسطر — طبيعة المشروع، موقعه، والأجل المتوقع. سنعاود الاتصال بكم برأي تقني أولي وبالخطوات المقبلة.",
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
  {
    page: PageKey.CONTACT,
    key: "projectTypes",
    locale: Locale.EN,
    order: 2,
    data: {
      items: [
        "Geology and mineral exploration",
        "Mining engineering and studies",
        "GIS and remote sensing",
        "Environment",
        "Training and capacity building",
        "Other",
      ],
    },
  },
  {
    page: PageKey.CONTACT,
    key: "projectTypes",
    locale: Locale.AR,
    order: 2,
    data: {
      items: [
        "الجيولوجيا والاستكشاف المنجمي",
        "الهندسة المنجمية والدراسات",
        "نظم المعلومات الجغرافية والاستشعار عن بعد",
        "البيئة",
        "التكوين وتعزيز القدرات",
        "أخرى",
      ],
    },
  },

  // ───────────────────────── GLOBAL ─────────────────────────
  // A starting draft built only from facts already confirmed (identity,
  // address, contact, self-hosting); no registration number or named
  // individual is invented. Editable from /admin/pages/mentions-legales
  // like every other structural section. EN/AR rows are machine-translated
  // placeholders, not client-confirmed copy — see the note above HOME.
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
  {
    page: PageKey.GLOBAL,
    key: "legal",
    locale: Locale.EN,
    order: 0,
    data: {
      heading: "Legal notice",
      intro:
        "In accordance with applicable regulations, this legal notice sets out the identity of the site's publisher and the terms of use of the published content.",
      sections: [
        {
          title: "Site publisher",
          body:
            "GeoExplorer Services — 37 Ext. F-NORD, Secteur 2, Tevragh Zeina, Nouakchott, Mauritania. Phone: +222 22 00 20 04 / +222 20 28 00 00. Email: contact@geoexplorerservices.com. Publication of the site is overseen by GeoExplorer Services management.",
        },
        {
          title: "Hosting",
          body:
            "The site is hosted and operated by GeoExplorer Services on its own infrastructure, accessible over an encrypted (TLS) connection.",
        },
        {
          title: "Intellectual property",
          body:
            "All content published on this site — text, studies, images and graphic elements — is the property of GeoExplorer Services or its partners, unless otherwise stated, and may not be reproduced without prior authorisation.",
        },
        {
          title: "Personal data",
          body:
            "Information submitted via the contact form is used exclusively to process your request and is not shared with any third party. You may request to access, correct or delete it by writing to contact@geoexplorerservices.com.",
        },
        {
          title: "Cookies",
          body:
            "This site does not use advertising tracking cookies. Only cookies strictly necessary for its operation (language preference) may be set.",
        },
      ],
    },
  },
  {
    page: PageKey.GLOBAL,
    key: "legal",
    locale: Locale.AR,
    order: 0,
    data: {
      heading: "الإشعار القانوني",
      intro:
        "وفقاً للأحكام المعمول بها، يوضّح هذا الإشعار القانوني هوية ناشر الموقع وشروط استخدام المحتوى المنشور.",
      sections: [
        {
          title: "ناشر الموقع",
          body:
            "GeoExplorer Services — 37 Ext. F-NORD، القطاع 2، تفرغ زينة، نواكشوط، موريتانيا. الهاتف: 20 00 22 22 222+ / 00 00 28 20 222+. البريد الإلكتروني: contact@geoexplorerservices.com. تتولى إدارة GeoExplorer Services نشر الموقع.",
        },
        {
          title: "الاستضافة",
          body:
            "يُستضاف الموقع ويُشغَّل من طرف GeoExplorer Services على بنية تحتية خاصة بها، يمكن الوصول إليها عبر اتصال مشفّر (TLS).",
        },
        {
          title: "الملكية الفكرية",
          body:
            "جميع المحتويات المنشورة على هذا الموقع — نصوص، دراسات، صور وعناصر رسومية — هي ملك لـ GeoExplorer Services أو لشركائها، ما لم يُذكر خلاف ذلك، ولا يجوز إعادة إنتاجها دون إذن مسبق.",
        },
        {
          title: "المعطيات الشخصية",
          body:
            "تُستخدم المعلومات المرسلة عبر استمارة الاتصال حصراً لمعالجة طلبكم ولا يتم إطلاع أي طرف ثالث عليها. يمكنكم طلب الاطلاع عليها أو تصحيحها أو حذفها بمراسلتنا على contact@geoexplorerservices.com.",
        },
        {
          title: "ملفات تعريف الارتباط",
          body:
            "لا يستخدم هذا الموقع ملفات تعريف ارتباط (كوكيز) لأغراض التتبّع الإعلاني. يمكن فقط استخدام الملفات الضرورية بشكل صارم لتشغيله (اختيار اللغة).",
        },
      ],
    },
  },
];

// Seed content is French by default — a row becomes the FR row unless it
// declares its own `locale`, matching how the existing-data migration
// treated Article/News/Service. Only the Services page intro's EN/AR text
// is confirmed client copy; every other section's EN/AR rows are
// machine-translated placeholders pending client review — swap them via
// the admin back-office or update this file once real translations land.
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
