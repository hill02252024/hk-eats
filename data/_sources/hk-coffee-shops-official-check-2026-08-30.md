# U Food 八間香港咖啡店：逐間去官方來源核

> **呢個檔會公開**（GitHub Pages 照 serve repo 入面所有嘢）。寫嘅時候當佢係公開嘢。

**核查日期：** 2026-08-30
**二手起點：** U Food〈【打工仔必睇】網民力推香港8大高質咖啡店…〉，2026-07-30
`https://ufood.com.hk/restaurant/news/detail/20104131/…`
**用途：** `data/coffee/reading-menu.json` → `pricing.hk.samples`；
`data/areas/hk-coffee-map.json` → `hours.street.observed` 等
**結論：** **一條都冇填。** 理由喺最後兩節。

U Food 呢篇本身**冇任何價錢**，八間之中三間（NOC、% Arabica、sensory ZERO）
連地址都係寫「各分店資訊去官網睇詳情」。所以佢只可以做「去邊度搵」嘅起點，
唔可以做出處。下面每一格都係去官方來源（官網／官方 IG）親自睇返，
搵唔到就寫搵唔到。

---

## 逐間結果

### 1. NOC Coffee Co.

| | |
|---|---|
| 官方來源 | `https://noc.coffee/en/` ✅ |
| 完整 menu + 價錢 | ✅ **有** —— `https://noc.coffee/media/2026/07/202607_Cafe-Drink-Menu_outlined.pdf`（由 `/en/about-us/food/` 連出去） |
| **單品手沖標價** | ✅ **有，而且係逐支豆逐個價**（見下） |
| 地址 | ✅ 官網 `/en/locations/cafe/` 列咗 **16 間**，逐間有全址 |
| 營業時間 | ✅ 逐間有；**但唔係一個時間** —— 最早 07:00（黃埔）、最遲 22:00（啟德） |
| 同 U Food 對唔對得上 | U Food 冇畀地址（「各分店資訊去官網睇詳情」）。U Food 寫「08:00 ~ 18:00」，**同官網對唔上** —— 官網 16 間之中至少 7 間唔係呢個時間 |

**官方單品手沖價（PDF 第 2 頁，`SINGLE ORIGIN POUROVER`）：**

| 級別 | 豆 | HK$ |
|---|---|---|
| COMPETITION | Panama Janson Coffee Hacienda Las Lagunas Geisha Washed | 95 |
| RARE | Ethiopia Bensa Gonjobe 74158 Anaerobic Natural 72 hours | 75 |
| RARE | Ethiopia Duwancho 74158 Red Honey 18 hours | 75 |
| RARE | Peru Finca Nueva Esperanza SL09 Washed | 75 |
| SPECIAL | Brazil Casa Bras Geisha Natural | 65 |
| SPECIAL | Rwanda Huye Geisha Anaerobic Natural | 65 |
| SPECIAL | Brazil Sitio Tres Barras Red Catucai Honey | 60 |
| SPECIAL | Ethiopia Chelchele Factory Heirloom Anaerobic Natural | 60 |

PDF 第 1 頁另有：Espresso 32、Long Black 36、Piccolo 42、Flat White 42、
Cappuccino 42、Mocha 50、**Pourover 60+**；凍：Black 42、White 46、Dirty 42、
Fizzpresso 50、Mocha 55、**Pourover 60+**。加項：Extra Shot / Almond / Oat 各 5，
Decaf +10。**menu 明文寫住「Subject to 10% Service Charge.」**

> 讀法：份 PDF 嘅字係 outline（冇 `/Font` table），抽唔到文字，
> 用 ghostscript 光柵化成 PNG 之後人手讀。日期由 URL 路徑
> `/media/**2026/07**/` 推斷係 2026 年 7 月出嘅版本 —— **份 menu 本身冇印日期**。

### 2. % Arabica

