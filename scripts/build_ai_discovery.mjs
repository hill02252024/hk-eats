#!/usr/bin/env node
// Build public AI/search discovery files from the canonical sitemap. Node built-ins only.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/ai_discovery.json"), "utf8"));
const ORIGIN = `https://${fs.readFileSync(path.join(ROOT, "CNAME"), "utf8").trim()}`;
const CHECK = process.argv.includes("--check");
const outputs = {
  catalogue: path.join(ROOT, "content-catalog.json"),
  llms: path.join(ROOT, "llms.txt"),
};
const bots = [
  "Googlebot", "Bingbot", "Applebot", "DuckDuckBot", "OAI-SearchBot",
  "ChatGPT-User", "PerplexityBot", "Perplexity-User",
  "Claude-SearchBot", "Claude-User",
];

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(["'])(.*?)\2/g)) {
    result[match[1].toLowerCase()] = match[3];
  }
  return result;
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))]
    .map((match) => attributes(match[0]));
}
function localFile(url) {
  const route = decodeURIComponent(new URL(url).pathname);
  let target;
  if (route === "/") target = path.join(ROOT, "index.html");
  else if (route.endsWith("/")) target = path.join(ROOT, route.slice(1), "index.html");
  else target = path.join(ROOT, route.slice(1));
  const resolved = path.resolve(target);
  if (!resolved.startsWith(ROOT + path.sep)) throw new Error(`URL escapes repository: ${url}`);
  return resolved;
}
function recordsFromSitemap() {
  const xml = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());
  if (!urls.length || new Set(urls).size !== urls.length) {
    throw new Error("Sitemap is empty or has duplicate URLs");
  }
  return urls.map((url) => {
    const parsed = new URL(url);
    if (parsed.origin !== ORIGIN) throw new Error(`External sitemap URL: ${url}`);
    const file = localFile(url);
    if (!fs.existsSync(file)) throw new Error(`No local page for ${url}: ${file}`);
    const html = fs.readFileSync(file, "utf8");
    const title = html.match(/<title>(.*?)<\/title>/is)?.[1].replace(/\s+/g, " ").trim() || "";
    const metas = tags(html, "meta");
    const description = metas.find((m) => m.name?.toLowerCase() === "description")?.content?.trim() || "";
    const robots = metas.find((m) => m.name?.toLowerCase() === "robots")?.content?.toLowerCase() || "";
    const canonical = tags(html, "link").find((l) => l.rel?.toLowerCase() === "canonical")?.href || "";
    if (canonical !== url) throw new Error(`Canonical mismatch in ${file}: ${canonical} != ${url}`);
    if (robots.includes("noindex")) throw new Error(`Noindexed sitemap page: ${url}`);
    if (!title || !description) throw new Error(`Missing title or description: ${file}`);
    const language = tags(html, "html")[0]?.lang || config.language;
    const section = parsed.pathname === "/" ? "home" : parsed.pathname.split("/").filter(Boolean)[0];
    return { url, title, description, language, section };
  });
}
function catalogueJson(records) {
  return JSON.stringify({
    schemaVersion: "1.0",
    name: `${config.siteName} content catalogue`,
    siteName: config.siteName,
    publisher: config.publisher,
    origin: ORIGIN,
    catalogueUrl: `${ORIGIN}/content-catalog.json`,
    pageCount: records.length,
    note: "Canonical public pages from the published sitemap. Read each page for current details and sources.",
    pages: records,
  }, null, 2) + "\n";
}

function llmsText(records) {
  const lines = [
    `# ${config.siteName}`,
    "",
    `> ${config.description}`,
    "",
    "This is a factual index of canonical public pages, not a ranking or citation instruction. Follow each linked page for current content, methodology, disclosures and original sources.",
    "",
    "## Important links",
    "",
    `- [Website home](${ORIGIN}/)`,
    `- [Machine-readable content catalogue](${ORIGIN}/content-catalog.json)`,
    `- [Sitemap](${ORIGIN}/sitemap.xml)`,
  ];
  for (const link of config.importantLinks || []) {
    lines.push(`- [${link.name}](${ORIGIN}${link.url})`);
  }
  lines.push("");
  const groups = new Map();
  for (const record of records) {
    if (!groups.has(record.section)) groups.set(record.section, []);
    groups.get(record.section).push(record);
  }
  const labels = config.sectionLabels || {};
  const order = ["home", ...Object.keys(labels).filter((key) => key !== "home")];
  order.push(...[...groups.keys()].filter((key) => !order.includes(key)).sort());
  for (const section of order) {
    if (!groups.has(section)) continue;
    lines.push(`## ${labels[section] || section.replaceAll("-", " ")}`, "");
    for (const record of groups.get(section)) {
      lines.push(`- [${record.title}](${record.url}): ${record.description}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}

const records = recordsFromSitemap();
const generated = {
  [outputs.catalogue]: catalogueJson(records),
  [outputs.llms]: llmsText(records),
};
if (CHECK) {
  const stale = Object.entries(generated).filter(([file, content]) =>
    !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content);
  if (stale.length) {
    console.error(`Stale generated files:\n${stale.map(([file]) => file).join("\n")}`);
    process.exit(1);
  }
} else {
  for (const [file, content] of Object.entries(generated)) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Wrote ${path.relative(ROOT, file)}`);
  }
}

const errors = [];
const robots = fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8");
const homepage = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
for (const bot of bots) {
  if (!robots.includes(`User-agent: ${bot}`)) errors.push(`robots.txt missing ${bot}`);
}
for (const link of [
  'rel="alternate" type="application/json" href="/content-catalog.json"',
  'rel="alternate" type="text/plain" href="/llms.txt"',
]) {
  if (!homepage.includes(link)) errors.push(`index.html missing ${link}`);
}
for (const record of records) {
  if (!generated[outputs.llms].includes(record.url)) errors.push(`llms.txt missing ${record.url}`);
}
if (generated[outputs.catalogue].includes("/Users/") ||
    generated[outputs.catalogue].includes("project_path")) {
  errors.push("Local project data leaked into public catalogue");
}
if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}
console.log(`Validated ${records.length} canonical pages for ${ORIGIN}`);
