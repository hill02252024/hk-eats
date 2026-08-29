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

### 分區名要對上搜尋意圖，唔可以用生產者詞彙

`trips` 分區由「行程模板／香港出發行程設計」改成「**北上行程**」。理由：

**「模板」係生產者詞彙。**佢描述嘅係我哋點樣組織內容（一副可以改日期
就用嘅骨架），唔係讀者腦入面嗰個詞。冇人會搵「行程模板」——佢哋搵嘅係
「北上行程」、「深圳一日遊」、「北上一日遊點安排」。

同樣道理，「香港出發行程設計」係一個編輯概念，唔係搜尋詞。分區名同時
係 `<h1>`、`<title>`、麵包屑、`BreadcrumbList` 同 nav 嘅內容——佢每一個
位置都係俾人一眼判斷「呢頁係咪我搵緊嗰樣」，所以要用讀者嘅詞。

**「模板」呢個概念保留，但只喺文章內部用。**每篇模板文照樣講「呢份模板
假設咗咩」、「可裁剪清單」，因為喺文章入面讀者已經知道自己喺睇咩；
分區名先要負責被搵到。

判斷方法：如果一個詞你要解釋先有人明，佢就唔應該做分區名。

### 分區名點解唔跟品牌名一齊抽象化

分區名同品牌名嘅處理方式刻意相反：

| | 要求 | 原因 |
|---|---|---|
| **品牌名** | 抽象 | 要跨目的地，加日本台灣唔使改名重建認知 |
| **分區名** | 具體 | 佢係 pillar 標題，要直接對上讀者實際會搵嘅嘢 |

分區名同時係 `<h1>`、`<title>`、麵包屑同 `BreadcrumbList` 嘅內容 ——
佢哋嘅工作係俾人一眼睇到「呢頁講咩」，所以越具體越好。
一個叫「食飲地圖」嘅 pillar 對唔上任何具體搜尋意圖，改咗係倒退。

### areas：「港深食飲地圖」改成「內地食飲地圖」

**「港深」太窄。**佢寫死咗兩個城市。第一篇廣州嘅紀錄一出，個名就已經
唔覆蓋到內容；之後加上海、成都，每加一個城市就要改一次分區名 ——
而改分區名會連帶改 `<h1>`、`<title>`、麵包屑、`BreadcrumbList` 同 nav，
仲要重新建立呢個 pillar 喺搜尋引擎眼中嘅認知。呢個成本唔應該每加一個
城市俾一次。

**「北上」唔啱做分區名。**佢係大灣區用語 —— 由香港向北去深圳、廣州
講得通，但上海喺香港嘅東北，成都喺西北，杭州、重慶更加唔係「上去」。
`guides/`（北上實務）同 `trips/`（北上行程）**保持唔改**，因為嗰兩個分區
真係淨係講過關同大灣區行程，「北上」喺嗰度係準確嘅，唔係將就。

**「內地」對香港讀者最自然。**呢個係香港人日常講開嘅詞，唔使解釋；
而且佢係一個地理範圍，唔綁死任何週期性趨勢（「北上消費」呢類詞會
隨風潮過時，「內地」唔會）。

**代價要講清楚：**`areas/` 入面仍然有一篇香港分區（`hk-coffee-map`），
名義上唔屬於「內地」。佢刻意留低做**對照基準** —— 冇咗香港嗰篇，
「用香港人嘅尺」就淨係一句口號，冇實物可以比。pillar 內文有一段專門
講呢件事，唔係當佢唔存在。呢個係一個已知嘅名實落差，記喺度，
唔係漏咗。

**將來加新目的地，仍然係開新分區而唔係改名** —— 例如加日本就開一個
新 pillar。「內地」呢個名撐得住由深圳擴到全國，但撐唔住跨國。

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

## 檢查器紀律（寫任何掃描／守衛之前睇一次）

本站資料存在**三層**：

| 層 | 係咩 | 例 |
|---|---|---|
| **HTML 硬寫** | 直接寫喺 `.html` 檔嘅字 | `<a href="https://www.sb.gov.hk/…">`、`.callout-disclosure` 內文 |
| **JSON data** | `data/**/*.json` 嘅 `entries` | `{"value": "…", "verifiedOn": "2026-08"}` |
| **runtime 渲染** | `js/freshness.js` 喺瀏覽器填入去嘅字 | `{{NEEDS_VERIFY: …}}` 標記、`data-fresh-key` 嘅內容 |

**過去四次盤點全部因為只掃一層而下錯結論。逐個記低，唔係為咗自責，係因為每一個都會再犯：**

1. `grep hk_eats` 報 0 —— 但原始碼係 `hk<span>_</span>eats`，字面上永遠唔會連續出現。**掃 HTML 層但冇 strip tag。**
2. `grep '{{NEEDS_VERIFY}}'` 報 0 —— 但呢個標記係 `freshness.js` 喺 runtime 生成，靜態檔案入面根本冇。**掃 HTML 層，但目標喺 runtime 層。**
3. FAQ schema 掃描只認 `<details class="faq-item">` —— 漏咗冇 class 嗰批，於是把「措辭唔同」誤報成「頁面完全冇呢條」。**掃 HTML 層但 selector 太窄。**
4. 「孤兒 entry」只計 `data-fresh-key` 引用 —— 冇計 E13／E17 守衛引用，於是把守衛錨點誤報成可刪資料。**掃 JSON↔HTML 綁定層，但漏咗守衛層。**

### 三條規則

**1. 檢查器要講明掃邊層。只掃一層唔可以下「全站零命中」結論。**
報告要寫「掃 HTML 層」定「掃 JSON 層」定「掃 runtime 層」。想講「全站零」，就三層都要掃過，或者明講「只掃咗 X 層，Y 層未掃」。

**2. 寫完即刻反向驗證。冇驗過嘅綠燈唔當數。**
注入一個**應該被抓到**嘅個案 → 確認檢查器會響 → 還原 → 確認回復乾淨。三步缺一不可。只做「注入→響」唔夠，因為可能佢對咩都響；只做「還原→綠」更加唔夠，因為嗰個綠可能係假嘅。

反向驗證要喺副本做（`cp -R . /tmp/probe`），唔好喺 working tree 度改完再靠 git 還原 —— 中途出錯就會污染。

**3. 刪除／改數／改架構唔可以只憑一次掃描，要逐個開檔人手核對。**
掃描負責**收窄範圍**，唔負責**下判決**。任何「呢 N 個可以刪」嘅結論，N 個都要逐個開返個檔睇上下文。第 4 條錯誤就係跳咗呢步。

### 反向驗證做唔到嘅情況

有啲嘢冇辦法注入（例如「呢個 URL 線上係咪 200」）。嗰陣要改為用**正對照**：搵一個一定會命中嘅目標，確認檢查器搵得到，先至可以講「另一個搵唔到 = 真係冇」。正對照同反向驗證只可以二選一，唔可以兩樣都冇。

## 目錄結構

