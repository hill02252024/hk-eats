# guides/bring-back.html 正文寫死數字稽核（2026-09-01）

**呢一輪係診斷，唔係修補。**冇查、冇改、冇填 —— 只列清單。

掃描定義：由 `guides/bring-back.html` 剝走 `<head>`、`<!-- build:jsonld -->`、
`<header>`／`<footer>`、`<svg>`、TOC、麵包屑，**以及所有 `<section class="data-block">`**
（嗰啲係 `data-fresh-key` 佔位符，值由 `data/guides/bring-back.json` 注入，唔算「寫死」），
剩返嘅就係人手寫喺正文同 FAQ 入面嘅字。

## 結果一句講完

| | |
|---|---|
| 含數字嘅正文段落 | **21 段** |
| distinct 數字 token | **18 個** |
| 完全冇對應 data entry 嘅（孤兒數字） | **0 個** |
| **有對應 data entry，但係人手抄多一次喺正文** | **18 個（全部）** |

**冇孤兒數字，反而係更麻煩嗰個結果。**每一個正文數字都係某條 data entry 嘅
**人手複本**，而兩者之間**冇任何守衛對數**。即係話：改咗 data 嘅 value，
正文唔會跟住變，而 build 唔會出聲。呢個正正係 E13（披露文案）同 E17（商店連結）
兩條守衛存在嘅理由 —— 但呢一頁嘅數字冇同等保護。

⚠️ 而呢個唔係假設。2026-09-01 改 `smoking.alternative` 嗰陣，
正文有兩處（正文段落 ＋ FAQ）寫住同一組罰則，**要人手逐處改**；
如果當時漏咗其中一處，出街就會係「資料格寫 50 萬、正文寫 5 萬」。

---

## 逐條清單

`data-fresh-key` 一共 13 條，全部喺頁面出現。下表嘅「對應 entry」係按**語意**判斷，
唔係字串比對。

| # | 數字原文 | 出現位置（節） | 對應 data entry | 備註 |
|---:|---|---|---|---|
| 1 | `24 小時` | lede、`#rule-24h`（h2＋正文）、`#alcohol-line`、`#dutiable`、`#formula`、`#traps`、`#checklist`、FAQ ×3 | `rule.24hour`；喺 `#formula` 嗰兩處係 `formula.powder`（**方向相反嘅另一條 24 小時**） | 全篇出現最密。同一個數字對應**兩條唔同 entry**，語境唔同意思相反 |
| 2 | `30%` | `#alcohol-line`（h2＋正文 ×3）、`#traps`、`#checklist`、FAQ | `duty.alcohol` / `duty.alcoholLow` | 分界線，一個數對兩條 entry（上下界） |
| 3 | `1 升` | `#alcohol-line` ×2、`#traps`、FAQ | `duty.alcohol` | |
| 4 | `0%` | `#alcohol-line`、FAQ | `duty.alcoholLow` | |
| 5 | `18 歲` | `#alcohol-line`、`#formula`、FAQ ×2 | `duty.alcohol` / `duty.ageLimit` | |
| 6 | `16 歲` | `#formula`、FAQ | `duty.ageLimit` / `formula.powder` | |
| 7 | `15 公斤` | `#meat`、FAQ | `permit.meat` | |
| 8 | `第 132AK 章` | `#meat`、FAQ | `permit.meat` | 章號，唔係數量 |
| 9 | `第 207 章` | `#plant` | `permit.plant` | 章號 |
| 10 | `50 萬元` | `#vape` 更正段、FAQ | `smoking.alternative`（進口） | ⚠️ 同一組數字亦出現喺 `formula.powder`（配方粉違例）—— **兩件唔同事撞同一個數** |
| 11 | `2 年` | `#vape` 更正段、FAQ | `smoking.alternative`（進口） | ⚠️ 同上，`formula.powder` 亦係 2 年 |
| 12 | `200 萬元` | `#vape` 更正段、FAQ | `smoking.alternative`（公訴） | |
| 13 | `7 年` | `#vape` 更正段、FAQ | `smoking.alternative`（公訴） | |
| 14 | `5 萬元` | `#vape` 更正段（引述舊值）、`#vape` 管有段 | `smoking.alternative`（超量管有） | ⚠️ 一次係**引述已作廢嘅舊值**、一次係**現行罰則**，同一個數兩種身分；另 `permit.meat` 亦有 5 萬元 |
| 15 | `6 個月` | 同上 | 同上 | ⚠️ 同上 |
| 16 | `3,000 元` | `#vape` 管有段 | `smoking.alternative`（定額罰款） | |
| 17 | `2026 年 4 月 30 日` | `#vape` 管有段、FAQ | `smoking.alternative` | 生效日期，今日已過 |
| 18 | `第 134／137／138 章` | **只喺 data，正文冇抄** | `permit.medicine` | ✅ 反面例子：呢條做啱咗 —— 章號只喺資料格出，正文冇複本 |

