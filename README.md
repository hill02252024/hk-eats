# 歎世界（repo: hk_eats）

> 顯示層品牌係「**歎世界**」，副題「**香港出發的食飲與旅行指南**」。
> 目錄名、repo 名、`SITE_ORIGIN` 入面嘅 `hk_eats` 係基建標識，**唔會改**，
> 亦唔會喺任何用戶或者搜尋引擎見到嘅位置出現。

## 品牌定位（寫新文之前睇一次）

本站嘅角度係**「用香港人嘅尺，量外面嘅世界」**。

比較基準永遠由香港出發：

- **價格**同旺角比
- **咖啡**同中環比
- **時間感**用港鐵同過關計

寫任何一篇新文，都應該問一句：呢個判斷，一個香港讀者可以用佢自己嘅
日常經驗接得住嗎？接唔住就要補一個香港側嘅參照點，唔好用當地標準
自說自話。

品牌名**刻意唔綁死地區**——「歎世界」冇講明係邊個世界，所以將來加
日本、台灣或者其他目的地都唔使改名、唔使重建 URL、唔使重新建立品牌認知。

**現階段範圍：北上、香港本地、咖啡。**超出呢三樣嘅題材，先確認佢
接唔接得返上面條尺，再決定要唔要開新分區。

### 分區名點解唔跟品牌名一齊抽象化

「港深食飲地圖」、「港深咖啡入門」呢類分區名**唔會改**，同品牌名嘅
處理方式刻意相反：

| | 要求 | 原因 |
|---|---|---|
| **品牌名** | 抽象 | 要跨目的地，加日本台灣唔使改名重建認知 |
| **分區名** | 具體 | 佢係 pillar 標題，要直接對上讀者實際會搵嘅嘢 |

分區名同時係 `<h1>`、`<title>`、麵包屑同 `BreadcrumbList` 嘅內容 ——
佢哋嘅工作係俾人一眼睇到「呢頁講咩」，所以越具體越好。
一個叫「食飲地圖」嘅 pillar 對唔上任何具體搜尋意圖，改咗係倒退。

**將來加新目的地，係開新分區，唔係改舊分區名。**例如加日本就開
一個新 pillar，「港深食飲地圖」照樣留喺度講港深。呢個亦係品牌名要
抽象嘅原因：品牌撐得住新分區，分區名唔使遷就品牌。


純靜態繁體中文網站，部署目標為 GitHub Pages。無框架、無 npm 依賴，
只有幾個用 Node 內建模組寫嘅 script。

## 核心設計：常青殼 vs 易耗芯

每篇文章分成兩層：

| 層 | 放喺邊 | 放咩 | 幾時改 |
|---|---|---|---|
| **常青殼** | HTML 正文 | 地理、原理、判斷邏輯、取捨 | 好少改 |
| **易耗芯** | `data/<section>/<name>.json` | 時間、費率、限額、政策狀態 | 經常改 |

頁面載入時由 `js/freshness.js` 讀 JSON 填入，並喺每個區塊底部顯示
「資料核實於 YYYY-MM」。

### volatility：唔同資料唔同覆核週期

每個 entry 可以帶一個可選嘅 `volatility`，預設 `normal`：

| volatility | 門檻 | 用嚟標咩 | 過門檻之後 |
|---|---|---|---|
| `low` | 12 個曆月 | 地理位置、接駁路線、機械原理 | 出過時警告 |
| `normal` | 6 個曆月 | 服務時間、費率、限額 | 出過時警告 |
| `high` | 冇門檻，永不「過期」 | 未定案嘅政策、施工中嘅設施 | **永遠**掛變動中橫幅 |

比較用嘅係曆月相減（`(nowY-vY)*12 + (nowM-vM)`），唔用毫秒差——
避免大小月同時區影響。**啱好等於門檻仍然算新鮮**，超過先算過期：
`normal` 喺第 6 個月唔會出警告，第 7 個月先出。

### 兩種提示係兩件唔同嘅事

