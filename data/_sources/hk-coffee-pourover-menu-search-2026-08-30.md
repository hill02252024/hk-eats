# 香港咖啡店「單品手沖杯價」第二輪搵：逐間查過乜

> **呢個檔會公開**（GitHub Pages 照 serve repo 入面所有嘢）。寫嘅時候當佢係公開嘢。

**核查日期：** 2026-08-30
**用途：** `data/coffee/reading-menu.json` → `pricing.hk.samples`
**上一輪：** `data/_sources/hk-coffee-shops-official-check-2026-08-30.md`（U Food 八間，1/5 夠格）
**結論：** **一條都冇填。** 累計夠格 **4 間**（NOC、CMCR、The Coffee Academics、
Elephant Grounds），**差一間**先夠五間門檻。

---

## 門檻（同 NOC 一樣，三條要一齊成立）

1. **官方來源**（官網／官方 IG）有公開嘅**店內 menu**（唔計二手整理、唔計外賣平台）
2. menu 入面有**單品手沖嘅杯價** —— 唔係豆價（200g／500g）、唔係 Flat White／
   espresso 類、唔係特調
3. **分得清加一前定加一後** —— menu 上要有明文（例如「subject to 10% service
   charge」或者「price inclusive」）

搵嘅方向：自己烘豆 ＋ 有店內 menu PDF／圖。純電商型（只賣豆）同連鎖飲品型唔試。

---

## 夠格：4 間

### 1. NOC Coffee Co.（上一輪已核，喺此重列）

| | |
|---|---|
| 官方 URL | `https://noc.coffee/en/` → menu PDF `https://noc.coffee/media/2026/07/202607_Cafe-Drink-Menu_outlined.pdf` |
| 有冇 menu | ✅ 有，官方 PDF |
| 有冇單品手沖杯價 | ✅ 有，第 2 頁「SINGLE ORIGIN POUROVER」，**逐支豆逐個價** |
| 實際價錢（HK$） | Panama Janson Geisha Washed **95**；Ethiopia Bensa Gonjobe **75**、Ethiopia Duwancho **75**、Peru Nueva Esperanza **75**；Brazil Casa Bras Geisha **65**、Rwanda Huye Geisha **65**、Brazil Sitio Tres Barras **60**、Ethiopia Chelchele **60** |
| 加一前／後 | **加一前** —— menu 明文「Subject to 10% Service Charge.」 |
| 日期 | **推**：URL 路徑 `/media/2026/07/` → 2026-07。menu 本身冇印日期 |
| 技術註 | PDF 已轉外框（冇 `/Font` 表），抽字抽唔到，要 `gs -sDEVICE=png16m -r160` 光柵化之後用眼睇 |

### 2. Common Man Coffee Roasters（CMCR）香港

| | |
|---|---|
| 官方 URL | `https://commonmancoffeeroasters.com.hk/pages/our-menus` → `https://cdn.shopify.com/s/files/1/0880/5017/2222/files/CMCR_HK_Day_Menu_Dec25.pdf` |
| 有冇 menu | ✅ 有，官網「our menus」頁一共連出 5 份 PDF（Day／Night／Set Lunch／Dinner Set／Wine） |
| 有冇單品手沖杯價 | ✅ 有 —— 「FILTER COFFEE 滴濾咖啡 › Filter Brew 手冲過濾咖啡」 |
| 實際價錢（HK$） | Standard Single Origin **75**；UnCommon Coffee **85**。（同組：Cold Brew 冷泡咖啡 50） |
| 加一前／後 | **加一前** —— 頁腳明文「All prices are exclusive of service charge & taxes. 所有價格不含服務費和稅。」 |
| 日期 | 檔名 `Dec25` → 2025 年 12 月版；CDN `?v=1765174286` → **2025-12-08 UTC** |
| 限制 | 「Standard Single Origin」係一個**級別**，唔係逐支豆標價 —— 同 NOC 唔同，睇唔到當日係邊支豆 |
| 其他條款 | 同一份 menu 寫明「Dine-in time is limited to 90 minutes」、「minimum spend of HKD100 per person」 |

