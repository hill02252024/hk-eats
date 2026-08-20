#!/usr/bin/env node
/* hk_eats — scripts/browser-check.mjs
 *
 * 喺真無頭 Chrome 度量度，唔係讀 CSS 推斷。
 *   1. 版面置中：1440px / 2560px 兩個寬度，量 getBoundingClientRect
 *      同 getComputedStyle 嘅實際數值
 *   2. freshness.js 有冇真係填到值、核實月份／過時警告／變動中橫幅有冇出
 *   3. ads.js 佔位：enabled:false 同「扮 enabled:true」兩態嘅實際高度
 *   4. 深色模式下有冇睇唔到嘅嘢
 *
 * 用法：先開一個 static server，然後
 *   node scripts/browser-check.mjs http://127.0.0.1:8733
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchChrome, killChrome, newPage, setViewport, goto, evaluate, setColorScheme } from "./lib/cdp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.argv[2] || "http://127.0.0.1:8733").replace(/\/+$/, "");
const PORT = 8733;

let pass = 0, fail = 0;
const say = (ok, label, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
};

/* ------- 內嵌 static server，免得要人手開 ------- */
function startServer() {
  const p = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"],
    { cwd: ROOT, stdio: "ignore" });
  return p;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------- 量度用嘅頁面內 function ------- */

const MEASURE_LAYOUT = `() => {
  const px = (s) => parseFloat(s);
  const el = document.querySelector('main .wrap') || document.querySelector('.wrap');
  const cs = getComputedStyle(el);
  const r  = el.getBoundingClientRect();
  const rootFont = px(getComputedStyle(document.documentElement).fontSize);
  const h1 = document.querySelector('h1');
  const p1 = document.querySelector('main p');
  const out = {
    viewportW: window.innerWidth,
    rootFontPx: rootFont,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    wrap: {
      left: +r.left.toFixed(2),
      right: +r.right.toFixed(2),
      width: +r.width.toFixed(2),
      computedMaxWidth: cs.maxWidth,
      computedMarginLeft: cs.marginLeft,
      computedMarginRight: cs.marginRight,
      computedPaddingLeft: cs.paddingLeft,
      computedPaddingRight: cs.paddingRight,
      computedBoxSizing: cs.boxSizing,
    },
    gapLeft:  +r.left.toFixed(2),
    gapRight: +(window.innerWidth - r.right).toFixed(2),
  };
  if (h1) { const hr = h1.getBoundingClientRect(); out.h1 = { left: +hr.left.toFixed(2), right: +hr.right.toFixed(2), width: +hr.width.toFixed(2) }; }
  if (p1) {
    const pr = p1.getBoundingClientRect();
    const pcs = getComputedStyle(p1);
    out.firstP = { left: +pr.left.toFixed(2), right: +pr.right.toFixed(2), width: +pr.width.toFixed(2), computedMaxWidth: pcs.maxWidth };
    out.pGapRightInsideWrap = +(r.right - px(cs.paddingRight) - pr.right).toFixed(2);
  }
  // 各類元素嘅左右邊界應該完全對齊
  const innerL = r.left + px(cs.paddingLeft);
  const innerR = r.right - px(cs.paddingRight);
  out.innerBox = { left: +innerL.toFixed(2), right: +innerR.toFixed(2), width: +(innerR - innerL).toFixed(2) };
  // 只量內容欄嘅「直接子元素」—— 巢狀喺 .data-block / .callout 入面嘅
  // 表格本來就應該內縮，唔算唔對齊。
  const kinds = { p: '.wrap > p', h1: '.wrap > h1', h2: '.wrap > h2',
                  ul: '.wrap > ul', ol: '.wrap > ol',
                  block: '.wrap > .data-block', figure: '.wrap > .diagram',
                  ad: '.wrap > .ad-slot' };
  out.edges = {};
  for (const [k, sel] of Object.entries(kinds)) {
    const e = document.querySelector(sel);
    if (!e) continue;
    const b = e.getBoundingClientRect();
    out.edges[k] = { left: +b.left.toFixed(2), right: +b.right.toFixed(2),
                     dL: +(b.left - innerL).toFixed(2), dR: +(innerR - b.right).toFixed(2) };
  }
  return out;
}`;