|  | 意思 | class | 位置 | 顏色 |
|---|---|---|---|---|
| 過期 | 資料**舊咗**，可能已經唔啱 | `.stale-warning` / `.data-block.is-stale` | 區塊註腳 | 琥珀 |
| 變動中 | 資料**啱**，但快變，隨時要重查 | `.volatile-banner` / `.data-block.is-volatile` | 區塊最頂 | 藍 |

兩者刻意唔共用 class、唔共用顏色、唔共用位置。一個區塊可以同時中兩樣。
`volatility: "high"` 嘅 entry 要提供 `volatileNote`，就係橫幅嘅文案。

## 目錄結構

```
index.html                 首頁：四個 pillar 入口 + 全部文章列表
about.html                 關於本站：常青／易耗嘅做法（由首頁搬出）
guides/index.html          pillar：港人北上完整指南（+ 3 篇 cluster）
areas/index.html           pillar：港深食飲地圖（+ 3 篇）
coffee/index.html          pillar：港深咖啡入門（+ 3 篇）
trips/index.html           pillar：香港出發行程設計（+ 3 篇）
en/                        預留目錄，唔填內容、唔入 sitemap、唔對外宣告
css/main.css               全站樣式，手機優先，深色模式用 prefers-color-scheme
js/freshness.js            易耗芯載入 + volatility + 兩套提示
js/affiliates.js           由 data/affiliates.json 注入 affiliate 連結
js/ads.js                  廣告位佔位邏輯（零廣告網絡代碼）
assets/svg/*.svg           圖解唯一來源，由 build 注入頁面
data/<section>/<name>.json 各文章嘅易耗芯
data/affiliates.json       全站唯一 affiliate 來源
data/ad-slots.json         全站唯一廣告位定義
scripts/build.mjs          build + 守衛
scripts/lib/cdp.mjs        零依賴 Chrome DevTools Protocol 驅動
scripts/browser-check.mjs  真無頭 Chrome 量度（版面／hydration／廣告位／深色）
scripts/test-freshness.mjs volatility 單元測試
scripts/check-contrast.mjs 深／淺色對比度量度
sitemap.xml  robots.txt    由 build 生成，要 commit
```

## 指令

```sh
node scripts/build.mjs            # build + 全部守衛
node scripts/test-freshness.mjs   # volatility 邏輯測試
node scripts/check-contrast.mjs   # WCAG 對比度量度（深／淺兩套）
node scripts/check-ads-cls.mjs    # 靜態證明廣告位兩態高度一致
node scripts/browser-check.mjs    # 真無頭 Chrome：量 computed 值同實際 hydration

SITE_ORIGIN=https://<user>.github.io/hk_eats node scripts/build.mjs   # 部署前
```

### 外部連結白名單

站外連結預設一律 error。放行名單喺 `scripts/build.mjs` 嘅
`EXTERNAL_ALLOWLIST`：

| 類型 | 網域 | 用途 |
|---|---|---|
| 尾綴 | `.gov.hk`、`.gov.cn` | 政府官方來源 |
| 精確 | `www.mtr.com.hk` | 港鐵接駁／特惠站官方說明 |
| 精確 | `www.openstreetmap.org` | 地圖參考 |
| 精確 | `schema.org`、`www.w3.org` | 結構化資料詞彙、SVG namespace |
| 精確 | `apps.apple.com`、`play.google.com` | 官方 app 商店 |

**加入白名單唔等於已經有連結。**`apps.apple.com` 同 `play.google.com`
係預留畀 `data/trips/trip-tools.json` 嘅 `apps.storeLinks`——該項而家
仲係 `needsVerify`，所以站內一條商店連結都冇。白名單先開定，
等資料補齊即刻用得。

放行咗嘅網域仍然要守其餘規則：必須 https、路徑唔可以係空或者 `/`、
唔准帶追蹤參數。affiliate 連結永遠唔會經白名單——佢哋只可以由
`js/affiliates.js` 喺 runtime 由 `data/affiliates.json` 注入。

### SITE_ORIGIN：全站絕對 URL 嘅唯一來源

