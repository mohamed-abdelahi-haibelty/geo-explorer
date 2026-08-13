import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// `next build` runs every "use cache" query once per static param while
// generating pages, and reproducibly hung indefinitely (confirmed via
// `lsof`/`sample`: an idle process, 0% CPU, stuck mid-request against
// Upstash's REST API for minutes, while a plain `curl` to the same
// endpoint succeeded in under half a second — a build-time Node/undici
// networking quirk in this environment, not a slow or unreachable
// Upstash). Gating this on `NEXT_PHASE` was tried first and did NOT
// work — that variable isn't reliably `phase-production-build` yet at the
// point `next.config.ts` is evaluated, reproduced with the exact same
// hang. An explicit opt-in env var sidesteps any framework-internal timing
// question entirely: `ENABLE_UPSTASH_CACHE_HANDLER` is set only in the
// Dockerfile's `runner` stage (never during any build, never in local dev),
// so this handler can only ever be active once the app is actually serving
// traffic — which is also the only place restart/multi-replica cache
// persistence actually matters.
const useUpstashCacheHandler =
  process.env.ENABLE_UPSTASH_CACHE_HANDLER === "1" &&
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  staticPageGenerationTimeout: 180,
  images: {
    loader: "custom",
    loaderFile: "./lib/cloudinary-image-loader.ts",
  },
  ...(useUpstashCacheHandler
    ? { cacheHandlers: { default: require.resolve("./cache-handlers/upstash-cache-handler.js") } }
    : {}),
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
