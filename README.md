# hk_eats

純靜態繁體中文網站，部署目標為 GitHub Pages。無框架、無 npm 依賴，
只有一個用 Node 內建模組寫嘅 build script。

## 核心設計：常青殼 vs 易耗芯

每篇文章分成兩層：

| 層 | 放喺邊 | 放咩 | 幾時改 |
|---|---|---|---|
| **常青殼** | `<section>` 之類嘅 HTML 正文 | 地理、原理、判斷邏輯、取捨 | 好少改 |
| **易耗芯** | `/data/<同名>.json` | 時間、價錢、限額、費率、規格區間 | 經常改 |

頁面載入時由 `js/freshness.js` 讀 JSON 填入，並喺每個區塊底部顯示
「資料核實於 YYYY-MM」。如果最舊嗰項 `verifiedOn` 距今超過 6 個曆月，
該區塊會自動加上 `.is-stale` 同一段顯眼提示「此部分資料可能已過時」。

咁樣做嘅原因：更新一個數字唔洗重寫文章；讀者一眼睇到資料幾新；
冇人維護嘅頁面會自己承認過時，唔會靜靜地繼續扮準確。

## 目錄結構

```
index.html              首頁：四個分區入口 + 文章列表
guides/                 北上實務（hub + 2 篇）
areas/                  分區食飲地圖（hub）
coffee/                 咖啡（hub + 1 篇）
trips/                  行程模板（hub）
en/                     預留英文版目錄，本次唔填內容
css/main.css            全站樣式，手機優先，深色模式用 prefers-color-scheme
js/freshness.js         易耗芯載入 + 核實月份 + 過時提示
js/affiliates.js        由 data/affiliates.json 注入 affiliate 連結
data/*.json             各文章嘅易耗芯
data/affiliates.json    全站唯一 affiliate 來源
scripts/build.mjs       build script（見下）
sitemap.xml             由 build 生成，要 commit
robots.txt              由 build 生成，要 commit
```

## Build

```sh
node scripts/build.mjs
# 部署前用真正網域跑一次：
SITE_ORIGIN=https://<user>.github.io/hk_eats node scripts/build.mjs
```

`SITE_ORIGIN` 只影響 `sitemap.xml` 同 `robots.txt` 入面嘅絕對 URL，
以及 JSON-LD 嘅 `@id`。頁面之間全部用相對路徑，所以放喺 repo 子路徑一樣行。

build script 做五件事：

1. 掃描全部 `.html` → 生成 `sitemap.xml`（`index.html` 會正規化成目錄形式）
2. 由每頁 `<head>` 嘅 `jsonld:*` meta 生成 JSON-LD，注入 `</head>` 之前
3. 檢查每篇文章有冇對應嘅 `/data/*.json`（冇 → **warning**）
4. 掃描硬編碼 affiliate URL（有 → **error**，`exit 1`）
5. 生成 `robots.txt`

注入嘅 JSON-LD 由 `<!-- build:jsonld -->` … `<!-- /build:jsonld -->` 包住，
每次 build 都會先刪舊再生新，所以可以重複跑，唔會累積。

## 點樣加一篇新文章

以下用「加一篇 `/guides/esim-setup.html`」做例。

### 1. 開常青殼

複製一篇最接近嘅現有文章做骨架（例如 `guides/payment-setup.html`），
改 `<title>`、`<meta name="description">`、`<h1>`、正文。

**正文只准寫唔會過期嘅嘢。** 任何時間、價錢、限額、型號、費率，
一律唔好打喺 HTML 入面。

### 2. 改 `<head>` 嘅 hreflang

```html
<link rel="alternate" hreflang="zh-HK" href="../guides/esim-setup.html">
<link rel="alternate" hreflang="en"    href="../en/guides/esim-setup.html">
<link rel="alternate" hreflang="x-default" href="../guides/esim-setup.html">
```

### 3. 改 `<head>` 嘅 jsonld meta

```html
<meta name="jsonld:type" content="Article,FAQPage">
<meta name="jsonld:headline" content="…">
<meta name="jsonld:description" content="…">
<meta name="jsonld:datePublished" content="2026-09-01">
<meta name="jsonld:dateModified" content="2026-09-01">
<meta name="jsonld:section" content="北上實務">
```

`jsonld:type` 可以逗號分隔多個，build 會生成 `@graph`。三種支援嘅類型：

- **`Article`** — 由 `jsonld:headline` / `description` / `datePublished` /
  `dateModified` / `section` 讀。
