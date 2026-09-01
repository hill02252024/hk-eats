#!/usr/bin/env node
/* hk_eats — scripts/check-affiliate-links.mjs
 *
 *   node scripts/check-affiliate-links.mjs --self-test
 *
 * E25／E26 嘅反面對照。**一個唔會 fail 嘅對照組等於冇對照組**，所以呢度
 * 唔係讀個檔睇下有冇字串，而係真係跑一次 scripts/build.mjs，用
 * AFFILIATES_JSON 指去 scripts/fixtures/ 入面嘅壞檔，然後要求：
 *   1. exit code 非零
 *   2. 輸出真係有嗰個 E-code
 *   3. 正常嗰個 data/affiliates.json 跑同一個 build **唔會**出呢兩個 code
 *
 * 第 3 點同頭兩點一樣重要 —— 一條恆真嘅守衛一樣係冇對照組。
 *
 * 守衛邏輯本身只有一份（喺 build.mjs），呢度唔複製。複製咗就會有兩份
 * 各自漂移嘅實作，而測試會繼續綠。
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = path.join(ROOT, "scripts", "build.mjs");

let pass = 0, fail = 0;
const ok = (n, cond, detail) => {
  if (cond) { pass++; console.log(`   PASS  ${n}`); }
  else { fail++; console.log(`   FAIL  ${n}${detail ? "  — " + detail : ""}`); }
};

function runBuild(fixture) {
  const env = { ...process.env };
  if (fixture) env.AFFILIATES_JSON = path.join("scripts", "fixtures", fixture);
  try {
    const out = execFileSync(process.execPath, [BUILD], { cwd: ROOT, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const lines = (out, code) => out.split("\n").filter((l) => l.includes(code) && /^ERROR/.test(l.trim()));

console.log("\n[A] 正常狀態：data/affiliates.json 唔應該出 E25／E26");
{
  const r = runBuild(null);
  ok("正常 build exit 0", r.code === 0, `exit ${r.code}`);
  ok("正常 build 冇 E25", lines(r.out, "E25").length === 0);
  ok("正常 build 冇 E26", lines(r.out, "E26").length === 0);
}

const CASES = [
  ["affiliates-no-aid.json",      "E25", "Klook 連結冇 aid（partner params 清空）"],
  ["affiliates-pending-aid.json", "E25", "aid 有值但係 PENDING 佔位值"],
  ["affiliates-shortlink.json",   "E26", "用咗 s.klook.com 短網址"],
];

for (const [fx, code, desc] of CASES) {
  console.log(`\n[B] 反面對照：${fx} —— ${desc}`);
  const r = runBuild(fx);
  const hits = lines(r.out, code);
  ok(`build 真係 fail（exit 非零）`, r.code !== 0, `exit ${r.code}`);
  ok(`真係報 ${code}`, hits.length > 0);
  for (const h of hits) console.log(`         ${h.trim()}`);
}

console.log(`\n${fail === 0 ? "✅ 全部通過" : "❌ " + fail + " 項失敗"}  (${pass} passed)`);
process.exit(fail ? 1 : 0);
