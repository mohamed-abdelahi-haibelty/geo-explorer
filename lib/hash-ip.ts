import { createHash } from "node:crypto";

export function hashIp(ip: string) {
  return createHash("sha256").update(ip).digest("hex");
}
