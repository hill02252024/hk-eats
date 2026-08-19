#!/usr/bin/env node
/* hk_eats — scripts/build.mjs
 *
 * 只用 Node 內建模組，冇任何 npm 依賴。
 *
 *   node scripts/build.mjs
 *   SITE_ORIGIN=https://your-name.github.io/hk_eats node scripts/build.mjs
 *
 * 生成：
 *   - sitemap.xml、robots.txt
 *   - 每頁嘅 JSON-LD（由 <head> 嘅 jsonld:* meta 讀）
 *   - 每頁嘅 inline SVG（由 assets/svg/ 注入，唯一來源）
 *
 * 檢查（error 會 exit 1）：
 *   E1 外部連結白名單     任何指向站外嘅 <a href> 都係 error，除非喺 allowlist。
 *                        affiliate 連結唯一合法途徑係 runtime 由 affiliates.js 注入。
 *   E2 外部圖片          <img src="http…"> 或 inline style url(http…) 即 error。
 *   E3 廣告網絡代碼       adsbygoogle / googlesyndication / ca-pub- 出現即 error。
 *   E4 廣告位排序        同一頁嘅第一個 .ad-slot 唔准排喺第一個 .affiliate-cta 之前。
 *   E5 廣告位尺寸        ad-slots.json 每個 slot 嘅高度要同 css/main.css 嘅
 *                        min-height 一一對應（手機 + 桌面兩組）。
 *   E6 資料檔缺失        頁面引用嘅 data-fresh 檔唔存在。
 *
 * 警告（唔會 exit 1）：
 *   W1 文章冇對應 data/<section>/<name>.json
 *   W2 data-fresh-key 喺資料檔搵唔到
 *   W3 entry 結構問題（冇 value、verifiedOn 格式錯、volatility 亂寫、
 *      volatility=high 但冇 volatileNote）
 *   W4 data-aff key 喺 affiliates.json 冇對應
 *   W5 JSON-LD meta 缺漏
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://example.github.io/hk_eats").replace(/\/+$/, "");
const SITE_NAME = "hk_eats";
const SITE_LANG = "zh-HK";
const SITE_HOST = (() => { try { return new URL(SITE_ORIGIN).host; } catch { return ""; } })();

const SKIP_DIRS = new Set([".git", "node_modules", "scripts", ".github"]);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

/* ------------------------------------------------------------------ */
/* 外部連結白名單                                                       */
/* ------------------------------------------------------------------ */

/* 白名單只放純參考用途嘅官方來源。凡係商業／可以掛佣金嘅網域，
 * 一律唔准出現喺 HTML —— affiliate 連結只可以由 js/affiliates.js
 * 喺 runtime 由 data/affiliates.json 讀出嚟注入。
 *
 * suffix：整個網域尾綴都放行（政府域）
 * exact ：淨係呢個 host 放行 */
const EXTERNAL_ALLOWLIST = {
  suffix: [
    ".gov.hk",   // 香港特區政府（入境處、保安局、運輸署等）
    ".gov.cn",   // 內地政府
  ],
  exact: [
    "www.mtr.com.hk",        // 港鐵：接駁／特惠站官方說明
    "www.openstreetmap.org", // 地圖參考
    "schema.org",            // 結構化資料詞彙
    "www.w3.org",            // SVG／XML namespace
  ],
};

/* 就算網域喺白名單，帶追蹤參數一樣攔 —— 白名單放行嘅係「參考連結」，
 * 唔係「帶 tracking 嘅參考連結」。 */
const TRACKING_PARAM_RE =
  /[?&](?:tag|aid|aff_adid|aff_id|affiliate_id|affid|aff_sub\d?|irclickid|awc|ranMID|ranSiteID|clickref|shareid|utm_source|utm_medium|utm_campaign)=/i;

function hostAllowed(host) {
  const h = host.toLowerCase();
  if (SITE_HOST && h === SITE_HOST) return true;
  if (EXTERNAL_ALLOWLIST.exact.includes(h)) return true;
  return EXTERNAL_ALLOWLIST.suffix.some((s) => h === s.slice(1) || h.endsWith(s));
}

