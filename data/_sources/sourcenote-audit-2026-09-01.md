# 全站 sourceNote 稽核（2026-09-01）

**呢一輪係診斷，唔係修補。**除咗呢個檔之外冇改過任何嘢：零 value 改動、
零新增 sourceNote、冇跑 `--publish`、冇 commit。

掃描定義：`data/**/*.json` 入面 `entries.*` 有 `value` 而**冇非空 `sourceNote`** 嘅。
`needsVerify` 嗰啲唔計（佢哋本來就未有值）。

---

## 0. 真實條數 vs 記憶

| | 記憶 | 實測 | 差異 |
|---|---|---|---|
| **總數** | 34 | **90** | **＋56** |
| payment-setup | 9 | **0** | −9 |
| border-crossings | 9 | **22** | ＋13 |
| bring-back | 13 | **9** | −4 |
| notes 嘅 `platform.*` | 3 | **0** | −3 |

三處差異解釋得到：

- **payment-setup 0 條** —— 2026-08-31 嗰輪已經把九條全部轉成 `needsVerify`
  兼標 `_draft: true`，佢哋而家冇 `value`，所以唔喺呢個掃描範圍。記憶停留咗喺改之前。
- **notes 的 `platform.*` 0 條** —— 六篇食評一共 **24 條** `platform.*`，
  **全部都有 sourceNote**（同一輪補齊咗）。呢一項記憶完全反轉咗。
- **＋56 從邊度嚟** —— 記憶只覆蓋咗 `_status` 係 `sourced`／`verified` 嗰兩個檔
  （即 W16 會嘈嗰批）。但 W16 只掃 `sourced|verified`，
  **`mixed` 同 `principles` 兩類檔完全喺守衛視線之外**，而佢哋佔咗 59 條：

| 檔 | `_status` | 條數 | W16 睇唔睇到 |
|---|---|---:|---|
| `guides/border-crossings.json` | sourced | 22 | ✅ 睇到（但 22 條全部有 `_noSource` 豁免，所以唔嘈） |
| `trips/trip-tools.json` | mixed | 14 | ❌ |
| `guides/bring-back.json` | verified | 9 | ✅ 睇到，**9 條全部會嘈** |
| `coffee/reading-menu.json` | principles | 8 | ❌ |
| `coffee/brewing-basics.json` | principles | 7 | ❌ |
| `notes/2026-08-fangwenshan-yunnan-mixian.json` | mixed | 5 | ❌ |
| `notes/2026-08-manji-claypot-rice.json` | mixed | 5 | ❌ |
| `notes/2026-08-panxi-restaurant.json` | mixed | 5 | ❌ |
| `coffee/grinder-guide.json` | principles | 4 | ❌ |
| `notes/2026-08-sinsumkee-claypot.json` | mixed | 4 | ❌ |
| `notes/2026-08-taizai-boat-noodle.json` | mixed | 3 | ❌ |
| `notes/2026-08-xiaoyueshan-laoyoufen.json` | mixed | 2 | ❌ |
| `coffee/espresso-machine.json` | mixed | 1 | ❌ |
| `trips/day-trip.json` | verified | 1 | ✅ 睇到（有 `_noSource`） |
| **合共** | | **90** | |

**帶 `_noSource` 明文豁免嘅：24 條。完全冇任何出處說明嘅：66 條。**

---

## 1. ABC 分類分佈

| 類 | 條數 | 佔比 |
|---|---:|---:|
| **[A] 可補** —— 有官方一手來源查得到 | **20** | 22% |
| **[B] 存疑** —— 查唔到／只有二手／懷疑填咗個大概 | **20** | 22% |
| **[C] 唔需要** —— 唔係外部事實聲明 | **50** | 56% |

---

## 2. [A] 可補（20 條）—— 應該查邊度

> 呢一輪**冇去查、冇填**。下面只係清單。

### `data/guides/bring-back.json`（7 條，`_status: verified`，全部係法定數字）

| key | value 摘要 | 應該查邊度 |
|---|---|---|
| `rule.24hour` | 持港身份證者須離港 ≥24 小時先有酒煙免稅額 | 香港海關（C&ED）「**旅客免稅優惠**」頁 |
| `duty.alcohol` | 18 歲、1 升、酒精 >30%、24 小時 | 同上 |
| `duty.alcoholLow` | 酒精 ≤30% 屬零稅率，數量不限 | 香港海關「**應課稅品**」頁 ＋《應課稅品條例》**Cap 109** 稅率表 |
| `duty.tobacco` | 19 支香煙／1 支雪茄（>1 支則 ≤25 克）／25 克其他煙草 | 香港海關「旅客免稅優惠」頁 |
| `duty.ageLimit` | 18 歲；嬰幼兒配方粉出境豁免 16 歲 | **兩份唔同文件**：18 歲 → 海關「旅客免稅優惠」；16 歲 → 《進出口（一般）規例》**Cap 60A** 之下嘅配方粉出口管制條文 |
| `declare.cash` | 第 629 章：>HK$120,000 須紅通道申報 | 香港海關「**現金及不記名可轉讓票據申報系統**」頁 ＋《打擊洗錢及恐怖分子資金籌集（現金及不記名可轉讓票據跨境流動）條例》**Cap 629** |
| `smoking.alternative` | 進口另類吸煙產品違法，最高罰 $5 萬、監禁 6 個月 | 衞生署「**控煙酒辦公室**」另類吸煙產品頁 ＋《吸煙（公眾衞生）條例》**Cap 371** |