### 3. The Coffee Academics（TCA）

| | |
|---|---|
| 官方 URL | `https://www.theacademicsgroup.com/pages/menu` → `https://cdn.shopify.com/s/files/1/0070/0085/0498/files/Main_Menu_UPDATE.pdf?v=1733105368` |
| 有冇 menu | ✅ 有，16 頁官方 PDF |
| 有冇單品手沖杯價 | ✅ 有 —— 第 8–9 頁「SPECIALTY POUROVER」，逐支豆逐個價 |
| 實際價錢（HK$） | **P8 Panama Geisha Coffee Collection**：Panama Esmeralda Geisha Washed **198**、NINETY Plus Panama Geisha Washed **98**、NINETY Plus Panama Geisha Natural **98**。**P9 Global Plantations（產區咖啡）**：Ecuador Olmedo Loja Agerogora Sidra **88**、Ethiopia Sidamo Hambela Buku Peaberry **78**、Indonesia Sumatra TP Washed **78**、Peru Organic Arabica **78** |
| 加一前／後 | **加一前** —— 尾頁明文「All prices are subject to 10% service charge. Waived for self takeaways.／堂食設有 10% 服務費」 |
| 日期 | CDN `?v=1733105368` → **2024-12-02 UTC**（menu 本身冇印日期） |
| ⚠ 限制 | 同一版 menu 頁**明文寫住「( Prices vary depending on the location. )」**，下面列咗 7 個香港點（Johnston Road｜Happy Valley｜The Unit@WorFu｜K11 Musea｜Harbour City｜Langham Place｜The Pulse@Discovery Bay）。即係**呢組價錢綁唔到某一區** —— 對 `pricing.hk.samples` 要求嘅「逐店地區」係一個真問題 |
| 另註 | 同一份 menu 另有「Barrel Fermentation Series」（酒桶發酵）128／88 —— 屬處理法特調系列，**冇當單品手沖計** |

### 4. Elephant Grounds

| | |
|---|---|
| 官方 URL | `https://www.elephantgrounds.com/`（首頁「MENU」掣）→ `https://www.elephantgrounds.com/_files/ugd/4d24c9_3edf3e64006645f99d89709697a9f2fa.pdf` |
| 有冇 menu | ✅ 有，4 頁官方 PDF；全站得呢一份 |
| 有冇單品手沖杯價 | ✅ 有 —— 第 4 頁「BREW BAR › POUR OVER」 |
| 實際價錢（HK$） | POUR OVER：OG BLEND **70**、**SINGLE ORIGIN 100**。（同組：COLD BREW 55） |
| 加一前／後 | **加一前** —— 第 4 頁頁腳「10% SERVICE CHARGE」（第 1、3 頁亦各有一次） |
| 日期 | HTTP `last-modified: 2025-05-16`；PDF 內部 `D:20250516153141` → **2025-05-16** |
| ⚠ 限制 | 份 PDF 內文標住 `#EGSTARSTREET`，第 3 頁仲有「EGSTARSTREET EXCLUSIVE」 → 呢份係**灣仔星街店**嘅 menu，但官網當佢係唯一嗰個「MENU」掣。其他分店價可能唔同，官網冇分店 menu |
| 另註 | 「SINGLE ORIGIN 100」冇印豆名，同 CMCR 一樣係級別價 |

---

## 唔夠格：逐間查過乜

「官網」一欄係實際打得通嘅網址；打唔通就寫 DNS／HTTP 結果。