/* ------------------------------------------------------------------ */
/* 檔案掃描                                                             */
/* ------------------------------------------------------------------ */

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
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
const jsFiles = allFiles.filter((f) => rel(f).startsWith("js/") && f.endsWith(".js")).sort();

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

function readMetas(html) {
  const metas = {};
  const re = /<meta\s+name=["']([^"']+)["']\s+content=["']([\s\S]*?)["']\s*\/?>/gi;
  let m;
  while ((m = re.exec(html))) metas[m[1]] = m[2];
  return metas;
}

const stripTags = (s) =>
  s.replace(/<[^>]*>/g, "")
   .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
   .replace(/&gt;/g, ">").replace(/&quot;/g, '"')
   .replace(/\s+/g, " ").trim();

/* ------------------------------------------------------------------ */
/* E1 外部連結白名單                                                    */
/* ------------------------------------------------------------------ */

function checkExternalLinks(file, text) {
  const r = rel(file);
  const re = /<a\b[^>]*?\bhref\s*=\s*["']([^"']*)["'][^>]*>/gi;
  let m, checked = 0;
  while ((m = re.exec(text))) {
    const href = m[1].trim();
    if (!href) continue;
    const isAbsolute = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href);
    if (!isAbsolute) continue;               // 相對路徑、#錨點、mailto: 一律放行
    checked++;
    let host;
    try {
      host = new URL(href.startsWith("//") ? "https:" + href : href).host;
    } catch {
      err(`E1 ${r}:${lineOf(text, m.index)} 解析唔到嘅絕對連結「${href.slice(0, 70)}」`);
      continue;
    }
    if (!hostAllowed(host)) {
      err(
        `E1 ${r}:${lineOf(text, m.index)} 外部連結指向唔喺白名單嘅網域「${host}」` +
        `（${href.slice(0, 70)}）→ affiliate 連結只准寫 data-aff="key" 由 affiliates.js 注入；` +
        `純參考連結要先加入 EXTERNAL_ALLOWLIST`
      );
    } else if (TRACKING_PARAM_RE.test(href)) {
      err(
        `E1 ${r}:${lineOf(text, m.index)} 白名單網域「${host}」但帶追蹤參數` +
        `（${href.slice(0, 70)}）→ 參考連結唔應該有 tracking`
      );
    }
  }
  return checked;
}

/* ------------------------------------------------------------------ */
/* E2 外部圖片 / E3 廣告網絡代碼                                        */
/* ------------------------------------------------------------------ */