### `data/guides/border-crossings.json`（10 條）

| key | 應該查邊度 |
|---|---|
| `lowu.hkLink`、`futian.hkLink` | 港鐵「**東鐵綫路綫圖**」（羅湖站、落馬洲站為總站） |
| `lowu.szLink`、`futian.szLink`、`huanggang.szLink`、`liantang.szLink` | 深圳地鐵集團官網「**線路圖／車站查詢**」（1／4／10／7／2 號綫對應站） |
| `hkbcp.what` | 保安局「**口岸通**」`sb.gov.hk/chi/bwt/` 頁上嘅**燈號圖例**（綠／黃／紅門檻、更新頻率） |
| `hkbcp.coverage` | 同上，頁面自己列出嘅管制站清單 |
| `hkbcp.extra` | 同上，皇巴／金巴欄目 |
| `hkbcp.source` | 同上，頁腳「資料由入境處、警務處、運輸署提供」＋下一階段說明 |

⚠️ 呢 10 條全部已經帶咗 `_noSource`（理由寫「結構性事實／地理常識」）。
**我認為呢個豁免對其中一批太寬鬆**：「深圳地鐵 7 號綫皇崗口岸站」唔係地理常識，
係一個會改嘅營運事實（新線開通、站名更改、口岸重建都會令佢過時）。
`hkbcp.*` 四條更加係**帶數字**嘅平台描述。

### `data/trips/trip-tools.json`（3 條）

`hkbcp.what`、`hkbcp.coverage`、`hkbcp.extra` —— 同 border-crossings 逐字相同，查同一個地方。
**但呢邊連 `_noSource` 都冇。**（見第 5 節「重複 entry」）

---

## 3. [B] 存疑（20 條）—— 核唔到嘅話點做

### `data/coffee/brewing-basics.json`（5 條）

`ratio.range`（1:15–1:17）、`ratio.start`（1:16 = 15g/240g）、`temp.range`（88–96°C）、
`time.range`（2:30–3:30）、`bloom.rule`（兩倍粉重、30–45 秒）

- **點解入 B**：SCA（Specialty Coffee Association）確實有出過 Golden Cup／
  Coffee Standards 一類文件，**但我印象中嗰組數同呢度對唔上**（金杯沖煮比例約
  55 g/L ≈ 1:18、沖煮水溫約 92–96°C）。本 repo 有一條硬規矩係「唔信記憶入面嘅數字」，
  所以我唔會憑印象判斷邊個啱 —— 只可以講：**呢度嘅數唔似係抄任何一個標準，
  比較似業界通則概括**，而檔頭亦自己咁講。
- **建議**：**唔好標 needsVerify、唔好剷走。**改為喺 **entry 層**加
  `_noSource: "業界通用起手範圍，非任何機構標準（檔頭 _note 已聲明）"`。
  理由：呢啲數嘅功能係「可重複嘅起點」，唔係「權威值」，功能上冇問題；
  真正嘅問題係**聲明只寫喺檔頭，entry 層睇唔到**，而 W16 又唔覆蓋 `principles` 檔 ——
  即係話呢個聲明冇任何機器守住。

### `data/coffee/grinder-guide.json`（4 條）

`tier.entry.traits`、`tier.mid.traits`、`tier.high.traits`、`tier.boutique.traits`

- **點解入 B**：檔頭寫「屬機械原理陳述」。**但「入門級多為錐刀」唔係機械原理，
  係一個關於市場現況嘅概括**，而市場會變（近年入門平刀機明顯多咗）。
  「公差控制到可標稱同心度」「小批量加工，逐台檢測」同樣係市場觀察。
  冇任何機構會出一份「手搖磨豆機價位分層」文件。
- **建議**：**改寫成模糊講法**（把「多為」「通常」呢類限定詞寫實，並加一句
  「呢個分層係本站按市面觀察歸納，唔係業界定義」），同時 entry 層加
  `_noSource: "本站按市面觀察歸納嘅分層，非機構定義"`。
  唔建議剷走（分層本身對讀者有用），亦唔建議 needsVerify（冇一個「正確答案」可以核）。

### `data/guides/border-crossings.json`（8 條）

| key | 點解入 B | 建議 |
|---|---|---|
| `huanggang.hkLink`、`szbay.hkLink`、`liantang.hkLink`、`mankamto.hkLink` | 「跨境巴士」「專綫巴士」「指定跨境巴士路線」冇一個單一官方清單，而且路線逐年變 | **改寫成模糊講法**：唔列交通模式，改為「經 XX 公路／XX 方向，冇鐵路直達」，把會變嗰部分踢走 |
| `szbay.szLink`（「口岸接駁市內交通，往南山、蛇口」） | 「接駁市內交通」冇講係咩，等於冇資訊 | **剷走**。佢冇畀到任何讀者用得着嘅嘢，留住只係佔位 |
| `mankamto.szLink`（「口岸巴士轉乘，無地鐵直達」） | 「無地鐵直達」係可核嘅（負面事實），「口岸巴士轉乘」唔可核 | **改寫成模糊講法**：只保留「無地鐵直達」呢半 |
| `hkbcp.alternative`（入境處 App 選單路徑 ＋ 八個口岸） | 選單路徑只可以喺 app 入面核，冇可引用文件；app 改版即變 | **改寫成模糊講法**：刪走逐級選單路徑，只留「入境處 App 有陸路口岸等候時間」 |
| `crossing.specialArrangement` | 主體係本站立場（叫人睇官方），但入面舉咗兩個**具體歷史事實**（除夕曾延長羅湖清關、深圳灣曾改 24 小時），呢兩個係可查嘅聲明 | **改寫成模糊講法**：把兩個例子改成「過往試過延長清關時間或者臨時 24 小時運作」，唔指名邊個口岸邊一年 —— 除非有人願意去翻新聞稿核實 |