| # | 店 | 官方來源 | 有冇店內 menu | 有冇單品手沖杯價 | 判定理由 |
|---|---|---|---|---|---|
| 5 | Cupping Room | `https://cuppingroom.hk/` (React SPA) | ❌ | ❌ | 由 JS bundle `main.c996922c.js` 抽出全部 route：`/about /shop /our-coffee /our-shops /locations /subscription …` —— **根本冇 menu 路由**。`/shop` 賣豆 |
| 6 | Craft Coffee Roaster | `https://craftcoffeeroaster.hk/pages/visit-our-shop` | ❌ | ❌ | Shopify `sitemap_pages_1.xml` 得 5 版（about／wholesale／shipping／contact／visit-our-shop）。「Visit Our Shop」只有大角咀同灣仔兩間嘅地址同開門時間，冇餐牌 |
| 7 | oma coffee roaster | `https://omacoffeeroaster.com/` | ❌ | ❌ | sitemap 5 版（contact／wholesale／about／shipping／return-policy）。導覽嗰個「FILTER COFFEE」係**豆嘅 collection**，唔係飲品 |
| 8 | Roastwork | `https://roastwork.com/` | ❌ | ❌ | sitemap 19 版，全部係 about／beans／wholesale／AeroPress 比賽／可持續發展，冇一版係店內餐牌 |
| 9 | Coffee Roasters Asia | `https://coffeeroasters.com.hk/` | ❌ | ❌ | sitemap 25 版全部電商（訂閱、掛耳、豆款分類、優惠條款）。純電商型 |
| 10 | Hazel & Hershey | `https://www.hazelnhershey.com/` | ❌ | ❌ | sitemap 17 版（about／教學課程／招聘／訂閱豆）。`/collections/filter-pourover` 係**器具**分類 |
| 11 | Quality Life Coffee | `https://www.qualitylife.coffee/` | ❌ | ❌ | sitemap 21 版全部電商＋沖煮教學。首頁有「手沖／單品」字眼但講嘅係豆 |
| 12 | Colour Brown | `https://colourbrown.com/pages/our-locations` | ❌ | ❌ | sitemap 8 版（contact／faq／about／locations／shipping／past-event／brands／media）。頁內「Pourover」係**器具**分類名 |
| 13 | Artista Perfetto | `https://artistaperfetto.com/pages/store-info` | ❌ | ❌ | sitemap 4 版（aboutus／wholesale／store-info／locations）。store-info 冇價 |
| 14 | Winston's Coffee | `https://www.winstonscoffee.com/pages/winstons-coffee` | ❌ | ❌ | sitemap 8 版，有 `winstons-coffee`／`winstons-food`／`winstons-booze`／`test-menus`。四版逐版睇過：**得相同品名，一個價都冇**（Iced Latte／Chai Latte／Hot Chocolate／Long Black 全部冇數字） |
| 15 | sensory ZERO | `https://sensoryzero.coffee/` | ❌ | ❌ | sitemap 26 版（分店、工作坊、企業方案、會員）。**冇 menu 版**。同上一輪結論一致 |
| 16 | 18 Grams | `https://18grams.com/` (Wix) | ❌ | ❌ | `/menu` 回 404。首頁 HTML 搵唔到任何手沖／pour over 字眼 |
| 17 | Knockbox Coffee | `https://www.knockboxcoffee.hk/` (Wix) | ❌ | ❌ | `/menu` 回 404。`/filtered-roast` 打得通但全站 client-side render，served HTML 冇任何價 |
| 18 | Barista Jam | `https://www.baristajam.com.hk/menu` | ❌ | ❌ | 呢個網址**302 去咗 Facebook 專頁** `facebook.com/baristajamhk`。等於冇官網 menu；FB 專頁要登入先睇到相，唔當核到 |
| 19 | Fuel Espresso | `https://www.fuelespresso.com/` | ❌ | ❌ | 導覽得 Our Story／Our Speciality／Roasting／Espresso Blends／Locations／Shop。冇餐牌，冇價 |
| 20 | Café Corridor | `https://cafecorridor.com/` | ❌ | ❌ | 首頁冇 menu 連結、冇 PDF、冇手沖字眼 |
| 21 | Coffee Assembly | `https://www.coffeeassembly.com/` | ❌ | ❌ | 得一版介紹文（講供應鏈透明度），冇餐牌 |
| 22 | For Single（單品咖啡＋單一麥芽） | `https://www.forsinglehk.com/menu` | ⚠ 只有酒 | ❌ | Wix Restaurants menu app 入面**得一份 `whisky-menu`**（逐支酒有 HK$ 價）。試過 `?menu=coffee-menu`／`coffee`／`food-menu` 全部 fallback 返同一版。咖啡冇公開價 |
| 23 | HABITŪ | `https://www.habitu.com.hk/menu-ele` → `_files/ugd/53d4ab_3cf91effad4d4395b1b1a9314e85e5d7.pdf` | ✅ 有（16 頁，2026-07-14） | ❌ | 光柵化逐頁睇過。P13「Classico Caffè」得 espresso 類（Double Espresso 32、Caffè Lungo 36／38、Latte 42／44…）；P12「4 Choices of Special Coffee」四款單品**標嘅係 200g／500g 豆價**（138／298）。**冇單品手沖杯**。逐分店有各自 menu 版（menu-ele／mira／oc／op／to） |
| 24 | Blue Bottle Coffee HK | `https://bluebottlecoffee.com/hk/cafes`、`https://bluebottlecoffee.hk/` | ❓ **未能核** | ❓ | 兩個網址都畀 Cloudflare 擋（HTTP 403，回「Attention Required! \| Cloudflare」）。curl 加齊瀏覽器 header 同 WebFetch 都一樣。**唔知有冇 menu，唔當夠格亦唔當唔夠格** |
| 25 | Amber Coffee Brewery | `https://www.amberbrewery.com/` | ❌ | ❌ | sitemap 得 1 版（contact-us）。而且搜到嘅資料顯示中環店已結業，冇進一步核 |
| 26 | Classified | `https://www.classifiedgroup.com.hk/` | ❌ | ❌ | 企業站（品牌／招聘／投資者關係），冇餐牌連結 |
| 27 | Sonne CAD | `https://sonnecad.com/` | ❓ 未能核 | ❓ | HTTP **429**（rate limit），重試一樣。冇核到 |
| 28 | Starbucks 香港 | `https://www.starbucks.com.hk/` | —— | —— | **連鎖飲品型，按搵嘅方向跳過**，冇核 |

