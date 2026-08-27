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
 * ⚠️ 有啲 data entry 冇 data-fresh-key，係俾 E13/E17 對數用，唔係孤兒，唔准刪。
 *    E17 靠「呢個 host 有冇喺同名 data 檔出現過」決定要唔要對數 —— 刪咗
 *    data 嗰邊，守衛就會靜靜放行所有嗰個網域嘅連結。E13 同理：披露聲明
 *    嘅正本存喺 data，頁面必須有 .callout-disclosure，兩邊對唔上就 error。
 *    而家嘅守衛錨點：guides/border-crossings 同 trips/trip-tools 各自嘅
 *    hkbcp.url.inbound / .outbound、trips/trip-tools 嘅 apps.storeLinks.android
 *    同 apps.disclosure。做「孤兒 entry」盤點時要當佢哋有引用。
 *
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
/* 發布模式：node scripts/build.mjs --publish
 * 平時 build 唔受影響 —— 施工中有待核實標記係正常。發布前先跑呢個模式，
 * 任何一頁仲有標記就唔應該出街。 */
const PUBLISH = process.argv.includes("--publish");

const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://example.github.io/hk_eats").replace(/\/+$/, "");
/* 顯示層品牌。目錄名／repo 名／SITE_ORIGIN 入面嘅 hk_eats 係基建標識，
 * 唔喺顯示層，所以唔改。 */
const SITE_NAME = "歎世界";
const SITE_TAGLINE = "香港出發的食飲與旅行指南";
const SITE_LANG = "zh-HK";
const LEGACY_DISPLAY_STRINGS = ["hk_eats", "港深食飲指南", "香港出發行程設計", "行程模板", "港深食飲地圖"];
const SITE_HOST = (() => { try { return new URL(SITE_ORIGIN).host; } catch { return ""; } })();

const SKIP_DIRS = new Set([".git", "node_modules", "scripts", ".github", "assets"]);

/* 四個內容分區。pillar 名同 nav 名喺呢度定義一次，
 * 麵包屑（可見 + JSON-LD）全部由呢度生成，唔會同頁面寫嘅內容行開。 */
const SECTIONS = {
  guides: { pillar: "港人北上完整指南", nav: "北上實務" },
  areas:  { pillar: "內地食飲地圖",     nav: "分區地圖" },
  notes:  { pillar: "實食紀錄",         nav: "實食紀錄" },
  coffee: { pillar: "港深咖啡入門",     nav: "咖啡" },
  trips:  { pillar: "北上行程",         nav: "北上行程" },
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
    // 官方 app 商店。預留畀 trips/trip-tools 嘅 apps.storeLinks —— 該項
    // 目前仲係 needsVerify，所以站內暫時一條商店連結都冇；白名單
    // 先開定，等資料補齊即刻用得。呢兩個網域係商店官方頁，唔帶佣金。
    "apps.apple.com",        // App Store
    "play.google.com",       // Google Play
    // 本站自己喺各平台嘅帳號。只可以喺 about.html 出現 —— E18 會攔住
    // 佢哋走入任何文章頁。放行嘅係「本站帳號主頁」，唔係平台上面
    // 任何一間店嘅頁；後者屬於會過期嘅內容，應該入資料檔而唔係硬連。
    "www.dianping.com",      // 大眾點評：香港人美食家
    "www.xiaohongshu.com",   // 小紅書：香港人｜美食實測
    "www.youtube.com",       // YouTube：Wandering Chef's Fork
    "space.bilibili.com",    // B站：香港人美食家
    "www.douyin.com",        // 抖音：港仔咖啡旅行食記
  ],
};

