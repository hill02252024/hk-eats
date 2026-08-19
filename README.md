# hk_eats

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
index.html                 首頁：四個分區入口 + 文章列表
guides/                    北上實務（hub + 2 篇）
areas/  trips/             分區地圖、行程模板（hub）
coffee/                    咖啡（hub + 1 篇）
en/                        預留英文版目錄，本次唔填內容
css/main.css               全站樣式，手機優先，深色模式用 prefers-color-scheme
js/freshness.js            易耗芯載入 + volatility + 兩套提示
js/affiliates.js           由 data/affiliates.json 注入 affiliate 連結
js/ads.js                  廣告位佔位邏輯（零廣告網絡代碼）
assets/svg/*.svg           圖解唯一來源，由 build 注入頁面
data/<section>/<name>.json 各文章嘅易耗芯
data/affiliates.json       全站唯一 affiliate 來源
data/ad-slots.json         全站唯一廣告位定義
scripts/build.mjs          build + 六類守衛
scripts/test-freshness.mjs volatility 單元測試
scripts/check-contrast.mjs 深／淺色對比度量度
sitemap.xml  robots.txt    由 build 生成，要 commit
```

## 指令

```sh
node scripts/build.mjs            # build + 全部守衛
node scripts/test-freshness.mjs   # volatility 邏輯測試
node scripts/check-contrast.mjs   # WCAG 對比度量度（深／淺兩套）
node scripts/check-ads-cls.mjs    # 證明廣告位兩態高度一致（CLS 預留）

SITE_ORIGIN=https://<user>.github.io/hk_eats node scripts/build.mjs   # 部署前
```

`SITE_ORIGIN` 只影響 `sitemap.xml`、`robots.txt` 同 JSON-LD 嘅絕對 URL。
頁面之間全部用相對路徑，所以放喺 repo 子路徑一樣行。

### build 做嘅嘢

生成：`sitemap.xml`、`robots.txt`、每頁 JSON-LD、每頁 inline SVG。
所有注入都用 marker 包住，每次先刪舊再生新，可以重複跑。

守衛（**error 會 exit 1**）：

| 編號 | 檢查 |
|---|---|
| E1 | 外部連結白名單：任何指向站外嘅 `<a href>` 都係 error，除非 host 喺 `EXTERNAL_ALLOWLIST`。白名單網域帶追蹤參數一樣攔。 |
| E2 | `<img src="http…">`、`srcset` 含外部網址、CSS `url(http…)` |
| E3 | 廣告網絡代碼（`adsbygoogle` / `googlesyndication` / `ca-pub-` / `data-ad-client`）出現喺可執行碼 |
| E4 | 同一頁嘅第一個 `.ad-slot` 排喺第一個 `.affiliate-cta` 之前 |
| E5 | `ad-slots.json` 嘅高度同 `css/main.css` 嘅 `min-height` 唔一致；或者 `enabled:true` / `publisher` 有值 |
| E6 | 引用嘅資料檔／SVG 唔存在、JSON 壞咗 |
| E7 | SVG 入面出現易耗值（時間、金額、費率、日數）——圖解只可以畫結構 |

警告（唔會 exit 1）：文章冇對應 data 檔、`data-fresh-key` 搵唔到、
entry 結構問題（冇 `value`、`verifiedOn` 格式錯、`volatility` 亂寫、
`high` 但冇 `volatileNote`）、`data-aff` key 冇對應、JSON-LD meta 缺漏。

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
`principles`（純原理，冇時效性）。

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

### 9. 加入導覽

首頁 `index.html` 同對應分區 hub 嘅文章清單（目前手寫，唔係 build 生成）。

### 10. 跑 build

```sh
node scripts/build.mjs
```

見到 `0 error` 先 commit。

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

`data/coffee/grinder-guide.json` 嘅 `_status` 係 `principles`：
呢篇文冇時效性數值（冇型號、冇售價、冇規格區間），
資料檔存放嘅係機械結構陳述，唔係被核實過嘅數據。

仍然係佔位值嘅只有 `data/affiliates.json` 嘅追蹤 ID（`PENDING-*`）——
未申請聯盟帳號之前唔應該當佢係真嘅。

## 部署到 GitHub Pages

1. `git remote add origin …` 然後 push
2. repo Settings → Pages → Source 揀 branch（`main`）同 `/ (root)`
3. 用真 origin 再跑一次 build，commit `sitemap.xml` 同 `robots.txt`

冇 CI build step，因為產物（注入咗嘅 JSON-LD 同 SVG、sitemap、robots）
係直接 commit 入 repo 嘅。