`SITE_ORIGIN` 係全站**所有**絕對 URL 嘅唯一來源，一共 115 處：

| 用途 | 處數 |
|---|---|
| `og:url` | 每頁 1 |
| JSON-LD `@id` / `url` / `publisher.url` / `WebSite.url` | 每頁 2–4 |
| `BreadcrumbList` 嘅 `item` | 每頁 2–3 |
| `sitemap.xml` 嘅 `<loc>` | 18 |
| `robots.txt` 嘅 `Sitemap:` | 1 |

頁面之間、CSS／JS／資料檔全部用**相對路徑**，所以放喺 repo 子路徑一樣行，
換網域亦唔會影響。

**冇任何一處寫死。**驗證方法：用另一個 origin 跑一次 build，
舊 origin 應該一處都唔剩：

```sh
SITE_ORIGIN=https://example.test node scripts/build.mjs
grep -r 'example.github.io' --include='*.html' --include='*.xml' --include='*.txt' .   # 應該 0 行
node scripts/build.mjs                                                                # 換返
```

build 亦有兩重保障：**E12** 會攔任何寫死嘅絕對網址（掃描前先剝走
`<!-- build:og -->` 同 `<!-- build:jsonld -->` 兩個生成區塊，剩低嘅就係人手寫嘅）；
**W11** 會喺 `SITE_ORIGIN` 仲係佔位網域嗰陣提你唔好發布。

### 部署前一定要跑

```sh
SITE_ORIGIN=https://實際域名 node scripts/build.mjs
```

見唔到 W11 先算準備好。用預設值 build 出嚟嘅 `sitemap.xml`、`robots.txt`
同所有 `og:url` 都會指去 `example.github.io`，發布咗等於叫搜尋引擎去一個
唔存在嘅網域。

### build 做嘅嘢

生成：`sitemap.xml`、`robots.txt`、每頁 JSON-LD、每頁 inline SVG。
所有注入都用 marker 包住，每次先刪舊再生新，可以重複跑。

守衛（**error 會 exit 1**）：

| 編號 | 檢查 |
|---|---|
| E1 | 外部連結白名單：任何指向站外嘅 `<a href>` 都係 error，除非 host 喺 `EXTERNAL_ALLOWLIST`。白名單網域帶追蹤參數一樣攔。另外**必須係 https**，而且**路徑唔可以係空或者 `/`**——要連去具體官方頁，唔准退返根網域。 |
| E2 | `<img src="http…">`、`srcset` 含外部網址、CSS `url(http…)` |
| E3 | 廣告網絡代碼（`adsbygoogle` / `googlesyndication` / `ca-pub-` / `data-ad-client`）出現喺可執行碼 |
| E4 | 同一頁嘅第一個 `.ad-slot` 排喺第一個 `.affiliate-cta` 之前 |
| E5 | `ad-slots.json` 嘅高度同 `css/main.css` 嘅 `min-height` 唔一致；或者 `enabled:true` / `publisher` 有值 |
| E6 | 引用嘅資料檔／SVG 唔存在、JSON 壞咗 |
| E7 | SVG 入面出現易耗值（時間、金額、費率、日數）——圖解只可以畫結構 |
| E8 | `hreflang` 唔係 zh-HK、連結指向 `/en/`、或者 `<html lang>` 唔係 zh-HK |
| E9 | 孤兒頁（冇任何頁連入）、連去唔存在嘅頁、由首頁去唔到、麵包屑錨點缺失 |
| E10 | 同一頁有重複 `id`、或者有 `<h2>` 冇 `id`（會令錨點目錄斷鏈） |
| E11 | 頁面冇 `<title>` 或者冇 `</head>`（`<title>` 同 Open Graph 注入唔到） |
| E12 | 寫死咗絕對網址：站內絕對 URL（換網域唔會跟住變）或者唔喺白名單嘅外部網址 |
| E13 | 利益披露文字喺 HTML 同 data 之間唔一致，或者 data 有披露聲明但頁面冇 `.callout-disclosure` |

警告（唔會 exit 1）：

