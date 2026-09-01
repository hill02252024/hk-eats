#!/usr/bin/env node
/* hk_eats — scripts/check-markdown-in-data.mjs
 *
 *   node scripts/check-markdown-in-data.mjs --self-test
 *
 * E28／W18 嘅反面對照。**一個唔會 fail 嘅對照組等於冇對照組**，所以呢度
 * 唔係讀個檔搵字串，而係真係跑一次 scripts/build.mjs，用
 * MARKDOWN_SCAN_EXTRA 叫佢額外掃埋 scripts/fixtures/markdown/。
 *
 * 個開關刻意做成「只可以加，唔可以減」—— 佢最多令守衛多掃一個資料夾，
 * 冇任何寫法可以令佢少掃 data/。所以就算有人誤用，都唔會靜靜咁收窄守衛。
 *
 * 四項斷言：
 *   1. 每個壞 fixture 都令 build fail（exit 非零）兼報啱嗰個 code
 *   2. 乾淨嗰個 fixture 一條都唔報          ← 證明唔係恆真
 *   3. 「3 * 4」同單條底線唔會被當成 markdown ← 證明唔會亂咬
 *   4. --publish 撞到呢個環境變數即刻拒絕跑
 *
 * 守衛邏輯只有一份（喺 build.mjs），呢度唔複製。
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = path.join(ROOT, "scripts", "build.mjs");
const FX = path.join("scripts", "fixtures", "markdown");

let pass = 0, fail = 0;
const ok = (n, cond, detail) => {
  if (cond) { pass++; console.log(`   PASS  ${n}`); }
  else { fail++; console.log(`   FAIL  ${n}${detail ? "  — " + detail : ""}`); }
};

function runBuild({ extra = null, publish = false } = {}) {
  const env = { ...process.env };
  delete env.MARKDOWN_SCAN_EXTRA;
  if (extra) env.MARKDOWN_SCAN_EXTRA = extra;
  const args = publish ? [BUILD, "--publish"] : [BUILD];
  try {
    return { code: 0, out: execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: (e.stdout || "") + (e.stderr || "") };
  }
}
const hits = (out, code, file) =>
  out.split("\n").map((l) => l.trim())
     .filter((l) => l.startsWith(code === "E28" ? "ERROR" : "WARNING") && l.includes(code) && (!file || l.includes(file)));

console.log("\n[A] 正常狀態：data/ 本身唔應該再有 E28");
{
  const r = runBuild();
  ok("正常 build exit 0", r.code === 0, `exit ${r.code}`);
  ok("正常 build 冇 E28", hits(r.out, "E28").length === 0, hits(r.out, "E28")[0]);
}

console.log("\n[B] 反面對照：壞 fixture 要令 build fail");
{
  const r = runBuild({ extra: FX });
  ok("build 真係 fail（exit 非零）", r.code !== 0, `exit ${r.code}`);
  for (const [file, code, desc] of [
    ["md-bold.json", "E28", "value 有 **粗體**"],
    ["md-italic.json", "E28", "value 有 *斜體*"],
    ["md-link-code.json", "E28", "value 有 [文字](網址) 同 `code`"],
    ["md-sourcenote.json", "W18", "sourceNote 有 **粗體**（warning 級）"],
  ]) {
    const h = hits(r.out, code, file);
    ok(`${file} → 報 ${code}（${desc}）`, h.length > 0);
    for (const l of h) console.log(`         ${l}`);
  }

  console.log("\n[C] 對照：唔應該報嘅嘢真係冇報");
  ok("md-clean.json 一條都冇報（證明唔係恆真）",
     hits(r.out, "E28", "md-clean").length === 0 && hits(r.out, "W18", "md-clean").length === 0,
     [...hits(r.out, "E28", "md-clean"), ...hits(r.out, "W18", "md-clean")][0]);
  ok("「3 * 4」同單獨一粒星唔會當成斜體",
     hits(r.out, "E28", "fx.notItalic").length === 0,
     hits(r.out, "E28", "fx.notItalic")[0]);
}

console.log("\n[D] --publish 一撞到 MARKDOWN_SCAN_EXTRA 就要拒絕跑");
{
  const r = runBuild({ extra: FX, publish: true });
  ok("exit 非零", r.code !== 0, `exit ${r.code}`);
  ok("係「拒絕」唔係「跑完先報錯」（冇階段行）", !/\[\d\/8\]/.test(r.out));
  ok("訊息講明原因", /--publish 唔准同 MARKDOWN_SCAN_EXTRA 一齊用/.test(r.out));
  for (const l of r.out.split("\n").filter((l) => l.trim())) console.log(`         ${l.trim()}`);
}

console.log(`\n${fail === 0 ? "✅ 全部通過" : "❌ " + fail + " 項失敗"}  (${pass} passed)`);
process.exit(fail ? 1 : 0);