function checkExternalImages(file, text) {
  const r = rel(file);
  const patterns = [
    { re: /<img\b[^>]*\bsrc\s*=\s*["']\s*(?:https?:)?\/\/[^"']*["'][^>]*>/gi, why: "<img> 指向外部網址" },
    { re: /<img\b[^>]*\bsrcset\s*=\s*["'][^"']*(?:https?:)?\/\/[^"']*["'][^>]*>/gi, why: "<img srcset> 含外部網址" },
    { re: /url\(\s*['"]?(?:https?:)?\/\//gi, why: "CSS url() 指向外部資源" },
  ];
  for (const p of patterns) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(text))) {
      err(`E2 ${r}:${lineOf(text, m.index)} ${p.why}：「${m[0].slice(0, 70)}」→ 本站零外部圖片，圖解一律 inline SVG`);
    }
  }
}

/* 只掃可執行內容：先剝走 /* … *\/ 區塊註解同 <!-- … --> HTML 註解。
 * 理由 —— js/ads.js 嘅檔頭註解要明文寫「本檔冇 adsbygoogle」，
 * 呢句係文件，唔係代碼；掃佢等於懲罰講清楚。行註解 // 冇剝，
 * 因為簡單剝法會誤傷字串入面嘅 "https://"，寧願保守。 */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
}

function checkAdNetworkCode(file, rawText) {
  const r = rel(file);
  const text = stripComments(rawText);
  const patterns = [
    /adsbygoogle/gi,
    /pagead2\.googlesyndication\.com/gi,
    /\bca-pub-\d+/gi,
    /\bdata-ad-client\b/gi,
  ];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      err(`E3 ${r}:${lineOf(text, m.index)} 出現廣告網絡代碼「${m[0]}」→ 本次唔准加任何廣告代碼或 publisher ID`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* E4 廣告位必須排喺 affiliate CTA 之後                                  */
/* ------------------------------------------------------------------ */

function firstIndexOfClass(text, cls) {
  const re = new RegExp(`class\\s*=\\s*["'][^"']*\\b${cls}\\b[^"']*["']`, "i");
  const m = re.exec(text);
  return m ? m.index : -1;
}

function checkAdOrdering(file, text) {
  const r = rel(file);
  const adIdx = firstIndexOfClass(text, "ad-slot");
  const ctaIdx = firstIndexOfClass(text, "affiliate-cta");
  if (adIdx === -1 || ctaIdx === -1) return;
  if (adIdx < ctaIdx) {
    err(
      `E4 ${r}: 第一個 .ad-slot（第 ${lineOf(text, adIdx)} 行）排喺第一個 ` +
      `.affiliate-cta（第 ${lineOf(text, ctaIdx)} 行）之前 → ` +
      `Klook／Amazon CTA 必須排喺同一版面嘅廣告位之前`
    );
  }
}

/* ------------------------------------------------------------------ */
/* E5 廣告位尺寸：ad-slots.json ↔ css/main.css                          */
/* ------------------------------------------------------------------ */

function checkAdSlotSizes() {
  const jsonPath = path.join(ROOT, "data/ad-slots.json");
  const cssPath = path.join(ROOT, "css/main.css");
  if (!fs.existsSync(jsonPath)) { err("E5 搵唔到 data/ad-slots.json"); return 0; }
  if (!fs.existsSync(cssPath)) { err("E5 搵唔到 css/main.css"); return 0; }

  let doc;
  try { doc = JSON.parse(fs.readFileSync(jsonPath, "utf8")); }
  catch (e) { err(`E5 data/ad-slots.json 唔係合法 JSON：${e.message}`); return 0; }

  if (doc.publisher) err(`E5 data/ad-slots.json 嘅 publisher 唔應該有值（而家係「${doc.publisher}」）→ 本次唔准填 publisher ID`);

  const css = fs.readFileSync(cssPath, "utf8");
  let ok = 0;
  for (const slot of doc.slots || []) {
    if (slot.enabled) err(`E5 slot「${slot.id}」嘅 enabled 係 true → 本次全部 slot 必須 false`);

    const re = new RegExp(`\\[data-ad-slot="${slot.id}"\\]\\s*\\{([^}]*)\\}`, "g");
    const blocks = [];
    let m;
    while ((m = re.exec(css))) blocks.push(m[1]);

    if (blocks.length !== 2) {
      err(`E5 css/main.css 入面 [data-ad-slot="${slot.id}"] 有 ${blocks.length} 條規則，預期 2 條（手機 + 桌面）`);
      continue;
    }
    const heights = blocks.map((b) => {
      const h = /min-height\s*:\s*(\d+)px/.exec(b);
      return h ? parseInt(h[1], 10) : null;
    });
    const want = [slot.mobile?.[1], slot.desktop?.[1]];
    const labels = ["手機", "桌面"];
    heights.forEach((got, i) => {
      if (got !== want[i]) {
        err(`E5 slot「${slot.id}」${labels[i]} min-height：CSS ${got}px ≠ ad-slots.json ${want[i]}px`);
      } else ok++;
    });
  }
  return ok;
}

/* ------------------------------------------------------------------ */
/* SVG 注入（assets/svg/ 係唯一來源）                                    */
/* ------------------------------------------------------------------ */

const SVG_START = "<!-- build:svg -->";
const SVG_END = "<!-- /build:svg -->";

function injectSvgs(relPath, html) {
  const figRe = /(<figure\b[^>]*\bdata-svg=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/figure>)/gi;
  let injected = 0;
  const out = html.replace(figRe, (all, open, name, inner, close) => {
    const svgPath = path.join(ROOT, "assets/svg", name + ".svg");
    if (!fs.existsSync(svgPath)) {
      err(`E6 ${relPath}: data-svg="${name}" 但 assets/svg/${name}.svg 唔存在`);
      return all;
    }
    const svg = fs.readFileSync(svgPath, "utf8").replace(/^﻿/, "").trim();
    const block = `\n${SVG_START}\n${svg}\n${SVG_END}\n`;
    let next;
    if (inner.includes(SVG_START)) {
      next = inner.replace(
        new RegExp(`\\n?${SVG_START}[\\s\\S]*?${SVG_END}\\n?`),
        block
      );
    } else {
      next = block + inner;
    }
    injected++;
    return open + next + close;
  });
  return { html: out, injected };
}

/* ------------------------------------------------------------------ */
/* E7 SVG 唔准 hardcode 易耗值                                          */
/* ------------------------------------------------------------------ */

/* 圖解係常青殼嘅一部分，build 直接注入 HTML，唔經 freshness.js。
 * 所以只要有一個服務時間、費率、日數寫落 SVG，佢就永遠唔會顯示核實月份、
 * 亦唔會過期 —— 資料變咗就靜靜地錯落去。圖解只可以畫結構。 */
const SVG_VOLATILE_PATTERNS = [
  { re: /\d{1,2}:\d{2}/g,                     why: "時間（服務時間屬易耗芯）" },
  { re: /24\s*小時/g,                          why: "服務時間描述" },
  { re: /HK\$\s*[\d,]+/g,                      why: "金額" },
  { re: /\d+(?:\.\d+)?\s*%/g,                 why: "費率" },
  { re: /[\d一二三四五六七八九十]+\s*個(?:工作天|月)/g, why: "期限／日數" },
];

function checkSvgVolatiles() {
  const dir = path.join(ROOT, "assets/svg");
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".svg"))) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    n++;
    for (const p of SVG_VOLATILE_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text))) {
        err(
          `E7 assets/svg/${f}:${lineOf(text, m.index)} SVG 入面出現易耗值「${m[0]}」` +
          `（${p.why}）→ 圖解只可以畫結構，數值要放 data/ 由 freshness.js 載入`
        );
      }
    }
  }
  return n;
}

