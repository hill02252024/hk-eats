#!/usr/bin/env node
/* hk_eats — scripts/build.mjs
 *
 * 只用 Node 內建模組，冇任何 npm 依賴。
 *
 *   node scripts/build.mjs
 *   SITE_ORIGIN=https://your-name.github.io/hk_eats node scripts/build.mjs
 *
 * 做五件事：
 *   1. 掃描全部 .html，生成 sitemap.xml
 *   2. 由每頁 <head> 的 jsonld:* meta 生成並注入 JSON-LD
 *   3. 檢查每篇文章有冇對應的 /data/ JSON（冇 → warning）
 *   4. 檢查有冇硬編碼 affiliate URL（有 → error，exit 1）
 *   5. 生成 robots.txt
 *
 * 退出碼：有任何 error 就 1，只有 warning 就 0。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://example.github.io/hk_eats").replace(/\/+$/, "");
const SITE_NAME = "hk_eats";
const SITE_LANG = "zh-HK";

const SKIP_DIRS = new Set([".git", "node_modules", "scripts", ".github"]);

const errors = [];
const warnings = [];
const notes = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const note = (m) => notes.push(m);

/* ------------------------------------------------------------------ */
/* 檔案掃描                                                             */
/* ------------------------------------------------------------------ */

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".") && ent.name !== ".well-known") continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

const allFiles = walk(ROOT);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const htmlFiles = allFiles.filter((f) => f.endsWith(".html")).sort();
const jsFiles = allFiles.filter((f) => f.endsWith(".js")).sort();

/* ------------------------------------------------------------------ */
/* 1 & 4 的共用工具                                                     */
/* ------------------------------------------------------------------ */

