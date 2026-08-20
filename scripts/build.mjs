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

const SKIP_DIRS = new Set([".git", "node_modules", "scripts", ".github", "assets"]);

/* 四個內容分區。pillar 名同 nav 名喺呢度定義一次，
 * 麵包屑（可見 + JSON-LD）全部由呢度生成，唔會同頁面寫嘅內容行開。 */
const SECTIONS = {
  guides: { pillar: "港人北上完整指南", nav: "北上實務" },
  areas:  { pillar: "港深食飲地圖",     nav: "分區地圖" },
  coffee: { pillar: "港深咖啡入門",     nav: "咖啡" },
  trips:  { pillar: "香港出發行程設計", nav: "行程模板" },
};

/* /en/ 係預留目錄，本次唔填內容，亦唔對外宣告。 */
const RESERVED_DIRS = new Set(["en"]);

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
/* E8 唔准宣告未存在的英文版                                            */
/* ------------------------------------------------------------------ */

/* /en/ 目前係空目錄。任何 hreflang="en"、x-default 或者指向 /en/ 嘅連結
 * 都係向搜尋引擎同讀者宣告一個唔存在嘅版本，所以一律攔。
 * 真係有英文內容之後，先放寬呢條。 */
function checkNoBilingualClaims(file, text) {
  const r = rel(file);
  const patterns = [
    { re: /hreflang\s*=\s*["'](?!zh-HK["'])[^"']*["']/gi, why: "hreflang 指向非 zh-HK 版本" },
    { re: /href\s*=\s*["'][^"']*\/en\/[^"']*["']/gi,      why: "連結指向未填內容嘅 /en/" },
    { re: /<html[^>]*\blang\s*=\s*["'](?!zh-HK["'])[^"']*["']/gi, why: "html lang 唔係 zh-HK" },
  ];
  for (const p of patterns) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(text))) {
      err(`E8 ${r}:${lineOf(text, m.index)} ${p.why}：「${m[0].slice(0, 60)}」→ /en/ 未有內容前唔准對外宣告雙語`);
    }
  }
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
/* 麵包屑（可見 markup + BreadcrumbList，同一個來源）                    */
/* ------------------------------------------------------------------ */

const BC_START = "<!-- build:breadcrumb -->";
const BC_END = "<!-- /build:breadcrumb -->";
const BC_BLOCK_RE = /[ \t]*<!-- build:breadcrumb -->[\s\S]*?<!-- \/build:breadcrumb -->\n?/g;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* 回傳 [{ name, href|null }]；href = null 代表當前頁 */
function breadcrumbTrail(relPath, metas) {
  if (relPath === "index.html") return null;
  const parts = relPath.split("/");
  const dir = parts.length > 1 ? parts[0] : null;
  const sec = dir && SECTIONS[dir];
  if (!sec) return null;

  const isPillar = parts[1] === "index.html";
  const trail = [{ name: "首頁", href: "../index.html", abs: "/" }];
  if (isPillar) {
    trail.push({ name: sec.pillar, href: null, abs: `/${dir}/` });
  } else {
    trail.push({ name: sec.pillar, href: "./index.html", abs: `/${dir}/` });
    trail.push({ name: metas["jsonld:headline"] || metas["jsonld:breadcrumbName"] || parts[1].replace(/\.html$/, ""),
                 href: null, abs: `/${relPath}` });
  }
  return trail;
}

function renderBreadcrumb(trail) {
  const items = trail.map((t) =>
    t.href
      ? `      <li><a href="${esc(t.href)}">${esc(t.name)}</a></li>`
      : `      <li><span aria-current="page">${esc(t.name)}</span></li>`
  ).join("\n");
  return (
    BC_START + "\n" +
    `<nav class="breadcrumb" aria-label="麵包屑">\n` +
    `  <ol>\n${items}\n  </ol>\n` +
    `</nav>\n` +
    BC_END + "\n"
  );
}

function breadcrumbLd(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: SITE_ORIGIN + t.abs,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* 錨點目錄（TOC）+ h2 id                                               */
/* ------------------------------------------------------------------ */

const TOC_START = "<!-- build:toc -->";
const TOC_END = "<!-- /build:toc -->";
const TOC_BLOCK_RE = /[ \t]*<!-- build:toc -->[\s\S]*?<!-- \/build:toc -->\n?/g;
const TOC_MIN_CHARS = 1200;
const TOC_MIN_H2 = 3;

/* 由標題文字生成 id：保留中日韓字同英數，其餘一律當分隔。
 * 中文 fragment 喺 URL 入面會被 percent-encode，瀏覽器照跳得到。 */
function slugify(text) {
  const cleaned = String(text)
    .replace(/[\u3000-\u303F\uFF00-\uFF65]/g, " ")   // 中文標點、全形符號
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-zA-Z0-9]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return cleaned.slice(0, 24) || "";
}

/* 掃 <h2>，補 id（build 加嘅會帶 data-build-id，之後可以跟住標題重生），
 * 回傳 [{ id, text }] 同改咗嘅 html。 */
function ensureH2Ids(relPath, html) {
  const used = new Set();
  // 先收集頁面上所有已存在、唔係 build 加嘅 id，避免撞
  const idRe = /\bid\s*=\s*["']([^"']+)["']/gi;
  let im;
  while ((im = idRe.exec(html))) used.add(im[1]);

  const headings = [];
  let n = 0;
  const out = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (all, attrs, inner) => {
    n++;
    const text = stripTags(inner);
    const isBuildId = /\bdata-build-id\b/.test(attrs);
    const existing = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);

    let id;
    if (existing && !isBuildId) {
      id = existing[1];                       // 人手寫嘅 id，尊重佢
      headings.push({ id, text });
      return all;
    }
    if (existing) used.delete(existing[1]);   // build 之前加嘅，收返可用

    const base = slugify(text) || `h2-${n}`;
    id = base;
    let k = 2;
    while (used.has(id)) id = `${base}-${k++}`;
    used.add(id);

    const cleanAttrs = attrs
      .replace(/\s*\bid\s*=\s*["'][^"']*["']/i, "")
      .replace(/\s*\bdata-build-id\b/i, "");
    headings.push({ id, text });
    return `<h2${cleanAttrs} id="${id}" data-build-id>${inner}</h2>`;
  });

  return { html: out, headings };
}

function renderToc(headings) {
  const items = headings
    .map((h) => `    <li><a href="#${esc(h.id)}">${esc(h.text)}</a></li>`)
    .join("\n");
  return (
    TOC_START + "\n" +
    `<nav class="toc" aria-labelledby="toc-title">\n` +
    `  <p class="toc-title" id="toc-title">本頁目錄</p>\n` +
    `  <ol>\n${items}\n  </ol>\n` +
    `</nav>\n` +
    TOC_END + "\n"
  );
}

/* 中文字數（用嚟決定要唔要 TOC） */
function cjkCount(html) {
  const m = /<article[^>]*>([\s\S]*?)<\/article>|<main[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  const body = m ? (m[1] || m[2]) : html;
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ");
  return (text.match(/[\u4e00-\u9fff]/g) || []).length;
}

/* 插入位置：首段（.lede，冇就 h1 之後第一個 </p>）之後 */
function injectToc(relPath, html, headings) {
  const block = renderToc(headings);
  if (TOC_BLOCK_RE.test(html)) {
    TOC_BLOCK_RE.lastIndex = 0;
    return html.replace(TOC_BLOCK_RE, block);
  }
  TOC_BLOCK_RE.lastIndex = 0;
  const lede = /<p class="lede">[\s\S]*?<\/p>\n?/i.exec(html);
  if (lede) {
    const at = lede.index + lede[0].length;
    return html.slice(0, at) + "\n" + block + html.slice(at);
  }
  const h1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.exec(html);
  if (h1) {
    const after = html.indexOf("</p>", h1.index);
    if (after !== -1) {
      const at = after + "</p>".length;
      return html.slice(0, at) + "\n\n" + block + html.slice(at);
    }
  }
  err(`E10 ${relPath}: 搵唔到插入 TOC 嘅位置（冇 .lede 亦冇 h1 後嘅段落）`);
  return html;
}

/* E10：全頁 id 唯一 */
function checkUniqueIds(relPath, html) {
  const seen = new Map();
  const re = /\bid\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const id = m[1];
    seen.set(id, (seen.get(id) || 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) err(`E10 ${relPath}: id="${id}" 出現 ${count} 次，唔唯一`);
  }
  const h2NoId = /<h2\b(?![^>]*\bid\s*=)[^>]*>/i.exec(html);
  if (h2NoId) err(`E10 ${relPath}: 有 <h2> 冇 id（${h2NoId[0].slice(0, 40)}）`);
}

/* ------------------------------------------------------------------ */
/* 全站最後更新（首頁用）                                                */
/* ------------------------------------------------------------------ */

const LU_START = "<!-- build:lastupdate -->";
const LU_END = "<!-- /build:lastupdate -->";
const LU_BLOCK_RE = /<!-- build:lastupdate -->[\s\S]*?<!-- \/build:lastupdate -->/g;

function latestVerifiedOn() {
  let best = null;
  const walkJson = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { walkJson(full); continue; }
      if (!ent.name.endsWith(".json")) continue;
      let doc;
      try { doc = JSON.parse(fs.readFileSync(full, "utf8")); } catch { continue; }
      for (const entry of Object.values((doc && doc.entries) || {})) {
        const v = entry && entry.verifiedOn;
        if (/^\d{4}-\d{2}$/.test(String(v || "")) && (!best || v > best)) best = v;
      }
    }
  };
  const dataDir = path.join(ROOT, "data");
  if (fs.existsSync(dataDir)) walkJson(dataDir);
  return best;
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

  // 麵包屑唔洗喺 meta 宣告 —— 由路徑同 SECTIONS 推出嚟，
  // 咁可見麵包屑同 BreadcrumbList 一定一致。
  const trail = breadcrumbTrail(relPath, metas);
  if (trail) graph.push(breadcrumbLd(trail));

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
  // 只有分區目錄之下嘅非 index 頁先算「文章」——根目錄嘅 about.html
  // 之類唔需要易耗芯。
  const isArticle = relPath.includes("/") && path.basename(relPath) !== "index.html";

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
      // 有 needsVerify 嘅 entry 係「明示留白」，唔應該當成結構錯誤 ——
      // 佢由 W7 獨立列出，唔喺呢度重複報。
      if (entry && entry.needsVerify) {
        if ("value" in entry && entry.value !== null) {
          warn(`W3 data/${name}.json: entry「${key}」同時有 needsVerify 同 value，應該二擇其一`);
        }
        if (entry.verifiedOn) {
          warn(`W3 data/${name}.json: entry「${key}」有 needsVerify 就唔應該有 verifiedOn（未核實就冇核實日期）`);
        }
        if ("volatility" in entry && !VALID_VOLATILITY.has(entry.volatility)) {
          warn(`W3 data/${name}.json: entry「${key}」嘅 volatility「${entry.volatility}」唔係 low/normal/high`);
        }
        if (entry.volatility === "high" && !entry.volatileNote) {
          warn(`W3 data/${name}.json: entry「${key}」係 high 但冇 volatileNote`);
        }
        continue;
      }
      if (!entry || typeof entry !== "object" || !("value" in entry)) {
        warn(`W3 data/${name}.json: entry「${key}」冇 value（如果係未核實，應該用 needsVerify）`);
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
/* E9 孤兒頁 / W6 點擊深度                                              */
/* ------------------------------------------------------------------ */

/* 由某頁嘅 href 解析出目標頁（repo 相對路徑），唔係內部頁就回 null */
function resolveInternal(fromRel, href) {
  const raw = String(href).trim();
  if (!raw) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(raw)) return null;  // 絕對／協議相對
  if (/^(?:mailto:|tel:|#)/i.test(raw)) return null;
  const clean = raw.split("#")[0].split("?")[0];
  if (!clean) return null;
  const fromDir = path.posix.dirname(fromRel);
  let target = path.posix.normalize(path.posix.join(fromDir === "." ? "" : fromDir, clean));
  if (target.startsWith("../")) return null;
  if (target.endsWith("/")) target += "index.html";
  if (!target.endsWith(".html")) return null;
  return target;
}

function buildLinkGraph(pageList) {
  const graph = new Map();     // from → Set(to)
  const inbound = new Map();   // to → Set(from)
  for (const { relPath, html } of pageList) {
    const outs = new Set();
    const re = /<a\b[^>]*?\bhref\s*=\s*["']([^"']*)["']/gi;
    let m;
    while ((m = re.exec(html))) {
      const t = resolveInternal(relPath, m[1]);
      if (!t || t === relPath) continue;
      outs.add(t);
      if (!inbound.has(t)) inbound.set(t, new Set());
      inbound.get(t).add(relPath);
    }
    graph.set(relPath, outs);
  }
  return { graph, inbound };
}

function checkLinkStructure(pageList) {
  const all = new Set(pageList.map((p) => p.relPath));
  const { graph, inbound } = buildLinkGraph(pageList);

  // 連到唔存在嘅頁
  for (const [from, outs] of graph) {
    for (const t of outs) {
      if (!all.has(t)) err(`E9 ${from}: 連結指向唔存在嘅頁「${t}」`);
    }
  }

  // 孤兒頁：冇任何其他頁連入
  const orphans = [];
  for (const relPath of all) {
    if (relPath === "index.html") continue;   // 首頁係入口，唔需要入連
    const inb = inbound.get(relPath);
    if (!inb || inb.size === 0) orphans.push(relPath);
  }
  for (const o of orphans) err(`E9 孤兒頁：${o} 冇任何頁面連入`);

  // BFS 算由首頁去每頁嘅最短點擊數
  const depth = new Map([["index.html", 0]]);
  const queue = ["index.html"];
  while (queue.length) {
    const cur = queue.shift();
    for (const next of graph.get(cur) || []) {
      if (!all.has(next) || depth.has(next)) continue;
      depth.set(next, depth.get(cur) + 1);
      queue.push(next);
    }
  }
  const unreachable = [...all].filter((p) => !depth.has(p));
  for (const u of unreachable) err(`E9 由首頁去唔到：${u}`);
  const deep = [...depth.entries()].filter(([, d]) => d > 3);
  for (const [p, d] of deep) warn(`W6 ${p}: 由首頁要 ${d} click 先去到（超過 3）`);

  return { orphans: orphans.length, depth, inbound, graph, maxDepth: Math.max(...depth.values()) };
}

/* ------------------------------------------------------------------ */
/* W8 cluster → pillar 內連                                             */
/* ------------------------------------------------------------------ */

/* 每篇 cluster 都要用一個「含 pillar 關鍵字」嘅 anchor 連返所屬 pillar，
 * 而且要喺頁面上半部 —— 咁樣讀者同爬蟲都容易由文章行返上去主題頁。 */
function checkPillarLinks(pageList) {
  const results = [];
  for (const { relPath, html } of pageList) {
    const parts = relPath.split("/");
    if (parts.length < 2 || parts[1] === "index.html") continue;
    const sec = SECTIONS[parts[0]];
    if (!sec) continue;

    const bodyM = /<article[^>]*>([\s\S]*?)<\/article>/i.exec(html);
    // 麵包屑一定喺最頂、一定連住 pillar，如果計佢，呢條檢查就永遠通過 ——
    // 要驗嘅係正文有冇真嘅內連，所以要先剝走麵包屑同廣告位。
    const body = (bodyM ? bodyM[1] : html)
      .replace(BC_BLOCK_RE, "")
      .replace(/<nav class="breadcrumb"[\s\S]*?<\/nav>/gi, "");
    BC_BLOCK_RE.lastIndex = 0;
    const half = Math.floor(body.length / 2);

    // 正文內連總數（指向站內其他頁）
    const allRe = /<a\b[^>]*?\bhref\s*=\s*["']([^"']*)["']/gi;
    let am, bodyLinks = 0;
    while ((am = allRe.exec(body))) {
      const t = resolveInternal(relPath, am[1]);
      if (t && t !== relPath) bodyLinks++;
    }
    if (bodyLinks < 3) warn(`W8 ${relPath}: 正文內連只有 ${bodyLinks} 條，要求 3–5 條`);
    else if (bodyLinks > 5) warn(`W8 ${relPath}: 正文內連有 ${bodyLinks} 條，超出 3–5 條`);

    const re = /<a\b[^>]*?\bhref\s*=\s*["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m, best = null, total = 0;
    while ((m = re.exec(body))) {
      const target = resolveInternal(relPath, m[1]);
      if (target !== `${parts[0]}/index.html`) continue;
      total++;
      const text = stripTags(m[2]);
      const hasKeyword = text.includes(sec.pillar);
      const inTopHalf = m.index < half;
      if (!best || (hasKeyword && inTopHalf && !(best.hasKeyword && best.inTopHalf))) {
        best = { text, hasKeyword, inTopHalf, at: m.index };
      }
    }

    if (total === 0) {
      warn(`W8 ${relPath}: 完全冇連返所屬 pillar（${parts[0]}/index.html）`);
    } else if (!best.hasKeyword) {
      warn(`W8 ${relPath}: 連返 pillar 嘅 anchor「${best.text}」唔含 pillar 關鍵字「${sec.pillar}」`);
    } else if (!best.inTopHalf) {
      warn(`W8 ${relPath}: 含關鍵字嘅 pillar 連結喺頁面下半部（位置 ${best.at}/${body.length}）`);
    }
    results.push({ relPath, total, bodyLinks, ok: !!best && best.hasKeyword && best.inTopHalf && bodyLinks >= 3 && bodyLinks <= 5 });
  }
  return results;
}

/* ------------------------------------------------------------------ */
/* W7 未核實標記                                                        */
/* ------------------------------------------------------------------ */

const NEEDS_VERIFY_RE = /\{\{\s*NEEDS_VERIFY\s*:\s*([^}]*)\}\}/g;

function collectNeedsVerify(pageList) {
  const found = [];
  for (const { relPath, html } of pageList) {
    NEEDS_VERIFY_RE.lastIndex = 0;
    let m;
    while ((m = NEEDS_VERIFY_RE.exec(html))) {
      found.push({ where: `${relPath}:${lineOf(html, m.index)}`, what: m[1].trim(), kind: "HTML" });
    }
  }
  const dataDir = path.join(ROOT, "data");
  const walkJson = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) { walkJson(full); continue; }
      if (!ent.name.endsWith(".json")) continue;
      let doc;
      try { doc = JSON.parse(fs.readFileSync(full, "utf8")); } catch { continue; }
      for (const [key, entry] of Object.entries((doc && doc.entries) || {})) {
        if (entry && entry.needsVerify) {
          found.push({ where: `${rel(full)} → ${key}`, what: entry.needsVerify, kind: "data" });
        }
      }
    }
  };
  if (fs.existsSync(dataDir)) walkJson(dataDir);
  for (const f of found) warn(`W7 待核實（${f.kind}）${f.where}：${f.what}`);
  return found;
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
    checkNoBilingualClaims(file, text);
  }
  checkAdNetworkCode(file, text);
}
console.log(`[1/8] 外部連結白名單 + 雙語宣告：掃 ${htmlFiles.length} 頁，${extLinks} 條絕對連結`);
console.log(`[2/8] 外部圖片 / 廣告代碼掃描：${htmlFiles.length + jsFiles.length} 個檔`);

