# W16 覆蓋範圍稽核（實測日 2026-09-02）

**呢一輪係診斷，唔准修。**冇改 W16 本身，冇改任何 data。
量度用嘅係一個臨時改動（暫時把 `_status` 過濾關咗），跑完即刻還原，
並且用 `shasum -a 256` 對過 `scripts/build.mjs` **byte-identical**、`git diff` 空白。

---

## 1. W16 而家掃緊乜

`scripts/build.mjs`：

```js
const W16_SCOPE = new Set(["sourced", "verified"]);
…
if (!W16_SCOPE.has(doc._status)) continue;
```

即係：**一個檔嘅 `_status` 只要唔係 `sourced` 或者 `verified`，成個檔就跳過。**

判斷單位係**檔**，唔係 entry。所以「一個檔入面有幾條係硬數據」呢件事完全唔影響 ——
檔頭寫 `mixed` 就全檔免疫。

---

## 2. 全站 21 個有 `entries` 嘅 data 檔

| 檔 | `_status` | entry | 有 value | 冇 sourceNote | 有 `_noSource` 豁免 | W16 會嘈 | |
|---|---|---:|---:|---:|---:|---:|:-:|
| `guides/border-crossings.json` | sourced | 35 | 35 | 22 | 22 | **0** | ✅ 掃 |
| `guides/bring-back.json` | verified | 13 | 13 | 0 | 0 | **0** | ✅ 掃 |
| `guides/bus-interchange.json` | verified | 15 | 15 | 0 | 0 | **0** | ✅ 掃 |
| `trips/day-trip.json` | verified | 4 | 4 | 1 | 1 | **0** | ✅ 掃 |
| `trips/overnight.json` | verified | 2 | 2 | 0 | 0 | **0** | ✅ 掃 |
| `trips/with-family.json` | verified | 2 | 2 | 0 | 0 | **0** | ✅ 掃 |
| `trips/trip-tools.json` | mixed | 15 | 15 | 14 | 0 | **14** | ❌ 略過 |
| `coffee/reading-menu.json` | principles | 12 | 8 | 8 | 0 | **8** | ❌ 略過 |
| `coffee/brewing-basics.json` | principles | 8 | 8 | 7 | 0 | **7** | ❌ 略過 |
| `notes/2026-08-fangwenshan-yunnan-mixian.json` | mixed | 12 | 12 | 5 | 0 | **5** | ❌ 略過 |
| `notes/2026-08-manji-claypot-rice.json` | mixed | 11 | 11 | 5 | 0 | **5** | ❌ 略過 |
| `notes/2026-08-panxi-restaurant.json` | mixed | 10 | 10 | 5 | 0 | **5** | ❌ 略過 |
| `notes/2026-08-sinsumkee-claypot.json` | mixed | 13 | 13 | 4 | 0 | **4** | ❌ 略過 |
| `coffee/grinder-guide.json` | principles | 4 | 4 | 4 | 0 | **4** | ❌ 略過 |
| `notes/2026-08-taizai-boat-noodle.json` | mixed | 10 | 10 | 3 | 0 | **3** | ❌ 略過 |
| `notes/2026-08-xiaoyueshan-laoyoufen.json` | mixed | 14 | 14 | 2 | 0 | **2** | ❌ 略過 |
| `coffee/espresso-machine.json` | mixed | 7 | 7 | 1 | 1 | **0** | ❌ 略過 |
| `areas/hk-coffee-map.json` | mixed | 6 | 2 | 0 | 0 | **0** | ❌ 略過 |
| `areas/shenzhen-malls.json` | unverified | 9 | 0 | 0 | 0 | **0** | ❌ 略過 |
| `areas/sz-coffee-map.json` | unverified | 9 | 0 | 0 | 0 | **0** | ❌ 略過 |
| `guides/payment-setup.json` | unverified | 9 | 0 | 0 | 0 | **0** | ❌ 略過 |

按 `_status` 歸類：

