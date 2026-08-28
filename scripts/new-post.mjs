#!/usr/bin/env node
/* hk_eats — scripts/new-post.mjs
 *
 * 開一篇新文章嘅骨架：HTML 殼 + 對應嘅 data JSON。
 *
 *   node scripts/new-post.mjs                      # 互動式問四條
 *   node scripts/new-post.mjs --list <sec>/<slug>  # 篇文填實咗，放佢出街
 *
 * ── 點解要分兩步 ──────────────────────────────────────────────
 * 新文一出世就係 `_draft: true`（入面全部係空位，未核實）。而 E19 明
 * 文規定：draft 頁唔准出現喺 sitemap、首頁 .post-list、pillar
 * .cluster-list。所以呢個 script **唔會**即刻把新文塞入清單 —— 咁做
 * 一定即刻撞 E19。
 *
 * 佢改為把兩段預先砌好嘅 <li> 存落 data JSON 嘅 `_pendingListing`，
 * 等你填實內容、拆走 `_draft` 之後，跑：
 *
 *     node scripts/new-post.mjs --list coffee/my-slug
 *
 * 佢會驗一次「真係唔再係 draft」，然後把兩段 <li> 插入首頁同 pillar、
 * 順手加返 pillar 個 jsonld:itemList 條數（E19 第四層要對數）。
 *
 * 守衛係權威，唔係阻頭阻勢嘅嘢。骨架過唔到守衛＝呢個 script 寫錯。
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "data");

/* 同 build.mjs 一份，唔可以各寫各。改咗嗰邊記得改呢邊。 */
const SECTIONS = {
  guides: { pillar: "港人北上完整指南", nav: "北上實務", list: true },
  areas:  { pillar: "內地食飲地圖",     nav: "分區地圖", list: true },
  notes:  { pillar: "實食紀錄",         nav: "實食紀錄", list: false },
  coffee: { pillar: "港深咖啡入門",     nav: "咖啡",     list: true },
  trips:  { pillar: "北上行程",         nav: "北上行程", list: true },
};
const NAV_ORDER = ["guides", "areas", "notes", "coffee", "trips"];
const DRAFT_REASON = "仲有待核實項目，未適合俾搜尋引擎索引。填實之後拆走呢兩個 key 就會自動返入 sitemap 同各清單。";

const die = (m) => { console.error(`\nERROR   ${m}\n`); process.exit(1); };
const todayMonth = () => new Date().toISOString().slice(0, 7);
const todayDate = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/* 模式二：把填實咗嘅文放出街                                            */
/* ------------------------------------------------------------------ */