### `data/guides/bring-back.json`（1 條）

`duty.dutiableList`（應課稅品四類 ＋「跨境司機（含港車北上、粵車南下）不享免稅優惠」）

- **點解入 B**：前半（四類應課稅品）明顯查得到，**但後半嗰句跨境司機豁免，
  我唔肯定海關有冇明文寫過**。兩句綁喺同一條 entry，一條 entry 只可以有一個分類 →
  按「唔肯定一律入 B」處理。
- **建議**：**拆成兩條 entry**。前半入 [A] 補海關「應課稅品」頁；
  後半如果核唔到，標 `needsVerify`（唔好剷 —— 呢句對港車北上讀者好重要，
  而且係「有／冇豁免」呢種二元問題，答得到就好有用）。

### `data/coffee/reading-menu.json`（1 條）

`altitude.rule`（海拔越高 → 成熟越慢 → 酸質越明亮、密度越高）

- **點解入 B**：呢個係一個**因果宣稱**，唔同同檔其他七條（純風味方向描述）。
  農學文獻有講，但係二手整理居多，而且「一般」呢個限定詞去到幾闊冇講。
- **建議**：**改寫成模糊講法**（明寫係「常見講法」而唔係定律），
  或者由 World Coffee Research 一類機構嘅公開資料補返 —— 但嗰個屬 [A] 級工作，
  今輪我唔肯定佢哋有冇一份可引用嘅文件，所以留 B。

### `data/notes/2026-08-fangwenshan-yunnan-mixian.json`（1 條）

`shop.branches`（「冇分店，單店經營」）

- **點解入 B**：呢條同檔入面其他四條唔同 —— 佢**唔係第一手觀察**，
  係一個關於商戶嘅外部事實。點知冇分店？睇平台商戶頁？問過店員？冇寫。
  而「冇分店」係一個難證嘅否定命題。
- **建議**：**標 `needsVerify`**，並把問題寫實（「呢個係邊度睇返嚟？平台商戶頁定係問店員？」）。
  唔建議剷走 —— 呢條係嗰篇文其中一個論點（單店 vs 連鎖）嘅支柱。

---

## 4. [C] 唔需要（50 條）—— 分佈同理由

| 檔 | 條數 | 一句理由 |
|---|---:|---|
| **六篇 notes** | 23 | 第一手：自己去過、自己叫嘅嘢、自己俾嘅錢、自己落嘅評分。冇外部出處可言（唯一例外係 `shop.branches`，已入 B） |
| `trips/trip-tools.json` | 11 | 四條 `*.highlight` ＋ `apps.coverage` ＋ `apps.parking.feature`：作者本人就係嗰四個 app 嘅開發者，屬第一手。`apps.disclosure` 係利益披露。兩條 `hkbcp.url.*` ＋ `apps.storeLinks.android`：value 本身就係官方 URL。`return.lastEntry`：關於「冇官方數」嘅陳述 |
| `coffee/reading-menu.json` | 7 | 處理法／烘焙度嘅風味方向描述 —— 檔頭明寫「唔係精確規則」，係落單前嘅預判，冇可被證偽嘅數值 |
| `guides/border-crossings.json` | 4 | `hzmb.direction`、`huanggangNew.notFutian` 係澄清句（防止讀者揀錯），唔係數值；兩條 `hkbcp.url.*` 嘅 value 本身就係官方 URL |
| `coffee/brewing-basics.json` | 2 | `temp.rule`（淺烘用高溫）同 `adjust.step`（一次改一個變數）係操作原則，唔係數值 |
| `guides/bring-back.json` | 1 | `penalty.general` 刻意唔寫任何數字，內容係「有後果，詳情睇海關官方頁」—— 呢個係本站嘅處理方式聲明 |
| `coffee/espresso-machine.json` | 1 | `site.noHandsOn` 講嘅係本站自己嘅狀態（冇試過任何機），出處就係作者本人 |
| `trips/day-trip.json` | 1 | `lastEntry.byPort` 係關於「冇官方公布」嘅陳述，後半推理由同檔有出處嘅 `ports.hours` 推出 |

⚠️ **[C] 唔等於「冇嘢做」。**下面兩個 [C] 群組有結構問題，見第 5 節。

---

## 5. 稽核過程撞到嘅四個結構問題

### 5.1 🔴 六條 entry 喺兩個檔重複，而豁免狀態唔一致

`hkbcp.what`、`hkbcp.coverage`、`hkbcp.extra`、`hkbcp.url.inbound`、`hkbcp.url.outbound`
五條，**value 逐字相同**，同時存在於 `guides/border-crossings.json` 同 `trips/trip-tools.json`。

| | border-crossings | trip-tools |
|---|---|---|
| `_noSource` | **有**（五條都有） | **冇**（五條都冇） |
| `sourceNote` | 冇 | 冇 |

同樣情況：`day-trip.lastEntry.byPort`（有 `_noSource`）vs
`trip-tools.return.lastEntry`（**冇**），value 亦係逐字相同。

