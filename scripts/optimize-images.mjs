#!/usr/bin/env node
/* hk_eats — scripts/optimize-images.mjs
 *
 * 把 assets/photos/_raw/<slug>/ 入面嘅原圖，壓成兩個尺寸嘅 WebP，
 * 放去 assets/photos/。原圖唔入版本控制（見 .gitignore）。
 *
 *   node scripts/optimize-images.mjs              # 全部
 *   node scripts/optimize-images.mjs <slug>       # 淨係一篇
 *   node scripts/optimize-images.mjs <slug> --html  # 順便印返 HTML 出嚟
 *
 * 依賴：**唔使 npm install。** 用 macOS 內置嘅 sips 解碼／縮放，加
 * cwebp（libwebp）編碼。兩樣呢部機都已經有。如果 node_modules 入面
 * 搵到 sharp 就會優先用 sharp（快好多、少一次中間檔），但唔會因為冇
 * sharp 而唔郁 —— 呢個站嘅規矩係零 npm 依賴。
 *
 * ⚠️ EXIF：手機相帶 GPS 座標同拍攝時間。呢度用兩道防線 ——
 *   1. 解碼成 PNG 做中間檔（PNG 冇 EXIF GPS 呢個概念）
 *   2. cwebp 明寫 `-metadata none`
 * 寫完之後仲會逐個檔掃一次，確認 WebP 冇 EXIF／XMP chunk，唔通過就
 * 當場 error 兼刪走個檔。呢個唔係「應該冇」，係「驗過冇」。
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW_DIR = path.join(ROOT, "assets", "photos", "_raw");
const OUT_DIR = path.join(ROOT, "assets", "photos");

/* 每篇文最多五張。超過就停低報錯，唔會靜靜咁截頭 —— 你以為上咗
 * 八張，實際出咗五張，係最難發現嗰種錯。 */
const MAX_PER_ARTICLE = 5;
const WIDTHS = [1200, 800];   // 桌面 / 手機
const QUALITY = 80;
const RAW_EXT = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".tif", ".tiff"]);

let errors = 0;
const err = (m) => { errors++; console.error(`ERROR   ${m}`); };
const warn = (m) => console.warn(`WARNING ${m}`);

/* ------------------------------------------------------------------ */
/* 後端偵測                                                            */
/* ------------------------------------------------------------------ */

function which(bin) {
  try { return execFileSync("/usr/bin/which", [bin], { encoding: "utf8" }).trim(); }
  catch { return null; }
}

/* cwebp 可能有幾個版本（homebrew / anaconda）。揀版本最新嗰個 ——
 * 舊版對 HEIC 之類嘅輸入同新 flag 支援唔齊。 */
function findCwebp() {
  const cands = [
    "/opt/homebrew/bin/cwebp",
    "/usr/local/bin/cwebp",
    which("cwebp"),
  ].filter((p) => p && fs.existsSync(p));
  if (!cands.length) return null;
  let best = null;
  for (const p of cands) {
    let v = "0.0.0";
    try { v = execFileSync(p, ["-version"], { encoding: "utf8" }).trim().split("\n")[0]; } catch {}
    const n = v.split(".").map((x) => parseInt(x, 10) || 0);
    const score = n[0] * 10000 + n[1] * 100 + n[2];
    if (!best || score > best.score) best = { path: p, version: v, score };
  }
  return best;
}

async function loadSharp() {
  try { return (await import("sharp")).default; } catch { return null; }
}

/* ------------------------------------------------------------------ */
/* EXIF 驗證                                                           */
/* ------------------------------------------------------------------ */

/* WebP 係 RIFF 容器：4 bytes chunk tag + 4 bytes size（小端）+ payload。
 * 逐個 chunk 行一次，睇下有冇 EXIF / XMP。唔用 indexOf 搵字串 ——
 * 圖像資料入面完全可能啱啱好出現 "EXIF" 呢四個 byte，會報假警。 */