const MEASURE_FRESH = `() => {
  const blocks = [...document.querySelectorAll('[data-fresh]')];
  return blocks.map((b) => {
    const keys = [...b.querySelectorAll('[data-fresh-key]')];
    const filled = keys.filter((k) => k.textContent.trim() && k.textContent.trim() !== '—' && k.textContent.trim() !== '…');
    const foot = b.querySelector('.freshness .verified');
    return {
      src: b.getAttribute('data-fresh'),
      state: b.getAttribute('data-fresh-state'),
      keys: keys.length,
      filled: filled.length,
      verifiedText: foot ? foot.textContent.trim() : null,
      hasStale: !!b.querySelector('.stale-warning'),
      hasVolatile: !!b.querySelector('.volatile-banner'),
      volatileTitle: (b.querySelector('.volatile-banner-title')||{}).textContent || null,
      isStaleClass: b.classList.contains('is-stale'),
      isVolatileClass: b.classList.contains('is-volatile'),
      needsVerify: b.querySelectorAll('.needs-verify').length,
      verifyMarkersWellFormed: [...b.querySelectorAll('.needs-verify')].every((e) => /^\{\{NEEDS_VERIFY: .+\}\}$/.test(e.textContent.trim())),
      sample: keys.length ? keys[0].textContent.trim().slice(0, 30) : null,
    };
  });
}`;

const MEASURE_ADS = `() => {
  return [...document.querySelectorAll('[data-ad-slot]')].map((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      id: el.getAttribute('data-ad-slot'),
      state: el.getAttribute('data-ad-state'),
      height: +r.height.toFixed(2),
      width: +r.width.toFixed(2),
      minHeight: cs.minHeight,
      placeholder: el.classList.contains('is-dev-placeholder'),
    };
  });
}`;

/* 摹擬「開通咗」：直接除去佔位 class，睇高度會唔會變 */
const MEASURE_ADS_ENABLED = `() => {
  const els = [...document.querySelectorAll('[data-ad-slot]')];
  els.forEach((e) => e.classList.remove('is-dev-placeholder'));
  void document.body.offsetHeight;
  return els.map((el) => {
    const r = el.getBoundingClientRect();
    return { id: el.getAttribute('data-ad-slot'), height: +r.height.toFixed(2) };
  });
}`;

/* ------- 主流程 ------- */

const server = startServer();
await sleep(900);
const chrome = await launchChrome({ port: 9222 });