/* 平台帳號網域：放行，但只限 about.html。E18 靠呢個表判斷。 */
const PLATFORM_HOSTS = new Set([
  "www.dianping.com",
  "www.xiaohongshu.com",
  "www.youtube.com",
  "space.bilibili.com",
  "www.douyin.com",
]);
const PLATFORM_ONLY_PAGE = "about.html";

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
    let parsed;
    try { parsed = new URL(href.startsWith("//") ? "https:" + href : href); } catch { parsed = null; }
    if (parsed && parsed.protocol !== "https:") {
      err(`E1 ${r}:${lineOf(text, m.index)} 外部連結唔係 https（${href.slice(0, 70)}）`);
    }
    if (parsed && (parsed.pathname === "" || parsed.pathname === "/")) {
      err(
        `E1 ${r}:${lineOf(text, m.index)} 外部連結指向根網域（${href.slice(0, 70)}）→ ` +
        `要連去具體嘅官方頁面，唔好淨係連個網域`
      );
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
    /* E18 平台帳號連結只准出現喺 about.html。
     * 文章頁嘅角色係「用香港人嘅尺量外面嘅世界」，唔係導流去自己嘅
     * 社交帳號；而且平台連結一旦散落各篇，改一個帳號就要全站搵。
     * 集中喺一版，改一次就得。 */
    if (PLATFORM_HOSTS.has(host.toLowerCase()) && r !== PLATFORM_ONLY_PAGE) {
      err(
        `E18 ${r}:${lineOf(text, m.index)} 平台帳號連結「${host}」只准出現喺 ` +
        `${PLATFORM_ONLY_PAGE}，唔准出現喺文章頁`
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
/* <title> 同 Open Graph：由 build 統一生成，唔喺頁面手寫              */
/* ------------------------------------------------------------------ */

const OG_START = "<!-- build:og -->";
const OG_END = "<!-- /build:og -->";
const OG_BLOCK_RE = /[ \t]*<!-- build:og -->[\s\S]*?<!-- \/build:og -->\n?/g;

function pageTitle(relPath, metas, currentTitle) {
  if (relPath === "index.html") return `${SITE_NAME} — ${SITE_TAGLINE}`;
  const head = metas["jsonld:headline"] ||
               (currentTitle || "").replace(new RegExp(`\\s*—\\s*${SITE_NAME}$`), "").trim() ||
               relPath;
  return `${head} — ${SITE_NAME}`;
}

/* 品牌位（nav 左上角）由 SITE_NAME 生成，中間一個字上 accent 色。
 * 唔靠頁面手寫 —— 手寫嘅版本會跟住舊模板一路複製落去。 */
function brandMarkup() {
  const chars = [...SITE_NAME];
  if (chars.length < 3) return esc(SITE_NAME);
  const mid = Math.floor(chars.length / 2);
  return esc(chars.slice(0, mid).join("")) +
         "<span>" + esc(chars[mid]) + "</span>" +
         esc(chars.slice(mid + 1).join(""));
}

/* 注意次序：先驗「檔案入面原本寫住咩」，再正規化。
 * 如果掉轉做，build 會靜靜咁修好然後檢查永遠 pass —— 咁個檢查就等於冇。
 * 而家嘅行為係：發現 drift → 報 error（exit 1）＋ 同時修好輸出，
 * 令你知道發生過，而唔係下次先發現。 */
function injectBrand(relPath, html) {
  const re = /(<a class="brand"[^>]*>)([\s\S]*?)(<\/a>)/i;
  const m = re.exec(html);
  if (!m) {
    err(`E14 ${relPath}: 搵唔到 <a class="brand">，品牌位注入唔到`);
    return html;
  }
  const authored = stripTags(m[2]).replace(/\s+/g, "");
  if (authored !== SITE_NAME) {
    err(
      `E14 ${relPath}: nav 品牌位原本寫住「${authored}」，唔等於 SITE_NAME「${SITE_NAME}」` +
      `（已同時正規化輸出，但請修返個來源）`
    );
  }
  return html.replace(re, (_all, open, _inner, close) => open + brandMarkup() + close);
}

/* <title> 由 build 生成，所以驗生成後嘅版本係廢話。真正要驗嘅係
 * 「作者原本寫咗咩」——入面唔應該有舊品牌字串。 */
function checkAuthoredTitle(relPath, currentTitle) {
  if (!currentTitle) return;
  const plain = stripTags(currentTitle).replace(/\s+/g, "");
  for (const legacy of LEGACY_DISPLAY_STRINGS) {
    if (plain.includes(legacy)) {
      err(`E14 ${relPath}: <title> 原本寫住舊字串「${legacy}」（「${plain}」）`);
    }
  }
}

function renderOg(relPath, metas, title) {
  const url = SITE_ORIGIN + canonicalPath(relPath);
  const desc = metas["jsonld:description"] || metas["description"] || SITE_TAGLINE;
  const type = relPath === "index.html" ? "website" : "article";
  const lines = [
    `<meta property="og:site_name" content="${esc(SITE_NAME)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:locale" content="zh_HK">`,
  ];
  return OG_START + "\n" + lines.join("\n") + "\n" + OG_END + "\n";
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

  if (relPath === "index.html") {
    graph.push({
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: SITE_TAGLINE,
      url: SITE_ORIGIN + "/",
      inLanguage: SITE_LANG,
      publisher,
    });
  }

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
/* E14 顯示層一致性：nav 同 footer 唔准行開                             */
/* ------------------------------------------------------------------ */

/* 呢條係由一次真實失手嚟嘅：trips/trip-tools.html 用咗一個喺品牌更名
 * 之前寫嘅頁面模板，結果 footer 留低咗舊品牌名，而當時嘅殘留掃描
 * 早過新頁存在，所以掃唔到。人手掃描擋唔住「之後先出現」嘅檔案，
 * 只有每次 build 都行嘅檢查先擋得住。 */
function checkDisplayConsistency(relPath, html) {
  // nav：四條分區連結嘅文字必須等於 SECTIONS 定義嘅 nav 名
  const navM = /<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/i.exec(html);
  if (!navM) {
    err(`E14 ${relPath}: 搵唔到 site-nav`);
  } else {
    const re = /<a\b[^>]*href="[^"]*\/([a-z-]+)\/index\.html"[^>]*>([\s\S]*?)<\/a>/gi;
    let m, seen = 0;
    while ((m = re.exec(navM[1]))) {
      const sec = SECTIONS[m[1]];
      if (!sec) continue;
      seen++;
      const text = stripTags(m[2]);
      if (text !== sec.nav) {
        err(`E14 ${relPath}: nav 入面「${m[1]}」寫住「${text}」，SECTIONS 定義係「${sec.nav}」`);
      }
    }
    if (seen !== Object.keys(SECTIONS).length) {
      err(`E14 ${relPath}: nav 只有 ${seen} 條分區連結，預期 ${Object.keys(SECTIONS).length} 條`);
    }
  }

  // ---- 三個品牌槽位：nav 品牌位、footer、<title> ----
  // 全部要剝走 tag 先比對。品牌位個 markup 係「歎<span>世</span>界」，
  // 直接喺原始 HTML 搵字串係搵唔到嘅 —— 上一輪就係死喺呢度。
  const brandM = /<a class="brand"[^>]*>([\s\S]*?)<\/a>/i.exec(html);
  if (!brandM) {
    err(`E14 ${relPath}: 搵唔到 nav 品牌位 <a class="brand">`);
  } else {
    // 第二道：驗最終輸出。injectBrand 已經驗過來源，呢度係防止
    // 注入本身出錯（例如 regex 撞唔到預期嘅 markup）。
    const got = stripTags(brandM[1]).replace(/\s+/g, "");
    if (got !== SITE_NAME) {
      err(`E14 ${relPath}: 注入後嘅 nav 品牌位仍然係「${got}」，唔等於「${SITE_NAME}」`);
    }
  }

  const footM = /<footer class="site-footer"[^>]*>([\s\S]*?)<\/footer>/i.exec(html);
  if (!footM) {
    err(`E14 ${relPath}: 搵唔到 site-footer`);
  } else if (!stripTags(footM[1]).includes(SITE_NAME)) {
    err(`E14 ${relPath}: footer 冇品牌名「${SITE_NAME}」`);
  }

  const titleM = /<title>([\s\S]*?)<\/title>/i.exec(html);
  if (!titleM) {
    err(`E14 ${relPath}: 冇 <title>`);
  } else if (!stripTags(titleM[1]).includes(SITE_NAME)) {
    err(`E14 ${relPath}: <title>「${stripTags(titleM[1])}」冇品牌名「${SITE_NAME}」`);
  }

  // 舊顯示字串：掃描前剝走 build 生成區塊同 SITE_ORIGIN
  // （SITE_ORIGIN 入面嘅 repo 名唔算顯示層）
  const cleaned = html
    .replace(OG_BLOCK_RE, "")
    .replace(LD_BLOCK_RE, "")
    .split(SITE_ORIGIN).join("");
  OG_BLOCK_RE.lastIndex = 0;
  LD_BLOCK_RE.lastIndex = 0;

  for (const legacy of LEGACY_DISPLAY_STRINGS) {
    // 「行程模板」喺正文入面可以係合法用詞（模板呢個概念保留），
    // 所以只喺顯示槽位（nav / h1 / title / meta-line / footer）先算違規。
    const slots = [
      [/<title>([\s\S]*?)<\/title>/i, "<title>"],
      [/<h1[^>]*>([\s\S]*?)<\/h1>/i, "<h1>"],
      [/<p class="meta-line">([\s\S]*?)<\/p>/i, ".meta-line"],
      [/<nav class="site-nav"[^>]*>([\s\S]*?)<\/nav>/i, "site-nav"],
      [/<footer class="site-footer"[^>]*>([\s\S]*?)<\/footer>/i, "site-footer"],
      [/<nav class="breadcrumb"[^>]*>([\s\S]*?)<\/nav>/i, "breadcrumb"],
    ];
    for (const [re, name] of slots) {
      const hit = re.exec(cleaned);
      // 一定要剝走 tag 先比對：「hk<span>_</span>eats」渲染出嚟係
      // 「hk_eats」，但喺原始 HTML 入面呢七個字元從來冇連續出現過。
      if (hit && stripTags(hit[1]).replace(/\s+/g, "").includes(legacy)) {
        err(`E14 ${relPath}: ${name} 仲有舊顯示字串「${legacy}」`);
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* E13 利益披露：HTML 同 data 唔准行開                                  */
/* ------------------------------------------------------------------ */

/* 利益披露（例如「本站作者係呢個 app 嘅開發者」）唔應該淨靠 freshness.js
 * 載入 —— fetch 一失敗，聲明就會消失，但文章照睇得到。所以披露文字直接
 * 寫喺 HTML；同時佢亦係 data 入面嘅一個 entry（方便統一維護）。
 * 兩邊必須一致，否則改一邊會靜靜地留低另一邊嘅舊版本。 */
function checkDisclosure(relPath, html) {
  const m = /<div[^>]*class="[^"]*\bcallout-disclosure\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);

  const base = relPath.replace(/\.html$/, "");
  const dataPath = path.join(DATA_DIR, base + ".json");
  let entry = null;
  if (fs.existsSync(dataPath)) {
    try {
      const doc = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      const hit = Object.entries(doc.entries || {})
        .find(([k, v]) => /(^|\.)disclosure$/.test(k) && v && typeof v.value === "string");
      if (hit) entry = { key: hit[0], value: hit[1].value };
    } catch { /* JSON 壞咗由 E6 處理 */ }
  }

  if (!m && !entry) return;
  if (m && !entry) {
    warn(`W12 ${relPath}: 有 .callout-disclosure 但 data/${base}.json 冇對應嘅 *.disclosure entry`);
    return;
  }
  if (!m && entry) {
    err(`E13 ${relPath}: data/${base}.json 有披露聲明「${entry.key}」，但頁面冇 .callout-disclosure —— 披露唔可以只存喺資料檔`);
    return;
  }
  const got = stripTags(m[1]).replace(/\s+/g, "");
  const want = String(entry.value).replace(/\s+/g, "");
  if (!got.includes(want)) {
    err(
      `E13 ${relPath}: 披露 callout 嘅文字同 data 嘅「${entry.key}」唔一致 —— ` +
      `改咗一邊冇改另一邊。頁面：「${stripTags(m[1]).slice(0, 40)}…」 / 資料：「${String(entry.value).slice(0, 40)}…」`
    );
  }
}

/* ------------------------------------------------------------------ */
/* E17 商店連結唔准同 data 行開                                          */
/* ------------------------------------------------------------------ */

/* 有啲外部連結要同時存在兩個地方：HTML（因為要撳得到、而且逐個唔同）
 * 同 data（因為要一次過睇晒同更新）。兩邊一行開，就會出現「頁面指去 A、
 * 資料檔寫住 B」而冇人發現。
 *
 * 判斷邊條要對數：唔用寫死嘅網域名單，而係睇「呢個 host 有冇喺同名
 * data 檔出現過」。有 → 代表呢類連結係由 data 管嘅，全條 URL 必須對得上；
 * 冇 → 代表佢淨係一條參考連結（例如 bring-back 嘅海關頁），唔管。
 * 咁樣加新一類連結唔使改守衛。 */
const EXT_URL_RE = /https?:\/\/[^\s"'<>)]+/g;

function checkStoreLinks(relPath, html) {
  const stripped = html.replace(OG_BLOCK_RE, "").replace(LD_BLOCK_RE, "");
  OG_BLOCK_RE.lastIndex = 0;
  LD_BLOCK_RE.lastIndex = 0;

  EXT_URL_RE.lastIndex = 0;
  const inHtml = [...new Set([...stripped.matchAll(EXT_URL_RE)].map((m) => m[0]))]
    .filter((u) => { try { return new URL(u).host !== SITE_HOST; } catch { return false; } });
  if (!inHtml.length) return;

  const base = relPath.replace(/\.html$/, "");
  const dataPath = path.join(DATA_DIR, base + ".json");
  if (!fs.existsSync(dataPath)) return;
  let doc;
  try { doc = JSON.parse(fs.readFileSync(dataPath, "utf8")); }
  catch { return; }  // JSON 壞咗由 E6 處理

  const haystack = JSON.stringify(doc.entries || {});
  for (const url of inHtml) {
    let host;
    try { host = new URL(url).host; } catch { continue; }
    if (!haystack.includes(host)) continue;          // 唔係由 data 管嗰類
    if (!haystack.includes(url)) {
      err(
        `E17 ${relPath}: 連結「${url}」嘅網域喺 data/${base}.json 出現過，` +
        `但全條 URL 對唔上 —— 頁面同資料檔行開咗，改一邊要兩邊一齊改`
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* E12 唔准寫死絕對網址                                                 */
/* ------------------------------------------------------------------ */

/* 全站嘅絕對 URL 只可以有兩個來源：
 *   1. build 由 SITE_ORIGIN 生成（<!-- build:og --> 同 <!-- build:jsonld --> 兩個區塊）
 *   2. 白名單上嘅外部參考連結
 * 除此之外任何 http(s):// 都係寫死，換網域嗰陣唔會跟住變。
 * 掃描前會剝走上面兩個生成區塊，剩低嘅就係人手寫嘅。 */
function checkNoHardcodedOrigin(relPath, html) {
  const stripped = html.replace(OG_BLOCK_RE, "").replace(LD_BLOCK_RE, "");
  OG_BLOCK_RE.lastIndex = 0;
  LD_BLOCK_RE.lastIndex = 0;

  const re = /https?:\/\/[^\s"'<>)]+/g;
  let m;
  while ((m = re.exec(stripped))) {
    const url = m[0];
    const before = stripped.slice(Math.max(0, m.index - 40), m.index);
    // xmlns 係命名空間識別碼，唔係連結，唔會跟網域走
    if (/xmlns(:[\w-]+)?\s*=\s*["']$/.test(before)) continue;

    let host;
    try { host = new URL(url).host; } catch { continue; }

    const at = html.indexOf(url);
    const line = at === -1 ? "?" : lineOf(html, at);
    if (host === SITE_HOST) {
      err(
        `E12 ${relPath}:${line} 寫死咗站內絕對網址「${url.slice(0, 70)}」→ ` +
        `站內連結一律用相對路徑；絕對 URL 只可以由 SITE_ORIGIN 生成，` +
        `否則換網域嗰陣呢一處唔會跟住變`
      );
    } else if (!hostAllowed(host)) {
      err(`E12 ${relPath}:${line} 絕對網址「${url.slice(0, 70)}」唔喺 EXTERNAL_ALLOWLIST`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 分段發布：_draft                                                     */
/* ------------------------------------------------------------------ */

/* 一頁只要喺佢嘅資料檔標咗 `"_draft": true`，就會由 sitemap、首頁文章
 * 清單同 pillar cluster list 排除 —— 但檔案照樣喺 repo，URL 照樣開得到。
 *
 * 點解要呢個機制：仲有待核實標記嘅頁面唔應該俾 Google 索引。一次過等
 * 全部填實先上線，會拖幾個星期；但把未完成嘅頁放出去，讀者會撞到一堆
 * 空位，而搜尋引擎會把「呢個站有好多缺口」記低。分段發布嘅意思係：
 * 乾淨嘅先出，填實一頁就拆一個標記，逐頁放出去。
 *
 * 排除範圍**唔包括** nav 同麵包屑 —— 嗰兩樣係結構，唔係推薦位。
 * 亦唔包括 robots.txt：唔入 sitemap 已經夠，加 disallow 反而會令
 * 之後放出去嗰陣要多做一步。 */
const draftCache = new Map();
function isDraft(relPath) {
  if (draftCache.has(relPath)) return draftCache.get(relPath);
  let v = false;
  const f = path.join(DATA_DIR, relPath.replace(/\.html$/, "") + ".json");
  if (fs.existsSync(f)) {
    try { v = JSON.parse(fs.readFileSync(f, "utf8"))._draft === true; } catch { v = false; }
  }
  draftCache.set(relPath, v);
  return v;
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
    // draft 頁係**刻意**冇人連入 —— 佢就係要暫時唔出現喺任何清單。
    // 當佢係孤兒會令分段發布同 E9 永遠打交。
    if (isDraft(relPath)) continue;
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
  const unreachable = [...all].filter((p) => !depth.has(p) && !isDraft(p));
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
/* E15 / E16 發布守衛（只喺 --publish 模式生效）                        */
/* ------------------------------------------------------------------ */

/* {{NEEDS_VERIFY}} 係內部施工標記，唔應該出街。
 * 難處係佢喺 HTML 原始碼入面唔存在 —— 頁面只寫 data-fresh-key，
 * 標記係 freshness.js 喺 runtime 由 JSON 嘅 needsVerify 渲染出嚟。
 * 所以要逐頁解析佢引用嘅 key，再對返 data，先知邊頁會出標記。
 * 順便都掃埋 HTML 入面直接手寫嘅字面標記。 */
function checkPublishReady(pageList) {
  if (!PUBLISH) return { pages: [], total: 0, deferred: [] };

  const offenders = [];
  const deferred = [];
  for (const { relPath, html } of pageList) {
    /* draft 頁跳過。
     *
     * E15 問嘅係「會唔會有待核實標記出到街」。draft 頁唔喺 sitemap、唔喺
     * 任何清單，本站唔會指路過去 —— 佢仲有標記係預期之內，正正就係佢
     * 標咗 draft 嘅原因。如果連佢都封鎖，就變成「要成個站填晒先發到」，
     * 分段發布等於冇做過。
     *
     * 呢個唔係鬆咗手：拆走 `_draft` 嗰一刻，E15 對嗰頁即刻重新武裝，
     * 所以「放一頁出街」同「嗰頁冇待核實標記」依然係綁死嘅。
     * 下面照樣數返有幾多頁被延後，唔會靜靜雞放過。 */
    if (isDraft(relPath)) { deferred.push(relPath); continue; }
    const files = new Set();
    let m;
    const fre = /data-fresh=["']([^"']+)["']/gi;
    while ((m = fre.exec(html))) files.add(m[1]);

    const keys = new Set();
    const kre = /data-fresh-key=["']([^"']+)["']/gi;
    while ((m = kre.exec(html))) keys.add(m[1]);

    const found = [];
    for (const name of files) {
      const doc = loadData(name);
      if (!doc) continue;
      for (const [key, entry] of Object.entries(doc.entries || {})) {
        if (keys.has(key) && entry && entry.needsVerify) {
          found.push({ key, from: `data/${name}.json`, what: entry.needsVerify });
        }
      }
    }

    NEEDS_VERIFY_RE.lastIndex = 0;
    while ((m = NEEDS_VERIFY_RE.exec(html))) {
      found.push({ key: "（HTML 字面）", from: `${relPath}:${lineOf(html, m.index)}`, what: m[1].trim() });
    }

    if (found.length) {
      offenders.push({ relPath, found });
      err(
        `E15 ${relPath}: 仲有 ${found.length} 個待核實標記會渲染出街 —— ` +
        found.map((f) => f.key).join("、")
      );
    }
  }
  return { pages: offenders, total: offenders.reduce((n, o) => n + o.found.length, 0), deferred };
}

/* 附帶（超出原本要求，但同一個道理）：SITE_ORIGIN 仲係佔位網域嗰陣，
 * sitemap、robots、og:url、JSON-LD 全部會指去唔存在嘅網域。
 * W11 本身就寫住「唔好發布」—— 一個發布模式冇理由當佢冇到。 */
function checkPublishOrigin() {
  if (!PUBLISH) return false;
  if (SITE_ORIGIN.toLowerCase().includes("example.")) {
    err(
      `E16 SITE_ORIGIN 仲係佔位網域「${SITE_ORIGIN}」，唔可以發布。` +
      `跑：SITE_ORIGIN=https://你嘅網域 node scripts/build.mjs --publish`
    );
    return true;
  }
  return false;
}

/* ------------------------------------------------------------------ */
/* E19 draft 頁唔准出現喺 sitemap 或者任何推薦清單                       */
/* ------------------------------------------------------------------ */

/* 標咗 _draft 但仲留喺清單度，等於「以為收埋咗，其實冇」—— 而呢種
 * 失手係靜嘅：頁面照樣睇得到、build 照樣過，你要開 sitemap 逐條對先
 * 發現。所以要一條每次 build 都行嘅檢查。
 *
 * 掃三個層：
 *   1. sitemap.xml 嘅 <loc>（生成物）
 *   2. 首頁 .post-list 嘅 <a href>（手寫）
 *   3. pillar .cluster-list 嘅 <a href>（手寫）
 *
 * nav 同麵包屑**唔掃** —— 嗰兩樣係結構導覽，唔係推薦位；而且麵包屑
 * 係 build 由路徑生成，draft 頁自己嗰條麵包屑一定會連返 pillar。 */
function checkDraftNotListed(pageList) {
  const drafts = new Set(pageList.filter((p) => isDraft(p.relPath)).map((p) => p.relPath));
  if (!drafts.size) return;

  // 2 + 3. 首頁 .post-list 同 pillar .cluster-list
  const LIST_RE = /<ul[^>]*class="[^"]*\b(post-list|cluster-list)\b[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi;
  for (const { relPath, html } of pageList) {
    let m;
    LIST_RE.lastIndex = 0;
    while ((m = LIST_RE.exec(html))) {
      const kind = m[1];
      const inner = m[2];
      const aRe = /<a\b[^>]*?\bhref\s*=\s*["']([^"']*)["']/gi;
      let a;
      while ((a = aRe.exec(inner))) {
        const t = resolveInternal(relPath, a[1]);
        if (t && drafts.has(t)) {
          err(`E19 ${relPath}: .${kind} 入面仲有 draft 頁「${t}」—— 標咗 draft 就要由清單拆走`);
        }
      }
    }
  }

  /* 4. Pillar 嘅 jsonld:itemList 條數 vs 佢畫面上 .cluster-list 條數。
   *
   * ItemList 唔載 URL，所以上面第 2、3 層掃唔到佢 —— 但佢一樣係一份俾
   * 機器讀嘅清單。由清單拆走 draft 嘅時候好易淨係改 HTML、唔記得改個
   * meta，結果變成同 Google 講「呢頁列住三篇」但頁面一篇都冇。
   *
   * 唔逐個名對，淨係對條數：名嘅寫法可以同 <li> 入面唔一樣（一個係
   * 標題、一個係入口文案），但「有幾多篇」冇得唔一樣。 */
  for (const { relPath, html } of pageList) {
    const parts = relPath.split("/");
    if (parts.length !== 2 || parts[1] !== "index.html" || !SECTIONS[parts[0]]) continue;
    const meta = html.match(/<meta\s+name="jsonld:itemList"\s+content="([^"]*)"/i);
    const ul = html.match(/<ul[^>]*class="[^"]*\bcluster-list\b[^"]*"[^>]*>([\s\S]*?)<\/ul>/i);
    const listed = meta ? meta[1].split("|").filter((x) => x.trim()).length : 0;
    const shown = ul ? (ul[1].match(/<li\b/gi) || []).length : 0;
    if (listed !== shown) {
      err(
        `E19 ${relPath}: jsonld:itemList 寫住 ${listed} 篇，但畫面 .cluster-list 得 ${shown} 篇` +
        ` —— 由清單拆走 draft 嘅時候要一齊改個 meta`
      );
    }
  }
}

/* E19 嘅 sitemap 層。
 *
 * 呢段刻意同清單層分開：清單層驗嘅係倉入面嘅 HTML，隨時可以驗；
 * sitemap 層驗嘅係「今次 build 正正寫咗落 sitemap.xml 嗰份」。
 * 讀舊檔會錯兩次 —— 第一次 build（未有 sitemap.xml）會靜靜跳過，
 * 而有舊檔嗰陣報嘅係上一次嘅狀態，唔係今次。所以要接住 writeSitemap
 * 之後即刻讀返出嚟驗。 */
function checkDraftNotInSitemap(pageList) {
  const drafts = pageList.filter((p) => isDraft(p.relPath)).map((p) => p.relPath);
  if (!drafts.length) return;
  const smPath = path.join(ROOT, "sitemap.xml");
  if (!fs.existsSync(smPath)) {
    err("E19 sitemap.xml: 應該已經生成但搵唔到 —— draft 排除做咗未無從驗證");
    return;
  }
  const locs = [...fs.readFileSync(smPath, "utf8").matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  for (const d of drafts) {
    const tails = [d];
    if (d.endsWith("/index.html")) tails.push(d.replace(/index\.html$/, ""));
    if (locs.some((u) => tails.some((t) => u.endsWith("/" + t)))) {
      err(`E19 sitemap.xml: 收錄咗 draft 頁「${d}」—— draft 唔應該俾搜尋引擎索引`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* W14 notes 嘅 feedsInto 指住一條仲係待核實嘅 areas key                 */
/* ------------------------------------------------------------------ */

/* 實食紀錄同分區地圖係一個循環：一次到訪嘅觀察，用嚟填實分區資料檔
 * 入面「冇得喺電腦前查」嗰啲 key。feedsInto 就係嗰條線。
 *
 * 但寫低咗一條線唔等於行過。如果一篇紀錄聲稱佢餵緊某條 areas key，
 * 而嗰條 key 到今日仍然係 needsVerify，即係嗰個循環未閂 —— 觀察擺喺
 * 度冇人收。呢個唔係 error（篇文本身冇問題），係一張待辦：
 * 有幾多篇紀錄喺度等緊人去把佢哋歸納返落分區檔。
 *
 * 同時亦驗 feedsInto 指嘅目標存唔存在。指去一個唔存在嘅檔或者 key，
 * 係一條斷咗嘅線 —— 比「未閂」更差，因為佢永遠唔會閂。 */
function checkNotesFeedsInto() {
  const notesDir = path.join(DATA_DIR, "notes");
  if (!fs.existsSync(notesDir)) return;

  const cache = new Map();
  const loadData = (target) => {
    if (cache.has(target)) return cache.get(target);
    const f = path.join(DATA_DIR, target + ".json");
    let doc = null;
    if (fs.existsSync(f)) {
      try { doc = JSON.parse(fs.readFileSync(f, "utf8")); } catch { doc = null; }
    }
    cache.set(target, doc);
    return doc;
  };

  for (const name of fs.readdirSync(notesDir).sort()) {
    if (!name.endsWith(".json")) continue;
    const relData = `data/notes/${name}`;
    let doc;
    try { doc = JSON.parse(fs.readFileSync(path.join(notesDir, name), "utf8")); }
    catch { continue; }   // JSON 壞咗由 E6 處理

    if (!doc.visitDate) {
      warn(`W14 ${relData}: 實食紀錄冇 visitDate —— 冇到訪日期嘅紀錄冇有效期`);
    }
    for (const [k, v] of Object.entries(doc.entries || {})) {
      if (v && v.volatility !== "high") {
        warn(`W14 ${relData}: entry「${k}」係「${v.volatility || "normal"}」—— 實食紀錄一律要 high`);
      }
    }

    const feeds = Array.isArray(doc.feedsInto) ? doc.feedsInto : [];
    if (!feeds.length) continue;

    for (const f of feeds) {
      const target = f && f.target;
      const key = f && f.key;
      if (!target || !key) {
        warn(`W14 ${relData}: feedsInto 有一項冇 target 或者 key`);
        continue;
      }
      const targetDoc = loadData(target);
      if (!targetDoc) {
        warn(`W14 ${relData}: feedsInto 指住「${target}」，但 data/${target}.json 唔存在 —— 斷咗嘅線`);
        continue;
      }
      const entry = (targetDoc.entries || {})[key];
      if (!entry) {
        warn(`W14 ${relData}: feedsInto 指住「${target} → ${key}」，但嗰個 key 唔存在 —— 斷咗嘅線`);
        continue;
      }
      if (entry.needsVerify) {
        warn(
          `W14 ${relData}: feedsInto 指住「${target} → ${key}」，但嗰條 key 仍然係待核實 —— ` +
          `呢篇紀錄嘅觀察未歸納返落分區檔`
        );
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* W13 H1 唔可以同分區名一模一樣                                        */
/* ------------------------------------------------------------------ */

/* Pillar 頁上面會連續出現三行同一個詞：nav 標籤、麵包屑最後一格、H1。
 * 三行一樣睇落似出錯，而且 H1 係全頁最大嗰個承諾位 —— 佢應該講一句嘢
 * （「北上行程點排」），唔係重複一個標籤（「北上行程」）。
 * 分區名要對上搜尋意圖，H1 要接住嗰個意圖再答多一步。 */
function checkH1NotSectionName(pageList) {
  for (const { relPath, html } of pageList) {
    const parts = relPath.split("/");
    if (parts.length < 2) continue;
    const sec = SECTIONS[parts[0]];
    if (!sec) continue;
    const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (!m) continue;
    const h1 = stripTags(m[1]).replace(/\s+/g, "");
    if (h1 === sec.pillar) {
      warn(`W13 ${relPath}: H1「${h1}」同分區名一模一樣 —— H1 應該係一句，唔係一個標籤`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* W10 cluster 體量超過所屬 pillar                                      */
/* ------------------------------------------------------------------ */

/* Pillar 應該係一個分區入面最高層、最闊嘅一頁。如果某篇 cluster 寫到
 * 比 pillar 仲長，兩者就會開始爭同一批關鍵字，而且讀者會分唔清邊頁
 * 先係入口。呢個時候應該考慮將該 cluster 升格成子 pillar（做法見 README）。
 *
 * 門檻設 +40%：超出 10–20% 只代表 pillar 寫得薄咗，補闊 pillar 就解決，
 * 唔值得每次 build 都嘈。成日響嘅警告等於冇警告 —— 留返畀真係要拆嘅個案。
 *
 * 判斷用嘅係「四捨五入之後嘅百分比」，同訊息顯示嘅數字一致。
 * 用原始比值會出現「訊息寫住 +40% 但唔報 warning」呢種自相矛盾嘅情況
 * （例如 2550/1823 = +39.88%）。 */
const CLUSTER_OVERSIZE_PCT = 40;

function checkClusterVsPillar(pageList) {
  const bySection = new Map();
  for (const p of pageList) {
    const parts = p.relPath.split("/");
    if (parts.length < 2 || !SECTIONS[parts[0]]) continue;
    if (!bySection.has(parts[0])) bySection.set(parts[0], { pillar: null, clusters: [] });
    const bucket = bySection.get(parts[0]);
    if (parts[1] === "index.html") bucket.pillar = p;
    else bucket.clusters.push(p);
  }
  const over = [];
  for (const [section, { pillar, clusters }] of bySection) {
    if (!pillar) continue;
    for (const c of clusters) {
      /* draft 頁唔喺 sitemap、亦唔喺任何清單，爭唔到關鍵字，所以體量
       * 比較對佢冇意義。拆走 _draft 放出去嗰陣，呢條 warning 會自動返嚟。 */
      if (isDraft(c.relPath)) continue;
      const pct = Math.round((c.chars / pillar.chars - 1) * 100);
      if (pct >= CLUSTER_OVERSIZE_PCT) {
        over.push({ relPath: c.relPath, chars: c.chars, pillarChars: pillar.chars, section, pct });
        warn(
          `W10 ${c.relPath}: ${c.chars} 字，超過所屬 pillar ${section}/index.html 嘅 ${pillar.chars} 字` +
          `（多 ${c.chars - pillar.chars} 字，+${pct}%，門檻 +${CLUSTER_OVERSIZE_PCT}%）` +
          `→ 考慮升格成子 pillar，或者將 pillar 寫闊啲`
        );
      }
    }
  }
  return over;
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

console.log(`hk_eats build — root ${ROOT}${PUBLISH ? "  [發布模式 --publish]" : ""}`);
console.log(`SITE_ORIGIN = ${SITE_ORIGIN}${process.env.SITE_ORIGIN ? "" : "（預設值，未由環境變數設定）"}`);

/* SITE_ORIGIN 係全站絕對 URL 嘅唯一來源：sitemap 嘅 <loc>、robots 嘅
 * Sitemap:、JSON-LD 嘅 @id／url／item、Open Graph 嘅 og:url。
 * 佢一錯，成套嘢就全部指去唔存在嘅網域。 */
if (SITE_ORIGIN.toLowerCase().includes("example.")) {
  warn(
    `W11 SITE_ORIGIN 仲係佔位網域「${SITE_ORIGIN}」——未設定正式網域，唔好發布。` +
    `部署前跑：SITE_ORIGIN=https://你嘅網域 node scripts/build.mjs`
  );
}
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
let ogCount = 0;
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

  // 品牌位：由 SITE_NAME 生成
  html = injectBrand(relPath, html);

  // <title> 同 OG：統一由品牌常數生成，唔靠頁面手寫
  const curTitle = (/<title>([\s\S]*?)<\/title>/i.exec(html) || [])[1];
  checkAuthoredTitle(relPath, curTitle);
  const title = pageTitle(relPath, metas, curTitle);
  if (/<title>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  } else {
    err(`E11 ${relPath}: 冇 <title>`);
  }
  {
    const og = renderOg(relPath, metas, title);
    if (OG_BLOCK_RE.test(html)) {
      OG_BLOCK_RE.lastIndex = 0;
      html = html.replace(OG_BLOCK_RE, og);
    } else if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, og + "</head>");
    } else {
      err(`E11 ${relPath}: 搵唔到 </head>，注入唔到 Open Graph`);
    }
    OG_BLOCK_RE.lastIndex = 0;
    ogCount++;
  }

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
  pages.push({ relPath, metas, injected, html, chars, title });
}
console.log(`[4/8] SVG ${svgCount} 張；麵包屑 ${bcCount} 頁；目錄 ${tocCount} 頁；JSON-LD ${pages.filter((p) => p.injected).length}/${pages.length} 頁`);
console.log(`      <title> + Open Graph：${ogCount} 頁（品牌「${SITE_NAME}」）`);
console.log(`      全站最新 verifiedOn：${latestUpdate || "（冇）"}`);

for (const { relPath, html } of pages) {
  checkUniqueIds(relPath, html);
  checkNoHardcodedOrigin(relPath, html);
  checkDisclosure(relPath, html);
  checkDisplayConsistency(relPath, html);
  checkStoreLinks(relPath, html);
}

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

checkH1NotSectionName(pages);
checkNotesFeedsInto();
checkDraftNotListed(pages);   // 清單層；sitemap 層喺 writeSitemap 之後先驗
const overSized = checkClusterVsPillar(pages);
console.log(`      cluster 體量 vs pillar：${overSized.length} 頁超出`);

const nv = collectNeedsVerify(pages);
const pub = checkPublishReady(pages);
checkPublishOrigin();
if (PUBLISH) {
  console.log(`      發布守衛：${pub.pages.length} 頁仲有待核實標記（共 ${pub.total} 個）`);
  if (pub.deferred.length) {
    console.log(`      發布守衛：${pub.deferred.length} 頁標咗 draft，暫緩檢查（${pub.deferred.join("、")}）`);
  }
}
console.log(`[7/8] 待核實標記：${nv.length} 個（HTML ${nv.filter((x) => x.kind === "HTML").length} / data ${nv.filter((x) => x.kind === "data").length}）`);

const sitemapPages = pages.filter(
  (p) => !RESERVED_DIRS.has(p.relPath.split("/")[0]) && !isDraft(p.relPath)
);
const draftPages = pages.filter((p) => isDraft(p.relPath)).map((p) => p.relPath);
if (draftPages.length) {
  console.log(`      sitemap 排除 draft：${draftPages.length} 頁（${draftPages.join("、")}）`);
}
if (sitemapPages.length !== pages.length) {
  console.log(`      sitemap 排除預留目錄：${pages.length - sitemapPages.length} 頁`);
}
writeSitemap(sitemapPages);
checkDraftNotInSitemap(pages);
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