- **`ItemList`** — 比較類文章用。加
  `<meta name="jsonld:itemListName" content="…">` 同
  `<meta name="jsonld:itemList" content="項目一|項目二|項目三">`（`|` 分隔）。
- **`FAQPage`** — 唔喺 meta 寫（答案太長塞唔落），由正文抽。格式必須係：

  ```html
  <h3 data-faq-q>問題？</h3>
  <div data-faq-a><p>答案。</p></div>
  ```

  兩者必須相鄰，`<div data-faq-a>` 入面唔可以有巢狀 `</div>`
  （抽取用嘅係非貪婪 regex，遇到第一個 `</div>` 就停）。

### 4. 開易耗芯 `data/esim-setup.json`

檔名必須同 HTML 檔名一樣（去掉 `.html`），否則 build 會出 warning。

```json
{
  "title": "…",
  "belongsTo": "/guides/esim-setup.html",
  "entries": {
    "plan.dataCap": { "value": "每日 2 GB", "verifiedOn": "2026-09" },
    "plan.notes":   { "value": ["支援熱點", "唔支援通話"], "verifiedOn": "2026-09" }
  }
}
```

每個 entry **必須**有 `value` 同 `verifiedOn`（`YYYY-MM`）。
`value` 可以係字串、數字或者陣列；陣列填入 `<ul>` / `<ol>` 會變成逐個 `<li>`，
填入其他元素會用「、」連接。

### 5. 喺 HTML 掛上易耗芯

```html
<section class="data-block" data-fresh="esim-setup">
  <h3>方案比較</h3>
  <p>每日用量上限：<span data-fresh-key="plan.dataCap"></span></p>
  <ul data-fresh-key="plan.notes"></ul>
</section>
```

- `data-fresh` 嘅值 = `/data/` 下嘅檔名（唔洗寫 `.json`）
- 一頁可以有多個 `data-block`，可以指向同一個檔嘅唔同 key
- 每個 block 嘅核實月份 = 該 block 用到嘅 entry 之中**最舊**嗰個

### 6. 加 affiliate 連結（如果有）

**唔准喺 HTML 寫 URL。** 先喺 `data/affiliates.json` 嘅 `links` 加一個 key：

```json
"klook-esim-macau": {
  "partner": "klook",
  "url": "https://…",
  "params": { "spm": "…" },
  "label": "澳門 eSIM",
  "verifiedOn": "2026-09"
}
```

然後喺頁面只寫 key：

```html
<a data-aff="klook-esim-macau"></a>
```

`js/affiliates.js` 會組好 URL（partner 共用參數 + link 專用參數）、
set `href`、加 `rel="sponsored nofollow noopener"`。搵唔到 key 就唔會 set `href`，
變成普通灰字，唔會變死連結。

### 7. 加入導覽

- 首頁 `index.html` 嘅「已發布文章」清單
- 對應分區 hub（例如 `guides/index.html`）嘅「文章」清單

呢兩個位置目前係手寫嘅，唔係 build 自動生成。

### 8. 跑 build

```sh
node scripts/build.mjs
```

見到 `0 error` 先 commit。Warning 要逐個睇——多數係漏咗 data 檔或者 key 打錯。

## 維護：覆核易耗芯

定期（建議每季）過一次 `data/*.json`：

1. 逐項核實數值
2. 將該 entry 嘅 `verifiedOn` 改成覆核當月
3. `node scripts/build.mjs`，commit

只要有 entry 超過 6 個曆月冇更新，前端就會自己喺該區塊出過時提示，
所以「有冇人維護」呢件事係讀者睇得到嘅，唔會靠自律。

## 現時狀態的誠實聲明

`data/*.json` 入面嘅數值屬**建站示範值**，未經逐項人手覆核，
每個檔嘅 `_note` 有寫明。機制（載入、顯示核實月份、6 個月過時警告）
係完整運作嘅；數值本身上線前要逐格覆核。

`data/affiliates.json` 嘅追蹤 ID 全部係 `PENDING-*` 佔位值，
未申請聯盟帳號之前唔應該當佢係真嘅。

本站**冇**任何 AdSense 或廣告代碼。

## 部署到 GitHub Pages

1. `git remote add origin …` 然後 push
2. repo Settings → Pages → Source 揀 branch（`main`）同 `/ (root)`
3. 用真 origin 再跑一次 build，commit `sitemap.xml` 同 `robots.txt`

冇 build step 喺 CI，因為產物（注入咗嘅 JSON-LD、sitemap、robots）
係直接 commit 入 repo 嘅。