const sizeChecks = checkAdSlotSizes();
console.log(`[3/8] 廣告位尺寸對帳：${sizeChecks} 組高度同 ad-slots.json 一致`);

const svgScanned = checkSvgVolatiles();
console.log(`      SVG 易耗值掃描：${svgScanned} 個檔`);

const pages = [];
let svgCount = 0;
let bcCount = 0;
let tocCount = 0;
const tocPages = [];
const latestUpdate = latestVerifiedOn();
for (const file of htmlFiles) {
  const relPath = rel(file);
  let html = fs.readFileSync(file, "utf8");
  const before = html;

  const svgRes = injectSvgs(relPath, html);
  html = svgRes.html;
  svgCount += svgRes.injected;

  html = html.replace(LD_BLOCK_RE, "");
  const metas = readMetas(html);

  // h2 id（全部頁都要，TOC 只加喺分區內、夠長嘅文）
  const idRes = ensureH2Ids(relPath, html);
  html = idRes.html;

  const inSection = relPath.includes("/") && !!SECTIONS[relPath.split("/")[0]];
  const chars = cjkCount(html);
  if (inSection && chars >= TOC_MIN_CHARS && idRes.headings.length >= TOC_MIN_H2) {
    html = injectToc(relPath, html, idRes.headings);
    tocCount++;
    tocPages.push({ relPath, chars, headings: idRes.headings.length });
  } else if (TOC_BLOCK_RE.test(html)) {
    TOC_BLOCK_RE.lastIndex = 0;
    html = html.replace(TOC_BLOCK_RE, "");   // 唔再合資格就移走舊 TOC
  }
  TOC_BLOCK_RE.lastIndex = 0;

  // 全站最後更新（放咗錨點嘅頁先會有）
  if (LU_BLOCK_RE.test(html) || /<!--\s*lastupdate\s*-->/.test(html)) {
    const lu = LU_START + (latestUpdate || "未有核實資料") + LU_END;
    LU_BLOCK_RE.lastIndex = 0;
    html = LU_BLOCK_RE.test(html)
      ? (LU_BLOCK_RE.lastIndex = 0, html.replace(LU_BLOCK_RE, lu))
      : html.replace(/<!--\s*lastupdate\s*-->/, lu);
    LU_BLOCK_RE.lastIndex = 0;
  }

  // 麵包屑：一步完成，唔好「先剝後補」——剝完先發現補唔到，就會寫低一個
  // 連錨點都冇嘅檔，之後永遠 build 唔返。
  const trail = breadcrumbTrail(relPath, metas);
  if (trail) {
    const block = renderBreadcrumb(trail);
    if (BC_BLOCK_RE.test(html)) {
      BC_BLOCK_RE.lastIndex = 0;
      html = html.replace(BC_BLOCK_RE, block);
      bcCount++;
    } else if (/<!--\s*breadcrumb\s*-->/.test(html)) {
      html = html.replace(/[ \t]*<!--\s*breadcrumb\s*-->\n?/, block);
      bcCount++;
    } else {
      err(`E9 ${relPath}: 搵唔到 <!-- breadcrumb --> 錨點，麵包屑注入唔到`);
    }
    BC_BLOCK_RE.lastIndex = 0;
  }
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
  pages.push({ relPath, metas, injected, html });
}
console.log(`[4/8] SVG ${svgCount} 張；麵包屑 ${bcCount} 頁；目錄 ${tocCount} 頁；JSON-LD ${pages.filter((p) => p.injected).length}/${pages.length} 頁`);
console.log(`      全站最新 verifiedOn：${latestUpdate || "（冇）"}`);