/* ------------------------------------------------------------------ */
/* JSON-LD                                                             */
/* ------------------------------------------------------------------ */

const LD_START = "<!-- build:jsonld -->";
const LD_END = "<!-- /build:jsonld -->";
const LD_BLOCK_RE = /[ \t]*<!-- build:jsonld -->[\s\S]*?<!-- \/build:jsonld -->\n?/g;

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
    const q = stripTags(m[1]), a = stripTags(m[2]);
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
      if (!metas["jsonld:headline"]) warn(`W5 ${relPath}: 宣告 Article 但冇 jsonld:headline`);
      if (!metas["jsonld:datePublished"]) warn(`W5 ${relPath}: 宣告 Article 但冇 jsonld:datePublished`);
    } else if (type === "ItemList") {
      const items = (metas["jsonld:itemList"] || "").split("|").map((s) => s.trim()).filter(Boolean);
      if (!items.length) { warn(`W5 ${relPath}: 宣告 ItemList 但 jsonld:itemList 係空`); continue; }
      graph.push({
        "@type": "ItemList",
        name: metas["jsonld:itemListName"] || metas["jsonld:headline"] || "",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: items.length,
        itemListElement: items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
      });
    } else if (type === "FAQPage") {
      const faq = extractFaq(html);
      if (!faq.length) { warn(`W5 ${relPath}: 宣告 FAQPage 但搵唔到 data-faq-q / data-faq-a 組合`); continue; }
      graph.push({
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question", name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      });
    } else {
      warn(`W5 ${relPath}: 唔認識嘅 jsonld:type「${type}」`);
    }
  }
  if (!graph.length) return null;
  const doc = graph.length === 1
    ? { "@context": "https://schema.org", ...graph[0] }
    : { "@context": "https://schema.org", "@graph": graph };
  return JSON.parse(JSON.stringify(doc));
}

