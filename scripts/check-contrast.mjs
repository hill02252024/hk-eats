#!/usr/bin/env node
/* hk_eats — scripts/check-contrast.mjs
 *
 * 由 css/main.css 抽出淺色（:root）同深色（@media prefers-color-scheme: dark
 * 入面嘅 :root）兩套 token，解析 var() 引用，然後逐對計 WCAG 2.1 對比度。
 *
 * 門檻：
 *   text      4.5:1   （SVG 入面所有 <text>，字級細過 18.66px bold / 24px）
 *   graphic   3.0:1   （有意義嘅線條、邊框；WCAG 1.4.11 Non-text Contrast）
 *   surface   1.1:1   （純色塊區分，唔承載資訊，只要睇得出兩層）
 *
 *   node scripts/check-contrast.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(ROOT, "css/main.css"), "utf8");

/* ---- 抽 token ---- */
function parseBlock(block) {
  const out = {};
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(block))) out[m[1]] = m[2].trim();
  return out;
}

const lightBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/);
const darkBlock = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([\s\S]*?)\n\s*\}/);
if (!lightBlock || !darkBlock) {
  console.error("解析唔到 :root token 區塊");
  process.exit(1);
}

const light = parseBlock(lightBlock[1]);
const dark = { ...light, ...parseBlock(darkBlock[1]) }; // 深色只覆寫部分 token

/* ---- 解析 var() 鏈 ---- */
function resolve(tokens, name, depth = 0) {
  if (depth > 10) return null;
  let v = tokens[name];
  if (!v) return null;
  const ref = /^var\((--[a-z0-9-]+)\)$/i.exec(v.trim());
  if (ref) return resolve(tokens, ref[1], depth + 1);
  return v.trim();
}

/* ---- 色彩計算 ---- */
function hexToRgb(hex) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
function relLuminance(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fgHex, bgHex) {
  const a = hexToRgb(fgHex), b = hexToRgb(bgHex);
  if (!a || !b) return null;
  const l1 = relLuminance(a), l2 = relLuminance(b);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/* ---- 要驗嘅組合 ---- */
const THRESH = { text: 4.5, graphic: 3.0, surface: 1.1, info: 0 };

const PAIRS = [
  // SVG 圖解：全部襯 .diagram 個底 --diagram-panel
  ["--diagram-ink",    "--diagram-panel", "text",    "圖解主文字／節點文字（.d-section .d-title .d-node-text …）"],
  ["--diagram-muted",  "--diagram-panel", "text",    "圖解次級小字（.d-sz .d-hk .d-note .d-leaf-text …）"],
  ["--diagram-accent", "--diagram-panel", "text",    "強調文字（.d-border-text .d-gap-text）"],
  ["--diagram-warn",   "--diagram-panel", "text",    "警示文字（.d-warn .d-leaf-warn）"],
  ["--diagram-ok",     "--diagram-panel", "text",    "正面標示文字（.d-ok）"],
  ["--diagram-ink",    "--diagram-panel", "graphic", "有意義線條（.d-edge、節點邊框）"],
  ["--diagram-accent", "--diagram-panel", "graphic", "邊界線、箭頭、間隙標示（.d-border .d-arrow .d-gap）"],
  ["--diagram-warn",   "--diagram-panel", "graphic", "偏擺箭頭與軸（.d-arrow-bad .d-shaft-bad）"],
  ["--diagram-ok",     "--diagram-panel", "graphic", "同心軸（.d-shaft-good）"],
  ["--diagram-line",   "--diagram-panel", "graphic", "結構性淡線（.d-tick .d-divider .d-body .d-cond rect）"],
  ["--diagram-fill-2", "--diagram-panel", "surface", "刀盤內層填色（.d-burr-inner）"],
  // 圖解卡片同頁面底色嘅分界係靠 1px border，唔係靠填色差 ——
  // 所以要驗嘅係邊框，填色差只作記錄（門檻 info，唔 gate）。
  ["--line",           "--bg",            "surface", "圖解卡片邊框 vs 頁面底色（卡片邊界靠 border）"],
  ["--diagram-panel",  "--bg",            "info",    "圖解卡片填色 vs 頁面底色（僅記錄，邊界靠 border）"],
  // 兩套提示
  ["--warn-fg",  "--warn-bg",  "text",    "過期警告文字 .stale-warning"],
  ["--warn-line","--warn-bg",  "graphic", "過期警告邊框"],
  ["--info-fg",  "--info-bg",  "text",    "變動中橫幅文字 .volatile-banner"],
  ["--info-line","--info-bg",  "graphic", "變動中橫幅邊框與 ◆ 標記"],
  // 兩套提示要同頁面底色都分得開
  ["--warn-bg",  "--bg-raised", "surface", "過期警告底色 vs 區塊底色"],
  ["--info-bg",  "--bg-raised", "surface", "變動中橫幅底色 vs 區塊底色"],
  // 廣告佔位框（只喺 localhost 出現，但一樣要睇得到）
  ["--line-strong", "--bg", "surface", "廣告位虛線框 vs 頁面底色"],
];

let fail = 0;
const themes = [["淺色 (light)", light], ["深色 (dark)", dark]];

for (const [themeName, tokens] of themes) {
  console.log(`\n=== ${themeName} ===`);
  console.log(`${"組合".padEnd(42)}${"前景".padEnd(10)}${"背景".padEnd(10)}${"比值".padStart(8)}  門檻   結果`);
  console.log("-".repeat(96));
  for (const [fgTok, bgTok, kind, label] of PAIRS) {
    const fg = resolve(tokens, fgTok);
    const bg = resolve(tokens, bgTok);
    const ratio = contrast(fg, bg);
    if (ratio === null) {
      console.log(`${label.padEnd(42)}解析失敗 ${fgTok}=${fg} ${bgTok}=${bg}`);
      fail++;
      continue;
    }
    const need = THRESH[kind];
    const ok = ratio >= need;
    if (!ok) fail++;
    console.log(
      `${label.slice(0, 40).padEnd(42)}${String(fg).padEnd(10)}${String(bg).padEnd(10)}` +
      `${ratio.toFixed(2).padStart(7)}:1  ${(kind === "info" ? "—" : String(need)).padEnd(6)} ${kind === "info" ? "記錄" : (ok ? "PASS" : "FAIL")}`
    );
  }
}

console.log("");
console.log(fail ? `${fail} 個組合未達門檻` : "全部組合達標");
process.exit(fail ? 1 : 0);