function publishListing(target) {
  const [section, slug] = String(target).split("/");
  if (!SECTIONS[section] || !slug) die(`--list 要 <分區>/<slug>，例如 coffee/my-slug`);

  const dataPath = path.join(DATA_DIR, section, `${slug}.json`);
  if (!fs.existsSync(dataPath)) die(`搵唔到 ${path.relative(ROOT, dataPath)}`);
  const doc = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  if (doc._draft === true) {
    die(`${section}/${slug} 仲係 _draft: true。\n` +
        `        放出街之前要：填晒待核實項 → 由 JSON 拆走 _draft 同 _draftReason → 再跑一次呢個指令。\n` +
        `        E19 唔會畀 draft 頁入清單，呢個 script 亦唔會幫你繞過佢。`);
  }
  const pend = doc._pendingListing;
  if (!pend) die(`${section}/${slug} 冇 _pendingListing —— 可能已經放咗出街。自己 grep 一次首頁同 pillar 睇下。`);

  const rel = `${section}/${slug}.html`;
  const home = path.join(ROOT, "index.html");
  const pillar = path.join(ROOT, section, "index.html");
  let homeHtml = fs.readFileSync(home, "utf8");
  let pillarHtml = fs.readFileSync(pillar, "utf8");

  if (homeHtml.includes(`./${rel}`)) die(`首頁已經有 ${rel} 嘅連結`);

  /* 首頁按最新排 —— 插最頂。但三篇食評永遠行先（見 README「首頁文章
   * 排序」），所以新 notes 插最頂，其餘插喺最後一篇 notes 之後。 */
  const ulRe = /(<ul class="post-list">)([\s\S]*?)(<\/ul>)/;
  const um = ulRe.exec(homeHtml);
  if (!um) die("首頁搵唔到 <ul class=\"post-list\">");
  const items = um[2].match(/\s*<li>[\s\S]*?<\/li>/g) || [];
  const lastNote = items.map((x) => x.includes("./notes/")).lastIndexOf(true);
  const at = section === "notes" ? 0 : lastNote + 1;
  items.splice(at, 0, "\n  " + pend.home.trim().split("\n").join("\n  "));
  homeHtml = homeHtml.slice(0, um.index) + um[1] + items.join("") + "\n" + um[3] +
             homeHtml.slice(um.index + um[0].length);
  fs.writeFileSync(home, homeHtml, "utf8");

  /* Pillar：cluster-list 可能而家係一句 .callout（清單曾經清空過），
   * 咁就要重新開一條 <ul>，順手拆走嗰句「未放出嚟」嘅說明。 */
  const cRe = /(<ul class="cluster-list">)([\s\S]*?)(<\/ul>)/;
  const cm = cRe.exec(pillarHtml);
  let count;
  if (cm) {
    const lis = cm[2].match(/\s*<li>[\s\S]*?<\/li>/g) || [];
    lis.push("\n  " + pend.pillar.trim().split("\n").join("\n  "));
    count = lis.length;
    lis.forEach((li, i) => { lis[i] = li.replace(/<span class="step">\d+<\/span>/, `<span class="step">${String(i + 1).padStart(2, "0")}</span>`); });
    pillarHtml = pillarHtml.slice(0, cm.index) + cm[1] + lis.join("") + "\n" + cm[3] +
                 pillarHtml.slice(cm.index + cm[0].length);
  } else {
    const co = /<p class="callout">呢個分區嘅文章仲有資料未核實[\s\S]*?<\/p>/.exec(pillarHtml);
    if (!co) die(`${section}/index.html 搵唔到 .cluster-list，亦搵唔到嗰句「未放出嚟」嘅說明 —— 自己手動插。`);
    count = 1;
    const li = pend.pillar.trim().replace(/<span class="step">\d+<\/span>/, '<span class="step">01</span>');
    pillarHtml = pillarHtml.slice(0, co.index) +
      `<ul class="cluster-list">\n  ${li.split("\n").join("\n  ")}\n</ul>` +
      pillarHtml.slice(co.index + co[0].length);
  }

  /* E19 第四層：itemList 條數要同畫面對數。 */
  const ilRe = /<meta name="jsonld:itemList" content="([^"]*)">/;
  const il = ilRe.exec(pillarHtml);
  if (il) {
    const names = il[1].split("|").filter((x) => x.trim());
    names.push(pend.itemName);
    pillarHtml = pillarHtml.replace(ilRe, `<meta name="jsonld:itemList" content="${names.join("|")}">`);
    if (names.length !== count) {
      console.log(`  ⚠ itemList 而家 ${names.length} 條，畫面 ${count} 條 —— build 會用 E19 報返你，自己校返。`);
    }
  } else {
    console.log(`  註：${section}/index.html 冇 jsonld:itemList meta（清單曾經清空時拆走咗）。` +
                `想要返就自己加 jsonld:itemListName + jsonld:itemList，條數要係 ${count}。`);
  }
  fs.writeFileSync(pillar, pillarHtml, "utf8");

  delete doc._pendingListing;
  fs.writeFileSync(dataPath, JSON.stringify(doc, null, 2) + "\n", "utf8");

  console.log(`\n已放出街：${rel}`);
  console.log(`  index.html         插喺第 ${at + 1} 位`);
  console.log(`  ${section}/index.html   cluster-list 而家 ${count} 篇`);
  runBuild();
}

/* ------------------------------------------------------------------ */
/* 骨架                                                                */
/* ------------------------------------------------------------------ */

function navHtml(section) {
  return NAV_ORDER.map((k) =>
    `      <a href="../${k}/index.html"${k === section ? ' aria-current="page"' : ""}>${SECTIONS[k].nav}</a>`
  ).join("\n");
}