/* ------------------------------------------------------------------ */
/* 資料檔檢查                                                           */
/* ------------------------------------------------------------------ */

const DATA_DIR = path.join(ROOT, "data");
const VALID_VOLATILITY = new Set(["low", "normal", "high"]);
const dataCache = new Map();

function loadData(name) {
  if (dataCache.has(name)) return dataCache.get(name);
  const p = path.join(DATA_DIR, name + ".json");
  let val = null;
  if (fs.existsSync(p)) {
    try { val = JSON.parse(fs.readFileSync(p, "utf8")); }
    catch (e) { err(`E6 data/${name}.json 唔係合法 JSON：${e.message}`); val = false; }
  }
  dataCache.set(name, val);
  return val;
}

function checkPageData(relPath, html) {
  const base = relPath.replace(/\.html$/, "");
  const isArticle = path.basename(relPath) !== "index.html";

  const usedFresh = new Set();
  let m;
  const blockRe = /data-fresh=["']([^"']+)["']/gi;
  while ((m = blockRe.exec(html))) usedFresh.add(m[1]);

  if (isArticle && !fs.existsSync(path.join(DATA_DIR, base + ".json"))) {
    warn(`W1 ${relPath}: 冇對應嘅 data/${base}.json`);
  }

  const usedKeys = new Set();
  const keyRe = /data-fresh-key=["']([^"']+)["']/gi;
  while ((m = keyRe.exec(html))) usedKeys.add(m[1]);

  const available = new Set();
  for (const name of usedFresh) {
    if (!name.includes("/")) {
      warn(`W1 ${relPath}: data-fresh="${name}" 冇 section 前綴，應該係 <section>/<name>`);
    }
    const doc = loadData(name);
    if (doc === null) { err(`E6 ${relPath}: 引用 data-fresh="${name}" 但 data/${name}.json 唔存在`); continue; }
    if (doc === false) continue;
    for (const [key, entry] of Object.entries(doc.entries || {})) {
      available.add(key);
      if (!entry || typeof entry !== "object" || !("value" in entry)) {
        warn(`W3 data/${name}.json: entry「${key}」冇 value`);
        continue;
      }
      if (!/^\d{4}-\d{2}$/.test(String(entry.verifiedOn || ""))) {
        warn(`W3 data/${name}.json: entry「${key}」嘅 verifiedOn 唔係 YYYY-MM`);
      }
      if ("volatility" in entry && !VALID_VOLATILITY.has(entry.volatility)) {
        warn(`W3 data/${name}.json: entry「${key}」嘅 volatility「${entry.volatility}」唔係 low/normal/high`);
      }
      if (entry.volatility === "high" && !entry.volatileNote) {
        warn(`W3 data/${name}.json: entry「${key}」係 high 但冇 volatileNote（橫幅會用預設文案）`);
      }
    }
  }
  for (const key of usedKeys) {
    if (!available.has(key)) warn(`W2 ${relPath}: data-fresh-key="${key}" 喺引用嘅資料檔搵唔到`);
  }

  // data-aff key 對照
  const affPath = path.join(DATA_DIR, "affiliates.json");
  let affDoc = null;
  if (fs.existsSync(affPath)) {
    try { affDoc = JSON.parse(fs.readFileSync(affPath, "utf8")); }
    catch (e) { err(`E6 data/affiliates.json 唔係合法 JSON：${e.message}`); }
  }
  const affRe = /data-aff=["']([^"']+)["']/gi;
  while ((m = affRe.exec(html))) {
    if (!affDoc) { err(`E6 ${relPath}: 用咗 data-aff 但讀唔到 data/affiliates.json`); break; }
    if (!affDoc.links || !affDoc.links[m[1]]) warn(`W4 ${relPath}: data-aff="${m[1]}" 喺 affiliates.json 冇對應 entry`);
  }
}

/* ------------------------------------------------------------------ */
/* sitemap / robots                                                    */
/* ------------------------------------------------------------------ */