| `_status` | 檔數 | 掃唔掃 | 如果掃，會嘈幾多條 |
|---|---:|:-:|---:|
| `sourced` | 1 | ✅ | 0 |
| `verified` | 5 | ✅ | 0 |
| **`mixed`** | **9** | ❌ | **38** |
| **`principles`** | **3** | ❌ | **19** |
| `unverified` | 3 | ❌ | 0（三個檔全部係 `needsVerify`，冇 value） |

---

## 3. 🔴 實測：如果 W16 擴大到全掃

臨時把 `if (!W16_SCOPE.has(doc._status)) continue;` 關咗，跑同一個 build：

| | W16 條數 | 全站 warning |
|---|---:|---:|
| **現行**（只掃 `sourced｜verified`） | **0** | **41** |
| **擴大到全掃** | **57** | **98** |
| 差 | **＋57** | **＋57** |

即係話：**W16 而家報 0 條，唔係因為全站都有出處，係因為佢冇睇 57 條。**
`sourced` 同 `verified` 六個檔已經清乾淨（`border-crossings` 22 條同 `day-trip` 1 條
用 `_noSource` 明文豁免，`bring-back` 13 條全部有 sourceNote），
所以現行範圍內真係 0 —— 但範圍本身只覆蓋咗全站有 value 嘅 entry 嘅一部分。

### 57 條嘅來源集中喺三處

- **`trips/trip-tools.json` 一個檔就佔 14 條**（最大單一來源）
- **三個 `principles` 檔合共 19 條**（`reading-menu` 8、`brewing-basics` 7、`grinder-guide` 4）
- **六篇 notes 合共 24 條**（食評嘅第一手紀錄）

### 更正上一輪一個數

2026-09-01 嗰份 `sourcenote-audit` 寫「W16 覆蓋唔到 **59** 條」。
正確係 **58**（90 條有 value 冇 sourceNote，減去 `sourced｜verified` 三個檔嘅 32 條）；
再減走 `espresso-machine → site.noHandsOn` 嗰條有 `_noSource` 豁免，
**W16 真正會新增嘅係 57 條**。上一輪嗰個 59 係加錯數。

---

## 4. 擴大之前要諗清楚嘅嘢（唔係建議，係阻礙清單）

呢一節只係記低「點解唔可以一鍵擴大」，**唔係提議下一步**。

1. **57 條入面有 24 條係食評嘅第一手紀錄**（自己去嗰日、自己叫嘅嘢、自己俾嘅錢、
   自己落嘅評分）。呢啲根本冇「外部出處」可言 —— 硬要 W16 掃佢哋，
   正確嘅收尾唔係補 sourceNote，係逐條加 `_noSource`。
   即係話擴大 W16 = 手寫 24 條豁免理由，而唔係做 24 次查證。
2. **19 條 `principles` 同樣情況**：三個檔嘅檔頭都明文寫住「唔係邊個機構嘅標準」
   「唔係精確規則」。聲明存在，只係喺檔頭唔喺 entry。
3. **`trip-tools` 嗰 14 條入面，大部分係第一手**（作者本人就係嗰四個 app 嘅開發者），
   但檔頭嘅「由 app 原始碼核實」同樣只寫喺檔頭。
4. 換句話講：**擴大 W16 之後，57 條入面大概只有極少數會真係去查出處，
   其餘全部會變成寫 `_noSource`。**呢個未必冇價值（聲明由檔頭落到 entry，
   grep 得返、機器守得住），但佢係一個「寫 57 段理由」嘅工作，
   唔係一個「補 57 個出處」嘅工作。要唔要做，係內容決定，唔係守衛決定。

---

## 5. 量度手法（可覆核）

```sh
cp scripts/build.mjs $BAK
shasum -a 256 scripts/build.mjs            # 9abc503b…4fd3c6
node scripts/build.mjs | grep -c '^WARNING W16'          # 0
# 臨時：if (false && !W16_SCOPE.has(doc._status)) continue;
node scripts/build.mjs | grep -c '^WARNING W16'          # 57
cp $BAK scripts/build.mjs
shasum -a 256 scripts/build.mjs            # 9abc503b…4fd3c6  ← 一模一樣
git diff --stat scripts/build.mjs          # 空白
```

臨時改動**冇 commit**，`git diff` 對過係空白。