| | |
|---|---|
| 官方來源 | `https://arabicacoffee.hk/` ✅ |
| 完整 menu + 價錢 | ❌ **冇**。導覽得 Our Story / Beans / Merchandise / Gift Sets / Stores / FAQ…，冇飲品 menu |
| 單品手沖標價 | ❌ 冇 |
| 地址 | ✅ `/locations/locations` 列咗 **17 間**，有全址 |
| 營業時間 | ❌ **官網一間都冇公布營業時間** |
| 同 U Food 對唔對得上 | U Food 冇畀地址。U Food 寫「08:30 ~ 19:00」—— **官網冇時間可對，核唔到** |

### 3. sensory ZERO

| | |
|---|---|
| 官方來源 | `https://sensoryzero.coffee/en` ✅ |
| 完整 menu + 價錢 | ❌ 冇。導覽有 Shop Online（賣豆）、Workshop，冇店內飲品價 |
| 單品手沖標價 | ❌ 冇（有「Hand Drip Workshop」課程，唔係一杯手沖嘅價） |
| 地址 | ✅ `/en/pages/locations` 列咗 **10 間**，有全址同電話 |
| 營業時間 | ✅ 逐間有，**而且係八間入面唯一逐間публ埋「last order」** |
| 同 U Food 對唔對得上 | U Food 冇畀地址。U Food 寫「10:00 ~ 22:00」—— **同官網對唔上**：10 間之中最早 08:00（科學園、黃竹坑），只有太古城同沙田先係 10:00 開 |

### 4. Craft Coffee Roaster

| | |
|---|---|
| 官方來源 | `https://craftcoffeeroaster.hk/` ✅ |
| 完整 menu + 價錢 | ❌ **冇店內飲品價**。個站係電商，賣豆同器材（single origin 豆有價，但嗰個係豆價，唔係一杯手沖嘅價） |
| 單品手沖標價 | ❌ 冇 |
| 地址 | ✅ `/pages/visit-our-shop`：大角咀 `G16, G/F, West 9 Zone, 38 Cherry Street, Tai Kok Tsui`；灣仔 `G/F, Shop B1, EIB Tower, 4-6 Morrison Hill Rd, Wanchai` |
| 營業時間 | ✅ 大角咀 Mon-Fri 8AM-5PM、Sat-Sun & P.H. 9AM-5PM；灣仔 Mon-Sun & P.H. 8.30AM-5PM |
| 同 U Food 對唔對得上 | ✅ **完全對得上**（大角咀嗰間）。U Food：大角咀櫻桃街38號西九滙地下G16號舖／08:00~17:00 平日、09:00~17:00 假日。U Food 冇提灣仔嗰間 |

### 5. Oma Specialty Coffee

| | |
|---|---|
| 官方來源 | 官網 `https://omacoffeeroaster.com/`、官方 IG `@omacoffeeroaster` ✅ |
| 完整 menu + 價錢 | ❌ 冇店內飲品價。官網賣豆／capsule／磨豆機 |
| 單品手沖標價 | ❌ 冇 |
| 地址 | ✅ `/pages/contact`：`G/F, 9 Wun Sha St, Tai Hang`（IG bio 亦寫 `9 Wun Sha Street`） |
| 營業時間 | ✅ `Monday-Sunday 08:30-18:00` |
| 同 U Food 對唔對得上 | ✅ **完全對得上**（大坑浣紗街9號地舖／08:30~18:00） |

> `/pages/location` 係 404，正確路徑係 `/pages/contact`。

### 6. C108 Cafe & Bar

