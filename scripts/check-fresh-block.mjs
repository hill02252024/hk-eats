#!/usr/bin/env node
/* hk_eats — scripts/check-fresh-block.mjs
 *
 * 唔開瀏覽器，直接 parse 生成嘅 HTML，重建一組 data-block 渲染完會係點：
 * 邊個 <h4> 之下有邊幾條 key、每條會出值定係出待核實標記。
 *
 *   node scripts/check-fresh-block.mjs <頁面路徑> <key 前綴> [選項]
 *   node scripts/check-fresh-block.mjs --self-test
 *
 * 個前綴係用嚟**搵**個 block，唔係用嚟篩入面啲 key —— 搵到之後成個
 * block 都會重建出嚟。因為要驗嘅係「呢一格入面點排」，唔係「呢條 key
 * 出咩」，隔離幾條唔同前綴嘅 key 一齊睇先睇得出分組啱唔啱。
 *
 * 例：
 *   node scripts/check-fresh-block.mjs coffee/reading-menu.html pricing. \
 *        --expect-groups 2 --expect-marks 4
 *
 * 選項：
 *   --expect-groups N   斷言有 N 個分組（有 mark 或者有 value 嘅組先計）
 *   --expect-marks N    斷言一共有 N 個待核實標記
 *   --self-test         唔讀站入面任何一頁，用內置 fixture 自測（見下）
 *
 * ── 點解個標記模板要 regex 由 js/freshness.js 讀返出嚟 ──────────────
 *
 * `{{NEEDS_VERIFY: …}}` 呢串字**喺 HTML 檔入面唔存在**。頁面只寫
 * `data-fresh-key`，個標記係 freshness.js 喺 runtime 砌出嚟嘅
 * （`fillNeedsVerify`）。所以呢個工具做嘅係「重建」，唔係「讀」。
 *
 * 重建就有一個風險：如果我喺呢度硬寫死 "{{NEEDS_VERIFY: " + x + "}}"，
 * 而第日有人改咗 freshness.js 個模板（改成 `[未核實：…]`、加個
 * class、換個 prefix），呢個工具會繼續用舊模板砌，繼續報綠 ——
 * 模擬同真實靜靜咁分咗家，而個測試唔會出聲。
 *
 * 所以模板由 freshness.js 原始碼 regex 抽返出嚟。抽唔到就 exit 2
 * 當呢次驗證作廢，唔會用 fallback 頂硬上 —— 一個「搵唔到就當冇事」
 * 嘅檢查同冇做過分別唔大。
 *
 * ⚠️ 呢個做法有個已知上限：佢對得住個**模板字串**，對唔住
 * `fillNeedsVerify` 嘅其餘行為（set 咩 class、咩 attribute）。
 * 要連行為都對得住，就要 export `fillNeedsVerify` 出嚟，再學
 * scripts/test-freshness.mjs 咁用 node:vm 載入真身。而家嗰個
 * `window.hkEatsFreshness` 冇 export 佢，所以未做到。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* ------------------------------------------------------------------ */
/* 由 freshness.js 讀返個標記模板                                       */
/* ------------------------------------------------------------------ */

function readMarkerTemplate() {
  const src = fs.readFileSync(path.join(ROOT, "js/freshness.js"), "utf8");
  const m = src.match(
    /mark\.textContent\s*=\s*("(?:[^"\\]|\\.)*")\s*\+\s*description\s*\+\s*("(?:[^"\\]|\\.)*")/
  );
  if (!m) return null;
  return { pre: JSON.parse(m[1]), post: JSON.parse(m[2]) };
}

/* ------------------------------------------------------------------ */
/* Parse：由一段 block HTML 抽出「h4 分組 → 每格一條 key」              */
/* ------------------------------------------------------------------ */

/**
 * @param src   一個 <section class="data-block"> 入面嘅 HTML
 * @param resolve  (key) => { rendered, kind }　kind: mark | value | missing | dangling
 */