function readMetas(html) {
  const metas = {};
  const re = /<meta\s+name=["']([^"']+)["']\s+content=["']([\s\S]*?)["']\s*\/?>/gi;
  let m;
  while ((m = re.exec(html))) metas[m[1]] = m[2];
  return metas;
}

const stripTags = (s) =>
  s.replace(/<[^>]*>/g, "")
   .replace(/&nbsp;/g, " ")
   .replace(/&amp;/g, "&")
   .replace(/&lt;/g, "<")
   .replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"')
   .replace(/\s+/g, " ")
   .trim();

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

/* ------------------------------------------------------------------ */
/* 4. 硬編碼 affiliate 檢查（先行；就算之後注入失敗都應該報到）           */
/* ------------------------------------------------------------------ */

/* 兩類 pattern：
 *   host  — 已知聯盟／商戶網域直接出現喺 markup 入面
 *   param — URL query 入面出現典型追蹤參數
 * 兩者都只掃 .html 同 js/（唔掃 data/，因為 data/affiliates.json 就係
 * 唯一合法存放位置）。 */
const AFFILIATE_PATTERNS = [
  { id: "host:klook",     re: /\bklook\.com\b/gi,                       why: "Klook 網域" },
  { id: "host:klook-short", re: /\bklk\.la\b/gi,                        why: "Klook 短連結" },
  { id: "host:amazon",    re: /\bamazon\.(?:com|co\.uk|co\.jp|de|fr|ca|cn|sg|com\.au)\b/gi, why: "Amazon 網域" },
  { id: "host:amzn",      re: /\bamzn\.(?:to|eu|asia)\b/gi,             why: "Amazon 短連結" },
  { id: "host:agoda",     re: /\bagoda\.com\b/gi,                       why: "Agoda 網域" },
  { id: "host:booking",   re: /\bbooking\.com\b/gi,                     why: "Booking.com 網域" },
  { id: "host:trip",      re: /\btrip\.com\b/gi,                        why: "Trip.com 網域" },
  { id: "host:kkday",     re: /\bkkday\.com\b/gi,                       why: "KKday 網域" },
  { id: "host:shopee",    re: /\bshopee\.[a-z.]{2,6}\b/gi,              why: "Shopee 網域" },
  { id: "host:taobao",    re: /\b(?:taobao|tmall)\.com\b/gi,            why: "淘寶／天貓網域" },
  { id: "param:tag",      re: /[?&]tag=[^"'\s&]+/gi,                    why: "Amazon associate tag" },
  { id: "param:aid",      re: /[?&]aid=[^"'\s&]+/gi,                    why: "Klook／Agoda aid" },
  { id: "param:aff",      re: /[?&](?:aff_adid|aff_id|affiliate_id|affid|aff_sub\d?)=[^"'\s&]+/gi, why: "通用 affiliate 參數" },
  { id: "param:network",  re: /[?&](?:irclickid|awc|ranMID|ranSiteID|clickref|pid|shareid)=[^"'\s&]+/gi, why: "聯盟網絡追蹤參數" },
  { id: "param:utm",      re: /[?&]utm_(?:source|medium|campaign)=[^"'\s&]+/gi, why: "UTM 追蹤參數" },
];

function scanHardcodedAffiliates(files) {
  let hits = 0;
  for (const file of files) {
    const r = rel(file);
    const text = fs.readFileSync(file, "utf8");
    for (const p of AFFILIATE_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text))) {
        hits++;
        err(
          `硬編碼 affiliate：${r}:${lineOf(text, m.index)} 「${m[0].slice(0, 60)}」` +
          `（${p.why}，規則 ${p.id}）→ 應該搬去 data/affiliates.json，頁面只寫 data-aff="key"`
        );
      }
    }
  }
  return hits;
}

/* ------------------------------------------------------------------ */
/* 2. JSON-LD 生成與注入                                                */
/* ------------------------------------------------------------------ */

const START = "<!-- build:jsonld -->";
const END = "<!-- /build:jsonld -->";
const JSONLD_BLOCK_RE = /[ \t]*<!-- build:jsonld -->[\s\S]*?<!-- \/build:jsonld -->\n?/g;

function canonicalPath(relPath) {
  if (relPath === "index.html") return "/";
  if (relPath.endsWith("/index.html")) return "/" + relPath.slice(0, -"index.html".length);
  return "/" + relPath;
}

function extractFaq(html) {
  const out = [];
  const re = /<h3[^>]*\bdata-faq-q\b[^>]*>([\s\S]*?)<\/h3>\s*<div[^>]*\bdata-faq-a\b[^>]*>([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = re.exec(html))) {
    const q = stripTags(m[1]);
    const a = stripTags(m[2]);
    if (q && a) out.push({ q, a });
  }
  return out;
}

const publisher = { "@type": "Organization", name: SITE_NAME, url: SITE_ORIGIN + "/" };

function buildGraph(relPath, html, metas) {
  const url = SITE_ORIGIN + canonicalPath(relPath);
  const types = (metas["jsonld:type"] || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!types.length) return null;

  const graph = [];

  for (const type of types) {
    if (type === "Article") {
      graph.push({
        "@type": "Article",
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        headline: metas["jsonld:headline"] || "",
        description: metas["jsonld:description"] || metas["description"] || "",
        inLanguage: SITE_LANG,
        datePublished: metas["jsonld:datePublished"] || "",
        dateModified: metas["jsonld:dateModified"] || metas["jsonld:datePublished"] || "",
        articleSection: metas["jsonld:section"] || undefined,
        author: publisher,
        publisher,
      });
      if (!metas["jsonld:headline"]) warn(`${relPath}: 宣告 Article 但冇 jsonld:headline`);
      if (!metas["jsonld:datePublished"]) warn(`${relPath}: 宣告 Article 但冇 jsonld:datePublished`);
    } else if (type === "ItemList") {
      const items = (metas["jsonld:itemList"] || "").split("|").map((s) => s.trim()).filter(Boolean);
      if (!items.length) {
        warn(`${relPath}: 宣告 ItemList 但 jsonld:itemList 係空，已略過該節點`);
        continue;
      }
      graph.push({
        "@type": "ItemList",
        name: metas["jsonld:itemListName"] || metas["jsonld:headline"] || "",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: items.length,
        itemListElement: items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
      });
    } else if (type === "FAQPage") {
      const faq = extractFaq(html);
      if (!faq.length) {
        warn(`${relPath}: 宣告 FAQPage 但搵唔到 <h3 data-faq-q> + <div data-faq-a> 組合，已略過該節點`);
        continue;
      }
      graph.push({
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    } else {
      warn(`${relPath}: 唔認識嘅 jsonld:type「${type}」，已略過`);
    }
  }

  if (!graph.length) return null;
  const doc = graph.length === 1
    ? { "@context": "https://schema.org", ...graph[0] }
    : { "@context": "https://schema.org", "@graph": graph };
  return JSON.parse(JSON.stringify(doc)); // 去掉 undefined
}

function injectJsonLd(file) {
  const relPath = rel(file);
  let html = fs.readFileSync(file, "utf8");
  const metas = readMetas(html);

  const before = html;
  html = html.replace(JSONLD_BLOCK_RE, ""); // 每次重生，保證 idempotent

  const doc = buildGraph(relPath, html, metas);
  if (doc) {
    const block =
      START + "\n" +
      '<script type="application/ld+json">\n' +
      JSON.stringify(doc, null, 2) + "\n" +
      "</script>\n" +
      END + "\n";
    if (!/<\/head>/i.test(html)) {
      err(`${relPath}: 搵唔到 </head>，無法注入 JSON-LD`);
      return { relPath, metas, injected: false };
    }
    html = html.replace(/<\/head>/i, block + "</head>");
  } else if (!metas["jsonld:type"]) {
    warn(`${relPath}: 冇 jsonld:type meta，冇注入任何結構化資料`);
  }

  if (html !== before) fs.writeFileSync(file, html, "utf8");
  return { relPath, metas, injected: !!doc };
}

/* ------------------------------------------------------------------ */
/* 3. 文章 ↔ /data/ JSON 對應檢查                                       */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(ROOT, "data");
const dataCache = new Map();

function loadData(name) {
  if (dataCache.has(name)) return dataCache.get(name);
  const p = path.join(DATA_DIR, name + ".json");
  let val = null;
  if (fs.existsSync(p)) {
    try {
      val = JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      err(`data/${name}.json 唔係合法 JSON：${e.message}`);
      val = false;
    }
  }
  dataCache.set(name, val);
  return val;
}

function checkArticleData(file, relPath, html) {
  const base = path.basename(relPath, ".html");
  const isArticle = base !== "index";
  const usedFresh = new Set();
  const blockRe = /data-fresh=["']([^"']+)["']/gi;
  let m;
  while ((m = blockRe.exec(html))) usedFresh.add(m[1]);

  if (isArticle && !fs.existsSync(path.join(DATA_DIR, base + ".json"))) {
    warn(`${relPath}: 冇對應嘅 data/${base}.json（文章應該有易耗芯資料檔）`);
  }

  // 逐個 data-fresh 區塊核對 key 有冇齊
  for (const name of usedFresh) {
    const doc = loadData(name);
    if (doc === null) {
      err(`${relPath}: 引用 data-fresh="${name}" 但 data/${name}.json 唔存在`);
      continue;
    }
    if (doc === false) continue;
    const entries = (doc && doc.entries) || {};
    const keyRe = /data-fresh-key=["']([^"']+)["']/gi;
    let k;
    const missing = [];
    while ((k = keyRe.exec(html))) {
      const key = k[1];
      if (!Object.prototype.hasOwnProperty.call(entries, key)) missing.push(key);
    }
    for (const key of new Set(missing)) {
      // key 可能屬於另一個 data-fresh 區塊，只有全部檔都冇先報
      const foundElsewhere = [...usedFresh].some((n) => {
        const d = loadData(n);
        return d && d.entries && Object.prototype.hasOwnProperty.call(d.entries, key);
      });
      if (!foundElsewhere) warn(`${relPath}: data-fresh-key="${key}" 喺任何引用嘅資料檔都搵唔到`);
    }
  }

  // 檢查 entry 結構
  for (const name of usedFresh) {
    const doc = loadData(name);
    if (!doc) continue;
    for (const [key, entry] of Object.entries(doc.entries || {})) {
      if (!entry || typeof entry !== "object" || !("value" in entry)) {
        warn(`data/${name}.json: entry「${key}」冇 value`);
      } else if (!/^\d{4}-\d{2}$/.test(String(entry.verifiedOn || ""))) {
        warn(`data/${name}.json: entry「${key}」嘅 verifiedOn 唔係 YYYY-MM 格式`);
      }
    }
  }

  // data-aff key 對照
  const affDoc = (() => {
    const p = path.join(DATA_DIR, "affiliates.json");
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, "utf8")); }
    catch (e) { err(`data/affiliates.json 唔係合法 JSON：${e.message}`); return false; }
  })();
  const affRe = /data-aff=["']([^"']+)["']/gi;
  let a;
  while ((a = affRe.exec(html))) {
    if (affDoc === null) { err(`${relPath}: 用咗 data-aff 但冇 data/affiliates.json`); break; }
    if (affDoc === false) break;
    if (!affDoc.links || !affDoc.links[a[1]]) {
      warn(`${relPath}: data-aff="${a[1]}" 喺 data/affiliates.json 冇對應 entry`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 1 & 5. sitemap.xml 與 robots.txt                                     */
/* ------------------------------------------------------------------ */

function writeSitemap(pages) {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages
      .map((p) => {
        const loc = SITE_ORIGIN + canonicalPath(p.relPath);
        const lastmod = p.metas["jsonld:dateModified"] || p.metas["jsonld:datePublished"] || "";
        return (
          "  <url>\n" +
          `    <loc>${loc}</loc>\n` +
          (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") +
          "  </url>\n"
        );
      })
      .join("") +
    "</urlset>\n";
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
  return pages.length;
}

function writeRobots() {
  const txt =
    "# hk_eats — 由 scripts/build.mjs 生成，唔好手改\n" +
    "User-agent: *\n" +
    "Allow: /\n" +
    "\n" +
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
  fs.writeFileSync(path.join(ROOT, "robots.txt"), txt, "utf8");
}

/* ------------------------------------------------------------------ */
/* 主流程                                                               */
/* ------------------------------------------------------------------ */

console.log(`hk_eats build — root ${ROOT}`);
console.log(`SITE_ORIGIN = ${SITE_ORIGIN}`);
console.log("");

const scanTargets = [...htmlFiles, ...jsFiles.filter((f) => rel(f).startsWith("js/"))];
const affHits = scanHardcodedAffiliates(scanTargets);
console.log(`[1/5] affiliate 硬編碼掃描：${scanTargets.length} 個檔，${affHits} 個命中`);

const pages = [];
for (const file of htmlFiles) {
  const info = injectJsonLd(file);
  pages.push(info);
}
console.log(`[2/5] JSON-LD 注入：${pages.filter((p) => p.injected).length}/${pages.length} 頁有結構化資料`);

for (const file of htmlFiles) {
  checkArticleData(file, rel(file), fs.readFileSync(file, "utf8"));
}
const articleCount = htmlFiles.filter((f) => path.basename(f) !== "index.html").length;
console.log(`[3/5] 文章 ↔ data 對應檢查：${articleCount} 篇文章`);

const n = writeSitemap(pages);
console.log(`[4/5] sitemap.xml：${n} 條 URL`);

writeRobots();
console.log("[5/5] robots.txt：已生成");

console.log("");
console.log("生成／改寫嘅檔案：");
console.log("  sitemap.xml");
console.log("  robots.txt");
for (const p of pages) if (p.injected) console.log(`  ${p.relPath}  (JSON-LD 已注入)`);

if (notes.length) {
  console.log("");
  for (const m of notes) console.log(`note    ${m}`);
}
if (warnings.length) {
  console.log("");
  for (const m of warnings) console.log(`WARNING ${m}`);
}
if (errors.length) {
  console.log("");
  for (const m of errors) console.error(`ERROR   ${m}`);
}

console.log("");
console.log(`完成：${errors.length} error、${warnings.length} warning。`);
process.exit(errors.length ? 1 : 0);
