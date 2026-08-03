import { getSiteSetting } from "@/server/queries/settings";

export default async function Home() {
  const settings = await getSiteSetting();

  return (
    <main>
      <h1>{settings?.companyName ?? "GeoExplorer Services"}</h1>
    </main>
  );
}