| 編號 | 檢查 |
|---|---|
| W1–W5 | 文章冇對應 data 檔、`data-fresh-key` 搵唔到、entry 結構問題、`data-aff` 冇對應、JSON-LD meta 缺漏 |
| W6 | 由首頁超過 3 click 先去到 |
| W7 | 待核實標記（逐個列出，同時掃 HTML 同 data） |
| W8 | cluster 冇用含 pillar 關鍵字嘅 anchor、喺上半部連返 pillar；正文內連唔喺 3–5 條 |
| W9 | 文章日期行冇「最後更新：」前綴，或者日期同 `jsonld:dateModified` 唔一致 |
| W10 | cluster 頁嘅中文字數**超出所屬 pillar 40% 或以上**（見下面「幾時要把 cluster 升格」） |
| W11 | `SITE_ORIGIN` 仲係佔位網域（含 `example.`）——未設定正式網域，唔好發布 |
| W12 | 頁面有 `.callout-disclosure` 但 data 冇對應嘅 `*.disclosure` entry |

## 點樣加一篇新文章

以下用「加一篇 `/guides/esim-setup.html`」做例。

### 1. 開常青殼

複製最接近嘅現有文章做骨架，改 `<title>`、`description`、`<h1>`、正文。
**正文只准寫唔會過期嘅嘢。** 任何時間、費率、限額、型號、政策狀態，
一律唔好打喺 HTML 入面。

### 2. hreflang

```html
<link rel="alternate" hreflang="zh-HK" href="../guides/esim-setup.html">
<link rel="alternate" hreflang="en"    href="../en/guides/esim-setup.html">
<link rel="alternate" hreflang="x-default" href="../guides/esim-setup.html">
```

### 3. jsonld meta

```html
<meta name="jsonld:type" content="Article,FAQPage">
<meta name="jsonld:headline" content="…">
<meta name="jsonld:description" content="…">
<meta name="jsonld:datePublished" content="2026-09-01">
<meta name="jsonld:dateModified" content="2026-09-01">
<meta name="jsonld:section" content="北上實務">
```

三種支援嘅類型：

- **`Article`** — 由上面嗰組 meta 讀。
- **`ItemList`** — 比較類用。加 `jsonld:itemListName` 同
  `jsonld:itemList`（項目用 `|` 分隔）。
- **`FAQPage`** — 由正文抽，格式必須係：

  ```html
  <h3 data-faq-q>問題？</h3>
  <div data-faq-a><p>答案。</p></div>
  ```

  兩者必須相鄰，`<div data-faq-a>` 入面唔可以有巢狀 `</div>`
  （抽取用非貪婪 regex，遇到第一個 `</div>` 就停）。

### 4. 開易耗芯 `data/guides/esim-setup.json`

**路徑係 `data/<section>/<name>.json`**，section 同 HTML 所在目錄一樣。
加咗 section 一層之後，`guides/esim.html` 同 `coffee/esim.html`
唔會再搶同一個資料檔。

```json
{
  "title": "…",
  "belongsTo": "/guides/esim-setup.html",
  "_status": "sourced",
  "entries": {
    "plan.dataCap": { "value": "每日 2 GB", "verifiedOn": "2026-09", "volatility": "normal" },
    "carrier.coverage": { "value": ["支援熱點", "唔支援通話"], "verifiedOn": "2026-09", "volatility": "low" },
    "policy.pending": {
      "value": "新規未生效。",
      "verifiedOn": "2026-09",
      "volatility": "high",
      "volatileNote": "呢項政策仲未定案，出行前請以官方公布為準。"
    }
  }
}
```

每個 entry **必須**有 `value` 同 `verifiedOn`（`YYYY-MM`）。
`volatility` 可選，預設 `normal`；`high` 要有 `volatileNote`。
`value` 可以係字串、數字或者陣列；陣列填入 `<ul>`/`<ol>` 會變成逐個 `<li>`。

`_status` 係畀人睇嘅標籤，唔影響邏輯：`sourced`（有來源核實）、
`principles`（純原理，冇時效性）、`unverified`（未核實）、`mixed`。