function buildHtml({ section, title, slug, isNotes, visitDate }) {
  const sec = SECTIONS[section];
  const types = sec.list && !isNotes ? "Article,ItemList,FAQPage" : "Article,FAQPage";
  const itemListMeta = sec.list && !isNotes
    ? `<meta name="jsonld:itemListName" content="${title}——分層">\n` +
      `<meta name="jsonld:itemList" content="第一層|第二層|第三層">\n`
    : "";
  const d = todayDate();

  /* 資料格。notes 有固定一套（到訪紀錄），其餘用三個通用位。 */
  const keys = isNotes
    ? [["到訪日期", "visit.date"], ["點咗咩", "order.set"], ["實付", "price.paid"],
       ["營業時間", "hours.daily"], ["去到點行", "access.metro"]]
    : [["數值一", "figure.one"], ["數值二", "figure.two"], ["適用範圍", "scope.note"]];

  const dataBlock =
    `<section class="data-block" data-fresh="${section}/${slug}">\n` +
    `  <h3>${isNotes ? "當日紀錄" : "會變嘅數值"}</h3>\n` +
    keys.map(([label, k]) => `  <p><strong>${label}：</strong><span data-fresh-key="${k}"></span></p>`).join("\n") +
    `\n</section>`;

  /* W8：正文內連要 3–5 條，其中一條 anchor 要含 pillar 關鍵字、
   * 而且要喺頁面上半部。骨架就照住呢個規矩砌，唔使你事後執。
   * 麵包屑唔計數（build 會剝走），所以下面呢三條先係真正計嗰三條。 */
  const siblings = listSiblings(section, slug).slice(0, 2);
  const sibLinks = siblings.length
    ? siblings.map((s) => `<a href="./${s.slug}.html">${s.title}</a>`).join("、")
    : `<a href="../about.html">關於本站</a>`;

  return `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — 歎世界</title>
<meta name="description" content="TODO：一句講清楚呢篇答緊咩問題，唔好抄標題。">
<meta name="jsonld:type" content="${types}">
<meta name="jsonld:headline" content="${title}">
<meta name="jsonld:description" content="TODO：一句，同上面嘅 description 可以唔同。">
<meta name="jsonld:datePublished" content="${d}">
<meta name="jsonld:dateModified" content="${d}">
<meta name="jsonld:section" content="${sec.nav}">
${itemListMeta}<link rel="stylesheet" href="../css/main.css">
<script src="../js/freshness.js" defer></script>
<script src="../js/ads.js" defer></script>
</head>
<body>
<a class="skip-link" href="#main">跳去正文</a>

<header class="site-header">
  <div class="wrap">
    <a class="brand" href="../index.html">歎<span>世</span>界</a>
    <nav class="site-nav" aria-label="主要分區">
${navHtml(section)}
    </nav>
  </div>
</header>

<main id="main">
<article class="wrap">
<!-- build:breadcrumb -->
<!-- /build:breadcrumb -->

<h1>${title}</h1>
<p class="meta-line">${sec.nav} · 最後更新：${d}</p>

<p class="lede">TODO：三到四句。講清楚呢篇答緊邊條問題、答案嘅形狀係點、
點解值得睇落去。唔好寫「本文將會介紹」——直接落內容。</p>

<!-- build:toc -->
<!-- /build:toc -->

<h2 id="TODO-第一節" data-build-id>TODO：第一節</h2>

<p>TODO：正文。呢個站寫嘅係判斷方法，唔係一份會過期嘅清單 ——
所以呢度應該講「點解」同「點判斷」，會變嘅數字全部落去下面個資料區塊。</p>

<p>${isNotes ? "呢篇係一次到訪嘅紀錄，" : ""}整個分區點樣串埋一齊，睇<a href="./index.html">${sec.pillar}</a>${
  siblings.length ? `；相關嘅有${sibLinks}` : `；本站點樣運作見${sibLinks}`}。</p>

<div class="ad-slot" data-ad-slot="ad-article-1"></div>

<h2 id="TODO-會變嘅數值" data-build-id>TODO：會變嘅數值</h2>

<p>TODO：一句交代呢個區塊入面啲數字係邊度嚟、幾時核實過。</p>

${dataBlock}
${isNotes ? `
<!-- 相片。每篇最多 5 張，用 scripts/optimize-images.mjs 生成。
     alt 一定要填（E20 會攔），figcaption 講埋張相支撐緊咩判斷。
     原圖放 assets/photos/_raw/${slug}/，唔入版本控制。 -->
` : ""}
<h2 id="TODO-第三節" data-build-id>TODO：第三節</h2>

<p>TODO：正文。</p>

<div class="ad-slot" data-ad-slot="ad-article-2"></div>

<section class="faq">
  <h2 id="常見問題" data-build-id>常見問題</h2>

  <h3 data-faq-q>TODO：第一條真係有人問嘅問題？</h3>
  <div data-faq-a>
    <p>TODO：答案。唔好寫成宣傳語，寫成回答。</p>
  </div>

  <h3 data-faq-q>TODO：第二條？</h3>
  <div data-faq-a>
    <p>TODO：答案。</p>
  </div>
</section>

<div class="ad-slot" data-ad-slot="ad-article-end"></div>

</article>
</main>

<footer class="site-footer">
  <div class="wrap">
    <p>歎世界 — 香港出發的食飲與旅行指南。</p>
    <p>本站資料分為常青內容與可變資料兩部分，可變資料一律標明核實月份與變動速度。　<a href="../about.html">關於本站</a></p>
  </div>
</footer>
</body>
</html>
`;
}

