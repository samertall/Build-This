/**
 * Read-only production smoke checks. No login, secrets, database writes,
 * or AI calls. Suitable for a scheduled CI health monitor.
 */
const origin = new URL(process.env.SMOKE_BASE_URL || "https://app.samertall.com");
if (origin.protocol !== "https:" || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== "/") {
  throw new Error("SMOKE_BASE_URL must be an HTTPS origin");
}

const scenarios = [
  { path: "/", status: 200, contentType: "text/html" },
  { path: "/sign-in", status: 200, contentType: "text/html" },
  { path: "/privacy", status: 200, contentType: "text/html" },
  { path: "/terms", status: 200, contentType: "text/html" },
  { path: "/support", status: 200, contentType: "text/html" },
  { path: "/robots.txt", status: 200, contentType: "text/plain" },
  { path: "/sitemap.xml", status: 200, contentType: "xml", contains: "https://app.samertall.com" },
  { path: "/api/healthz", status: 200, contentType: "application/json", jsonStatus: "ok" },
  { path: "/api/projects", status: 401, contentType: "application/json" },
];

let failures = 0;
for (const check of scenarios) {
  const url = new URL(check.path, origin);
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      redirect: "manual",
      headers: { Accept: "*/*", "User-Agent": "BuildThis-ReadOnlySmoke/1.0" },
    });
    const body = await response.text();
    const type = response.headers.get("content-type") || "";
    const valid = response.status === check.status &&
      type.toLowerCase().includes(check.contentType) &&
      (!check.contains || body.includes(check.contains)) &&
      (!check.jsonStatus || JSON.parse(body).status === check.jsonStatus);
    if (!valid) throw new Error(`Expected ${check.status} ${check.contentType}; received ${response.status} ${type}`);
    console.log(`PASS ${check.path}: ${response.status}`);
  } catch (error) {
    failures++;
    console.error(`FAIL ${check.path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failures) {
  console.error(`${failures}/${scenarios.length} smoke checks failed`);
  process.exitCode = 1;
} else {
  console.log(`All ${scenarios.length} read-only production smoke checks passed`);
}