### 未核實嘅資料：寧願留白，唔好作

如果你冇核實過一項數值，**唔准填一個似層層嘅數字**。改為用 `needsVerify`：

```json
"duty.alcohol": {
  "needsVerify": "香港入境旅客嘅酒類免稅限額（數量、酒精濃度門檻、年齡限制）",
  "volatility": "normal"
}
```

有 `needsVerify` 嘅 entry **唔要** `value`，亦**唔要** `verifiedOn`——
未核實就冇核實日期，寫一個日期落去係講大話。頁面會喺該位置渲染
`{{NEEDS_VERIFY: …}}` 標記，區塊加 `.is-unverified`，註腳寫明有幾多項待核實。
build 會逐個列出（W7），所以呢批標記同時係一份待辦清單。

正文入面亦可以直接寫 `{{NEEDS_VERIFY: 描述}}`，build 一樣掃得到。

### 5. 喺 HTML 掛上易耗芯

```html
<section class="data-block" data-fresh="guides/esim-setup">
  <h3>方案</h3>
  <p>每日上限：<span data-fresh-key="plan.dataCap"></span></p>
  <ul data-fresh-key="carrier.coverage"></ul>
</section>
```

`data-fresh` 嘅值 = `data/` 之下嘅相對路徑（**要有 section 前綴**，唔洗寫 `.json`）。
每個 block 嘅核實月份 = 該 block 用到嘅 entry 之中最舊嗰個；
過期判斷就逐個 entry 用佢自己嘅 volatility 門檻計。

### 6. 加圖解（可選）

SVG 放 `assets/svg/<name>.svg`，係唯一來源。頁面只寫：

```html
<figure class="diagram" data-svg="esim-setup">
<figcaption>一句講清楚圖入面睇到咩。</figcaption>
</figure>
```

build 會將 SVG 內容注入 `<!-- build:svg -->` … `<!-- /build:svg -->` 之間。

SVG 要求：`viewBox`、`role="img"`、`aria-labelledby` 指向自己嘅
`<title>` 同 `<desc>`；顏色一律用 `css/main.css` 定義嘅 `--diagram-*`
變數（透過 class，唔好硬編碼 hex），咁深色模式先會跟住轉。

**圖解只可以畫結構，唔可以寫易耗值。** 因為 SVG 由 build 直接注入 HTML，
唔經 `freshness.js`，所以任何寫落 SVG 嘅時間／金額／費率／日數都唔會顯示
核實月份、亦唔會過期，資料一變就靜靜地錯落去。build 會攔（E7）。
改完顏色跑 `node scripts/check-contrast.mjs` 確認兩套模式都達標。
**零外部圖片** —— `<img src="http…">` 會被 build 攔。

### 7. 加 affiliate 連結（如果有）

**唔准喺 HTML 寫任何 URL。** 先喺 `data/affiliates.json` 嘅 `links` 加 key，
然後頁面只寫：

```html
<p class="affiliate-cta">… <a data-aff="klook-esim-macau"></a> …</p>
```

`js/affiliates.js` 會組好 URL、set `href`、加 `rel="sponsored nofollow noopener"`。

### 8. 加廣告位（可選）

```html
<div class="ad-slot" data-ad-slot="ad-article-1"></div>
```

**順序規則：任何 Klook / Amazon CTA 區塊必須排喺同一版面嘅廣告位之前。**
即係第一個 `.affiliate-cta` 一定要出現喺第一個 `.ad-slot` 之前，
違反就 build error（E4）。理由：CTA 係我哋自己揀嘅、對讀者有用嘅推薦，
廣告係買返嚟嘅版位——次序講緊嘅係邊樣先服務讀者。

四個可用 slot 見 `data/ad-slots.json`。唔做頁頂 leaderboard，唔做 sticky anchor。

### 9. 加入導覽同內連

三個地方：

