#!/usr/bin/env node
/* hk_eats — scripts/test-freshness.mjs
 *
 * 用 node:vm 載入 js/freshness.js 嘅真身（唔係複製一份邏輯出嚟測），
 * 覆蓋 volatility 三檔 × 邊界月份 5/6/7 同 11/12/13。
 *
 *   node scripts/test-freshness.mjs
 */

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(ROOT, "js/freshness.js"), "utf8");

const stubEl = { querySelectorAll: () => [], appendChild() {}, insertBefore() {}, classList: { add() {} }, setAttribute() {}, removeAttribute() {} };
const sandbox = {
  window: {},
  document: {
    currentScript: { src: "https://example.test/js/freshness.js" },
    getElementsByTagName: () => [],
    querySelectorAll: () => [],
    querySelector: () => null,
    createElement: () => stubEl,
    addEventListener: () => {},
    readyState: "complete",
  },
  fetch: () => Promise.reject(new Error("測試唔連網")),
  Array, Object, Date, String, Number, Math, JSON, Infinity, console,
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const F = sandbox.window.hkEatsFreshness;

let pass = 0, fail = 0;
const rows = [];

function check(label, actual, expected) {
  const ok = actual === expected;
  ok ? pass++ : fail++;
  rows.push({ ok, label, actual: String(actual), expected: String(expected) });
}

/* 由「而家」倒推 N 個曆月，砌一個 verifiedOn。
   固定用 2027-03-15 做「而家」，令測試唔會隨真實日期飄。 */
const NOW = new Date(2027, 2, 15); // 2027-03
function ymAgo(months) {
  let y = NOW.getFullYear();
  let m = NOW.getMonth() + 1 - months;
  while (m <= 0) { m += 12; y -= 1; }
  return `${y}-${String(m).padStart(2, "0")}`;
}

/* ---- 1. 三檔 × 邊界月份 ---- */
const MONTHS = [5, 6, 7, 11, 12, 13];
const EXPECT_STALE = {
  //        5      6      7      11     12     13
  low:    [false, false, false, false, false, true ],  // 門檻 12
  normal: [false, false, true,  true,  true,  true ],  // 門檻 6
  high:   [false, false, false, false, false, false],  // 永不過期
};

for (const vol of ["low", "normal", "high"]) {
  MONTHS.forEach((months, i) => {
    const raw = ymAgo(months);
    const ym = F.parseYearMonth(raw);
    check(`monthsSince  ${raw} @2027-03 (${vol})`, F.monthsSince(ym, NOW), months);
    check(`isStale      ${vol.padEnd(6)} ${String(months).padStart(2)} 個月`, F.isStale(ym, NOW, vol), EXPECT_STALE[vol][i]);
  });
}

/* ---- 2. 門檻值本身 ---- */
check("threshold low", F.thresholdFor("low"), 12);
check("threshold normal", F.thresholdFor("normal"), 6);
check("threshold high", F.thresholdFor("high"), Infinity);

/* ---- 3. 預設值與非法值 ---- */
check("volatility 缺省 → normal", F.normalizeVolatility(undefined), "normal");
check("volatility null → normal", F.normalizeVolatility(null), "normal");
check("volatility 亂寫 → normal", F.normalizeVolatility("HIGHEST"), "normal");
check("volatility 大寫 HIGH → high", F.normalizeVolatility("HIGH"), "high");
check("缺省 volatility 用 6 個月門檻", F.isStale(F.parseYearMonth(ymAgo(7)), NOW, undefined), true);
check("缺省 volatility 6 個月唔算舊", F.isStale(F.parseYearMonth(ymAgo(6)), NOW, undefined), false);

/* ---- 4. isVolatile ---- */
check("isVolatile high", F.isVolatile("high"), true);
check("isVolatile normal", F.isVolatile("normal"), false);
check("isVolatile low", F.isVolatile("low"), false);
check("isVolatile 缺省", F.isVolatile(undefined), false);

/* ---- 5. high 就算好舊都唔會 stale ---- */
check("high 60 個月前仍然唔算過期", F.isStale(F.parseYearMonth(ymAgo(60)), NOW, "high"), false);

/* ---- 6. 日期格式 ---- */
check("parseYearMonth 2026-13", F.parseYearMonth("2026-13"), null);
check("parseYearMonth 202608", F.parseYearMonth("202608"), null);
check("parseYearMonth 空字串", F.parseYearMonth(""), null);
check("parseYearMonth 缺省", F.parseYearMonth(undefined), null);
check("parseYearMonth 2026-00", F.parseYearMonth("2026-00"), null);

/* ---- 7. 跨年 ---- */
check("跨年 2026-12 @2027-03", F.monthsSince(F.parseYearMonth("2026-12"), NOW), 3);
check("跨年 2026-03 @2027-03", F.monthsSince(F.parseYearMonth("2026-03"), NOW), 12);
check("跨年 low 12 個月唔算舊", F.isStale(F.parseYearMonth("2026-03"), NOW, "low"), false);
check("跨年 low 13 個月算舊", F.isStale(F.parseYearMonth("2026-02"), NOW, "low"), true);

/* ---- 輸出 ---- */
console.log("freshness volatility 測試（固定「而家」= 2027-03）\n");
for (const r of rows) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.label.padEnd(46)} → ${r.actual}${r.ok ? "" : "   (預期 " + r.expected + ")"}`);
}
console.log("");
console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