| | |
|---|---|
| 官方來源 | 官方 IG **兩個**：`@c108.cafe`（日間）、`@c108.bar`（夜間）✅。**搵唔到官網** |
| 完整 menu + 價錢 | ❌ 冇。兩個 bio 都冇價；有 story highlight 叫「Drinks」「Menu」，但 highlight 入面嘅嘢我攞唔到 |
| 單品手沖標價 | ❌ 冇 |
| 地址 | ❌ **兩個官方 IG bio 都冇寫地址** |
| 營業時間 | 部分：`@c108.bar` bio 寫 `Mon-Thu,Sun 6pm - 12am`、`Fri-Sat 6pm-2am`、`Walk in only`。**`@c108.cafe` bio 冇時間** |
| 同 U Food 對唔對得上 | U Food：中環奧卑利街15號／08:00~17:30 + 18:00~00:00（平日）、10:30~17:30 + 18:00~00:00（週末）。**地址官方核唔到**（只有 OpenRice／Esquire／Timeout 呢啲二手講「中環奧卑利街15號地下」，唔可以攞嚟頂）。**夜間時間對唔上** —— 官方 bar bio 話 Fri-Sat 開到 2am，U Food 話 00:00 |

### 7. FREE D COFFEE

| | |
|---|---|
| 官方來源 | 官方 IG `@free_d_coffee`（有藍剔）✅；Linktree `linktr.ee/freedcoffee`。**搵唔到官網** |
| 完整 menu + 價錢 | ❌ 冇。Linktree 八條連結全部係 IG／Threads／FB／YouTube 報道／Google Drive 海報，**冇 menu 價錢頁** |
| 單品手沖標價 | ❌ 冇 |
| 地址 | ✅ IG bio 列咗 **4 間**：葵涌廣場、觀塘駱駝漆、新蒲崗 Mikiki、上環禧利街 |
| 營業時間 | ✅ IG bio 逐間有 |
| 同 U Food 對唔對得上 | ✅ 觀塘嗰間**對得上**（U Food：08:00~18:00、假日 10:00~19:00；IG bio：`8-6 weekdays / 10-7 weekends & holidays`）。⚠️ 但**分店名單對唔上** —— U Food 只提觀塘；IG bio 嗰四間冇灣仔利東街，而 OpenRice（二手）有灣仔利東街同葵芳。即係官方 bio 同二手平台講嘅分店數唔同 |

### 8. 野田珈琲 生豆專門店 + 焙煎

| | |
|---|---|
| 官方來源 | 官網 `https://www.nodacoffee.com.hk/`（由官方 IG `@nodacoffeehk` bio 連出去）✅ |
| 完整 menu + 價錢 | ❌ 冇店內飲品價。官網賣生豆／熟豆 |
| 單品手沖標價 | ❌ 冇 |
| 地址 | ✅ `灣仔軒尼詩道314-324號Winland Square地下B店` |
| 營業時間 | ✅ Mon-Thu 08:00-19:30、Fri 08:00-20:00、Sat-Sun 09:00-20:00、假日前夕到 20:00 |
| 同 U Food 對唔對得上 | ✅ **完全對得上**（U Food 寫「W Square」，官網寫「Winland Square」，同一個地方；三段時間逐段一樣） |

---

## 總表

| 店 | 官方來源 | 有 menu 價 | **單品手沖價** | 地址 | 時間 | 對得返 U Food |
|---|---|---|---|---|---|---|
| NOC | ✅ 官網 | ✅ | **✅ 8 支豆 60–95** | ✅ 16 間 | ✅ | ❌ 時間對唔上 |
| % Arabica | ✅ 官網 | ❌ | ❌ | ✅ 17 間 | ❌ 官網冇 | ❌ 核唔到 |
| sensory ZERO | ✅ 官網 | ❌ | ❌ | ✅ 10 間 | ✅ 連尾單 | ❌ 時間對唔上 |
| Craft | ✅ 官網 | ❌ | ❌ | ✅ 2 間 | ✅ | ✅ |
| Oma | ✅ 官網+IG | ❌ | ❌ | ✅ 1 間 | ✅ | ✅ |
| C108 | ✅ 兩個 IG | ❌ | ❌ | ❌ **官方冇** | 部分（只有 bar） | ❌ 地址核唔到、夜間時間對唔上 |
| FREE D | ✅ 官方 IG | ❌ | ❌ | ✅ 4 間 | ✅ | ✅（觀塘）／分店名單對唔上 |
| 野田 | ✅ 官網 | ❌ | ❌ | ✅ 1 間 | ✅ | ✅ |