1. 首頁 `index.html` 嘅「全部文章」清單（手寫）。
2. 所屬 pillar 嘅 `.cluster-list`（手寫）。
3. **正文內 3–5 條內連**，其中最少一條要喺頁面上半部、用含 pillar 名嘅
   anchor 連返 pillar，例如 `<a href="./index.html">港人北上完整指南</a>`。
   唔跟就出 W8。

麵包屑唔使手寫。喺 `.wrap` 開頭放一個 `<!-- breadcrumb -->` 錨點，
build 會由路徑同 `SECTIONS` 表生成可見麵包屑同 `BreadcrumbList`
兩樣——同一個來源，唔會行開。四個 pillar 嘅名喺 `scripts/build.mjs`
頂部嘅 `SECTIONS` 定義一次。

### 10. 日期行同錨點目錄（都係自動）

文章開頭嘅日期行格式固定：

```html
<p class="meta-line">北上實務 · 最後更新：2026-08-21</p>
```

日期要同 `jsonld:dateModified` 一致，唔跟就出 W9。

**錨點目錄唔使手寫。** 分區之下、中文字數 ≥ 1200、而且有 ≥ 3 個 `<h2>`
嘅頁，build 會自動：

1. 幫每個 `<h2>` 生成 `id`（由標題文字 slug 化，撞名自動加 `-2`）。
   build 加嘅會帶 `data-build-id`，改咗標題會跟住重生；
   人手寫嘅 `id` 會被尊重，唔會覆蓋。
2. 喺首段（`.lede`）之後插入 `<nav class="toc">`。
3. 檢查全頁 `id` 唯一、每個 `h2` 都有 `id`（E10）。

首頁嘅「全站資料最後更新」亦係 build 生成：放一個 `<!-- lastupdate -->`
錨點，build 會填入全站所有 `data/**/*.json` 之中最新嗰個 `verifiedOn`。

### 11. `<title>` 同 Open Graph（唔使寫，build 會覆蓋）

`<title>` 由 build 統一生成，格式固定：

- 首頁 → `歎世界 — 香港出發的食飲與旅行指南`
- 內頁 → `{jsonld:headline} — 歎世界`

Open Graph（`og:site_name` / `og:title` / `og:description` / `og:type` /
`og:url` / `og:locale`）同樣由 build 注入 `<!-- build:og -->` 區塊。
品牌字串只喺 `scripts/build.mjs` 頂部嘅 `SITE_NAME` 同 `SITE_TAGLINE`
定義一次，JSON-LD 嘅 `publisher.name` 同首頁嘅 `WebSite.name` 都由佢哋讀，
所以改品牌名只需要改嗰兩行。

頁面**仍然要有**一個 `<title>` 標籤（內容係咩都得，build 會覆蓋），
同一個 `</head>`，否則出 E11。

### 10. 跑 build

```sh
node scripts/build.mjs
```

見到 `0 error` 先 commit。

## 版面

閱讀寬度統一由 `.wrap` 決定：`max-width: 46rem`（736px @16px root）、
`margin-left/right: auto`、`padding: 0 1.25rem`、`box-sizing: border-box`。

**唔好再喺 `p` / `li` 另外加 `max-width`。** 以前呢度夾住一個 38rem，
令段落右邊剩低約 91px 死位，而標題、表格、圖解冇受限，兩者右邊界對唔齊——
睇落就似成欄嘢偏咗。而家所有內容欄嘅直接子元素共用同一條左右邊界。

實測（`node scripts/browser-check.mjs`，真無頭 Chrome）：
1440px 時 wrap 左右留白各 352px，2560px 時各 912px，
內容框 696px，段落／標題／清單／資料塊／圖解嘅左右偏移全部 0.00px。
廣告位刻意固定闊度並置中，所以驗嘅係左右偏移相等而唔係貼齊。

## 利益披露

如果一篇文提到本站作者有份開發、擁有或者收錢嘅嘢，披露**必須**用
`.callout-disclosure` 獨立卡片，唔可以埋喺正文段落入面。三種 callout
刻意分得開：

