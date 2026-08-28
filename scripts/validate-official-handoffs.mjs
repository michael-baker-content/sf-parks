import { readFile } from "node:fs/promises";
import process from "node:process";

const registry = JSON.parse(await readFile(new URL("../data/content/official-service-handoffs.json", import.meta.url), "utf8"));
const handoffs = [...registry.programs, ...registry.reservations];
const timeoutMs = 10_000;

async function requestHeaders(url, method = "HEAD") {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    headers: {
      "user-agent": "SF-Parks-Explorer-Link-Check/1.0",
      ...(method === "GET" ? { range: "bytes=0-0" } : {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.body) await response.body.cancel();
  return response;
}

async function checkHandoff(handoff) {
  try {
    let response = await requestHeaders(handoff.url);
    if (response.status === 405 || response.status === 501) response = await requestHeaders(handoff.url, "GET");
    const finalUrl = new URL(response.url || handoff.url);
    const redirected = finalUrl.href !== handoff.url;
    if (!["www.sfrecpark.org", "sfrecpark.org"].includes(finalUrl.hostname)) {
      return { handoff, level: "error", message: `redirected outside sfrecpark.org to ${finalUrl.href}` };
    }
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      return { handoff, level: "warning", message: `reachable, but automated checks received HTTP ${response.status}` };
    }
    if (!response.ok) return { handoff, level: "error", message: `returned HTTP ${response.status}` };
    if (redirected) return { handoff, level: "warning", message: `redirected to ${finalUrl.href}` };
    return { handoff, level: "ok", message: `HTTP ${response.status}` };
  } catch (error) {
    return { handoff, level: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

const results = await Promise.all(handoffs.map(checkHandoff));
const errors = results.filter((result) => result.level === "error");
const warnings = results.filter((result) => result.level === "warning");

for (const result of results) {
  const marker = result.level === "ok" ? "OK" : result.level === "warning" ? "WARN" : "FAIL";
  console.log(`${marker} ${result.handoff.id}: ${result.message}`);
}

console.log(`\nChecked ${results.length} official handoff links: ${results.length - errors.length - warnings.length} passed, ${warnings.length} warnings, ${errors.length} failed.`);
if (errors.length) process.exitCode = 1;
