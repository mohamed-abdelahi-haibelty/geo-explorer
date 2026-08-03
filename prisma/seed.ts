import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PageKey, Prisma } from "./generated/client";

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
];

async function seedPageSections() {
  for (const section of pageSections) {
    await db.pageSection.upsert({
      where: { page_key: { page: section.page, key: section.key } },
      create: {
        page: section.page,
        key: section.key,
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

const services: {
  slug: string;
  order: number;
  title: string;
  tagline: string;
  summary: string;
  icon: string;
  blocks: { title: string; items: string[] }[];
}[] = [
  {
    slug: "geologie-exploration-miniere",
    order: 0,
    title: "Géologie et exploration minière",
    tagline: "Une donnée maîtrisée, à chaque étape du projet.",
    summary:
      "Planifier, acquérir, contrôler et interpréter : nous couvrons l'intégralité du cycle d'exploration, avec la même exigence de qualité à chaque phase.",
    icon: "mountain",
    blocks: [
      {
        title: "Planification et terrain",
        items: [
          "Planification et exécution des programmes d'exploration",
          "Reconnaissance et cartographie géologique 2D/3D, échantillonnage roche, sol et sédiments",
          "Tranchées, puits, tarière et contrôle des travaux",
        ],
      },
      {
        title: "Données géoscientifiques",
        items: [
          "Compilation de données géologiques, géochimiques et géophysiques",
          "Création et gestion de géodatabases SIG",
          "Acquisition, traitement et interprétation des données",
        ],
      },
      {
        title: "Forages et contrôle qualité (QA/QC)",
        items: [
          "Contrôle et supervision des forages RC et DD",
          "Description lithologique et structurale des forages",
          "Évaluation des procédures, traçabilité et contrôle QA/QC — pour une donnée sur laquelle vous pouvez bâtir vos décisions",
        ],
      },
      {
        title: "Modélisation et évaluation",
        items: [
          "Modélisation géologique et estimation des ressources",
          "Ciblage et hiérarchisation des zones prospectives",
          "Rapports techniques et recommandations opérationnelles claires",
        ],
      },
    ],
  },
  {
    slug: "ingenierie-miniere-etudes",
    order: 1,
    title: "Ingénierie minière et études",
    tagline: "De l'idée au projet viable.",
    summary:
      "Des études qui transforment un gisement en projet bancable, et un projet en exploitation performante.",
    icon: "settings",
    blocks: [
      {
        title: "Études minières",
        items: [
          "Évaluation technique et due diligence",
          "Pré-faisabilité et faisabilité technico-économique",
          "Planification, optimisation et analyse de scénarios",
          "Appui aux standards internationaux JORC et NI 43-101",
          "Cartographie géologique",
        ],
      },
      {
        title: "Exploitation et assistance",
        items: [
          "Sélection des méthodes d'exploitation les mieux adaptées",
          "Assistance technique à l'exploitation semi-industrielle et industrielle",
          "Suivi technique des opérations et production de rapports",
        ],
      },
      {
        title: "Traitement et valorisation",
        items: [
          "Appui à la définition des unités de traitement",
          "Analyse de variantes techniques et des besoins en essais",
          "Coordination avec laboratoires et spécialistes des procédés",
        ],
      },
      {
        title: "Carrières et matériaux",
        items: [
          "Reconnaissance et caractérisation des matériaux",
          "Études de carrières et appui aux infrastructures",
          "Suivi des volumes, de la stabilité et de la conformité technique",
        ],
      },
    ],
  },
  {
    slug: "sig-teledetection",
    order: 2,
    title: "SIG et télédétection",
    tagline: "Voir plus loin, décider plus vite.",
    summary:
      "Des données géospatiales fiables pour éclairer vos décisions, sécuriser votre conformité et gagner du temps sur le terrain.",
    icon: "map",
    blocks: [
      {
        title: "SIG et bases de données",
        items: [
          "Création, gestion, visualisation et analyse de données thématiques et spatiales",
          "Bases de données géoscientifiques et intégration multi-formats",
          "Cartographie numérique, tableaux de bord et supports d'aide à la décision",
        ],
      },
      {
        title: "Télédétection",
        items: [
          "Traitement d'images satellites et aériennes",
          "Calcul d'indices spectraux et analyses multivariées",
          "Cartographie des altérations, structures et occupations du sol",
        ],
      },
      {
        title: "Drone et photogrammétrie",
        items: [
          "Orthophotos, modèles numériques de terrain et calcul de volumes",
          "Cartographie et inspection de sites miniers et d'infrastructures",
          "Acquisition rapide, même en zones étendues ou difficiles d'accès",
        ],
      },
    ],
  },
  {
    slug: "environnement",
    order: 3,
    title: "Environnement",
    tagline: "Concilier performance minière et responsabilité environnementale.",
    summary:
      "Anticiper les exigences réglementaires et sociales, documenter les impacts réels et sécuriser la conformité de vos opérations — du permis initial à la réhabilitation du site.",
    icon: "leaf",
    blocks: [
      {
        title: "Études et conformité environnementales",
        items: [
          "NIES, EIES et plans de gestion environnementale et sociale",
          "Évaluation des impacts, sites contaminés et déchets miniers",
          "Consultation des parties prenantes et engagement du public",
          "Suivi, réhabilitation et conformité réglementaire",
        ],
      },
    ],
  },
  {
    slug: "formation-renforcement-capacites",
    order: 4,
    title: "Formation et renforcement de capacités",
    tagline: "Transmettre l'expertise, renforcer vos équipes.",
    summary:
      "Des programmes pratiques, construits autour de vos besoins réels et des données de vos propres projets.",
    icon: "graduation-cap",
    blocks: [
      {
        title: "Exploration minière",
        items: [
          "Principes fondamentaux de l'exploration",
          "Méthodes d'échantillonnage roche, sol et sédiments",
          "Gestion des programmes de forage RC et DD",
        ],
      },
      {
        title: "SIG et télédétection",
        items: [
          "ArcGIS, QGIS et gestion de bases de données spatiales",
          "Traitement et interprétation d'images",
          "Cartographie thématique et production de livrables",
        ],
      },
      {
        title: "Modélisation et estimation des ressources",
        items: [
          "Bases de la géostatistique",
          "Construction de modèles géologiques 3D",
          "Estimation des ressources et contrôle qualité",
        ],
      },
      {
        title: "Gestion de projets miniers",
        items: [
          "Planification, suivi de mission et reporting",
          "HSE, traçabilité et QA/QC",
          "Appui à la prise de décision et transfert de compétences",
        ],
      },
      {
        title: "Notre pédagogie",
        items: [
          "Cours ciblés, études de cas, démonstrations, ateliers pratiques, exercices sur données réelles et accompagnement post-formation — pour une montée en compétence durable, pas seulement théorique.",
        ],
      },
      {
        title: "Pour qui",
        items: [
          "Géologues, ingénieurs des mines, techniciens, prospecteurs, petits exploitants, cadres de sociétés minières et agents d'institutions publiques.",
        ],
      },
    ],
  },
];

async function seedServices() {
  for (const service of services) {
    const record = await db.service.upsert({
      where: { slug: service.slug },
      create: {
        slug: service.slug,
        order: service.order,
        title: service.title,
        tagline: service.tagline,
        summary: service.summary,
        icon: service.icon,
      },
      update: {
        order: service.order,
        title: service.title,
        tagline: service.tagline,
        summary: service.summary,
        icon: service.icon,
      },
    });

    // No stable natural key on ServiceBlock: replace the set on every run.
    await db.$transaction([
      db.serviceBlock.deleteMany({ where: { serviceId: record.id } }),
      db.serviceBlock.createMany({
        data: service.blocks.map((block, index) => ({
          serviceId: record.id,
          title: block.title,
          items: block.items,
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