| class | 顏色 | 意思 |
|---|---|---|
| `.callout` | 灰 | 補充說明 |
| `.callout-alert` | 琥珀 | 警告，會出事嗰種 |
| `.callout-disclosure` | 粗邊 + 標籤 | 身分聲明，唔係警告亦唔係補充 |

披露文字**同時**寫兩個地方：

1. **HTML 正文**（主體）—— 因為利益披露唔應該淨靠 `freshness.js` 載入。
   fetch 一失敗，聲明就會消失，但文章照睇得到，咁就變成冇披露。
2. **`data/<section>/<name>.json` 嘅 `*.disclosure` entry** —— 方便統一維護。

兩邊必須逐字一致，`build` 會用 **E13** 攔住 drift；只有 HTML 冇 data 就出
**W12**。呢個係全站唯一一處刻意重複嘅內容，理由就係上面第一點。

實例：`trips/trip-tools.html`（作者係文中提到嘅幾個 app 嘅開發者）。

## 幾時要把 cluster 升格成子 pillar

Pillar 應該係一個分區入面最高層、最闊嘅一頁。當某篇 cluster 寫到比
pillar 仲大，兩者就會開始爭同一批關鍵字，而且讀者會分唔清邊頁先係入口。

### 觸發條件

主要訊號（build 會報 **W10**）：

- **字數超出所屬 pillar 40% 或以上。**build 會列出超出幾多字同幾多 %。

**點解門檻係 +40% 而唔係 0%？**因為<strong>成日響嘅警告等於冇警告</strong>。
門檻設 0% 嗰陣，12 篇 cluster 之中有 9 篇報 warning——包括只超出 4%、
5%、7% 呢種。嗰個級數唔代表要拆文，只代表 pillar 寫得薄咗少少，
而每次 build 都見到九行黃字，結果就係冇人再讀 W10。
設 +40% 之後只剩三篇，而且下一名係 +11%，中間有清楚嘅斷層。

判斷用嘅係**四捨五入之後嘅百分比**，同警告訊息顯示嘅數字一致——
用原始比值會出現「訊息寫住 +40% 但唔報 warning」呢種自相矛盾嘅情況
（例如 2550 / 1823 = +39.88%）。

輔助訊號（要自己判斷）：

- `<h2>` 數目接近或者超過 pillar（例如 pillar 9 個、cluster 16 個）。
- 單頁明顯涵蓋咗多過一個獨立搜尋意圖（例如同一篇入面又講免稅額、
  又講許可證、又講出境限制，三者根本唔會同一個人同一時間搵）。
- 內連入度高過同分區其他 cluster，即係佢實際已經扮緊入口。

**超出 10–20% 唔使急**（呢個級數而家根本唔會報 warning）。真正要考慮
升格嘅係**超出 50% 以上**，或者 W10 響咗再加兩個輔助訊號同時成立。

### 做法

1. 開一個新目錄，例如 `guides/bring-back/`，將原文變成 `index.html`
   做子 pillar，只保留框架同判斷邏輯。
2. 將原文按**搜尋意圖**拆成 2–3 篇 cluster，唔好按段落長度拆。
3. 喺 `scripts/build.mjs` 嘅 `SECTIONS` 加入新層。
   **注意：現時嘅麵包屑同 `breadcrumbTrail()` 只支援一層分區**，
   升格之前要先擴充佢哋支援兩層，否則麵包屑會斷。
4. **舊 URL 唔好刪。**`guides/bring-back.html` 應該保留並轉為指向
   新子 pillar 嘅入口，避免斷內連同外部連結。
5. 更新首頁同上層 pillar 嘅 `.cluster-list`。
6. 跑 `node scripts/build.mjs`，確認孤兒 0 個、最深 ≤ 3 click、
   W8（cluster → pillar 內連）全部合格。

### 而家嘅狀態

`guides/bring-back.html` 已經 3,000 字以上、16 個 `<h2>`，係全站最大嘅
cluster，超出所屬 pillar 七成以上。**暫時唔拆**——因為佢嘅內容係一條
連貫嘅決策鏈（分類 → 免稅額 → 許可證 → 罰則），拆開會令讀者要跳頁先
答到一條問題。但佢係第一個要盯住嘅候選，下次再加內容就應該升格。