function parseGroups(src, resolve) {
  /* 三種 token：
   *   1. <h4>            —— 分組標題
   *   2. <ul|ol data-fresh-key="…">  —— 成個清單由一條 key 填（陣列值）
   *   3. <p|li> 入面有 data-fresh-key —— 一格一條 key
   *
   * 第 2 種要行喺第 3 種之前，而且要整個 <ul> 一次過食走 —— 否則個
   * <ul> 入面嘅 <li> 會逐個再被第 3 種掃一次。呢種寫法 freshness.js
   * 係支援嘅（fillElement 見到 UL/OL 就逐項生成 <li>），漏咗佢，
   * 一版用陣列渲染嘅 block 會被報成「0 條 key」—— 睇落似空白，
   * 其實係工具讀唔到。 */
  const tokenRe = new RegExp(
    "<h4[^>]*>([\\s\\S]*?)<\\/h4>" +
    "|<(ul|ol)([^>]*\\bdata-fresh-key=\"[^\"]+\"[^>]*)>[\\s\\S]*?<\\/\\2>" +
    "|<(?:p|li)([^>]*)>([\\s\\S]*?)<\\/(?:p|li)>",
    "g"
  );
  const groups = [];
  let cur = null, m;
  const ensure = () => {
    if (!cur) { cur = { heading: "（冇 h4，直屬 block）", rows: [] }; groups.push(cur); }
    return cur;
  };
  while ((m = tokenRe.exec(src))) {
    if (m[1] !== undefined) {
      cur = { heading: strip(m[1]), rows: [] };
      groups.push(cur);
      continue;
    }
    if (m[3] !== undefined) {                    // <ul|ol data-fresh-key>
      const key = (m[3].match(/data-fresh-key="([^"]+)"/) || [])[1];
      if (!key) continue;
      ensure().rows.push({ label: `（${m[2]} 清單）`, key, ...resolve(key) });
      continue;
    }
    const attrs = m[4], inner = m[5];
    if (inner === undefined) continue;
    /* data-fresh-key 可以喺兩個位：<p> 自己身上（成段由一條 key 填），
     * 或者入面嗰個 <span>（一格一條）。freshness.js 用
     * querySelectorAll("[data-fresh-key]")，兩種都收 —— 只讀 inner
     * 就會靜靜咁漏咗第一種，報「0 條 key」。 */
    const key = (attrs.match(/data-fresh-key="([^"]+)"/) || [])[1]
             || (inner.match(/data-fresh-key="([^"]+)"/) || [])[1];
    if (!key) continue;
    const onTag = /data-fresh-key="/.test(attrs);
    const label = onTag ? "（整段）" : strip(inner.replace(/<span[\s\S]*/, ""));
    ensure().rows.push({ label, key, ...resolve(key) });
  }
  return groups;
}

const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

function makeResolver(entries, tpl) {
  return (key) => {
    const e = entries[key];
    if (!e) return { rendered: "‹key 喺 data 搵唔到›", kind: "dangling" };
    if (e.needsVerify) return { rendered: tpl.pre + e.needsVerify + tpl.post, kind: "mark" };
    if (e.value !== undefined && e.value !== null) {
      const v = Array.isArray(e.value) ? e.value.join(" / ") : String(e.value);
      return { rendered: v, kind: "value" };
    }
    return { rendered: "—", kind: "missing" };
  };
}

/* ------------------------------------------------------------------ */
/* 報告                                                                 */
/* ------------------------------------------------------------------ */

let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) fail++;
};