**點解要緊**：一個 value 有兩份，改一邊唔改另一邊就會靜靜咁行開 ——
呢個正正係 E13／E17 存在嘅理由，但呢六條冇任何守衛對數。
而且豁免理由只寫咗喺其中一邊，另一邊睇落就變成「無故冇出處」。

### 5.2 🔴 W16 覆蓋唔到 59 條（66 條無豁免入面嘅大多數）

W16 只掃 `_status ∈ {sourced, verified}`。`mixed` 同 `principles` 完全喺視線外，
而佢哋合共 59 條有 value 冇 sourceNote。**即係話：一個檔只要 `_status` 寫
`mixed`，就自動免疫。**呢個唔係設計意圖 —— W16 自己個註解都承認咗
（「⚠️ 即係 notes/* 同 trip-tools（都係 mixed）而家唔受呢條守」），
但當時冇量化過個缺口有幾大。而家有數：**59 條。**

### 5.3 🟡 同一類 entry，repo 入面有兩種做法

`price.paid` 呢個 key 喺五篇食評出現，憑據處理方式唔一致：

| 檔 | `price.paid` sourceNote |
|---|---|
| `2026-08-xiaoyueshan-laoyoufen` | **有** —— 「本站自己嘅支付紀錄頁（微信支付…）」 |
| `2026-08-sinsumkee-claypot` | 冇 |
| `2026-08-manji-claypot-rice` | 冇 |
| `2026-08-panxi-restaurant` | 冇 |
| `2026-08-taizai-boat-noodle` | 冇 |

小越山嗰篇之所以有，係因為嗰輪撞到「¥19.9 vs ¥23.00」先去揭支付紀錄。
其餘四篇嘅金額（¥53.8、約 HK$220、¥30.6、¥88）**憑據等級不明** ——
究竟係睇返單據，定係憑記憶？本 repo 有一條明文規矩係「唔信記憶入面嘅數字」，
但呢四條由外面睇唔出係邊種。

**呢個唔係 sourceNote 缺失問題，係「憑據等級」冇記錄嘅問題。**
建議另開一個欄位（例如 `_evidence: "receipt" | "memory"`），
唔好硬塞入 sourceNote —— 自己俾嘅錢唔算「出處」。

### 5.4 🟡 三個 `principles` 檔嘅聲明只喺檔頭

`brewing-basics`、`reading-menu`、`grinder-guide` 三個檔嘅檔頭都寫得好清楚
（「唔係邊個機構嘅標準」「唔係精確規則」），**但 entry 層一個字都冇**。
19 條 entry 全部靠檔頭一句話撐住，而 W16 又唔掃 `principles`。
任何人（包括將來嘅自己）淨係讀 entry 就會以為佢哋有出處。

---

## 6. 額外檢查

### (i) `volatility: high` 而 `verifiedOn` 距今 >3 個月 —— **0 條**

呢 90 條入面有 **28 條** `high`，**全部 `verifiedOn: 2026-08`，距今 1 個月**，
冇一條超過三個月。分佈：notes 24 條、`border-crossings` 2 條
（`hkbcp.source`、`crossing.specialArrangement`）、`day-trip` 1 條、`trip-tools` 1 條。

⚠️ **但「冇超期」唔等於冇風險。**28 條入面 24 條係食評 —— 佢哋嘅 `verifiedOn`
記錄嘅係**到訪月份**，而唔係「最後覆核月份」。即係話呢個日期永遠唔會更新，
到咗 2026-12 佢哋會一齊變成「4 個月前」然後永遠繼續老落去。
**`high` ＋ 一次性紀錄 ＝ 呢條檢查對食評根本唔適用**，
應該另外諗一個機制（例如食評用 `_snapshot: true` 標明佢係定格，唔參與時效檢查）。

### (ii) 數字類（價錢、時間、班次、匯率）—— **24 條**

> 呢類最危險，因為讀者會照住個數行動，而錯咗睇唔出。

**法定數字（8 條，全部喺 `bring-back.json`，`_status: verified` 但零 sourceNote）**

| key | 入面嘅數 |
|---|---|
| `smoking.alternative` | 罰款 **$50,000**、監禁 **6 個月** |
| `declare.cash` | **HK$120,000** 申報門檻 |
| `duty.tobacco` | **19** 支香煙／**1** 支雪茄／**25** 克 |
| `duty.alcohol` | **1** 升、**30%**、**18** 歲、**24** 小時 |
| `rule.24hour` | **24** 小時 |
| `duty.alcoholLow` | **30%** |
| `duty.ageLimit` | **18** 歲、**16** 歲 |
| `penalty.general` | （刻意冇數字） |

**平台／服務門檻（6 條）**

| 檔 → key | 入面嘅數 |
|---|---|
| `border-crossings → hkbcp.what` | 綠 **<15** 分／黃 **15–30** 分／紅 **>30** 分，每 **15** 分鐘更新 |
| `trip-tools → hkbcp.what` | 同上（重複） |
| `border-crossings → hkbcp.coverage` ／ `trip-tools → hkbcp.coverage` | **8** 個管制站 |
| `border-crossings → hkbcp.alternative` | **8** 個口岸 |
| `trip-tools → apps.mtr.highlight` | 尾班車剩 **30** 分鐘出警示 |

**沖煮參數（5 條，`brewing-basics`）**
`ratio.range` 1:15–1:17／`ratio.start` 1:16（15g:240g）／`temp.range` 88–96°C／
`time.range` 2:30–3:30／`bloom.rule` 兩倍粉重、30–45 秒

**第一手金額同時間（5 條，notes）**
`manji.price.paid` ¥53.8／`panxi.price.paid` 約 HK$220／`sinsumkee.price.paid` ¥30.6／
`taizai.price.paid` ¥88／`fangwenshan.price.set` 原價 ¥54、實付 ¥0
（另有 `manji.queue.door`「十幾分鐘」、`manji.queue.toTable`「約 15 分鐘」——
自認係估算，風險較低）

**自家 app 數字（1 條）**
`trip-tools → apps.parking.highlight`：**51** 條結構化收費、**20** 個商場優惠
—— 第一手，但呢兩個數會隨 app 更新變，而 `verifiedOn` 唔會自動跟。

---

## 7. 最危險嘅五條

排序準則：**數字 ＋ 讀者會照住行動 ＋ 錯咗有法律或金錢後果 ＋ 檔案自稱已核實但講唔出出處**。

| # | 檔 → key | 點解排呢個位 |
|---|---|---|
| 1 | `bring-back → smoking.alternative` | 寫住「最高罰款 5 萬元及監禁 6 個月」。檔標 `verified` 但零出處。讀者會用呢個數衡量「帶唔帶好」，而電子煙係近年執法重點 |
| 2 | `bring-back → declare.cash` | HK$120,000 申報門檻，引咗 Cap 629。門檻數字錯 ＝ 讀者可能無意中漏報 |
| 3 | `bring-back → duty.tobacco` | 「19 支香煙」係一個異常精確嘅數（唔係 20），一支之差就係違法／唔違法。零出處 |
| 4 | `bring-back → duty.alcohol` ＋ `rule.24hour` | 三個條件（1 升／>30%／離港 24 小時）疊埋先成立。即日來回等於零免稅額呢個結論影響好大 |
| 5 | `border-crossings → hkbcp.what` | 15／15–30／30 分鐘燈號門檻 ＋ 每 15 分鐘更新。檔標 `sourced`，靠 `_noSource` 寫「出處就係 hkbcp.url.* 兩條」豁免咗 —— **但帶數字嘅描述唔應該用結構性豁免**，數字會改，URL 唔會告訴你佢改咗 |

---

## 8. 未確定嘅嘢

1. **SCA 嘅實際數字我冇查。**上面講「金杯約 55 g/L ≈ 1:18、水溫約 92–96°C」係我印象，
   **同呢個 repo「唔信記憶入面嘅數字」嘅規矩相衝**，所以我只用佢做「值得懷疑」嘅理由，
   冇用佢做「呢度寫錯咗」嘅結論。要落實 [B] → [A] 或者確認現狀，一定要真係去查 SCA。
2. **`duty.ageLimit` 嗰個「16 歲」我唔確定條文出處。**我寫咗 Cap 60A 一類嘅方向，
   但嬰幼兒配方粉出口管制嘅實際附例編號我冇核過。
3. **「跨境司機不享免稅優惠」（`duty.dutiableList` 後半）我唔知海關有冇明文。**
4. **深圳地鐵線路對應站我用常識判斷「睇落合理」，冇核。**（7 號綫皇崗口岸站、
   2 號綫蓮塘口岸站、4／10 號綫福田口岸站）「睇落合理」唔算核過。
5. **`shop.branches`（芳雯山冇分店）我判斷唔到當時嘅憑據係咩。**
   有可能係平台商戶頁寫住「1 間分店」，亦有可能係推測。
6. **五篇食評嘅金額，我分唔到邊啲有單據。**小越山嗰篇因為上一輪查過所以知，
   其餘四篇要問返編輯本人。
7. **`_noSource` 呢個豁免制度嘅界線本身值得重諗。**「結構性事實／地理常識」
   而家覆蓋咗由「羅湖站係東鐵綫總站」（真常識）到「深圳地鐵 7 號綫皇崗口岸站」
   （會變嘅營運事實）到「口岸通綠燈 <15 分鐘」（帶數字嘅平台規格）——
   三種嘢用同一個理由豁免，界線太闊。但收窄佢會令 W16 由 0 條變幾十條，
   **唔係今輪可以順手做嘅嘢**。
8. **呢份稽核冇檢查 value 嘅正確性。**只檢查「有冇講得出出處」。
   `bring-back` 嗰九條可能全部啱 —— 但冇人可以由 repo 本身睇得出。

---

## 附錄：90 條逐條分類

`_noS` ＝ 有冇 `_noSource` 豁免。

| # | 檔 | key | 類 | volatility | verifiedOn | `_noS` | 一句理由 |
|---:|---|---|:-:|---|---|:-:|---|
| 1 | `guides/border-crossings.json` | `futian.hkLink` | **A** | low | 2026-08 | 有 | 港鐵東鐵綫路綫圖可核（落馬洲站為總站）。 |
| 2 | `guides/border-crossings.json` | `futian.szLink` | **A** | low | 2026-08 | 有 | 深圳地鐵官網可核（4／10 號綫福田口岸站）。 |
| 3 | `guides/border-crossings.json` | `hkbcp.coverage` | **A** | normal | 2026-08 | 有 | 口岸通頁面自己列出嘅管制站清單，可核。 |
| 4 | `guides/border-crossings.json` | `hkbcp.extra` | **A** | normal | 2026-08 | 有 | 口岸通皇巴／金巴欄目，可核。 |
| 5 | `guides/border-crossings.json` | `hkbcp.source` | **A** | high | 2026-08 | 有 | 口岸通頁腳嘅供數部門同下一階段說明，可核。 |
| 6 | `guides/border-crossings.json` | `hkbcp.what` | **A** | normal | 2026-08 | 有 | 燈號門檻同更新頻率係保安局「口岸通」頁上嘅圖例，可核。 |
| 7 | `guides/border-crossings.json` | `huanggang.szLink` | **A** | low | 2026-08 | 有 | 深圳地鐵官網可核（7 號綫皇崗口岸站）。 |
| 8 | `guides/border-crossings.json` | `liantang.szLink` | **A** | low | 2026-08 | 有 | 深圳地鐵官網可核（2 號綫蓮塘口岸站）。 |
| 9 | `guides/border-crossings.json` | `lowu.hkLink` | **A** | low | 2026-08 | 有 | 港鐵東鐵綫路綫圖可核（羅湖站為總站）。 |
| 10 | `guides/border-crossings.json` | `lowu.szLink` | **A** | low | 2026-08 | 有 | 深圳地鐵官網車站查詢可核（1 號綫羅湖站）。 |
| 11 | `guides/bring-back.json` | `declare.cash` | **A** | normal | 2026-08 | 冇 | Cap 629 申報門檻，海關現金申報系統頁有明文。 |
| 12 | `guides/bring-back.json` | `duty.ageLimit` | **A** | normal | 2026-08 | 冇 | 兩個年齡各有法定出處（18 歲：海關；16 歲：配方粉出口管制條文）。 |
| 13 | `guides/bring-back.json` | `duty.alcohol` | **A** | normal | 2026-08 | 冇 | 法定免稅額，海關「旅客免稅優惠」頁有明文。 |
| 14 | `guides/bring-back.json` | `duty.alcoholLow` | **A** | normal | 2026-08 | 冇 | 零稅率界定，海關「應課稅品」頁／Cap 109 稅率表有明文。 |
| 15 | `guides/bring-back.json` | `duty.tobacco` | **A** | normal | 2026-08 | 冇 | 法定免稅額，海關「旅客免稅優惠」頁有明文。 |
| 16 | `guides/bring-back.json` | `rule.24hour` | **A** | normal | 2026-08 | 冇 | 法定條件，海關「旅客免稅優惠」頁有明文。 |
| 17 | `guides/bring-back.json` | `smoking.alternative` | **A** | normal | 2026-08 | 冇 | Cap 371 罰則，控煙酒辦公室另類吸煙產品頁有明文。 |
| 18 | `trips/trip-tools.json` | `hkbcp.coverage` | **A** | normal | 2026-08 | 冇 | 同上。 |
| 19 | `trips/trip-tools.json` | `hkbcp.extra` | **A** | normal | 2026-08 | 冇 | 同上。 |
| 20 | `trips/trip-tools.json` | `hkbcp.what` | **A** | normal | 2026-08 | 冇 | 同 border-crossings 逐字相同，查同一個口岸通頁；但呢邊連 _noSource 都冇。 |
| 21 | `coffee/brewing-basics.json` | `bloom.rule` | **B** | low | 2026-08 | 冇 | 悶蒸水量同秒數屬經驗值，冇機構標準可對。 |
| 22 | `coffee/brewing-basics.json` | `ratio.range` | **B** | low | 2026-08 | 冇 | 數字範圍；同我印象中 SCA 金杯比例對唔上，但唔准憑記憶判斷 —— 要人手查。 |
| 23 | `coffee/brewing-basics.json` | `ratio.start` | **B** | low | 2026-08 | 冇 | 同上，起手比例係通則概括唔係標準。 |
| 24 | `coffee/brewing-basics.json` | `temp.range` | **B** | low | 2026-08 | 冇 | 88–96°C 嘅下限低過我印象中嘅公開標準，要人手查。 |
| 25 | `coffee/brewing-basics.json` | `time.range` | **B** | low | 2026-08 | 冇 | 總時間區間屬經驗值，冇機構標準可對。 |
| 26 | `coffee/grinder-guide.json` | `tier.boutique.traits` | **B** | low | 2026-08 | 冇 | 同上，而且「邊際回報遞減」係編輯判斷混咗入事實描述。 |
| 27 | `coffee/grinder-guide.json` | `tier.entry.traits` | **B** | low | 2026-08 | 冇 | 「入門級多為錐刀」係市場觀察唔係機械原理，而市場會變。 |
| 28 | `coffee/grinder-guide.json` | `tier.high.traits` | **B** | low | 2026-08 | 冇 | 同上。 |
| 29 | `coffee/grinder-guide.json` | `tier.mid.traits` | **B** | low | 2026-08 | 冇 | 同上，價位分層冇任何機構定義。 |
| 30 | `coffee/reading-menu.json` | `altitude.rule` | **B** | low | 2026-08 | 冇 | 呢條同上面七條唔同 —— 佢係一個因果宣稱（海拔→成熟速度→酸質密度），可被證偽。 |
| 31 | `guides/border-crossings.json` | `crossing.specialArrangement` | **B** | high | 2026-08 | 有 | 主體係本站立場，但舉咗兩個具體歷史事實（除夕延長羅湖清關、深圳灣改 24 小時），嗰兩個要核。 |
| 32 | `guides/border-crossings.json` | `hkbcp.alternative` | **B** | normal | 2026-08 | 有 | App 選單路徑只可以喺 app 入面核，冇可引用文件，改版即變。 |
| 33 | `guides/border-crossings.json` | `huanggang.hkLink` | **B** | low | 2026-08 | 有 | 「跨境巴士、過境私家車」冇單一官方清單，路線逐年變。 |
| 34 | `guides/border-crossings.json` | `liantang.hkLink` | **B** | low | 2026-08 | 有 | 「新界東北巴士、私家車」同上。 |
| 35 | `guides/border-crossings.json` | `mankamto.hkLink` | **B** | low | 2026-08 | 有 | 「指定跨境巴士路線」——邊啲路線冇講，亦冇官方清單。 |
| 36 | `guides/border-crossings.json` | `mankamto.szLink` | **B** | low | 2026-08 | 有 | 「無地鐵直達」核得到，「口岸巴士轉乘」核唔到；兩句綁埋。 |
| 37 | `guides/border-crossings.json` | `szbay.hkLink` | **B** | low | 2026-08 | 有 | 「專綫巴士、跨境直通巴」同上，冇可引用嘅權威清單。 |
| 38 | `guides/border-crossings.json` | `szbay.szLink` | **B** | low | 2026-08 | 有 | 「接駁市內交通，往南山、蛇口」太籠統，等於冇資訊，亦無從核。 |
| 39 | `guides/bring-back.json` | `duty.dutiableList` | **B** | normal | 2026-08 | 冇 | 前半（四類應課稅品）查得到，但後半「跨境司機不享免稅」我唔肯定海關有冇明文；兩句綁埋一條，按「唔肯定入 B」處理。 |
| 40 | `notes/2026-08-fangwenshan-yunnan-mixian.json` | `shop.branches` | **B** | high | 2026-08 | 冇 | 唔係第一手觀察 —— 「冇分店」係關於商戶嘅外部事實，而且係難證嘅否定命題，冇寫憑據。 |
| 41 | `coffee/brewing-basics.json` | `adjust.step` | **C** | low | 2026-08 | 冇 | 「一次只改一個變數」係本站教法，唔係外部事實。 |
| 42 | `coffee/brewing-basics.json` | `temp.rule` | **C** | low | 2026-08 | 冇 | 「淺烘用高溫」係操作原則，唔係數值聲明。 |
| 43 | `coffee/espresso-machine.json` | `site.noHandsOn` | **C** | low | 2026-09 | 有 | 講本站自己嘅狀態（冇試過任何機），出處就係作者本人；已有 _noSource。 |
| 44 | `coffee/reading-menu.json` | `process.anaerobic` | **C** | low | 2026-08 | 冇 | 同上。 |
| 45 | `coffee/reading-menu.json` | `process.honey` | **C** | low | 2026-08 | 冇 | 同上。 |
| 46 | `coffee/reading-menu.json` | `process.natural` | **C** | low | 2026-08 | 冇 | 同上。 |
| 47 | `coffee/reading-menu.json` | `process.washed` | **C** | low | 2026-08 | 冇 | 風味方向描述，檔頭明寫「唔係精確規則」。 |
| 48 | `coffee/reading-menu.json` | `roast.dark` | **C** | low | 2026-08 | 冇 | 同上。 |
| 49 | `coffee/reading-menu.json` | `roast.light` | **C** | low | 2026-08 | 冇 | 同上。 |
| 50 | `coffee/reading-menu.json` | `roast.medium` | **C** | low | 2026-08 | 冇 | 同上。 |
| 51 | `guides/border-crossings.json` | `hkbcp.url.inbound` | **C** | low | 2026-08 | 有 | value 本身就係官方 URL。 |
| 52 | `guides/border-crossings.json` | `hkbcp.url.outbound` | **C** | low | 2026-08 | 有 | value 本身就係官方 URL。 |
| 53 | `guides/border-crossings.json` | `huanggangNew.notFutian` | **C** | low | 2026-08 | 有 | 同上，澄清東鐵綫落馬洲站對接福田口岸。 |
| 54 | `guides/border-crossings.json` | `hzmb.direction` | **C** | low | 2026-08 | 有 | 澄清句（呢個唔係深圳方向口岸），防止讀者揀錯，冇數值。 |
| 55 | `guides/bring-back.json` | `penalty.general` | **C** | normal | 2026-08 | 冇 | 刻意唔寫任何數字，內容係「有後果，詳情睇海關官方頁」——本站處理方式聲明，唔係可證偽嘅數值。 |
| 56 | `notes/2026-08-fangwenshan-yunnan-mixian.json` | `meal.disclosure` | **C** | high | 2026-08 | 冇 | 利益披露（平台試單全免），本站自己嘅陳述。 |
| 57 | `notes/2026-08-fangwenshan-yunnan-mixian.json` | `price.set` | **C** | high | 2026-08 | 冇 | 第一手：自己嗰張單（平台試單，實付 ¥0）。 |
| 58 | `notes/2026-08-fangwenshan-yunnan-mixian.json` | `queue.observed` | **C** | high | 2026-08 | 冇 | 第一手觀察，而且本身明寫「冇計時」。 |
| 59 | `notes/2026-08-fangwenshan-yunnan-mixian.json` | `visit.date` | **C** | high | 2026-08 | 冇 | 第一手：自己去嗰日。 |
| 60 | `notes/2026-08-manji-claypot-rice.json` | `order.set` | **C** | high | 2026-08 | 冇 | 第一手：自己叫嘅嘢。 |
| 61 | `notes/2026-08-manji-claypot-rice.json` | `price.paid` | **C** | high | 2026-08 | 冇 | 第一手：自己俾嘅錢（但憑據等級——單據定記憶——冇記錄）。 |
| 62 | `notes/2026-08-manji-claypot-rice.json` | `queue.door` | **C** | high | 2026-08 | 冇 | 第一手觀察（自認係估算：「等咗十幾分鐘」）。 |
| 63 | `notes/2026-08-manji-claypot-rice.json` | `queue.toTable` | **C** | high | 2026-08 | 冇 | 第一手觀察（自認係估算：「約 15 分鐘」）。 |
| 64 | `notes/2026-08-manji-claypot-rice.json` | `visit.date` | **C** | high | 2026-08 | 冇 | 第一手：自己去嗰日。 |
| 65 | `notes/2026-08-panxi-restaurant.json` | `order.items` | **C** | high | 2026-08 | 冇 | 第一手：自己叫嘅嘢。 |
| 66 | `notes/2026-08-panxi-restaurant.json` | `price.paid` | **C** | high | 2026-08 | 冇 | 第一手：自己俾嘅錢（但憑據等級——單據定記憶——冇記錄）。 |
| 67 | `notes/2026-08-panxi-restaurant.json` | `queue.holiday` | **C** | high | 2026-08 | 冇 | 第一手觀察。 |
| 68 | `notes/2026-08-panxi-restaurant.json` | `queue.waitTime` | **C** | high | 2026-08 | 冇 | 第一手觀察，而且本身明寫「冇計時」。 |
| 69 | `notes/2026-08-panxi-restaurant.json` | `visit.date` | **C** | high | 2026-08 | 冇 | 第一手：自己去嗰日。 |
| 70 | `notes/2026-08-sinsumkee-claypot.json` | `order.set` | **C** | high | 2026-08 | 冇 | 第一手：自己叫嘅嘢。 |
| 71 | `notes/2026-08-sinsumkee-claypot.json` | `price.paid` | **C** | high | 2026-08 | 冇 | 第一手：自己俾嘅錢（但憑據等級——單據定記憶——冇記錄）。 |
| 72 | `notes/2026-08-sinsumkee-claypot.json` | `value.rating` | **C** | high | 2026-08 | 冇 | 本站自己落嘅評分，唔係抄返嚟嘅數。 |
| 73 | `notes/2026-08-sinsumkee-claypot.json` | `visit.date` | **C** | high | 2026-08 | 冇 | 第一手：自己去嗰日。 |
| 74 | `notes/2026-08-taizai-boat-noodle.json` | `order.set` | **C** | high | 2026-08 | 冇 | 第一手：自己叫嘅嘢。 |
| 75 | `notes/2026-08-taizai-boat-noodle.json` | `price.paid` | **C** | high | 2026-08 | 冇 | 第一手：自己俾嘅錢（但憑據等級——單據定記憶——冇記錄）。 |
| 76 | `notes/2026-08-taizai-boat-noodle.json` | `visit.date` | **C** | high | 2026-08 | 冇 | 第一手：自己去嗰日。 |
| 77 | `notes/2026-08-xiaoyueshan-laoyoufen.json` | `order.set` | **C** | high | 2026-08 | 冇 | 第一手：自己叫嘅嘢。 |
| 78 | `notes/2026-08-xiaoyueshan-laoyoufen.json` | `value.rating` | **C** | high | 2026-08 | 冇 | 本站自己落嘅評分，唔係抄返嚟嘅數。 |
| 79 | `trips/day-trip.json` | `lastEntry.byPort` | **C** | high | 2026-08 | 有 | 關於「冇官方公布」嘅陳述，後半推理由同檔有出處嘅 ports.hours 推出；已有 _noSource。 |
| 80 | `trips/trip-tools.json` | `apps.coverage` | **C** | low | 2026-08 | 冇 | 講自家 app 嘅資料範圍，第一手。 |
| 81 | `trips/trip-tools.json` | `apps.disclosure` | **C** | low | 2026-08 | 冇 | 利益披露，本站自己嘅身分陳述。 |
| 82 | `trips/trip-tools.json` | `apps.kmb.highlight` | **C** | low | 2026-08 | 冇 | 作者係該 app 開發者，屬第一手（但憑據「由原始碼核實」只寫喺檔頭）。 |
| 83 | `trips/trip-tools.json` | `apps.mtr.highlight` | **C** | low | 2026-08 | 冇 | 同上，第一手。 |
| 84 | `trips/trip-tools.json` | `apps.parking.feature` | **C** | normal | 2026-08 | 冇 | 同上，第一手；提及嘅 data.gov.hk 只係講自己攞邊度嘅數。 |
| 85 | `trips/trip-tools.json` | `apps.parking.highlight` | **C** | low | 2026-08 | 冇 | 同上，第一手；但 51／20 兩個數會隨 app 更新變。 |
| 86 | `trips/trip-tools.json` | `apps.storeLinks.android` | **C** | low | 2026-08 | 冇 | value 本身就係官方商店 URL，而且 E17 已同 apps.json 對數。 |
| 87 | `trips/trip-tools.json` | `apps.weather.highlight` | **C** | low | 2026-08 | 冇 | 同上，第一手。 |
| 88 | `trips/trip-tools.json` | `hkbcp.url.inbound` | **C** | low | 2026-08 | 冇 | value 本身就係官方 URL。 |
| 89 | `trips/trip-tools.json` | `hkbcp.url.outbound` | **C** | low | 2026-08 | 冇 | value 本身就係官方 URL。 |
| 90 | `trips/trip-tools.json` | `return.lastEntry` | **C** | high | 2026-08 | 冇 | 關於「冇官方數」嘅陳述 —— 但同 day-trip.lastEntry.byPort 逐字相同而冇 _noSource。 |
