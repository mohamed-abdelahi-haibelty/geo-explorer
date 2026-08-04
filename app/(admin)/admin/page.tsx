import { getDashboardCounts } from "@/server/queries/dashboard";

export default async function AdminDashboardPage() {
  const counts = await getDashboardCounts();

  const stats = [
    { label: "Articles publiés", value: counts.publishedArticles },
    { label: "Articles en brouillon", value: counts.draftArticles },
    { label: "Actualités", value: counts.newsCount },
    { label: "Messages non lus", value: counts.unreadMessages },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl text-foreground">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble du contenu et de l&apos;activité du site.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1.5 bg-background p-5">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="font-mono text-3xl font-medium tabular-nums text-foreground">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