## 廣告位：而家係咩狀態

**站內冇任何廣告代碼。** 冇 AdSense script、冇 `adsbygoogle.js`、
冇 publisher ID。`data/ad-slots.json` 入面四個 slot 全部 `enabled: false`，
`publisher` 係 `null`。build 會強制呢一點（E3、E5）。

而家做咗嘅只有「留位」：

- `css/main.css` 用 `min-height` 硬預留高度，同 `enabled` 狀態無關。
  高度數值同 `ad-slots.json` 一一對應，build 逐個對帳。
- `js/ads.js` **唔准**改容器嘅 `width`／`height`／`min-height`／`padding`／
  `margin`／`display`。本機開發時見到嘅虛線框用 `outline`
  （唔佔版面）加絕對定位嘅 `::after`（唔撐高度）——所以
  `enabled:false` 同 `true` 兩種狀態下版面高度完全一樣，將來開通時 CLS = 0。
- 佔位框只喺 `localhost` / `127.0.0.1` / `.local` / `file:` 出現，
  生產環境係純空白佔位。

將來要開通：喺 `ad-slots.json` 填 `publisher`、將要開嘅 slot 改 `enabled: true`、
喺 `js/ads.js` 嘅 `loadNetwork()` 加載入邏輯。同時要記得放寬 build 嘅 E3／E5。

## 維護：覆核易耗芯

定期過一次 `data/**/*.json`：核實數值 → 更新該 entry 嘅 `verifiedOn`
→ 跑 build → commit。`low` 類一年一次就夠，`normal` 類半年一次，
`high` 類要跟住新聞走。

只要有 entry 超過自己嘅門檻，前端就會喺該區塊出過時提示，
所以「有冇人維護」係讀者睇得到嘅，唔係靠自律。

## 資料來源狀態

`data/guides/*.json` 嘅數值由編輯提供並標示為已核實（`_status: "sourced"`），
唔係佔位示範值。當中兩項要留意：

- 蓮塘／香園圍嘅服務時間各方寫法唔一致，正文同資料檔都寫明以保安局
  「口岸通」公布為準。
- 新皇崗口岸嗰組標記為 `volatility: "high"`，會永久掛變動中橫幅，
  因為正式通關日期未公布。

`data/guides/bring-back.json` 嘅 `_status` 係 `verified`：11 項免稅額、
許可證同罰則規定經編輯核實並列出，唯一例外係 `penalty.general`——
未申報嘅一般罰則，搜到嘅金額同刑期互相矛盾，所以保持未核實，
正文唔寫任何數字，改為指向海關官方頁。呢個係「同一篇文入面
核實同未核實並存」嘅示範。

`data/coffee/grinder-guide.json` 嘅 `_status` 係 `principles`：
呢篇文冇時效性數值（冇型號、冇售價、冇規格區間），
資料檔存放嘅係機械結構陳述，唔係被核實過嘅數據。

仍然係佔位值嘅只有 `data/affiliates.json` 嘅追蹤 ID（`PENDING-*`）——
未申請聯盟帳號之前唔應該當佢係真嘅。

## 語言

全站 `<html lang="zh-HK">`。`/en/` 保留做結構預留，但**唔填內容、唔入
sitemap、唔出現喺 nav、亦冇任何 `hreflang` 指住佢**——冇內容之前宣告雙語，
等於向搜尋引擎同讀者承諾一個唔存在嘅版本。build 會攔（E8）。

真係有英文內容之後，先放寬 E8 並喺 `RESERVED_DIRS` 移走 `en`。

## 部署到 GitHub Pages

1. `git remote add origin …` 然後 push
2. repo Settings → Pages → Source 揀 branch（`main`）同 `/ (root)`
3. 用真 origin 再跑一次 build，commit `sitemap.xml` 同 `robots.txt`

冇 CI build step，因為產物（注入咗嘅 JSON-LD 同 SVG、sitemap、robots）
係直接 commit 入 repo 嘅。
