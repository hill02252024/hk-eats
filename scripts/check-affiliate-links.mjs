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

function runBuild(fixture, extraArgs = []) {
  const env = { ...process.env };
  delete env.AFFILIATES_JSON;
  if (fixture) env.AFFILIATES_JSON = path.join("scripts", "fixtures", fixture);
  try {
    const out = execFileSync(process.execPath, [BUILD, ...extraArgs], { cwd: ROOT, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] });
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
  ["affiliates-unlinked-partner-empty.json",   "E27", "被引用嘅 link 屬於一個 params 空咗嘅夥伴"],
  ["affiliates-unlinked-partner-pending.json", "E27", "同上，但 params 有 key 而值係 PENDING 佔位"],
];

for (const [fx, code, desc] of CASES) {
  console.log(`\n[B] 反面對照：${fx} —— ${desc}`);
  const r = runBuild(fx);
  const hits = lines(r.out, code);
  ok(`build 真係 fail（exit 非零）`, r.code !== 0, `exit ${r.code}`);
  ok(`真係報 ${code}`, hits.length > 0);
  for (const h of hits) console.log(`         ${h.trim()}`);
}

/* AFFILIATES_JSON 係一個「叫守衛讀第二個檔」嘅開關。佢淨係應該喺呢個
 * self-test 度出現；一旦同 --publish 夾埋用，就等於「我要出街嗰份」同
 * 「我而家讀緊 fixture」兩句同時成立 —— 一個矛盾。build.mjs 喺任何檢查
 * 跑之前就攔咗佢，所以連「0 error」呢個誤導畫面都唔會印得出。 */
console.log("\n[C] --publish 一撞到 AFFILIATES_JSON 就要拒絕跑");
{
  const r = runBuild("affiliates-no-aid.json", ["--publish"]);
  ok("exit 非零", r.code !== 0, `exit ${r.code}`);
  ok("係「拒絕」唔係「跑完先報錯」（輸出唔應該有 [1/8] 之類嘅階段）",
     !/\[\d\/8\]/.test(r.out));
  ok("訊息講明係 --publish 同 AFFILIATES_JSON 撞", /--publish 唔准同 AFFILIATES_JSON 一齊用/.test(r.out));
  for (const l of r.out.split("\n").filter((l) => l.trim())) console.log(`         ${l.trim()}`);
}
console.log("\n[D] 對照：冇 --publish 嘅時候，覆寫照舊行得（self-test 路徑唔受影響）");
{
  const r = runBuild("affiliates-no-aid.json");
  ok("照樣跑得到檢查（輸出有階段行）", /\[\d\/8\]/.test(r.out));
  ok("而且係因為 fixture 觸發 E25 先 fail，唔係被拒", lines(r.out, "E25").length > 0 && r.code !== 0);
}

console.log(`\n${fail === 0 ? "✅ 全部通過" : "❌ " + fail + " 項失敗"}  (${pass} passed)`);
process.exit(fail ? 1 : 0);