function printGroups(groups, width = 96) {
  for (const g of groups) {
    console.log(`\n▌ ${g.heading}`);
    for (const r of g.rows) {
      const tag = { mark: "  [NEEDS_VERIFY 標記]", dangling: "  ⚠️ 對唔返 data",
                    missing: "  ⚠️ 有 key 冇值" }[r.kind] || "";
      const short = r.rendered.length > width
        ? r.rendered.slice(0, width) + "…" + (r.kind === "mark" ? "}}" : "")
        : r.rendered;
      console.log(`    ${r.label}${short}`);
      console.log(`      └ ${r.key}${tag}`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* 主：驗一頁                                                           */
/* ------------------------------------------------------------------ */

function runPage(pageRel, prefix, opts) {
  const pagePath = path.join(ROOT, pageRel);
  if (!fs.existsSync(pagePath)) { console.error(`❌ 搵唔到 ${pageRel}`); process.exit(2); }
  const html = fs.readFileSync(pagePath, "utf8");

  console.log(`頁面：${pageRel}`);
  console.log(`前綴：${prefix}`);

  const tpl = readMarkerTemplate();
  if (!tpl) {
    console.error("❌ 喺 js/freshness.js 搵唔到標記模板 —— 呢次驗證作廢，唔會用 fallback 頂硬上");
    process.exit(2);
  }
  console.log(`\n正對照 1：由 js/freshness.js 讀到標記模板 = ` +
    `${JSON.stringify(tpl.pre)} + description + ${JSON.stringify(tpl.post)}`);

  const blockRe = /<section class="data-block"([^>]*)>([\s\S]*?)<\/section>/g;
  const all = [...html.matchAll(blockRe)];
  const hit = all.filter(([, , body]) => body.includes(`data-fresh-key="${prefix}`));
  console.log(`正對照 2：頁面一共 ${all.length} 個 data-block，其中 ${hit.length} 個帶「${prefix}」` +
    `（前綴只用嚟搵 block；搵到之後成個 block 都會重建）`);
  if (!all.length) { console.error("❌ 呢頁一個 data-block 都冇"); process.exit(2); }
  if (!hit.length) { console.error(`❌ 冇一個 data-block 帶「${prefix}」開頭嘅 key`); process.exit(2); }

  // data-fresh 指住邊個資料檔
  const dataName = (hit[0][1].match(/data-fresh="([^"]+)"/) || [])[1];
  if (!dataName) { console.error("❌ 個 data-block 冇 data-fresh 屬性"); process.exit(2); }
  const dataPath = path.join(ROOT, "data", dataName + ".json");
  if (!fs.existsSync(dataPath)) { console.error(`❌ 搵唔到 data/${dataName}.json`); process.exit(2); }
  const entries = JSON.parse(fs.readFileSync(dataPath, "utf8")).entries || {};
  console.log(`正對照 3：data/${dataName}.json 讀到 ${Object.keys(entries).length} 條 entry`);

  const resolve = makeResolver(entries, tpl);
  const groups = hit.flatMap(([, , body]) => parseGroups(body, resolve))
                    .filter((g) => g.rows.length);

  console.log(`\n──────── 重建出嚟嘅 block ────────`);
  printGroups(groups);

  console.log(`\n──────── 斷言 ────────`);
  const rows = groups.flatMap((g) => g.rows);
  const marks = rows.filter((r) => r.kind === "mark").length;
  const dangling = rows.filter((r) => r.kind === "dangling");

  check("每條 key 都對得返 data", dangling.length === 0,
    dangling.map((r) => r.key).join(", "));
  check("至少抽到一條 key", rows.length > 0, `${rows.length} 條`);
  console.log(`  （分組 ${groups.length}、待核實標記 ${marks}、有值 ` +
    `${rows.filter((r) => r.kind === "value").length}）`);

  if (opts.groups != null) {
    check(`分組數 = ${opts.groups}`, groups.length === opts.groups,
      `實際 ${groups.length}：${groups.map((g) => g.heading).join(" / ")}`);
  }
  if (opts.marks != null) {
    check(`待核實標記數 = ${opts.marks}`, marks === opts.marks, `實際 ${marks}`);
  }
  return { groups, marks };
}

/* ------------------------------------------------------------------ */
/* --self-test：唔讀站入面任何一頁                                      */
/* ------------------------------------------------------------------ */

function selfTest() {
  console.log("── self-test：用內置 fixture，唔讀站入面任何一頁 ──\n");

  const tpl = readMarkerTemplate();
  check("由 js/freshness.js 抽到標記模板", !!tpl,
    tpl ? `${JSON.stringify(tpl.pre)} … ${JSON.stringify(tpl.post)}` : "抽唔到");
  if (!tpl) { console.log("\n❌ 模板抽唔到，後面冇得驗"); process.exit(2); }
  check("模板真係包住 description（唔係空殼）",
    tpl.pre.length > 0 && tpl.post.length > 0);

  const FIX = `
    <h4>甲區（貨幣 A）</h4>
    <p><strong>原始值：</strong><span data-fresh-key="t.a.samples"></span></p>
    <p><strong>區間：</strong><span data-fresh-key="t.a.band"></span></p>
    <h4>乙區（貨幣 B）</h4>
    <p><strong>原始值：</strong><span data-fresh-key="t.b.samples"></span></p>
    <p><strong>區間：</strong><span data-fresh-key="t.b.band"></span></p>
    <p><strong>已填嗰條：</strong><span data-fresh-key="t.filled"></span></p>
    <p><strong>對唔返嗰條：</strong><span data-fresh-key="t.nosuch"></span></p>
    <h4>丙區（陣列值）</h4>
    <ul data-fresh-key="t.list"><li>渲染前嘅佔位</li><li>第二行佔位</li></ul>
    <p data-fresh-key="t.para"></p>`;
  const ENTRIES = {
    "t.a.samples": { needsVerify: "甲區抽樣" },
    "t.a.band": { needsVerify: "甲區區間" },
    "t.b.samples": { needsVerify: "乙區抽樣" },
    "t.b.band": { needsVerify: "乙區區間" },
    "t.filled": { value: "一個真值", verifiedOn: "2026-08" },
    "t.list": { value: ["第一項", "第二項", "第三項"], verifiedOn: "2026-08" },
    "t.para": { value: "成段由一條 key 填", verifiedOn: "2026-08" },
  };
  const resolve = makeResolver(ENTRIES, tpl);

  const real = parseGroups(FIX, resolve);
  const realMarks = real.flatMap((g) => g.rows).filter((r) => r.kind === "mark").length;
  check("fixture 讀到三組", real.length === 3, `實際 ${real.length}`);
  check("fixture 讀到四個標記", realMarks === 4, `實際 ${realMarks}`);
  check("有值嗰條唔會當成標記",
    real.flatMap((g) => g.rows).find((r) => r.key === "t.filled")?.kind === "value");
  check("對唔返 data 嗰條會報 dangling",
    real.flatMap((g) => g.rows).find((r) => r.key === "t.nosuch")?.kind === "dangling");

  // ── <ul data-fresh-key> ──
  // freshness.js 見到 UL/OL 就逐項生成 <li>（fillElement）。呢個 parser
  // 一定要當佢係一條 key，而且唔可以連佢入面嗰啲佔位 <li> 一齊再數一次。
  const allRows = real.flatMap((g) => g.rows);
  const listRow = allRows.find((r) => r.key === "t.list");
  check("<ul data-fresh-key> 當成一條 key", !!listRow && listRow.kind === "value",
    listRow ? `kind=${listRow.kind}` : "搵唔到");
  check("陣列值渲染成三項", !!listRow && listRow.rendered.split(" / ").length === 3,
    listRow ? listRow.rendered : "");
  check("<ul> 入面嘅佔位 <li> 冇被重複數",
    allRows.filter((r) => r.key === "t.list").length === 1,
    `實際 ${allRows.filter((r) => r.key === "t.list").length} 次`);
  // ── <p data-fresh-key>（屬性喺 tag 身上，唔喺入面嘅 <span>）──
  const paraRow = allRows.find((r) => r.key === "t.para");
  check("<p data-fresh-key> 讀得到（屬性喺 tag 身上）",
    !!paraRow && paraRow.kind === "value", paraRow ? `kind=${paraRow.kind}` : "搵唔到");

  check("總 key 數 = 8（4 標記 + 1 值 + 1 dangling + 1 清單 + 1 整段）",
    allRows.length === 8, `實際 ${allRows.length}`);

  // 反面對照：剝走 <ul> 個 data-fresh-key，同一個 parser 一定要搵唔返嗰條 key。
  // 冇呢一步，「讀到 t.list」可能係硬寫出嚟，唔證明到佢真係由 HTML 讀。
  const noAttr = FIX
    .replace(/<ul data-fresh-key="t\.list">/, "<ul>")
    .replace(/<p data-fresh-key="t\.para">/, "<p>");
  const noAttrRows = parseGroups(noAttr, resolve).flatMap((g) => g.rows);
  console.log(`\n  反面對照：剝走 <ul> 同 <p> 兩個 data-fresh-key 之後，同一個 parser 讀到 ` +
    `${noAttrRows.length} 條 key（原本 ${allRows.length} 條）`);
  check("反面對照：剝走屬性就搵唔返 t.list / t.para（證明係讀 HTML，唔係硬寫）",
    !noAttrRows.some((r) => r.key === "t.list" || r.key === "t.para"));
  check("反面對照：其餘六條唔受影響（證明淨係嗰兩條冧咗，唔係成個 parse 壞咗）",
    noAttrRows.length === 6, `實際 ${noAttrRows.length}`);

  // ── 反面對照：剷走 h4，同一個 parser 一定要報一組 ──
  // 冇呢一步，「分咗兩組」可能係 parser 硬套出嚟，唔證明到 HTML 真係分咗組。
  const stripped = FIX.replace(/<h4[^>]*>[\s\S]*?<\/h4>/g, "");
  const merged = parseGroups(stripped, resolve);
  const mergedMarks = merged.flatMap((g) => g.rows).filter((r) => r.kind === "mark").length;
  console.log(`\n  反面對照：剷走兩個 <h4> 之後，同一個 parser 讀到 ` +
    `${merged.length} 組 / ${mergedMarks} 個標記` +
    `（組名：${merged.map((g) => g.heading).join("、")}）`);
  check("反面對照：剷走 h4 就只剩一組（證明分組係讀 HTML 讀返嚟，唔係硬寫）",
    merged.length === 1);
  check("反面對照：標記數唔變（證明淨係分組冧咗，唔係成個 parse 壞咗）",
    mergedMarks === 4, `實際 ${mergedMarks}`);
}

/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
if (argv.includes("--self-test")) {
  selfTest();
} else {
  const pos = argv.filter((a) => !a.startsWith("--"));
  const flag = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : Number(argv[i + 1]);
  };
  if (pos.length < 2) {
    console.error("用法：node scripts/check-fresh-block.mjs <頁面路徑> <key 前綴> " +
      "[--expect-groups N] [--expect-marks N]\n" +
      "　　　node scripts/check-fresh-block.mjs --self-test");
    process.exit(2);
  }
  runPage(pos[0], pos[1], { groups: flag("--expect-groups"), marks: flag("--expect-marks") });
}

console.log(`\n${fail === 0 ? "✅ 全部通過" : "❌ " + fail + " 項失敗"}`);
process.exit(fail ? 1 : 0);