for (const { relPath, html } of pages) checkUniqueIds(relPath, html);

/* W9：文章頭嘅日期要用「最後更新：」而且同 jsonld:dateModified 一致 */
for (const { relPath, html, metas } of pages) {
  const m = /<p class="meta-line">([\s\S]*?)<\/p>/i.exec(html);
  if (!m) continue;
  // 首頁嗰行係全站最後更新（取自最新 verifiedOn，格式 YYYY-MM），
  // 唔係文章日期，唔適用呢條規則。
  if (m[1].includes(LU_START)) continue;
  const text = stripTags(m[1]);
  const want = metas["jsonld:dateModified"] || metas["jsonld:datePublished"];
  if (!/最後更新：/.test(text)) {
    warn(`W9 ${relPath}: 文章日期行冇「最後更新：」前綴（「${text}」）`);
  } else if (want && !text.includes(want)) {
    warn(`W9 ${relPath}: 文章日期行嘅日期同 jsonld:dateModified（${want}）唔一致（「${text}」）`);
  }
}

for (const file of htmlFiles) checkPageData(rel(file), fs.readFileSync(file, "utf8"));
const articleCount = htmlFiles.filter((f) => path.basename(f) !== "index.html").length;
console.log(`[5/8] 文章 ↔ data 對應檢查：${articleCount} 篇文章`);

