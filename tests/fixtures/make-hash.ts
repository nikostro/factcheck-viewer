import * as fs from "node:fs";
import * as path from "node:path";

export function toUrlSafeBase64(json: string): string {
  return Buffer.from(json, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function toStandardBase64(json: string): string {
  return Buffer.from(json, "utf-8").toString("base64");
}

export function loadFixture(name: string): unknown {
  const p = path.join(__dirname, `${name}.json`);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function fixtureHashUrl(name: string, urlSafe = true): string {
  const json = JSON.stringify(loadFixture(name));
  const b64 = urlSafe ? toUrlSafeBase64(json) : toStandardBase64(json);
  return `/#data_b64=${b64}`;
}