另外 DNS 查唔到（域名根本唔存在／解析唔到，所以冇官網可核）：
`colourbrown.hk`、`roastwork.hk`、`hazelhershey.com`、`accro.coffee`、`accrocoffee.hk`、
`rabbitholeroaster.com`、`urbancoffeeroaster.com`、`urbancoffee.hk`、`halfwaycoffee.hk`、
`cafedeadend.com`、`hollybrown.com.hk`、`brewbros.hk`、`n1coffee.hk`、`coffeeassembly.hk`、
`ecup.hk`、`baristart.com.hk`、`theninetys.com`、`pacificcoffee.com`。
Halfway Coffee 同 Rabbit Hole（香港）搵唔到官網 —— 只有 OpenRice／foodpanda 等二手源，
按規矩唔用。

---

## 判定

夠格 4 間（NOC、CMCR、TCA、Elephant Grounds），門檻係五間，**差一間**，
所以 `pricing.hk.samples` **維持 needsVerify，一條都冇填**。

就算夠五間，落數之前仲有三件事要處理返：

1. **地區綁唔實。** TCA 官方明講「Prices vary depending on the location」，7 個香港點
   共用一份 menu；Elephant Grounds 嗰份係星街店專屬但被當成全店 menu。
   `pricing.hk.samples` 要求「逐店地區核實得到」，呢兩間目前做唔到。
2. **粒度唔一致。** NOC 同 TCA 係逐支豆逐個價（60–95 / 78–198）；CMCR 同
   Elephant Grounds 係級別價（75 / 100），睇唔到豆。混住歸納會整出一個假嘅區間。
3. **日期跨度太闊。** TCA 2024-12、Elephant Grounds 2025-05、CMCR 2025-12、
   NOC 2026-07 —— 前後差成年半，唔可以當同一個時點嘅抽樣。

再搵一間之前，可以行嘅方向：官方 IG 有 menu 相嗰批（要有完整年份先算），
或者仲未核到嗰兩間（Blue Bottle 要繞過 Cloudflare、Sonne CAD 要等 rate limit 過）。