**八間之中，有公開飲品價錢嘅：一間（NOC）。有真・單品手沖逐支豆標價嘅：一間（NOC）。**

---

## 判定一：`pricing.hk.samples` —— 唔填，差四間

entry 門檻：真・單品手沖標價、地區核實得到、日期完整、每間都要。

- **夠格：1 間**（NOC）。八支豆 60–95，官方 PDF，地區可核實（官網 16 間全址），
  日期由 URL 路徑推 2026-07。
- **唔夠格：7 間，而且唔係「唔以單品手沖為主」咁簡單 —— 係連一杯 Flat White
  幾錢都冇公開。** 七間全部零飲品價。

站長初步估「% Arabica、C108、FREE D、sensory ZERO 唔係以單品手沖為主」——
方向啱，但實際情況更徹底：**呢四間連價都冇公開，所以「係唔係以單品手沖為主」
呢條問題根本輪唔到問**。反而站長冇點名嘅 Craft 同 Oma 兩間係真・單品咖啡烘焙商
（官網有 single origin 豆賣），但佢哋一樣冇公開店內飲品價。

**要五間先填得到，而家一間。差四間。**

## 判定二：`areas/hk-coffee-map` 八條 —— 一條都唔填

呢批材料只可能服務到 `hours.street.observed`
（「抽樣**街舖型**咖啡店嘅實際開門同尾單時間，逐間由店方公布抄」）。
我而家手上有六個品牌、三十四個分點嘅**官方公布**營業時間 —— 「由店方公布抄」
呢半做到咗。但兩個缺口卡死：

1. **分唔到邊間係「街舖型」。** 三十四個分點大部分喺商場、寫字樓、工廈。
   由地址推「G/F + 街名 = 街舖」係推論唔係事實 —— 一個商場裙樓嘅 G/F 舖
   同一個真・臨街舖唔同。而同一份檔嘅 `district.street` 已經標咗
   **「必須實地：拆唔開，冇客觀部分可以獨立查」**，即係本站早就判咗
   街舖分類唔係枱面功夫。喺 `hours.street.observed` 度用地址推翻返嗰個判斷，
   等於自己拆自己台。
2. **「尾單時間」八間得一間有。** entry 明文要「開門**同尾單**時間」。
   只有 sensory ZERO 逐間公布 last order；NOC、Craft、Oma、野田、FREE D
   全部只公布關門時間。就算解決咗第 1 點，收到嘅都係半份資料。

其餘七條：`district.street`、`district.upstairs`、`hours.industrial`、
`access.upstairs` 標咗必須實地；`district.industrial.list` 要規劃署官方劃分，
呢批店舖資料幫唔到；`district.industrial.judgement`、`hours.street.typical`
係判斷層，要先有對應嘅客觀 key。

## 下次要補咩

- **`pricing.hk.samples`：** 再搵四間有公開單品手沖逐支豆標價嘅香港店。
  由呢次經驗睇，**要搵「自己烘豆 + 有店內 menu PDF／圖」嗰種**，
  純電商型（Craft、Oma、野田）同連鎖飲品型（% Arabica、FREE D）都唔會公開。
  另外記住 NOC 份 menu 寫住 **+10% 服務費** —— 抽樣要講清楚報嘅係
  加一前定加一後，唔可以有啲加有啲唔加。
- **`hours.street.observed`：** 先要一個「邊間係街舖型」嘅可核實依據
  （實地行過，或者一個講得出舖位型態嘅官方／地政來源），
  再加上尾單時間。兩樣齊先填得到。