function webpChunks(file) {
  const b = fs.readFileSync(file);
  if (b.length < 12 || b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const out = [];
  let off = 12;
  while (off + 8 <= b.length) {
    const tag = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    out.push(tag);
    off += 8 + size + (size % 2);   // chunk 之後有 padding 對齊到雙數
  }
  return out;
}

function assertNoMetadata(file) {
  const chunks = webpChunks(file);
  if (!chunks) { err(`${path.basename(file)}: 唔係一個有效嘅 WebP 檔`); return false; }
  const bad = chunks.filter((c) => c === "EXIF" || c === "XMP ");
  if (bad.length) {
    err(`${path.basename(file)}: 仲有 ${bad.join("／")} chunk —— 元資料剝唔乾淨，已刪走個檔`);
    fs.unlinkSync(file);
    return false;
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* 縮放 + 編碼                                                          */
/* ------------------------------------------------------------------ */

function sipsDimensions(src) {
  const out = execFileSync("/usr/bin/sips", ["-g", "pixelWidth", "-g", "pixelHeight", src], { encoding: "utf8" });
  const w = /pixelWidth:\s*(\d+)/.exec(out);
  const h = /pixelHeight:\s*(\d+)/.exec(out);
  return { w: w ? +w[1] : 0, h: h ? +h[1] : 0 };
}

/* sips 路線：先解成 PNG（順手斷咗 EXIF 呢條線），再交畀 cwebp。
 * 唔直接 jpeg → cwebp，因為 jpeg 中間檔會帶住原本嘅 EXIF，變成
 * 淨係靠 cwebp 一道防線。 */
function encodeWithSips(src, width, dest, cwebp) {
  const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "hk-eats-img-")), "step.png");
  try {
    execFileSync("/usr/bin/sips", [
      "--resampleWidth", String(width),
      "--setProperty", "format", "png",
      src, "--out", tmp,
    ], { stdio: "ignore" });
    execFileSync(cwebp, ["-q", String(QUALITY), "-metadata", "none", "-quiet", tmp, "-o", dest], { stdio: "ignore" });
    const d = sipsDimensions(dest);
    return d;
  } finally {
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  }
}

async function encodeWithSharp(sharp, src, width, dest) {
  const info = await sharp(src)
    .rotate()                                   // 跟 EXIF orientation 轉正，然後掉咗個 tag
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(dest);                              // sharp 預設唔帶 metadata
  return { w: info.width, h: info.height };
}

/* ------------------------------------------------------------------ */
/* 主流程                                                              */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const wantHtml = argv.includes("--html");
const only = argv.filter((a) => !a.startsWith("--"))[0] || null;

if (!fs.existsSync(RAW_DIR)) {
  console.log(`冇 ${path.relative(ROOT, RAW_DIR)}／ —— 未有原圖，冇嘢做。`);
  console.log("放法：assets/photos/_raw/<article-slug>/ 入面擺原圖，一篇文一個資料夾。");
  process.exit(0);
}

const sharp = await loadSharp();
const cwebp = sharp ? null : findCwebp();
if (!sharp && !cwebp) {
  err("搵唔到 sharp，亦搵唔到 cwebp。裝 libwebp（brew install webp）或者 sharp 其中一樣先。");
  process.exit(1);
}
console.log(`後端：${sharp ? "sharp（node_modules）" : `sips + ${cwebp.path}（${cwebp.version}）`}`);
console.log("");

fs.mkdirSync(OUT_DIR, { recursive: true });

const slugs = fs.readdirSync(RAW_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("."))
  .map((d) => d.name)
  .filter((s) => !only || s === only)
  .sort();

if (only && !slugs.length) {
  err(`搵唔到 assets/photos/_raw/${only}/`);
  process.exit(1);
}
if (!slugs.length) {
  console.log("_raw/ 入面一個資料夾都冇。");
  process.exit(0);
}

const report = [];