const linkStats = checkLinkStructure(pages);
console.log(`[6/8] 內連結構：${pages.length} 頁，孤兒 ${linkStats.orphans} 個，最深 ${linkStats.maxDepth} click`);

const pillarLinks = checkPillarLinks(pages);
console.log(`      cluster → pillar 內連：${pillarLinks.filter((r) => r.ok).length}/${pillarLinks.length} 篇合格`);

const nv = collectNeedsVerify(pages);
console.log(`[7/8] 待核實標記：${nv.length} 個（HTML ${nv.filter((x) => x.kind === "HTML").length} / data ${nv.filter((x) => x.kind === "data").length}）`);

const sitemapPages = pages.filter((p) => !RESERVED_DIRS.has(p.relPath.split("/")[0]));
if (sitemapPages.length !== pages.length) {
  console.log(`      sitemap 排除預留目錄：${pages.length - sitemapPages.length} 頁`);
}
writeSitemap(sitemapPages);
writeRobots();
console.log(`[8/8] sitemap.xml（${sitemapPages.length} 條 URL）、robots.txt：已生成`);

console.log("");
console.log("生成／改寫嘅檔案：");
console.log("  sitemap.xml");
console.log("  robots.txt");
for (const p of pages) if (p.injected) console.log(`  ${p.relPath}`);

console.log("");
console.log("錨點目錄：");
for (const t of tocPages) console.log(`  ${t.relPath.padEnd(34)} ${String(t.chars).padStart(5)} 字　${t.headings} 個 h2`);

console.log("");
console.log("由首頁計嘅點擊深度：");
for (const [p, d] of [...linkStats.depth.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))) {
  const inb = linkStats.inbound.get(p);
  console.log(`  ${String(d)} click  ${p.padEnd(34)} 入連 ${inb ? inb.size : 0} 條  出連 ${(linkStats.graph.get(p) || new Set()).size} 條`);
}

if (warnings.length) { console.log(""); for (const m of warnings) console.log(`WARNING ${m}`); }
if (errors.length) { console.log(""); for (const m of errors) console.error(`ERROR   ${m}`); }

console.log("");
console.log(`完成：${errors.length} error、${warnings.length} warning。`);
process.exit(errors.length ? 1 : 0);