function listSiblings(section, slug) {
  const dir = path.join(ROOT, section);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".html") && f !== "index.html" && f !== `${slug}.html`)
    .map((f) => {
      const h = fs.readFileSync(path.join(dir, f), "utf8");
      const m = /<h1>([\s\S]*?)<\/h1>/.exec(h);
      return { slug: f.replace(/\.html$/, ""), title: m ? m[1].replace(/<[^>]+>/g, "").trim() : f };
    });
}

function buildData({ section, title, slug, isNotes, visitDate }) {
  const keys = isNotes
    ? ["visit.date", "order.set", "price.paid", "hours.daily", "access.metro"]
    : ["figure.one", "figure.two", "scope.note"];

  const entries = {};
  for (const k of keys) {
    entries[k] = {
      /* 一出世就係「未核實」，唔係空字串 —— 空字串會靜靜咁渲染成一格
       * 空白，睇落似做完；needsVerify 會渲染成一個顯眼嘅待核實標記，
       * 而且 W7 每次 build 都會列出嚟。 */
      needsVerify: `TODO：${k} 要填咩，寫一句畀將來嘅自己睇`,
      volatility: isNotes ? "high" : "normal",
      ...(isNotes ? { volatileNote: "呢篇係一次到訪嘅紀錄。價錢、等候時間、出品水準隨時變，日期之後嘅嘢本站冇再核實。" } : {}),
    };
  }

  const doc = {
    title: `${title} — 易耗芯資料`,
    belongsTo: `/${section}/${slug}.html`,
    _status: "skeleton",
    _draft: true,
    _draftReason: DRAFT_REASON,
    _note: "由 scripts/new-post.mjs 生成嘅骨架。每條 entry 都係 needsVerify，填實一條拆一條。",
    ...(isNotes ? { visitDate, feedsInto: [] } : {}),
    entries,
    _pendingListing: {
      itemName: title,
      home: `<li><a href="./${section}/${slug}.html">${title}</a>\n` +
            `    <p>${SECTIONS[section].nav} · ${todayDate()}　TODO：一兩句摘要，講呢篇答到咩。</p></li>`,
      pillar: `<li><span class="step">99</span>\n` +
              `    <a href="./${slug}.html">${title}</a>\n` +
              `    <p>TODO：一句，講呢篇喺呢條線入面擺喺邊個位。</p></li>`,
    },
  };
  return JSON.stringify(doc, null, 2) + "\n";
}

/* ------------------------------------------------------------------ */

function runBuild() {
  console.log("\n── 跑 build ──");
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, "scripts", "build.mjs")], { cwd: ROOT, encoding: "utf8" });
    const tail = out.trim().split("\n").slice(-1)[0];
    console.log(tail);
    console.log("0 error。骨架過到全部守衛。");
    return true;
  } catch (e) {
    const out = (e.stdout || "") + (e.stderr || "");
    console.error(out.split("\n").filter((l) => /^ERROR/.test(l)).join("\n"));
    console.error("\n骨架過唔到守衛。呢個係 scripts/new-post.mjs 寫錯，唔係守衛要放寬 —— 去修 script。");
    return false;
  }
}