function writeSitemap(pages) {
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pages.map((p) => {
      const loc = SITE_ORIGIN + canonicalPath(p.relPath);
      const lastmod = p.metas["jsonld:dateModified"] || p.metas["jsonld:datePublished"] || "";
      return "  <url>\n" + `    <loc>${loc}</loc>\n` +
        (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : "") + "  </url>\n";
    }).join("") +
    "</urlset>\n";
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml, "utf8");
  return pages.length;
}

function writeRobots() {
  fs.writeFileSync(path.join(ROOT, "robots.txt"),
    "# hk_eats — 由 scripts/build.mjs 生成，唔好手改\n" +
    "User-agent: *\nAllow: /\n\n" + `Sitemap: ${SITE_ORIGIN}/sitemap.xml\n`, "utf8");
}

/* ------------------------------------------------------------------ */
/* 主流程                                                               */
/* ------------------------------------------------------------------ */

console.log(`hk_eats build — root ${ROOT}`);
console.log(`SITE_ORIGIN = ${SITE_ORIGIN}`);
console.log("");

let extLinks = 0;
for (const file of [...htmlFiles, ...jsFiles]) {
  const text = fs.readFileSync(file, "utf8");
  if (file.endsWith(".html")) {
    extLinks += checkExternalLinks(file, text);
    checkExternalImages(file, text);
    checkAdOrdering(file, text);
  }
  checkAdNetworkCode(file, text);
}
console.log(`[1/6] 外部連結白名單：掃 ${htmlFiles.length} 頁，${extLinks} 條絕對連結`);
console.log(`[2/6] 外部圖片 / 廣告代碼掃描：${htmlFiles.length + jsFiles.length} 個檔`);

const sizeChecks = checkAdSlotSizes();
console.log(`[3/6] 廣告位尺寸對帳：${sizeChecks} 組高度同 ad-slots.json 一致`);

const svgScanned = checkSvgVolatiles();
console.log(`      SVG 易耗值掃描：${svgScanned} 個檔`);

const pages = [];
let svgCount = 0;
for (const file of htmlFiles) {
  const relPath = rel(file);
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  const svgRes = injectSvgs(relPath, html);
  html = svgRes.html;
  svgCount += svgRes.injected;

  html = html.replace(LD_BLOCK_RE, "");
  const metas = readMetas(html);
  const doc = buildGraph(relPath, html, metas);
  let injected = false;
  if (doc) {
    const block = LD_START + "\n" + '<script type="application/ld+json">\n' +
      JSON.stringify(doc, null, 2) + "\n</script>\n" + LD_END + "\n";
    if (!/<\/head>/i.test(html)) err(`E6 ${relPath}: 搵唔到 </head>`);
    else { html = html.replace(/<\/head>/i, block + "</head>"); injected = true; }
  } else if (!metas["jsonld:type"]) {
    warn(`W5 ${relPath}: 冇 jsonld:type meta`);
  }

  if (html !== before) fs.writeFileSync(file, html, "utf8");
  pages.push({ relPath, metas, injected });
}
console.log(`[4/6] SVG 注入：${svgCount} 張；JSON-LD 注入：${pages.filter((p) => p.injected).length}/${pages.length} 頁`);

for (const file of htmlFiles) checkPageData(rel(file), fs.readFileSync(file, "utf8"));
const articleCount = htmlFiles.filter((f) => path.basename(f) !== "index.html").length;
console.log(`[5/6] 文章 ↔ data 對應檢查：${articleCount} 篇文章`);

writeSitemap(pages);
writeRobots();
console.log(`[6/6] sitemap.xml（${pages.length} 條 URL）、robots.txt：已生成`);

console.log("");
console.log("生成／改寫嘅檔案：");
console.log("  sitemap.xml");
console.log("  robots.txt");
for (const p of pages) if (p.injected) console.log(`  ${p.relPath}`);

if (warnings.length) { console.log(""); for (const m of warnings) console.log(`WARNING ${m}`); }
if (errors.length) { console.log(""); for (const m of errors) console.error(`ERROR   ${m}`); }

console.log("");
console.log(`完成：${errors.length} error、${warnings.length} warning。`);
process.exit(errors.length ? 1 : 0);
