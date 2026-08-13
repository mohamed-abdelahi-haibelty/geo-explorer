// Backs `cacheHandlers.default` in next.config.ts — the in-memory default
// for `"use cache"` doesn't survive a restart or a second replica, and this
// project already has a real Upstash Redis instance (used for login rate
// limiting) rather than a local Redis container, so the ISR cache shares it
// instead of adding a new service. CJS + `.js`, not TypeScript: Next
// resolves `cacheHandlers` paths
// with `require.resolve` before the app's own build pipeline runs (see the
// Next docs' own examples for this config key), so this file has to be
// loadable standalone.
//
// `@upstash/redis` auto-serializes non-string values with JSON.stringify/
// parse on set/get, so entries are stored as plain objects, not manually
// encoded strings.
const { Redis } = require("@upstash/redis");

const redis = Redis.fromEnv();

const KEY_PREFIX = "nextcache:entry:";
const TAGS_KEY = "nextcache:tags";
// One year — Redis still needs *some* TTL so abandoned entries eventually
// fall out, but `expire` from Next can be `Infinity` for cacheLife profiles
// with no explicit expiry, which Redis's EX option can't represent directly.
const MAX_TTL_SECONDS = 60 * 60 * 24 * 365;

// Populated by refreshTags() before each request (Next's own contract) —
// get() consults this synchronously instead of hitting Redis per soft tag.
const localTagTimestamps = new Map();

async function streamToBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

function bufferToStream(buffer) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer));
      controller.close();
    },
  });
}

module.exports = {
  async get(cacheKey, softTags) {
    let stored;
    try {
      stored = await redis.get(KEY_PREFIX + cacheKey);
    } catch {
      // get() failures propagate as render errors per Next's cache-handler
      // contract unless caught here — a Redis blip should be a cache miss,
      // not a broken page.
      return undefined;
    }
    if (!stored) return undefined;

    const now = Date.now();
    if (now > stored.timestamp + stored.revalidate * 1000) return undefined;

    // Soft tags (route-path-derived, e.g. revalidatePath) aren't stored on
    // the entry itself — invalidated if any of them were updated after this
    // entry was written.
    for (const tag of softTags) {
      const invalidatedAt = localTagTimestamps.get(tag);
      if (invalidatedAt && invalidatedAt > stored.timestamp) return undefined;
    }

    return {
      value: bufferToStream(Buffer.from(stored.value, "base64")),
      tags: stored.tags,
      stale: stored.stale,
      timestamp: stored.timestamp,
      expire: stored.expire,
      revalidate: stored.revalidate,
    };
  },

  async set(cacheKey, pendingEntry) {
    const entry = await pendingEntry;
    const buffer = await streamToBuffer(entry.value);
    const ttl = Number.isFinite(entry.expire) && entry.expire > 0 ? Math.min(entry.expire, MAX_TTL_SECONDS) : MAX_TTL_SECONDS;

    await redis.set(
      KEY_PREFIX + cacheKey,
      {
        value: buffer.toString("base64"),
        tags: entry.tags,
        stale: entry.stale,
        timestamp: entry.timestamp,
        expire: entry.expire,
        revalidate: entry.revalidate,
      },
      { ex: ttl },
    );
  },

  async refreshTags() {
    const tagTimestamps = await redis.hgetall(TAGS_KEY);
    if (!tagTimestamps) return;
    for (const [tag, timestamp] of Object.entries(tagTimestamps)) {
      localTagTimestamps.set(tag, Number(timestamp));
    }
  },

  async getExpiration(tags) {
    let max = 0;
    for (const tag of tags) {
      const timestamp = localTagTimestamps.get(tag);
      if (timestamp && timestamp > max) max = timestamp;
    }
    return max;
  },

  async updateTags(tags) {
    const now = Date.now();
    const updates = {};
    for (const tag of tags) {
      updates[tag] = now;
      localTagTimestamps.set(tag, now);
    }
    if (Object.keys(updates).length > 0) await redis.hset(TAGS_KEY, updates);
  },
};