try {
  const page = await newPage(chrome.port);

  /* ===== 1. 版面置中 ===== */
  console.log("── 1. 版面置中（真 Chrome，量 getBoundingClientRect + getComputedStyle）──\n");
  const pages = [
    ["/index.html", "首頁"],
    ["/guides/border-crossings.html", "cluster 文章"],
    ["/guides/index.html", "pillar 頁"],
  ];
  for (const width of [1440, 2560]) {
    console.log(`  ▸ 視窗寬度 ${width}px`);
    for (const [url, label] of pages) {
      await setViewport(page, width, 900);
      await goto(page, BASE + url, { settleMs: 500 });
      const m = await evaluate(page, MEASURE_LAYOUT);
      const symmetric = Math.abs(m.gapLeft - m.gapRight) <= 1;
      const expectedWidth = Math.min(width, 46 * m.rootFontPx);
      const widthOk = Math.abs(m.wrap.width - expectedWidth) <= 1;
      const noHScroll = m.docScrollW <= width + 1;
      console.log(
        `    ${label.padEnd(12)} wrap: left=${m.wrap.left} right=${m.wrap.right} width=${m.wrap.width}` +
        `  留白 左=${m.gapLeft} 右=${m.gapRight}`
      );
      console.log(
        `    ${"".padEnd(12)} computed: max-width=${m.wrap.computedMaxWidth} margin=${m.wrap.computedMarginLeft}/${m.wrap.computedMarginRight}` +
        ` padding=${m.wrap.computedPaddingLeft}/${m.wrap.computedPaddingRight} box-sizing=${m.wrap.computedBoxSizing} root=${m.rootFontPx}px`
      );
      if (m.firstP) {
        console.log(
          `    ${"".padEnd(12)} 首段: left=${m.firstP.left} right=${m.firstP.right} width=${m.firstP.width}` +
          ` max-width=${m.firstP.computedMaxWidth}  段落右邊距離 wrap 內緣=${m.pGapRightInsideWrap}px`
        );
      }
      const edgeNames = Object.keys(m.edges);
      console.log(
        `    ${"".padEnd(12)} 內容框 ${m.innerBox.left}–${m.innerBox.right}（${m.innerBox.width}px）　各元素偏移 ` +
        edgeNames.map((k) => `${k}:Δ左${m.edges[k].dL}/Δ右${m.edges[k].dR}`).join("  ")
      );
      // 廣告位刻意有固定闊度（336／300px）並置中，唔應該同文字欄同一邊界，
      // 所以佢驗嘅係「左右偏移相等」而唔係「貼齊內容框」。
      const flow = edgeNames.filter((k) => k !== "ad");
      const aligned = flow.every((k) => Math.abs(m.edges[k].dL) <= 1 && Math.abs(m.edges[k].dR) <= 1);
      say(aligned, `${width}px ${label}：段落／標題／清單／資料塊／圖解左右邊界對齊`,
          flow.map((k) => `${k}(${m.edges[k].dL},${m.edges[k].dR})`).join(" "));
      if (m.edges.ad) {
        say(Math.abs(m.edges.ad.dL - m.edges.ad.dR) <= 1, `${width}px ${label}：廣告位置中`,
            `左偏 ${m.edges.ad.dL} / 右偏 ${m.edges.ad.dR}`);
      }
      say(symmetric, `${width}px ${label}：左右留白對稱`, `左 ${m.gapLeft} vs 右 ${m.gapRight}`);
      say(widthOk, `${width}px ${label}：wrap 寬度 = min(視窗, 46rem)`, `${m.wrap.width} vs 期望 ${expectedWidth}`);
      say(noHScroll, `${width}px ${label}：冇橫向捲軸`, `scrollWidth ${m.docScrollW}`);
    }
    console.log("");
  }

  /* ===== 2. freshness ===== */
  console.log("── 2. freshness.js 實際 hydration ──\n");
  await setViewport(page, 1440, 1000);
  for (const url of ["/guides/border-crossings.html", "/guides/payment-setup.html",
                     "/guides/bring-back.html", "/trips/overnight.html", "/coffee/brewing-basics.html"]) {
    await goto(page, BASE + url, { settleMs: 900 });
    const blocks = await evaluate(page, MEASURE_FRESH);
    console.log(`  ▸ ${url}`);
    for (const b of blocks) {
      console.log(
        `    [${b.src}] state=${b.state} 填 ${b.filled}/${b.keys}` +
        ` | ${b.verifiedText || "冇註腳"}` +
        ` | 過時=${b.hasStale ? "有" : "冇"} 變動中=${b.hasVolatile ? "有" : "冇"}` +
        (b.needsVerify ? ` | 未核實 ${b.needsVerify} 項` : "") +
        (b.sample ? ` | 首格「${b.sample}」` : "")
      );
      say(b.state === "ready", `${url} [${b.src}] 載入成功`);
      // 待核實嘅格一樣有文字（就係嗰個標記），所以 filled 已經包含佢哋 ——
      // 唔可以再加一次，否則會重複計。
      say(b.filled === b.keys, `${url} [${b.src}] 每個 key 都有內容`, `${b.filled}/${b.keys}，其中待核實 ${b.needsVerify}`);
      say(!!b.verifiedText, `${url} [${b.src}] 有核實月份註腳`);
      say(b.hasVolatile === b.isVolatileClass, `${url} [${b.src}] 橫幅同 class 一致`);
      if (b.needsVerify) {
        say(b.verifyMarkersWellFormed, `${url} [${b.src}] 待核實標記格式正確`, `${b.needsVerify} 個 {{NEEDS_VERIFY: …}}`);
      }
    }
    console.log("");
  }

  /* ===== 2b. 麵包屑 ===== */
  console.log("── 2b. 麵包屑實際 render ──\n");
  for (const url of ["/guides/bring-back.html", "/coffee/index.html"]) {
    await goto(page, BASE + url, { settleMs: 300 });
    const bc = await evaluate(page, `() => {
      const nav = document.querySelector('nav.breadcrumb');
      if (!nav) return null;
      const items = [...nav.querySelectorAll('li')].map((li) => ({
        text: li.textContent.trim(),
        href: li.querySelector('a') ? li.querySelector('a').getAttribute('href') : null,
        current: !!li.querySelector('[aria-current="page"]'),
      }));
      const r = nav.getBoundingClientRect();
      return { items, top: +r.top.toFixed(0), label: nav.getAttribute('aria-label') };
    }`);
    console.log(`  ▸ ${url}: ${bc ? bc.items.map((i) => i.text + (i.href ? `→${i.href}` : "（當前）")).join(" › ") : "冇麵包屑"}`);
    say(!!bc, `${url} 有麵包屑`);
    if (bc) {
      say(bc.items.length >= 2, `${url} 麵包屑最少兩層`, `${bc.items.length} 層`);
      say(bc.items[bc.items.length - 1].current, `${url} 最後一層標記 aria-current`);
      say(bc.items[0].href !== null, `${url} 首層可以撳返首頁`);
    }
  }
  console.log("");

  /* ===== 2c. 錨點目錄 ===== */
  console.log("── 2c. 錨點目錄：每條 anchor 跳唔跳得到 ──\n");
  for (const url of ["/guides/bring-back.html", "/coffee/brewing-basics.html", "/trips/index.html"]) {
    await goto(page, BASE + url, { settleMs: 300 });
    const toc = await evaluate(page, `() => {
      const nav = document.querySelector('nav.toc');
      if (!nav) return null;
      const links = [...nav.querySelectorAll('a')];
      const broken = [];
      let firstTop = null;
      links.forEach((a) => {
        const id = decodeURIComponent(a.getAttribute('href').slice(1));
        const t = document.getElementById(id);
        if (!t) broken.push(id);
        else if (firstTop === null) firstTop = Math.round(t.getBoundingClientRect().top + scrollY);
      });
      const h2All = [...document.querySelectorAll('main h2')];
      const navRect = nav.getBoundingClientRect();
      const lede = document.querySelector('p.lede');
      return {
        count: links.length, broken,
        h2Count: h2All.length,
        h2WithId: h2All.filter((h) => h.id).length,
        afterLede: lede ? navRect.top >= lede.getBoundingClientRect().bottom - 1 : null,
        scrollMarginTop: getComputedStyle(h2All[0]).scrollMarginTop,
      };
    }`);
    console.log(`  ▸ ${url}: ${toc ? `${toc.count} 條目錄項，${toc.h2WithId}/${toc.h2Count} 個 h2 有 id，斷鏈 ${toc.broken.length} 條，scroll-margin-top=${toc.scrollMarginTop}` : "冇目錄"}`);
    say(!!toc, `${url} 有錨點目錄`);
    if (toc) {
      say(toc.broken.length === 0, `${url} 目錄冇斷鏈`, toc.broken.join(", "));
      say(toc.count === toc.h2Count, `${url} 目錄涵蓋全部 h2`, `${toc.count}/${toc.h2Count}`);
      say(toc.h2WithId === toc.h2Count, `${url} 每個 h2 都有 id`);
      say(toc.afterLede === true, `${url} 目錄排喺首段之後`);
    }
  }
  console.log("");

  /* ===== 2d. 首頁最後更新 ===== */
  console.log("── 2d. 首頁 ──\n");
  await goto(page, BASE + "/index.html", { settleMs: 300 });
  const home = await evaluate(page, `() => {
    const h1 = document.querySelector('h1');
    const sub = document.querySelector('.site-subtitle');
    const meta = document.querySelector('.meta-line');
    return {
      h1: h1 ? h1.textContent.trim() : null,
      subtitle: sub ? sub.textContent.trim() : null,
      lastUpdate: meta ? meta.textContent.trim() : null,
      hasOldSection: /點解要分開常青同易耗/.test(document.body.textContent),
      aboutLink: !!document.querySelector('a[href$="about.html"]'),
    };
  }`);
  console.log(`  H1: ${home.h1}`);
  console.log(`  副標: ${home.subtitle}`);
  console.log(`  ${home.lastUpdate}`);
  say(home.h1 === "港深食飲指南", "首頁 H1 已改", home.h1);
  say(!!home.subtitle, "首頁有副標題");
  say(/最後更新：\d{4}-\d{2}/.test(home.lastUpdate || ""), "首頁有全站最後更新日期", home.lastUpdate);
  say(!home.hasOldSection, "「點解要分開常青同易耗」已搬離首頁");
  say(home.aboutLink, "首頁有連去 /about.html");
  console.log("");

  /* ===== 3. 廣告位兩態高度 ===== */
  console.log("── 3. ads.js 佔位：兩態實際高度 ──\n");
  for (const [width, which] of [[390, "手機"], [1440, "桌面"]]) {
    await setViewport(page, width, 900);
    await goto(page, BASE + "/guides/border-crossings.html", { settleMs: 700 });
    const before = await evaluate(page, MEASURE_ADS);
    const after = await evaluate(page, MEASURE_ADS_ENABLED);
    console.log(`  ▸ ${which}（${width}px）`);
    for (let i = 0; i < before.length; i++) {
      const b = before[i], a = after[i];
      const same = Math.abs(b.height - a.height) < 0.01;
      console.log(
        `    ${b.id.padEnd(16)} state=${(b.state||"-").padEnd(10)} min-height=${b.minHeight.padEnd(7)}` +
        ` 佔位態高度=${b.height}  除去佔位 class 後=${a.height}  ${same ? "一致" : "↯ 唔一致"}`
      );
      say(same, `${which} ${b.id} 兩態高度一致`, `${b.height} vs ${a.height}`);
      say(b.height >= parseFloat(b.minHeight) - 0.01, `${which} ${b.id} 高度達到預留值`, `${b.height} ≥ ${b.minHeight}`);
    }
    console.log("");
  }

  /* ===== 4. 深色模式 ===== */
  console.log("── 4. 深色模式實際 render ──\n");
  await setViewport(page, 1440, 900);
  for (const scheme of ["light", "dark"]) {
    await setColorScheme(page, scheme);
    await goto(page, BASE + "/guides/border-crossings.html", { settleMs: 600 });
    const colors = await evaluate(page, `() => {
      const g = (sel, prop) => { const e = document.querySelector(sel); return e ? getComputedStyle(e)[prop] : null; };
      const svgText = document.querySelector('.diagram-svg .d-node-text');
      return {
        bodyBg: g('body','backgroundColor'),
        bodyFg: g('body','color'),
        svgTextFill: svgText ? getComputedStyle(svgText).fill : null,
        diagramBg: g('.diagram','backgroundColor'),
        svgCount: document.querySelectorAll('.diagram-svg').length,
      };
    }`);
    console.log(`  ▸ ${scheme}: body ${colors.bodyFg} on ${colors.bodyBg} | 圖解底 ${colors.diagramBg} | SVG 文字 ${colors.svgTextFill}`);
    say(colors.svgCount > 0, `${scheme} 模式有 inline SVG`);
    say(colors.svgTextFill !== colors.diagramBg, `${scheme} 模式 SVG 文字冇同底色撞`, `${colors.svgTextFill} vs ${colors.diagramBg}`);
  }

  await page.close();
} finally {
  await killChrome(chrome);
  server.kill("SIGKILL");
}

console.log("");
console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
