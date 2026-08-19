#!/usr/bin/env node
/* hk_eats — scripts/check-ads-cls.mjs
 *
 * 證明「enabled:false 同 enabled:true 兩種狀態下，廣告容器嘅版面高度一樣」。
 *
 * 冇瀏覽器嘅情況下唔可以量度實際 layout，所以呢度用嘅係靜態證明：
 * 只要 (a) 高度完全由 base 規則嘅 min-height 決定，(b) 兩態之間唯一嘅
 * 差別係一個唔影響盒模型嘅 class，(c) JS 由頭到尾冇改過任何影響版面
 * 嘅屬性 —— 咁高度就唔可能唔同。逐條逐條驗。
 *
 *   node scripts/check-ads-cls.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(ROOT, "css/main.css"), "utf8");
const adsJs = fs.readFileSync(path.join(ROOT, "js/ads.js"), "utf8");
const slots = JSON.parse(fs.readFileSync(path.join(ROOT, "data/ad-slots.json"), "utf8"));

/* 選擇器分析用嘅版本：先剝走 CSS 註解，否則註解入面嘅 "ad-slots.json"
   會被當成選擇器嘅一部分（個 . 會誤判成 class）。 */
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

let pass = 0, fail = 0;
const say = (ok, label, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
};

/* 影響盒模型高度嘅屬性。outline 唔喺入面（佢唔佔版面）。 */
const LAYOUT_PROPS = [
  "height", "min-height", "max-height", "width", "min-width", "max-width",
  "padding", "padding-top", "padding-bottom", "margin", "margin-top",
  "margin-bottom", "display", "border", "border-width", "border-top",
  "border-bottom", "box-sizing", "position", "aspect-ratio", "line-height",
  "font-size",
];

/* ---- 1. JS 側：ads.js 唔准掂任何 style ---- */
console.log("── 1. js/ads.js 有冇改過版面 ──");

