// Liveness only — Dockerfile's HEALTHCHECK just needs to know the Node
// process is up and serving, not that Postgres/Redis are reachable (a
// transient DB blip shouldn't make Docker restart an otherwise-healthy
// container).
export async function GET() {
  return Response.json({ status: "ok" });
}