for (const slug of slugs) {
  const dir = path.join(RAW_DIR, slug);
  const files = fs.readdirSync(dir)
    .filter((f) => !f.startsWith(".") && RAW_EXT.has(path.extname(f).toLowerCase()))
    .sort();

  console.log(`▸ ${slug}　原圖 ${files.length} 張`);

  if (files.length > MAX_PER_ARTICLE) {
    err(`${slug}: ${files.length} 張原圖，超過每篇 ${MAX_PER_ARTICLE} 張上限。` +
        `自己揀走邊幾張 —— 呢個 script 唔會幫你截，因為你會以為出咗全部。`);
    console.log("");
    continue;
  }
  if (!files.length) { warn(`${slug}: 資料夾入面冇認得嘅圖檔`); console.log(""); continue; }

  const shots = [];
  for (let i = 0; i < files.length; i++) {
    const src = path.join(dir, files[i]);
    const n = String(i + 1).padStart(2, "0");
    const srcDim = sharp ? null : sipsDimensions(src);
    const variants = {};
    let ok = true;

    for (const w of WIDTHS) {
      /* 檔名一律重新編 —— 原檔名（IMG_4821.HEIC）冇資訊，
       * 而且會洩露你部機同拍攝次序。 */
      const name = `${slug}-${n}-${w}.webp`;
      const dest = path.join(OUT_DIR, name);
      const dim = sharp
        ? await encodeWithSharp(sharp, src, w, dest)
        : encodeWithSips(src, w, dest, cwebp.path);
      if (!assertNoMetadata(dest)) { ok = false; break; }
      variants[w] = { name, ...dim, bytes: fs.statSync(dest).size };
    }
    if (!ok) continue;

    const before = fs.statSync(src).size;
    const after = Object.values(variants).reduce((a, v) => a + v.bytes, 0);
    const big = variants[WIDTHS[0]];
    console.log(
      `   ${files[i]}` +
      `${srcDim ? `　${srcDim.w}×${srcDim.h}` : ""}` +
      `　${(before / 1024 / 1024).toFixed(2)} MB` +
      ` → ${WIDTHS.map((w) => `${w}px ${(variants[w].bytes / 1024).toFixed(0)} KB`).join(" + ")}` +
      `　（合共 ${(after / 1024).toFixed(0)} KB，剩返 ${(after / before * 100).toFixed(1)}%）`
    );
    shots.push({ n, big, variants, before, after });
    report.push({ slug, file: files[i], before, after });
  }

  if (wantHtml && shots.length) {
    console.log("");
    console.log(`   ── ${slug} 嘅 HTML（自己填 alt 同 figcaption，唔好留空）──`);
    for (const s of shots) console.log(figureHtml(slug, s).split("\n").map((l) => "   " + l).join("\n"));
  }
  console.log("");
}

/* 圖片喺文章頁（分區/檔名.html），所以相對路徑要 ../ */
function figureHtml(slug, s) {
  const small = s.variants[WIDTHS[1]].name;
  const big = s.big.name;
  return `<figure class="photo-figure">
  <picture>
    <source
      type="image/webp"
      srcset="../assets/photos/${small} 800w, ../assets/photos/${big} 1200w"
      sizes="(max-width: 720px) 100vw, 720px">
    <img src="../assets/photos/${big}"
         width="${s.big.w}" height="${s.big.h}"
         loading="lazy" decoding="async"
         alt="">
  </picture>
  <figcaption></figcaption>
</figure>`;
}

if (report.length) {
  const b = report.reduce((a, r) => a + r.before, 0);
  const a = report.reduce((x, r) => x + r.after, 0);
  console.log(`合計：${report.length} 張，${(b / 1024 / 1024).toFixed(2)} MB → ${(a / 1024).toFixed(0)} KB（${(a / b * 100).toFixed(1)}%）`);
  console.log(`元資料：${report.length * WIDTHS.length} 個輸出檔逐個掃過 RIFF chunk，冇 EXIF、冇 XMP。`);
}
if (errors) {
  console.error("");
  console.error(`${errors} 個 error。`);
  process.exit(1);
}