async function interactive(preset) {
  /* 唔用 rl.question()：喺 pipe 入面（測試、CI、俾 agent 驅動）佢會
   * 答完第一條就再唔 settle。行 async iterator 就 TTY 同 pipe 都一樣。 */
  const rl = readline.createInterface({ input: stdin, terminal: !!stdin.isTTY });
  const lines = rl[Symbol.asyncIterator]();
  /* key 明寫，唔靠問題文字嘅第一個字 —— 重問嗰句（「唔認得。分區…」）
   * 同正常嗰句要對到同一個 key，靠字首會撞。 */
  const ask = async (key, q, def) => {
    if (preset && preset.has(key)) { const v = preset.get(key); preset.delete(key); return v; }
    stdout.write(def ? `${q}（預設 ${def}）： ` : `${q}： `);
    const { value, done } = await lines.next();
    if (done) { stdout.write("\n"); return def || ""; }
    return String(value).trim() || def || "";
  };

  console.log("開一篇新文章嘅骨架。四條問題。\n");
  let section = await ask("section", `1. 分區（${Object.keys(SECTIONS).join(" / ")}）`);
  while (!SECTIONS[section]) section = await ask("section", `   唔認得。分區（${Object.keys(SECTIONS).join(" / ")}）`);

  let title = await ask("title", "2. 標題（一句，唔好淨係一個標籤）");
  while (!title) title = await ask("title", "   標題唔可以空");

  const guess = section === "notes" ? `${todayMonth()}-` : "";
  let slug = await ask("slug", "3. slug（英文小寫、用 - 分隔）", guess || undefined);
  while (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) slug = await ask("slug", "   只准 a-z 0-9 同 -。slug");

  const isNotesDefault = section === "notes" ? "y" : "n";
  const ans = (await ask("notes", "4. 係咪實食紀錄（notes）？(y/n)", isNotesDefault)).toLowerCase();
  const isNotes = ans.startsWith("y");

  let visitDate = "";
  if (isNotes) {
    visitDate = await ask("visit", "   到訪年月（YYYY-MM）", todayMonth());
    while (!/^\d{4}-\d{2}$/.test(visitDate)) visitDate = await ask("visit", "   格式 YYYY-MM。到訪年月");
  }
  rl.close();

  if (isNotes && section !== "notes") {
    console.log(`\n註：你揀咗 ${section} 但話係實食紀錄。實食紀錄應該放 notes/ —— 唔係樣式問題，`);
    console.log("    係 W14 只掃 data/notes/*.json 嘅回饋線，放錯分區條線就冇人驗。");
  }
  return { section, title, slug, isNotes, visitDate };
}

/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const listIdx = argv.indexOf("--list");
if (listIdx !== -1) {
  publishListing(argv[listIdx + 1]);
} else {
  /* 非互動用法（俾測試同 agent 驅動）：
   *   node scripts/new-post.mjs --section coffee --title "…" --slug … [--notes] [--visit YYYY-MM]
   * 問題答齊就唔會再問。答唔齊就照跌返落互動模式問剩返嗰啲。 */
  const flag = (n) => { const i = argv.indexOf(`--${n}`); return i === -1 ? null : argv[i + 1]; };
  const preset = new Map();
  if (flag("section")) preset.set("section", flag("section"));
  if (flag("title")) preset.set("title", flag("title"));
  if (flag("slug")) preset.set("slug", flag("slug"));
  if (argv.includes("--notes")) preset.set("notes", "y");
  else if (flag("section")) preset.set("notes", flag("section") === "notes" ? "y" : "n");
  if (flag("visit")) preset.set("visit", flag("visit"));

  const opts = await interactive(preset);
  const htmlPath = path.join(ROOT, opts.section, `${opts.slug}.html`);
  const dataPath = path.join(DATA_DIR, opts.section, `${opts.slug}.json`);
  if (fs.existsSync(htmlPath)) die(`${path.relative(ROOT, htmlPath)} 已經存在`);
  if (fs.existsSync(dataPath)) die(`${path.relative(ROOT, dataPath)} 已經存在`);

  fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(htmlPath, buildHtml(opts), "utf8");
  fs.writeFileSync(dataPath, buildData(opts), "utf8");

  console.log("");
  console.log("生成咗：");
  console.log(`  ${path.relative(ROOT, htmlPath)}`);
  console.log(`  ${path.relative(ROOT, dataPath)}`);
  console.log("");
  console.log("因為係 _draft，佢而家：唔入 sitemap、唔入首頁清單、唔入 pillar 清單，");
  console.log("但 URL 打得開。E19 就係守呢件事。");
  console.log("");
  console.log("填實之後放出街：");
  console.log(`  1. 把 data JSON 每條 needsVerify 換成 value + verifiedOn`);
  console.log(`  2. 拆走 _draft 同 _draftReason`);
  console.log(`  3. node scripts/new-post.mjs --list ${opts.section}/${opts.slug}`);

  if (!runBuild()) process.exit(1);
}