```
index.html                 首頁：五個 pillar 入口 + 全部文章列表
about.html                 關於本站：常青／易耗嘅做法（由首頁搬出）
sources/                   內容來源檔（.md 草稿）。**唔入版本控制**（見 .gitignore）——
                           GitHub Pages 會把 repo 入面所有檔案公開，包括未成文嘅稿；
                           只靠 robots.txt disallow 唔算數，唔上傳先算數
guides/index.html          pillar：港人北上完整指南（+ 3 篇 cluster）
areas/index.html           pillar：內地食飲地圖（+ 3 篇）
notes/index.html           pillar：實食紀錄（+ 3 篇）
coffee/index.html          pillar：港深咖啡入門（+ 3 篇）
trips/index.html           pillar：北上行程（+ 4 篇）
en/                        預留目錄，唔填內容、唔入 sitemap、唔對外宣告
css/main.css               全站樣式，手機優先，深色模式用 prefers-color-scheme
js/freshness.js            易耗芯載入 + volatility + 兩套提示
js/affiliates.js           由 data/affiliates.json 注入 affiliate 連結
js/ads.js                  廣告位佔位邏輯（零廣告網絡代碼）
assets/svg/*.svg           圖解唯一來源，由 build 注入頁面
data/<section>/<name>.json 各文章嘅易耗芯
data/notes/*.json          實食紀錄嘅易耗芯：一定有 visitDate、全部 entry high、
                           feedsInto 指返分區檔邊條 key（W14 驗）
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

SITE_ORIGIN=https://實際域名 node scripts/build.mjs --publish   # 發布前必跑

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
| 精確 | `www.dianping.com`、`www.xiaohongshu.com`、`www.youtube.com`、`space.bilibili.com`、`www.douyin.com` | 本站喺各平台嘅帳號主頁。**只准喺 `about.html` 出現**，E18 會攔住佢哋走入文章頁 |

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
| E15 | **（只喺 `--publish`）**頁面仲會渲染 `{{NEEDS_VERIFY}}` 標記 |
| E16 | **（只喺 `--publish`）**`SITE_ORIGIN` 仲係佔位網域 |
| E17 | 頁面入面嘅外部連結，**如果佢個 host 喺同名 data 檔出現過**，全條 URL 就必須對得上 —— 防止頁面同資料檔行開 |
| E18 | 平台帳號連結（`PLATFORM_HOSTS`）出現喺 `about.html` 以外嘅任何頁 |
| E19 | 標咗 `_draft` 嘅頁，出現喺 `sitemap.xml`、首頁 `.post-list`、或者任何 pillar 嘅 `.cluster-list`；另外 pillar 嘅 `jsonld:itemList` 條數同佢畫面 `.cluster-list` 條數對唔上 |
| E20 | 相片冇 `alt`、`alt` 係空、係佔位字（「圖片」「TODO」…）或者係檔名；`.photo-figure` 入面冇 `<img>`；`.photo-figure` 以外有冇 `alt` 嘅 `<img>` |
| E14 | 顯示層走樣：**nav 品牌位／footer／`<title>` 三個品牌槽位**同 `SITE_NAME` 唔一致、nav 分區名同 `SECTIONS` 唔一致、nav 少咗分區連結、或者顯示槽位仲有舊字串 |

警告（唔會 exit 1）：

| 編號 | 檢查 |
|---|---|
| W1–W5 | 文章冇對應 data 檔、`data-fresh-key` 搵唔到、entry 結構問題、`data-aff` 冇對應、JSON-LD meta 缺漏 |
| W6 | 由首頁超過 3 click 先去到 |
| W7 | 待核實標記（逐個列出，同時掃 HTML 同 data） |
| W8 | cluster 冇用含 pillar 關鍵字嘅 anchor、喺上半部連返 pillar；正文內連唔喺 3–5 條 |
| W9 | 文章日期行冇「最後更新：」前綴，或者日期同 `jsonld:dateModified` 唔一致 |
| W10 | cluster 頁嘅中文字數**超出所屬 pillar 40% 或以上**（見下面「幾時要把 cluster 升格」）。`_draft` 頁跳過 —— 佢唔喺清單亦唔喺 sitemap，爭唔到關鍵字 |
| W11 | `SITE_ORIGIN` 仲係佔位網域（含 `example.`）——未設定正式網域，唔好發布 |
| W12 | 頁面有 `.callout-disclosure` 但 data 冇對應嘅 `*.disclosure` entry |
| W13 | Pillar 嘅 `<h1>` 同分區名一模一樣（H1 要係一句，唔係重複一個標籤） |
| W15 | 相片冇 `width`／`height`（載入嗰刻會跳版，CLS）、冇 `loading="lazy"`、或者 `.photo-figure` 冇 `figcaption` |
| W14 | `data/notes/*.json` 嘅回饋線有問題：冇 `visitDate`、有 entry 唔係 `high`、`feedsInto` 指去唔存在嘅檔／key（斷線），或者指住嘅 areas key **仍然係 `needsVerify`**（觀察未歸納返落分區檔） |

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

### 發布前：一個標記都唔可以剩

`{{NEEDS_VERIFY}}` 係**內部施工標記，唔應該出街**。佢嘅角色係施工期間
令空位可見同可追蹤，唔係一個對讀者有意義嘅內容。

所以有兩條硬規則：

1. **發布前任何頁面唔可以殘留 `{{NEEDS_VERIFY}}`。**
2. **唔可以有內容去解釋呢個標記存在。**如果你發現自己想寫一段
   「點解呢度係空嘅」，正確做法係填實佢，唔係解釋佢。
   （`trips/trip-tools.html` 就試過有一條 FAQ 專門解釋卡片入面
   「同其他有咩唔同」點解係空 —— 嗰條 FAQ 本身就係「標記出咗街」
   嘅症狀，已經整條刪走。）

跑 `node scripts/build.mjs --publish` 檢查。呢個模式會：

- **E15** —— 逐頁解析佢引用嘅 `data-fresh-key`，對返 data；
  只要有一個 entry 帶 `needsVerify`，該頁就 error。
  （標記喺 HTML 原始碼入面係唔存在嘅 —— 頁面只寫 `data-fresh-key`，
  標記係 `freshness.js` 喺 runtime 渲染出嚟，所以淨係 grep HTML 搵唔到。
  E15 同時亦掃埋 HTML 入面手寫嘅字面標記。）
- **E16** —— `SITE_ORIGIN` 仲係佔位網域就 error。W11 本身就寫住
  「唔好發布」，一個發布模式冇理由當佢冇到。

**平時 build 唔受影響** —— 施工中有標記係正常，日常只會見到 W7 列表。

### 跨檔共用嘅事實：兩邊都要標

同一件事寫喺兩個資料檔嗰陣（架構冇跨檔引用機制），兩個 entry 都要加
`_sharedWith` 指返對方，提醒改嘅人兩邊一齊改。現時有兩組：

| 事實 | 檔 A | 檔 B |
|---|---|---|
| 口岸最遲進入時間 | `trips/trip-tools.json` → `return.lastEntry` | `trips/day-trip.json` → `lastEntry.byPort` |
| 口岸通實時輪候 | `trips/trip-tools.json` → `hkbcp.*` | `guides/border-crossings.json` → `hkbcp.*` |

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

### 分區名、H1、麵包屑：三樣嘢唔可以一樣

Pillar 頁上面會連續出現三行：nav 標籤、麵包屑最後一格、`<h1>`。
如果三行都係同一個詞，睇落似出錯，而且浪費咗 `<h1>` ——
佢係全頁最大嗰個承諾位。

| 位置 | 要求 | 例 |
|---|---|---|
| 分區名（nav／麵包屑） | 一個**標籤**，對上搜尋意圖 | 北上行程 |
| `<h1>` | 一**句**，接住嗰個意圖再答多一步 | 北上行程點排 |

`build` 會用 **W13** 攔住「H1 完全等於分區名」。五個 pillar 現時嘅 H1：

| 分區 | 分區名 | H1 |
|---|---|---|
| guides | 港人北上完整指南 | 北上由準備到返程，四個決策點 |
| areas | 內地食飲地圖 | 一個區點行，先睇密度同動線 |
| notes | 實食紀錄 | 一次到訪講唔到一個區，但一個區要由好多次到訪砌返出嚟 |
| coffee | 港深咖啡入門 | 一杯咖啡由四層變數決定 |
| trips | 北上行程 | 北上行程點排 |

### 品牌槽位：三個位，一個來源

品牌字串喺三個地方出現，全部由 `SITE_NAME` 生成或者驗證：

1. **nav 品牌位** —— `build` 直接生成（`<a class="brand">` 嘅內容整個換掉）。
2. **`<title>`** —— `build` 生成。
3. **footer** —— 手寫，但 `build` 驗佢含 `SITE_NAME`。

**E14 嘅次序好重要：先驗「檔案原本寫住咩」，再正規化輸出。**
如果掉轉做，build 會靜靜咁修好然後檢查永遠 pass ——
一個永遠唔會 fail 嘅檢查等於冇檢查。而家嘅行為係：發現 drift
就報 error（exit 1），同時仍然修好輸出，令你知道發生過。

**掃描一定要剝走 tag。**品牌位個 markup 係 `歎<span>世</span>界`，
所以 `grep 'hk_eats'` 喺舊版本嘅品牌位（`hk<span>_</span>eats`）
係**結構上搵唔到**嘅 —— 渲染出嚟有嗰七個字，但原始碼入面
從來冇連續出現過。呢個盲點真係中過一次，見 E14 嘅註解。

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

## `/notes/` 實食紀錄：五條硬規則

呢個分區同其餘四個嘅設計前提相反：**佢刻意會過期。**

|  | `areas/` 分區地圖 | `notes/` 實食紀錄 |
|---|---|---|
| 回答 | 呢個區係點 | 我嗰次點 |
| 保質期 | 以年計 | 以月計 |
| 標記 | 核實月份 | **到訪日期** |
| 變動速度 | low / normal | **一律 high** |

兩者係一個循環：紀錄累積落嚟，用嚟填實分區檔入面「冇得喺電腦前查」
嗰啲 key；分區檔提供結構，令一次到訪由「我食咗餐飯」變成「我喺呢個
結構入面試咗一個點」。條線寫喺 data 嘅 `feedsInto`，**W14** 負責睇住佢。

### 1. 每篇一定要有 `visitDate`，`volatility` 一律 `"high"`

`visitDate` 放喺 JSON 頂層（`"visitDate": "2026-08"`），每個 entry 嘅
`volatility` 一律 `"high"` 並附 `volatileNote`。

`high` 喺呢度嘅意思唔係「就快變」，係「由第一日開始就係一次性觀察」——
所以佢**永遠**掛變動中橫幅，唔會有一日靜靜咁「過咗期」然後扮仍然啱。
兩樣都由 W14 驗。

### 2. 平台提供嘅免費餐或招待，必須喺文章開頭披露

用 `.callout-disclosure`，擺喺 `<h1>` 之後、`.lede` 之前 —— 即係讀者
一定會喺讀到任何判斷之前見到。**同 app 開發者披露用同一把尺**：
E13 一樣會驗 HTML 同 data 兩邊逐字一致，唔一致就 error。

披露文要寫明三樣：邊個平台提供、原價幾多、實際畀咗幾多。

### 3. 價錢、排隊時間、營業狀況一律入 data JSON

同全站一致：正文只留唔會變嘅判斷，會變嘅數值抽晒去
`data/notes/<name>.json`，用 `data-fresh-key` 掛返上頁面。

**唯一例外係披露卡片。**規則 2 要求披露文字逐字寫喺 HTML（E13），
而披露文入面通常有原價 —— 呢個數會同時出現喺 HTML。呢個係刻意嘅，
理由同全站「披露係唯一一處刻意重複嘅內容」一樣：披露唔可以淨靠
`freshness.js` 載入，fetch 一失敗就會變成冇披露。

### 5. 冇計時嘅嘢，唔准永遠掛住待核實

`needsVerify` 嘅意思係「我未查，但查得到，而且我打算查」。佢同時係一份
待辦清單（W7 會逐個列）。

**但有一類嘢係永遠查唔到嘅：單次到訪嗰陣冇量度嘅嘢。**平台唔會記低我
嗰日等咗幾耐；我亦冇打算專登返去計時。呢類項目掛住 `needsVerify`
係一個假承諾 —— 佢暗示將來會填，但根本冇人會填，於是佢會永遠留喺
W7 清單度，把真正做得到嘅待辦沖淡。

正確做法係**改寫成一句陳述**：講返我實際觀察到嘅，唔准補一個冇量過
嘅數字。

```json
"queue.observed": {
  "value": "到訪當日冇計時，亦冇排隊。",
  "verifiedOn": "2026-08",
  "volatility": "high",
  "volatileNote": "呢個係一次到訪嘅觀察，唔係量度。本站冇打算返去計時，所以呢項唔會有數字。"
}
```

分野好簡單：

| | 用 `needsVerify` | 改寫成陳述 |
|---|---|---|
| 營業時間 | ✅ 查得到（平台、店面、電話） | |
| 免稅限額 | ✅ 查得到（政府網頁） | |
| 我嗰日等咗幾耐 | | ✅ 冇量過，冇人補得返 |
| 我嗰日見到幾多人 | | ✅ 同上 |

**陳述唔准偷偷帶數字。**「大約等咗十分鐘」如果係事後估，同作一個數
冇分別。冇計時就寫「冇計時」，再講你實際見到咩。

### 二手來源要同一手分得開：`sourceNote`

本站引開嘅政府網頁係**一手**：發布者就係規則制定者。平台商戶頁
（營業時間、人均、分項評分、步行距離）係**二手**：平台顯示嘅嘢由商戶
或者用戶提供，平台自己亦唔保證準，而且可能好耐冇更新過。

兩者唔可以用同一個視覺重量呈現，否則讀者會以為「營業時間」同
「免稅限額」係同一個可信度。

所以二手 entry 要加 `sourceNote`：

```json
"hours.daily": {
  "value": "週一至週日 10:30–21:00",
  "verifiedOn": "2026-08",
  "volatility": "high",
  "volatileNote": "營業時間隨時變，而且呢個係平台資料唔係商戶公布 —— 出發前自己再確認。",
  "sourceNote": "大眾點評商戶資訊頁，平台顯示 4 月前更新；非商戶官方公布，出發前建議自行確認。"
}
```

`freshness.js` 會喺區塊註腳用 `.source-note` 渲染出嚟（去重，同一個來源
只講一次），樣式係 muted 斜體 —— **刻意唔用警告色**。三種提示答三條
唔同嘅問題，唔可以撈亂：

| class | 顏色 | 答緊 |
|---|---|---|
| `.volatile-banner` | 藍 | 呢啲數變得幾快？ |
| `.stale-warning` | 琥珀 | 呢啲數幾耐冇覆核？ |
| `.source-note` | muted | **呢啲數邊度嚟？** |

`sourceNote` 要寫明**平台顯示幾時更新過** —— 一個「6 月前更新」嘅營業
時間同一個「1 月前更新」嘅，可信度差好遠，而呢個資訊只有截圖嗰陣
見到，事後補唔返。

### 4. 唔准用排名語言

「必食」、「最好」、「第一」呢類詞唔准出現喺**本站自己嘅判斷**入面。
理由係樣本量：一次到訪、一間舖、冇對照組，落唔到呢種結論。

平台榜單同評分照引，但要講明係邊個嘅數。寫法上嘅分別：

- ❌ 「呢區必食」「深圳最好嘅雲南米線」
- ✅ 「大眾點評小食榜第一（平台排名，非本站結論）」
- ✅ 「我食嗰四樣入面，炸洋芋做得最好」

### `feedsInto` 嘅格式

```json
"visitDate": "2026-08",
"feedsInto": [
  {
    "target": "areas/shenzhen-malls",
    "key": "list.local.candidates",
    "note": "點解呢次觀察填得實呢條 key"
  }
]
```

`target` 係 `data/` 之下嘅路徑（唔洗寫 `.json`），`key` 要喺嗰個檔真係
存在。W14 會驗三樣：檔存唔存在、key 存唔存在、嗰條 key 係咪仲係
`needsVerify`。

**冇合適目標嘅時候唔准硬砌。**寫 `"feedsInto": []`，再用
`_feedsIntoNote` 講清楚點解 —— 例如廣州嘅紀錄，本站而家冇廣州分區頁，
指去任何深圳 key 都係假嘅。指一條斷咗嘅線比留白更差，因為佢永遠
唔會閂。

## 分段發布：`_draft`

一次過推二十篇文出去，入面十篇仲有「待核實」標記，等於叫 Google 用最差
嗰批頁去評估成個站。上線嗰陣佢見到嘅應該係一批填實咗嘅文，唔係一個工地。

所以資料檔可以標：

```json
{
  "_status": "…",
  "_draft": true,
  "_draftReason": "仲有待核實項目，未適合俾搜尋引擎索引。填實之後拆走呢兩個 key 就會自動返入 sitemap 同各清單。",
  …
}
```

`_draft: true` 之後：

| 會點 | 唔會點 |
|---|---|
| 由 `sitemap.xml` 排除 | 檔案照樣喺 repo |
| 由首頁 `.post-list` 排除 | URL 照樣打得開 |
| 由 pillar `.cluster-list` 排除 | nav、麵包屑照樣有（見下） |
| E9 孤兒／到唔到達唔會報 | |
| W10 體量比較跳過 | |
| `--publish` 嘅 E15 暫緩檢查 | |

**唔係隱藏，係唔推薦。** 頁面唔會 404、唔會 noindex、唔會由 repo 消失。
只係本站唔會主動指路過去，亦唔會叫搜尋引擎去收錄佢。有人攞住條 URL
入嚟一樣睇得到 —— 佢見到嘅係一頁清楚標住邊格未核實嘅文，呢個係誠實嘅
狀態，唔使遮。

### nav 同麵包屑刻意唔排除

E19 掃四層：sitemap、`.post-list`、`.cluster-list`，加上 pillar 嘅
`jsonld:itemList` 條數（佢唔載 URL，所以要用條數對，唔係對名 —— meta 入面
係標題，`<li>` 入面係入口文案，兩者本來就唔同寫法，但「有幾多篇」冇得唔同）。
**唔掃 nav，唔掃麵包屑。** 因為 draft 講嘅係「呢篇未夠皮推出去」，唔係「呢個分區唔存在」。
分區入口一定要行得通，否則麵包屑會斷、pillar 會變孤兒 —— 攞住條 URL
入嚟嗰個人會撞牆。

### E15 點解要跳過 draft

E15 問嘅係「會唔會有待核實標記出到街」。Draft 頁唔喺 sitemap、唔喺任何
清單，本站唔會指路過去 —— 佢仲有標記係預期之內，正正就係佢標咗 draft
嘅原因。如果連佢都封鎖，`--publish` 就要成個站填晒先過到，分段發布等於
冇做過。

**唔係鬆咗手：拆走 `_draft` 嗰一刻，E15 對嗰頁即刻重新武裝。** 所以
「放一頁出街」同「嗰頁冇待核實標記」依然係綁死嘅 —— 你冇得一邊放出去
一邊留住標記。Build 亦會逐次數返有幾多頁被暫緩，唔會靜靜雞放過。

### 一篇一篇放

流程係：填實一頁嘅待核實項 → 拆走嗰兩個 key → 跑 build → 佢自動返入
sitemap 同各清單 → commit。唔使改任何清單 HTML？**唔係**，清單 HTML 要
自己加返 —— E19 只保證「draft 唔喺清單」，唔會幫你把出咗街嘅文塞返入去。
拆走 `_draft` 之後記得同時把 `<li>` 加返落首頁同 pillar。

### 清單變空嗰陣

`areas/` 同 `trips/` 而家全部 cluster 都係 draft，清單係空嘅。空 `<ul>`
睇落似壞咗，所以嗰兩頁改成一句說明：呢個分區嘅文仲有資料未核實，未放
出嚟；上面嘅寫法同框架本身已經完整，照睇得。**唔准**為咗填滿個清單而
把未核實嘅文推出去 —— 咁樣就等於冇做過呢個機制。

### `about.html` 係例外

`/about` 有五條平台帳號 URL 未填，但佢係一頁必要頁：披露、聯絡、平台
帳號都喺嗰度，唔可以由 sitemap 拆走。所以佢照樣出街，五條 URL 用待核實
標記照樣顯示。填得返幾時就填。


## 首頁文章排序：最新行先，食評擺最前

首頁本來按分區分五組排。改咗做一條 flat 清單、最新行先，三篇實食紀錄
擺最前。

理由唔係「最新比較好」，係兩種文嘅作用唔同：

- **實用文**（支付設定、口岸、帶咩返香港）答得到一條具體問題。答完就完 ——
  讀者攞到答案，走。佢唔會記得係邊個站答嘅。
- **食評**有第一身視角：邊日去、叫咗咩、邊樣好邊樣唔好、同香港邊間比。
  呢種嘢冇得抄，亦冇得由別處查返嚟。記唔記得住一個站，靠嘅係呢啲。

所以實用文負責接搜尋流量，食評負責令人記得返轉頭。搜尋流量本來就唔經
首頁 —— 佢由 Google 直接落到內頁。首頁見到嘅係已經入到嚟嘅人，佢哋值得
見到最有辨識度嗰批，唔係一份分區目錄（分區目錄喺上面「五個分區」個
card-grid 已經有咗）。

分區分組唔係冇用，係擺錯位：佢係導覽，唔係文章清單。


## 兩個工具 script

冇 CMS 後台，亦唔打算有。要嘅係兩件事：開新文唔使複製貼上、放相唔使
人手記住十樣嘢。兩個 script 就係做呢兩件。

### `scripts/new-post.mjs` — 開一篇新文嘅骨架

```
node scripts/new-post.mjs                        # 互動式，問四條
node scripts/new-post.mjs --section coffee \
     --title "…" --slug dripper-shapes           # 非互動（俾測試／agent 用）
node scripts/new-post.mjs --list coffee/my-slug  # 填實咗，放佢出街
```

四條問題：分區、標題、slug、係咪實食紀錄（notes 就要埋到訪年月）。

生成兩個檔：

- `<分區>/<slug>.html` —— 完整殼：nav（`aria-current` 自動落喺當前分區）、
  麵包屑 marker、H1、日期行、lede、TOC marker、幾個 `<h2>`、資料區塊
  （`data-fresh` 已經駁好）、FAQ 區、廣告位、footer。分區對應嘅
  `jsonld:type`：`notes` 出 `Article,FAQPage`，其餘出
  `Article,ItemList,FAQPage`（跟返而家嗰批文嘅實際用法）。
- `data/<分區>/<slug>.json` —— `_draft: true`、`_status: "skeleton"`，
  每條 entry 都係 `needsVerify`（唔係空字串 —— 空字串會靜靜咁渲染成
  一格空白，睇落似做完；`needsVerify` 會渲染成顯眼標記，而且 W7 每次
  build 都列出嚟）。notes 額外帶 `visitDate` 同空 `feedsInto`，全部
  entry 一律 `volatility: "high"` 加 `volatileNote`。

骨架**一開波就過到 W8**：正文剛好三條內連（pillar + 兩篇同分區文），
連返 pillar 嗰條 anchor 用 pillar 全名、擺喺上半部。呢個唔係巧合 ——
係照住 W8 條件砌嘅。

#### 點解唔即刻把新文加入清單

原本嘅要求係「自動加入 pillar cluster list 同首頁清單」。做唔到 ——
**同 E19 直接相撞**：新文一出世就係 `_draft`，而 E19 明文規定 draft
頁唔准出現喺 sitemap、首頁 `.post-list`、pillar `.cluster-list`。即刻
插入嘅話，跑 build 一定紅。

規矩係「骨架過唔到守衛＝script 寫錯，唔係守衛要放寬」，所以改成兩步：

1. `new-post.mjs` 把兩段預先砌好嘅 `<li>` 存落 data JSON 嘅
   `_pendingListing`（首頁一段、pillar 一段，連 `itemList` 要加嘅名）。
2. 你填實內容、拆走 `_draft`，然後 `--list <分區>/<slug>` ——
   佢會先驗一次「真係唔再係 draft」（仲係就拒絕，唔會幫你繞過 E19），
   然後插入首頁（新 notes 插最頂，其餘插喺最後一篇食評之後，跟返
   「最新行先、食評擺最前」）、插入 pillar（順手重編 `<span class="step">`
   序號）、加返 `jsonld:itemList` 個名（E19 第四層要條數對得上）、
   最後拆走 `_pendingListing`，再跑一次 build。

如果 pillar 嘅清單之前係空嘅（而家 `areas/` 同 `trips/` 就係），
`--list` 會把嗰句「呢個分區嘅文章仲有資料未核實」換返做一條新 `<ul>`。

### `scripts/optimize-images.mjs` — 相片壓縮

```
node scripts/optimize-images.mjs                    # 全部
node scripts/optimize-images.mjs <slug>             # 一篇
node scripts/optimize-images.mjs <slug> --html      # 順便印 HTML 出嚟
```

原圖擺 `assets/photos/_raw/<article-slug>/`，一篇文一個資料夾。輸出
`assets/photos/<slug>-NN-1200.webp` 同 `-800.webp`，質素 80。

**唔會放大。** 原圖細過目標闊度嗰陣，就照原圖闊度出 —— sips 嘅
`--resampleWidth` 唔理呢樣，照樣拉大（實測：一張 1136px 原圖上到
1200px，壓完 119%，即係大過原圖，而畫質淨係差咗）。`--html` 印出嚟嘅
`srcset` descriptor 亦都用**實際**闊度（例如 `1136w`），唔係名義上
嗰個 —— 寫死 1200w 就係呃緊瀏覽器揀圖。

**唔使 `npm install`。** 用 macOS 內置 `sips` 解碼＋縮放，`cwebp`
（libwebp）編碼 —— 呢部機兩樣都有（`/opt/homebrew/bin/cwebp` 1.6.0）。
如果 `node_modules` 入面搵到 `sharp` 就會自動改用 sharp（快啲、少一次
中間檔），但**唔會因為冇 sharp 而唔郁**。本站零 npm 依賴呢條規矩冇變。
機器上冇 cwebp 嘅話：`brew install webp`。

#### EXIF：兩道防線，加一次實測

手機相帶 GPS 座標、拍攝時間同機型。呢啲嘢一出街就係公開你幾時喺邊度。

1. 中間檔用 **PNG**，唔用 JPEG —— PNG 冇 EXIF GPS 呢個概念，
   所以由解碼嗰步就已經斷咗條線。
2. `cwebp -metadata none` 明寫（雖然佢預設就係 none，但預設會變，
   明寫唔會）。
3. 寫完之後**逐個輸出檔行一次 RIFF chunk**，見到 `EXIF` 或者 `XMP `
   就當場 error 兼刪走個檔。

第 3 點唔係擺設：把第 1、2 點改返做 JPEG 中間檔 + `-metadata all`
試過，守衛即刻紅並且刪咗個檔。所以「冇 EXIF」呢句係驗過，唔係
「應該冇」。

行 chunk 唔用 `indexOf("EXIF")` —— 圖像資料入面完全可能啱啱好出現
呢四個 byte，會報假警。

#### 每篇五張，超過就停

超過 5 張直接 error，**唔會幫你截頭**。靜靜咁淨係處理頭五張，係最難
發現嗰種錯 —— 你以為出咗八張。


## 相片規則

### 一、只准用自己影嘅相 —— 亦都唔准用圖庫相

平台（大眾點評、小紅書、抖音…）上面嘅相唔准搬落嚟。唔係怕告 ——
係呢個站嘅價值就係第一身。搬一張唔知邊個影、唔知幾時影、唔知有冇
修過嘅相返嚟，同「未核實就唔寫」呢條規矩直接矛盾。

**Unsplash、Pexels、Pixabay 呢類免費圖庫，一樣唔准用。** 呢條唔係
「順帶一提」，係同上面同一條規矩嘅延伸：

1. **同定位相衝。** 全站嘅賣點係「我去過、我影過、我標明幾時核實」。
   一張圖庫嘅「深圳街景」放喺一篇實食紀錄入面，讀者分唔出邊張係真、
   邊張係擺設 —— 而佢一旦分唔出，**真嗰幾張嘅可信度會一齊跌**。
   一張借返嚟嘅相，傷嘅唔係佢自己，係佢隔籬嗰張。
2. **佢係幾千個站共用嘅嘢。** 熱門圖庫相會同時出現喺無數內容農場、
   SEO 站同 AI 生成文入面。放上嚟等於主動同嗰批嘢撞樣。
3. **對 SEO 貢獻接近零。** 搜尋引擎見過嗰張圖幾萬次，佢唔會因為你
   again 用一次而覺得你有原創內容。真正有價值嘅係「呢個站有而其他
   站冇」嘅嘢 —— 圖庫相定義上就唔屬於呢一類。

所以全站只准兩種視覺元素：

| 可以 | 唔可以 |
|---|---|
| **我自己影嘅相** —— 經 `optimize-images.mjs`，剝走 EXIF，`alt` 要寫實際見到咩 | 圖庫相（Unsplash / Pexels / Pixabay / Getty…） |
| **本站畫嘅 inline SVG 圖解** —— `assets/svg/`，CSS 變數上色，深淺色都達標 | 平台上面搬落嚟嘅相 |
| | AI 生成嘅圖 |
| | 任何外部 host 嘅圖（E2 本身就攔） |

E2 攔住「圖片指去外部網址」，但攔唔到「下載咗圖庫相再放入 repo」——
嗰個要靠呢條規矩同 code review。**寧願一張都冇。** 一篇冇圖嘅文係
一篇冇圖嘅文；一篇插住圖庫相嘅文係一篇睇落似內容農場嘅文。

### 二、每篇最多五張

`optimize-images.mjs` 硬性攔住。五張唔係美學決定，係編輯紀律：一篇
食評如果要八張相先講得清楚，通常係文字寫得唔夠準。

### 三、相片唔係裝飾，要撐得住文中某個判斷

每張相都要對得返正文入面一句具體嘅話。例子：

| 文中嘅判斷 | 應該影乜 |
|---|---|
| 「飯焦火候到位」 | 掀開之後嘅飯焦特寫，睇到顏色同厚薄 |
| 「環境 100 分」 | 園林同座位環境，睇到空間感 |
| 「一間冇分店嘅單店」 | 店面同招牌，睇到規模 |
| 「湯底贏」 | 湯色同沉澱物，睇到用料 |

判斷方法：**寫唔出 `alt` 嗰張相，就係唔應該存在嗰張相。** 所以 E20
把「冇 alt」「alt 係空」「alt 係『圖片』」「alt 係檔名」全部當 error，
唔係 warning。`alt=""` 喺 HTML 標準入面解「純裝飾，故意唔讀」——
本站唔容許純裝飾相，所以空 `alt` 一樣攔。

`figcaption` 就寫俾睇到相嗰個人：呢張相支撐緊邊一句。

### 四、HTML 格式

```html
<figure class="photo-figure">
  <picture>
    <source
      type="image/webp"
      srcset="../assets/photos/<slug>-01-800.webp 800w,
              ../assets/photos/<slug>-01-1200.webp 1200w"
      sizes="(max-width: 720px) 100vw, 720px">
    <img src="../assets/photos/<slug>-01-1200.webp"
         width="1200" height="900"
         loading="lazy" decoding="async"
         alt="一碗雲吞麵，湯色偏琥珀，碗邊見到蝦籽沉底">
  </picture>
  <figcaption>湯底顏色同蝦籽沉澱 —— 呢張相係「湯底贏」嗰句嘅根據。</figcaption>
</figure>
```

`width` / `height` 由 `optimize-images.mjs` 寫死（`--html` 會連數值一齊
印出嚟）。有咗呢兩個數，瀏覽器自己推 `aspect-ratio`，圖未落到之前個位
已經留好 —— 實測兩個闊度 CLS 都係 **0.0000**。所以 CSS 入面除咗
`height: auto` 唔可以再寫高度，寫咗會蓋過個推算。

深色模式**唔會**把相調暗。調暗會令你睇到嘅同張相實際係咩唔同，
食物顏色尤其明顯。

### 五、原圖唔入版本控制

`.gitignore` 有 `assets/photos/_raw/`。兩個理由：原圖幾 MB 一張，
而且帶住未剝走嘅 EXIF —— GitHub Pages 會把 repo 入面所有嘢公開。
原圖自己留一份喺 repo 以外。

### 六、日常流程

1. 影相 → AirDrop 落電腦
2. 放入 `assets/photos/_raw/<article-slug>/`
3. `node scripts/optimize-images.mjs <article-slug> --html`
4. 把印出嚟嘅 `<figure>` 貼入文章，填 `alt` 同 `figcaption`
5. `node scripts/build.mjs` —— E20 會攔住冇 alt 嘅相


## 等上架：避暑助手（HeatSafe HK）

**本站暫時唔提呢隻 app。** 唔係因為佢差 —— 係因為佢兩邊商店都未上架，
而阻塞原因係一個**法律問題，唔係代碼問題**。

### 點解唔加

`~/Desktop/hk_heatsafe/docs/remaining_gaps.md §0` 標住 🔴「上架阻塞」：
app 用緊兩個**唔喺 data.gov.hk 開放數據目錄**嘅天文台網站內部 endpoint
（官方香港暑熱指數同逐小時預報），**使用條款未同天文台確認過**，要去信。

呢件事同本站「未核實嘅資料：寧願留白，唔好作」係同一條規矩：
**一個自己都未確認到可唔可以合法用嘅資料源，唔應該由我寫一篇文推畀人。**
就算佢技術上做得幾好都好。

（另有一個矛盾未解：`DECISIONS.md` D28.9 寫住「iOS 1.0.0 已經交咗審核」，
但 todays-tasks 嘅 `_data/apps.json` 冇 `apple_url`、落地頁亦冇 App Store
連結。批咗、拒咗、定仲審緊 —— 由 repo 入面分唔出，所以當未上架處理。）

### 上到架就照住做（定位分析已經做咗）

**唔好開獨立一頁。** 加入 `trips/trip-tools.html` 第四節，同香港天氣通
一組。三個理由：

1. 兩個 app 同一個作者、同一個資料源（天文台）、同一個使用時機
   （出門前），擺埋一齊先講得通。
2. 「熱到咩程度」冇一個獨立嘅北上決策場景 —— 佢係「今日點行」嘅一個
   子問題。開一頁就要砌一個唔存在嘅需求。
3. **唔好寫成「熱就北上避暑」。** 深圳同香港同緯度，夏天通常仲熱，
   因果根本唔成立；而且避暑助手只讀天文台，答唔到深圳幾熱
   （`lib/` 入面搵 `深圳|Shenzhen|廣東|China` **零命中**，全部 endpoint
   都係 `data.weather.gov.hk` / `hko.gov.hk` / 香港各政府部門）。

### 第四節嗰條軸已經改咗（唔使等）

原本嘅軸係「落雨 → 室內／室外」，太窄。而家係
**「今日室外可唔可以待，可以待幾耐」**：

| | 答邊半 | 形狀 |
|---|---|---|
| 落雨、警告 | 去唔去 | 二元 |
| 氣溫、濕度、太陽 | 待得幾耐、幾點窗口最闊 | 連續 |

**呢個改動而家就做咗，冇等避暑助手。** 理由：舊嗰條軸本身就太窄
（夏天喺香港，後半條問題往往比前半更決定你嗰日點過），改完之後
整節唔再假設「天氣＝雨」。

咁樣將來加避暑助手就係**插一張 `.app-card`**，唔使重寫成節。

### 插卡嗰陣要一齊改嘅嘢

- **`apps.disclosure`**（`data/trips/trip-tools.json`）而家寫住
  「本站作者係九巴通 — 長者版、鐵路通、香港泊車王、香港天氣通嘅開發者」。
  加第五張卡而唔改呢句，會直接觸發 **E13**（披露 HTML↔data 一致性）。
- **`apps.storeLinks.android` / `.ios`** 兩條清單都要加多一行，
  否則 **E17** 會報「頁面同資料檔行開」。
- 卡入面嘅 `highlight` 要開一條新 key（跟 `apps.weather.highlight` 嘅寫法）。

### 佢實際有咩（睇過代碼，唔係估）

寫嗰陣唔好當佢係「另一隻天氣 app」：

- **有真逐小時預報**，唔止即時 —— 天文台自動分區天氣預報（ARWF/OCF），
  約 230 個逐小時點由當前鐘開始，另加 10 日逐日預報（第一日係**今日**，
  同開放數據 `fnd` 唔同，`fnd` 第一日係聽日）。
- **三套標準並排**：香港 HKHI、日本 WBGT、美國 NWS 熱指數，同一組觀測、
  同一時間、同一地點算出。核心論點係官方 HKHI 俾太陽直曬 5% 權重、
  國際 WBGT 俾 20% —— **差四倍**，所以露天環境官方警告會系統性偏低。
- **2,046 個實體設施連座標**：飲水點 1,215、公廁 812、臨時避暑中心 19。
- **三種通知**（全部預設關）：每朝出門提示、官方工作暑熱警告升降級、
  一個鐘之內轉熱。


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

## App 卡片（`.app-card`）

提到具體 app 嘅時候用，一張卡三行，**唔准寫成產品頁**：

| 行 | 內容 | 來源 |
|---|---|---|
| 做咩 | 一句，逐字沿用正文已有嘅描述 | HTML（唔准喺卡片度加新功能） |
| 特別之處 | 關於自己嘅事實 | data 嘅 `apps.<name>.highlight` |
| 商店連結 | 官方商店頁 | data 嘅 `apps.storeLinks` |

硬規則：

- **唔准列功能清單。**一句講完，講唔完就代表你想寫產品頁。
- **唔准寫版本號、評分、下載量、宣傳語氣。**
- **欄位叫「特別之處」，唔叫「同其他有咩唔同」。**呢個唔係措辭偏好，係
  可驗證性嘅分別：**比較宣稱要驗證對手，本站驗證唔到**——講「比 X 快」
  就要量過 X，講「只有我哋有」就要掃過全市場，兩樣本站都做唔到，
  寫落去就係冇根據嘅斷言。「特別之處」係關於自己嘅事實，
  代碼驗證得到：打開 repo 就見到係咪真係咁做。
  （原本個 key 叫 `apps.*.diff`，已改為 `apps.*.highlight`。）
- **卡片要分散放喺對應場景嗰節之後，唔可以集中喺文末。**集中放會變成
  推薦列表；分散放先係「講到呢個環節順帶提」。
- 如果頁面有利益披露，**披露 callout 必須喺第一張卡片之前**出現。

實例：`trips/trip-tools.html`（四張卡分別喺實時到站、泊車、天氣三節之後）。

### App 名一定要用商店實際名

寫落卡片同正文嘅名，必須係商店上架名，唔可以用口語簡稱：

| 卡片名 | 註 |
|---|---|
| 九巴通 — 長者版 | **冇一個叫淨「九巴通」嘅 app。**pubspec／Info.plist／AndroidManifest 三處都寫住「長者版」 |
| 鐵路通 | **兩個平台唔同名。**App Store 叫「鐵路通」，Google Play 叫「港鐵通 — 實時列車資訊」。卡片用 App Store 名，另加一行 `.app-note` 說明 Play 上架名 |
| 香港泊車王 | 兩邊同名 |
| 香港天氣通 | 兩邊同名 |

### Bundle ID（對商店連結用）

| App | iOS | Android |
|---|---|---|
| 九巴通 — 長者版 | `com.hkwww.kmbApp` | `com.hkwww.kmb_app` |
| 鐵路通 | `com.hkwww.mtrRealTimeInfo` | `com.hkwww.mtr_real_time_info` |
| 香港泊車王 | `com.hkwww.carpart` | `com.hkwww.carpart` |
| 香港天氣通 | `com.hkwww.www` | `com.hkwww.www` |

**前兩個 iOS 同 Android 唔一致**（camelCase vs snake_case），砌商店連結時要分開攞，唔可以共用一個 id。

### 商店連結：Android 推得到，iOS 推唔到

Google Play 嘅 URL 由 `applicationId` 直接組成，所以知道 bundle id
就砌得出，唔使查商店：

```
https://play.google.com/store/apps/details?id=<applicationId>
```

**App Store 唔同**——佢用數字 ID（`id123456789`），同 bundle id 冇任何
推導關係，一定要去商店攞。所以 `data/trips/trip-tools.json` 將商店連結
拆成兩個 entry：`apps.storeLinks.android`（已核實，四條）同
`apps.storeLinks.ios`（`needsVerify`）。

卡片入面嘅 Google Play 係真嘅 `<a href>`（白名單放行），因為連結要逐個
app 唔同，一個共用 entry render 唔到；但同一條 URL 亦一定要喺 data 檔
出現，**E17** 就係防止兩邊行開。

### E17 點決定邊條連結要對數

唔用寫死嘅網域名單，而係睇 **「呢個 host 有冇喺同名 data 檔出現過」**：

- **有** → 代表呢類連結由 data 管，全條 URL 必須對得上（例：商店連結、
  口岸通嘅 `sb.gov.hk`）。
- **冇** → 代表佢淨係一條參考連結（例：`bring-back` 引嘅海關頁），唔管。

咁樣加新一類受管連結唔使改守衛：你一將 URL 放入 data，佢自動開始受檢。

### 查詢參數：唔好靠估，逐個實測

外部連結帶 query 參數嗰陣，**一定要跑一次 build 確認冇被 `TRACKING_PARAM_RE` 誤攔**。
已經實測過通過嘅：`?id=`（Google Play）、`?type=`（口岸通出／入境）。
兩者都唔喺追蹤參數名單，所以放行。**唔准為咗遷就守衛而改官方 URL** ——
要改就改守衛。

### 硬規則：香港天氣通張卡唔准提通知

**`apps.weather.highlight` 同該卡任何位置，唔准出現通知／提醒／推送／
背景警告相關嘅字眼。**

理由唔係措辭偏好，係事實：該 app 嘅警告通知由自己 polling 驅動，
只喺前景或者 resume 時發，app 完全關閉就唔會有，而且 pubspec 冇任何
背景排程套件。寫「唔使開任何嘢都知道八號要掛」係講大咗。

其餘三個 app 嘅通知功能可以寫，但要標清楚係 [需要開啟]（全部預設關）。

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

**超出 10–20% 唔使急**（呢個級數而家根本唔會報 warning）。

**但最重要嗰句係：拆分嘅真正觸發條件係 Search Console 顯示關鍵字互食
——即係同一組 query 底下，cluster 同 pillar 互相搶位、或者 cluster
搶咗本應屬於 pillar 嘅入口 query。字數比例只係一個提示，唔係判準。**

字數大唔等於關鍵字重疊。一篇 3,000 字但主題極集中嘅文，同 pillar
可以完全冇衝突；一篇 1,500 字但涵蓋三個獨立搜尋意圖嘅文，就算冇觸發
W10 都可能已經喺互食。所以 W10 響咗只代表「值得去 Search Console
睇一眼」，唔代表「要拆」。冇實際 query 數據之前，唔應該拆。

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

## App Store 連結：ID 由邊度嚟、點對數

四個 app 嘅 App Store 數字 ID **冇得由 bundle id 推出嚟**，所以曾經係
`data/trips/trip-tools.json` 入面一條 `needsVerify`。而家填實咗。

ID 由 `~/Desktop/GITHUB/hill02252024.github.io/_data/apps.json` 攞
（同一個作者嘅落地頁 repo，`generated_from: source files under ~/Desktop`）。

**但唔係照抄成條 URL。** 兩邊嘅 URL 格式唔一樣：

| | 格式 | 例 |
|---|---|---|
| `apps.json` | 冇地區段 | `https://apps.apple.com/app/id6779145047` |
| **本站用** | 有 `/hk/` | `https://apps.apple.com/hk/app/id6779145047` |

**四條 ID 逐條對過，4/4 完全一致** —— 唔一致嘅只係地區段。
兩種都實測過 HTTP 200，而且逐條開返出嚟核對 `<title>`，確認每個 ID
真係對應返嗰個 app（唔止「有嘢喺度」，係「係嗰個 app」）。

本站揀 `/hk/`：讀者係香港人，指定 HK 商店可以避開「你所在地區冇呢個
app」呢種訊息。呢個差異記喺 entry 嘅 `sourceNote` 度，唔會靜靜咁夾成
一樣。

⚠️ **改連結要兩邊一齊改**：`E17` 要求 HTML 入面嘅 URL 同 data 檔**逐字**
對得上。四張 `.app-card` 嘅 `href` 同 `apps.storeLinks.ios` 嘅清單係同一
批字串。

## 待辦：五條平台主頁 URL（`/about`）

`/about` 嘅「喺其他平台」表而家**淨係列帳號名，冇連結**：

| 平台 | 帳號名 |
|---|---|
| 大眾點評 | 香港人美食家 |
| 小紅書 | 香港人｜美食實測 |
| YouTube | Wandering Chef's Fork |
| B站 | 香港人美食家 |
| 抖音 | 港仔咖啡旅行食記 |

五條主頁 URL 要逐個開返 app 至攞得到，2026-08-28 上線嗰陣未攞齊。冇用
`{{NEEDS_VERIFY}}` 留住 —— 標記係俾「查得到但未查」嘅嘢用嘅，而呢五條唔喺
電腦前查得返，掛住只會變成一個冇人拆嘅永久標記（同 `/notes/` 第 5 條硬
規則同一個道理）。所以直接由表入面拆走，剩低帳號名。

**唔准做嘅事**：唔准猜主頁網址、唔准擺搜尋結果頁充數、唔准留空連結。
一條錯嘅帳號連結比冇連結更差 —— 佢會將讀者送去第二個人度。

補返嘅時候：

1. `EXTERNAL_ALLOWLIST.exact` 入面五個網域（`www.dianping.com`、
   `www.xiaohongshu.com`、`www.youtube.com`、`space.bilibili.com`、
   `www.douyin.com`）**保留住，唔好刪** —— 補得到就即刻用得。
2. `PLATFORM_HOSTS` 同 E18 一樣照留。E18 攔嘅係「平台連結走入文章頁」，
   同呢五條而家填咗未冇關係。
3. 表加返第三欄「主頁連結」，逐條要 https、要有具體路徑（E1 會攔根網域）。
4. 只准加喺 `about.html`。


## A 類待核實：19 個可以喺電腦前查完嘅

「A 類」＝ 官方／政府／商戶公布嘅資料，唔使落場就查得到。逐個一行，照住做就得。
URL 後面嘅括號係 **2026-08-23 由本機實測嘅 HTTP 狀態**；`200` = 通，`404`／`000` = 嗰條路徑試過唔通，改用旁邊嗰條。

查到之後：把 `needsVerify` 換成 `value` + `verifiedOn`（`YYYY-MM`），保留原本嘅 `volatility`。**唔好順手改其他 key。**

### 深圳商圈（`data/areas/shenzhen-malls.json`）

| key | 要查咩 | 去邊度 |
|---|---|---|
| `list.gateway` | 緊貼羅湖／福田／深圳灣口岸、步行或一程車可達嘅商圈名 | 高德地圖以各口岸為圓心搜「购物中心」，半徑 2 km：https://amap.com （200） |
| `list.cbd` | CBD 型商圈名單同所屬行政區 | 深圳市政府《商業網點規劃 2023-2035》新聞稿，列明五個地標商圈同所屬區：http://www.sz.gov.cn/cn/xxgk/zfxxgj/tpxw/content/post_10857804.html （200） |
| `list.destination.candidates` | 商圈名單同所屬行政區（**只填名單，唔好落「值唔值得專程」判斷**） | 同上 |
| `list.local.candidates` | 非核心商圈名單同所屬行政區 | 同上 |
| `access.byPort` | 六個口岸到各商圈嘅最短路線同大概車程 | 路線：https://www.szmc.net/map/ （200）；逐段車程：https://amap.com （200） |
| `hours.mall` | 大型商場一般營業時間區間，同餐飲樓層收工差異 | **冇單一官方頁**。逐個商場官網／公眾號抄，或 https://www.dianping.com （200）睇「营业时间」再抽樣核 |

### 深圳咖啡（`data/areas/sz-coffee-map.json`）

| key | 要查咩 | 去邊度 |
|---|---|---|
| `venue.mall` | 咖啡集中嘅商圈名單同一般所在樓層 | 同上批商場嘅樓層指引（商場官網 floor guide） |
| `venue.park` | 創意園區／文創園名單同所在區 | 深圳市政府入口網站站內搜「文化創意園區」：http://www.sz.gov.cn/ （200） |
| `venue.street.candidates` | 深圳街區名單同所屬行政區（**只填名單**） | 同上（行政區劃） |
| `chain.local` | 深圳本土連鎖咖啡品牌名單同定位（價位帶、主打） | **冇官方名錄**。https://www.dianping.com （200）搜「咖啡」按連鎖篩，再入品牌官網／小程序核價位 |
| `access.park.published` | 創意園區官方公布嘅開放時間（**唔包出入管制同泊車，嗰兩樣係實地層**） | 各園區官網 |
| `hours.mall` | 商場型咖啡店營業時間，同商場開關門嘅關係 | 由上面 `hours.mall` 同一批資料推導 |

### 行程（`data/trips/*.json`）

| key | 要查咩 | 去邊度 |
|---|---|---|
| `day-trip / duration.clearance.weekday` | 平日各主要口岸嘅一般過關等候時間區間 | 保安局口岸通（出境）：https://www.sb.gov.hk/chi/bwt/status.html?type=outbound （200）。連續抽樣幾日先歸納區間 |
| `day-trip / duration.clearance.weekend` | 週末及長假期嘅過關等候時間區間 | 同上（入境版換 `?type=inbound`） |
| `day-trip / duration.hkSide` | 由新界東／新界西／九龍到各口岸嘅一般車程 | https://amap.com （200）或 Google Maps 路線規劃 |
| `day-trip / duration.szSide` | 由各口岸到主要商圈嘅一般車程 | 同上 |
| `overnight / lodging.registration` | 境外旅客喺內地住宿嘅登記要求（酒店代辦定自行申報、要咩證件） | 公安機關出入境管理公布。⚠️ https://www.mps.gov.cn 由本機試到 **521**、https://www.nhc.gov.cn **412**，即係要換網絡或改用地方公安局網站 |
| `overnight / lodging.foreignerAccept` | 接待境外旅客嘅住宿類型限制 | 同上，同一份規定 |
| `overnight / checkin.hours` | 一般入住與退房時間，同提早寄存行李嘅慣例 | 酒店官網逐間抄，抽樣歸納 |
| `overnight / luggage.storage.published` | 提供行李寄存嘅場所名單同**公布收費**（實際可得性係實地層） | 口岸／地鐵／商場官網 |
| `trip-tools / apps.storeLinks.ios` | 四個 app 嘅 App Store 數字 ID | https://apps.apple.com （200）逐個搜 app 名，抄網址嘅數字 ID |
| `with-family / fare.child` | 兒童及長者喺跨境交通同深圳地鐵嘅票價優惠同年齡／身高門檻 | 港鐵票務：https://www.mtr.com.hk/ch/customer/tickets/concessionary_fares.html （200）；深圳地鐵：https://www.szmc.net/szmc_m （200） |
| `with-family / docs.child` | 小童過關所需嘅證件同隨行人要求 | 入境事務處：https://www.immd.gov.hk/hkt/ （200）；政府一站通：https://www.gov.hk/tc/residents/immigration/ （200） |
| `with-family / access.toilets.mapped` | 口岸同商場平面圖上標示嘅廁所位置（**育嬰設施實況係實地層**） | 各口岸／商場官方平面圖 |

### 咖啡（`data/coffee/*.json`）

| key | 要查咩 | 去邊度 |
|---|---|---|
| `brewing-basics / freshness.window` | 唔同烘焙度嘅最佳賞味窗口（由烘焙日起計嘅日數區間） | 烘焙商公布嘅賞味期 + 業界文獻，兩個獨立來源夾 |
| `reading-menu / menu.pricing.samples` | 抽樣店舖嘅單品手沖標價（**記低抽樣間數、地區、日期**；歸納區間係另一個 key） | 店舖餐牌／官網／點評 |

### 香港咖啡（`data/areas/hk-coffee-map.json`）

| key | 要查咩 | 去邊度 |
|---|---|---|
| `district.industrial.list` | 香港工業區嘅實際名單（**只填名單，「有冇咖啡聚落」係判斷層**） | 規劃署分區計劃大綱圖：https://www.pland.gov.hk/ |

⚠️ **呢頁其餘 5 個 key 全部唔係 A 類**：`district.street`、`district.upstairs`、`hours.industrial` 標咗「必須實地」，`hours.street.observed` 同 `.typical` 要抽樣。詳見下一節。

### 由本機試唔通嘅 URL

| URL | 狀態 | 點算 |
|---|---|---|
| `https://www.mps.gov.cn` | 521 | 內地公安部主站由本機連唔到。改用深圳市公安局或地方出入境管理處嘅頁 |
| `https://www.nhc.gov.cn` | 412 | 同上 |
| `https://commerce.sz.gov.cn/` | 000 | 深圳市商務局主站連唔到，但 `www.sz.gov.cn` 嘅新聞稿（200）已經覆蓋同一份規劃 |

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

冇 CI build step，因為產物（注入咗嘅 JSON-LD 同 SVG、sitemap、robots）
係直接 commit 入 repo 嘅。

### 上線 checklist：十一步，次序唔可以亂

**依家未做第一步。GitHub Pages 仲係熄咗嘅，`SITE_ORIGIN` 仲係
`example.github.io`，兩樣都係刻意。** 未買域名之前唔好開 Pages ——
一開，`hill02252024.github.io/hk-eats/` 就上線，Google 收咗，之後轉自訂
網域要 301，而 GitHub Pages 做唔到真正嘅 301。等於一開始就送咗一批
重複內容出去。

1. **買域名。** 呢步做唔到，下面十步全部唔好做。
2. **`/about` 五條平台帳號 URL。** 2026-08-28 上線嗰陣攞唔齊，所以改成
   淨係列帳號名、唔放連結，`{{NEEDS_VERIFY}}` 直接拆走（見上面「待辦：
   五條平台主頁 URL」）。`--publish` 因此過到 E15。
3. **用真網域重跑 build：**
   ```
   SITE_ORIGIN=https://你嘅域名 node scripts/build.mjs
   ```
   佢會改寫全部 canonical、`og:url`、JSON-LD、`sitemap.xml`、`robots.txt`。
   跑完打開 `sitemap.xml` 肉眼確認一次 host 對。

   > **上線之後就唔使再帶呢個環境變數。** build 而家會讀 repo 入面
   > 嘅 `CNAME` 檔做預設網域（次序：`SITE_ORIGIN` 環境變數 → `CNAME`
   > → 佔位網域）。冇呢一層嘅話，上線之後任何一次 bare
   > `node scripts/build.mjs` 都會靜靜咁把全站改返做 `example.github.io`
   > 而且唔報錯 —— 而 `scripts/new-post.mjs` 每次開新文都會跑一次 bare
   > build，即係開一篇文就打回原形一次。
4. **寫 CNAME 檔：**
   ```
   echo "你嘅域名" > CNAME
   ```
   （淨係域名，冇 `https://`，冇尾 slash。）
5. **commit + push** —— 產物同 `CNAME` 一齊入。
6. **Settings → Pages** → Source 揀 `main` / `(root)` → Custom domain 填
   同一個域名 → 等佢驗證 → 剔 Enforce HTTPS（憑證要幾分鐘至幾個鐘先發到）。
7. **DNS：四條 A + 一條 CNAME。**
   - apex（`@`）→ 四條 A record，指向 GitHub Pages 嘅四個 IP
   - `www` → CNAME 指向 `hill02252024.github.io`

   **四個 IP 自己去 GitHub 官方文件核實返，唔好照抄任何二手清單。**
   GitHub 換過 IP，網上一堆過期教學。查呢頁：
   `https://docs.github.com/pages` → 「Managing a custom domain for your
   GitHub Pages site」→ apex domain 嗰節。
8. **Search Console 加 Domain property**（唔係 URL prefix）。驗證方式係
   加一條 TXT record，同第 7 步一次過落 DNS 慳時間。
9. **交 sitemap**：Search Console → Sitemaps → 填 `sitemap.xml`。
10. **對七篇乾淨文逐篇 Request indexing。** 只做七篇 —— draft 嗰批本來就
    唔喺 sitemap，唔好手動推佢哋。
11. **由 todays-tasks 同 pdfloveme 各加一條連結入嚟。** 兩個站都係你自己
    嘅，唔係買連結。加喺有上文下理嘅位，唔好開一個 footer 連結農場。

第 3 步同第 4 步之間唔好 push；第 6 步之前 DNS 未落都唔好剔 Enforce HTTPS
—— 憑證簽唔到會卡住，要等佢自己 retry。