const jsCode = adsJs
  .replace(/\/\*[\s\S]*?\*\//g, "")   // 剝走註解，只驗可執行碼
  .replace(/^\s*\/\/.*$/gm, "");

say(!/\.style\b/.test(jsCode), "冇任何 .style 存取",
    /\.style\b/.test(jsCode) ? "發現 .style" : "");
say(!/setAttribute\s*\(\s*["']style["']/.test(jsCode), "冇 setAttribute('style', …)");
say(!/cssText/.test(jsCode), "冇 cssText");
say(!/insertAdjacentHTML|innerHTML|outerHTML/.test(jsCode), "冇 innerHTML / insertAdjacentHTML（唔會塞內容撐高）");
say(!/appendChild|insertBefore|append\s*\(/.test(jsCode), "冇 appendChild / insertBefore（唔會加子節點）");
say(!/textContent|innerText/.test(jsCode), "冇寫 textContent（「廣告位」字樣全部由 CSS ::after 出）");

const layoutInJs = LAYOUT_PROPS.filter((p) => new RegExp(`["'\`]${p}["'\`]`).test(jsCode));
say(layoutInJs.length === 0, "冇喺 JS 出現任何版面屬性名", layoutInJs.join(", "));

// 只准做呢兩種 DOM 操作
const mutations = [...jsCode.matchAll(/el\.(\w+)/g)].map((m) => m[1]);
const allowed = new Set(["setAttribute", "getAttribute", "classList", "tagName"]);
const illegal = [...new Set(mutations)].filter((m) => !allowed.has(m));
say(illegal.length === 0, "對容器嘅操作只限 setAttribute / classList", illegal.join(", "));

// classList 只准 add，唔准 remove/toggle（避免兩態行為分歧）
const classOps = [...new Set([...jsCode.matchAll(/classList\.(\w+)/g)].map((m) => m[1]))];
say(classOps.every((o) => o === "add"), `classList 操作只有 add`, classOps.join(", "));

/* ---- 2. CSS 側：高度由 base 規則決定 ---- */
console.log("\n── 2. css/main.css 高度喺邊度定 ──");

for (const slot of slots.slots) {
  const re = new RegExp(`\\[data-ad-slot="${slot.id}"\\]\\s*\\{([^}]*)\\}`, "g");
  const blocks = [...css.matchAll(re)].map((m) => m[1]);
  const heights = blocks.map((b) => {
    const h = /min-height\s*:\s*(\d+)px/.exec(b);
    return h ? parseInt(h[1], 10) : null;
  });
  const ok = blocks.length === 2 &&
             heights[0] === slot.mobile[1] &&
             heights[1] === slot.desktop[1];
  say(ok, `${slot.id} 高度由 base 規則硬預留`,
      `手機 ${heights[0]}px / 桌面 ${heights[1]}px（json: ${slot.mobile[1]} / ${slot.desktop[1]}）`);

  // base 規則唔准被 .is-dev-placeholder 之類嘅「狀態」class 限定。
  // .ad-slot 本身係基礎 class，唔算狀態 —— 剝走佢先再睇有冇剩低嘅 class。
  const selRe = new RegExp(`([^{}]*\\[data-ad-slot="${slot.id}"\\][^{}]*)\\{`, "g");
  const stateGated = [...cssNoComments.matchAll(selRe)]
    .map((m) => m[1].trim())
    .filter((sel) => sel.replace(/\.ad-slot\b/g, "").includes("."));
  say(stateGated.length === 0, `${slot.id} 嘅高度規則冇被任何狀態 class 限定`,
      stateGated.length ? stateGated.join(" / ") : "選擇器全部係 .ad-slot[data-ad-slot=…]");
}

/* ---- 3. CSS 側：佔位樣式唔准影響盒模型 ---- */
console.log("\n── 3. .is-dev-placeholder 有冇改過盒模型 ──");

function ruleBody(selector) {
  const re = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}");
  const m = re.exec(css);
  return m ? m[1] : null;
}

const phBody = ruleBody(".ad-slot.is-dev-placeholder");
say(phBody !== null, "搵到 .ad-slot.is-dev-placeholder 規則");
if (phBody) {
  const props = [...phBody.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
  const bad = props.filter((p) => LAYOUT_PROPS.includes(p));
  say(bad.length === 0, "佔位框冇用任何影響高度嘅屬性", `實際用咗：${props.join(", ")}`);
  say(props.includes("outline"), "用 outline 畫框（outline 唔佔版面，border 會）");
  say(!props.includes("border") && !props.includes("border-width"), "冇用 border");
}

const afterBody = ruleBody(".ad-slot.is-dev-placeholder::after");
say(afterBody !== null, "搵到 ::after 規則");
if (afterBody) {
  say(/position\s*:\s*absolute/.test(afterBody), "::after 係絕對定位（脫離文檔流，撐唔到容器）");
  say(/inset\s*:\s*0/.test(afterBody), "::after 用 inset:0 貼住容器，唔會自己定尺寸");
  say(/content\s*:/.test(afterBody), "「廣告位」字樣由 CSS content 出，唔經 JS");
}

const baseBody = ruleBody(".ad-slot");
say(baseBody !== null && /overflow\s*:\s*hidden/.test(baseBody || ""),
    ".ad-slot 有 overflow:hidden（將來廣告超高都撐唔爆版面）");
say(baseBody !== null && /contain\s*:\s*layout/.test(baseBody || ""),
    ".ad-slot 有 contain:layout（內部 layout 唔會外洩）");

/* ---- 4. 結論 ---- */
console.log("\n── 4. 推論 ──");
console.log("  容器高度 = base 規則嘅 min-height（同 enabled 無關）");
console.log("  enabled:false → 加 .is-dev-placeholder（只有 outline / border-radius / ::after）");
console.log("  enabled:true  → 加載廣告，內容受 overflow:hidden + contain:layout 約束");
console.log("  JS 由頭到尾冇改過任何版面屬性 → 兩態高度相同");

console.log("");
console.log(`${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