### 只喺 data、正文冇複本嘅（做得啱嗰批，列出嚟做對照）

`36 個月`、`1.8 公斤`（`formula.powder`）、`19 支`／`1 支雪茄`／`25 克`（`duty.tobacco`）、
`12 萬元`（`declare.cash`）、`四類應課稅品`（`duty.dutiableList`）。
**呢批一改 data 就即刻全站生效**，係本站原本嘅設計意圖。

---

## 估計嘅官方來源（只係估，冇查）

呢一節純粹係「如果要核，應該去邊」。**本輪冇去查、冇填。**

| 數字 | 估計官方來源 |
|---|---|
| `15 公斤`、`第 132AK 章` | 章號屬《食物業規例》（第 132X 章系列）之下嘅附屬法例 —— 應查**食物環境衞生署／食物安全中心**嘅「進口肉類／家禽」頁；15 公斤自用免許可證嗰句應查**漁農自然護理署**。⚠️ 對應 entry 嘅 sourceNote 自己都寫住「未由主管部門官方頁核實」 |
| `第 207 章` | 《植物（進口管制及病蟲害控制）條例》—— **漁農自然護理署**「植物進口」頁；條文原文喺 elegislation（對 curl 唔通，要人手核） |
| `第 134／137／138 章` | 《危險藥物條例》／《抗生素條例》／《藥劑業及毒藥條例》—— **衞生署藥物辦公室** |
| `50 萬元`、`2 年`（配方粉） | ✅ 呢組今日其實已經喺 **customs.gov.hk 出口管制頁**核到原文（見下面「順帶發現」），但 entry 嘅 sourceNote 未更新 |
| 其餘（`24 小時`／`30%`／`1 升`／`18 歲`／`16 歲`／煙酒罰則／`12 萬`） | 已經喺 2026-09-01 嗰輪核過，出處寫咗喺對應 entry 嘅 sourceNote（香港海關、衞生署控煙酒辦公室） |

---

## 順帶發現（唔喺本輪範圍，冇改）

1. **`formula.powder` 嘅 sourceNote 已經過時。**佢寫住「未由主管部門官方頁核實…
   屬工業貿易署嘅範圍，唔喺頁面上嗰兩條海關連結」。但 2026-09-01 核 `duty.ageLimit`
   嗰陣，**香港海關自己嘅「出口管制」頁就有成段配方粉條文**，
   `36 個月`／`16 歲`／`24 小時`／`1.8 公斤`／`50 萬元`／`2 年` 六個數全部逐字對得上。
   即係話呢條其實核到，只係當時搵錯咗部門。
   URL：`https://www.customs.gov.hk/tc/service-enforcement-information/trade-facilitation/prohibited-articles/controlled-exports/index.html`

2. **`permit.meat` 同 `permit.plant` 嘅 sourceNote 亦寫住「唔喺海關連結」**，
   但海關「出口管制」／「禁運／受管制物品」兩頁都有相關段落，值得再掃一次。

3. **`5 萬元 ＋ 6 個月` 呢一組喺全篇有三種唔同身分**：
   (a) `#vape` 更正段引述**已作廢**嘅舊值；(b) `#vape` 管有段嘅**現行**罰則；
   (c) `permit.meat` 嘅違例罰則。將來如果要做「正文 ↔ data 對數」守衛，
   **淨靠字串比對會撞晒**，一定要按 entry ＋ 語境定位。

4. **W10 而家 firing**（4,343 字 vs pillar 2,824 字，+54%）。
   內容係法律更正同免責，唔會為咗清 warning 而剷。
   要清就要把 pillar 寫闊，或者把呢篇升格做子 pillar —— 兩樣都唔係今輪嘢。
