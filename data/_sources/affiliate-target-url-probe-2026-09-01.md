# 聯盟落地頁 URL 探測紀錄（2026-09-01）

目的：接通聯盟之前，先確認每個夥伴嘅**落地頁**係一個穩定嘅分類頁，
唔係單一產品頁（單一產品下架就 404，而本站冇偵測機制）。
站規：**確認 HTTP 200 先寫入 data/affiliates.json。**

方法：`curl -s -o /dev/null -w '%{http_code}'`，UA 用 Chrome 128 桌面字串，
`--max-time 25`。403 同 404 分開睇 —— 呢三個站都分得出兩者，
所以 403 = 對方擋 client，404 = 條路徑真係唔存在。

## Klook（www.klook.com）

| URL | code | 結論 |
|---|---|---|
| `/zh-HK/esim/` | **200** | ✅ 寫入。標題「5G eSIM、旅遊SIM卡及隨身WiFi \| 50多個國家 \| Klook」，分類頁、有分頁 1–25 |
| `/zh-HK/transport/` | **200**（連續 3 次） | ✅ 寫入。標題「預訂全球鐵路＆巴士車票」 |
| `/zh-HK/attractions/` | **200** | ✅ 寫入。標題「⋯必玩景點門票⋯ - Klook」 |
| `/zh-HK/activity/` | **403**（連續 3 次） | ❌ 舊值，已換走 —— 見下 |
| `/zh-HK/city/34-shenzhen-things-to-do/` | 403 | 唔用 |
| `/zh-HK/city/2-hong-kong-things-to-do/` | 403 | 唔用 |
| `/zh-HK/wifi-sim-card/` | 403 | 唔用 |
| `/zh-HK/experiences/` | 403 | 唔用 |
| `/zh-HK/experiences/list/wifi-sim-card/` | 403 | 唔用 |
| `/zh-HK/china-esim/` | 404 | 唔存在 |
| `/zh-HK/list/wifi-sim-card/` | 404 | 唔存在 |
| `/zh-HK/sim-card/`、`/zh-HK/wifi-sim/`、`/zh-HK/data-sim/` | 404 | 唔存在 |
| `/zh-HK/tours/`、`/zh-HK/things-to-do/` | 404 | 唔存在 |
| `/robots.txt` | 200 | — |

🔴 **舊值失效**：`klook-china-esim` 原本指住 `/zh-HK/activity/`，
`verifiedOn: 2026-08`。今日連續三次探測都係 **403**，而**同一分鐘**
`/zh-HK/transport/` 三次都 200 —— 所以唔係隨機封 bot，係嗰條路徑本身
對外唔通。已換成 `/zh-HK/esim/`（而且語意上更貼「內地上網數據卡／eSIM」）。

**呢件事本身就係論據**：一條標住「核實過」嘅外部連結，半個月後就靜靜咁
壞咗，而本站冇任何機制知道。W17 就係為咗呢件事加嘅。

## Trip.com（hk.trip.com）

| URL | code | 結論 |
|---|---|---|
| `/hotels/shenzhen-hotels-list-30/` | **200** | ✅ 寫入。標題「深圳酒店推介：精選 10 間高性價比酒店（每晚低至 HK$175）\| Trip.com」 |
| `/hotels/guangzhou-hotels-list-32/` | **200** | ✅ 寫入。城市列表頁 |
| `/hotels/` | 200 | 通，但太闊（唔綁城市），冇寫入 |
| `/travel-guide/destination/shenzhen-30/` | 200 | 通，但係內容頁唔係訂房頁，冇寫入 |
| `/hotels/list?city=30` | 200 | 通，但係 query 形式、易改，冇寫入 |
| `/hotels/shenzhen-hotels-list-30`（冇尾斜線） | **404** | ⚠️ 尾斜線唔可以拆 |
| `/hotels/shenzhen-hotels/` | 404 | 唔存在 |
| `/hotels/hongkong-hotels-list-38/`、`/hotels/hong-kong-hotel-list-38/` | 404 | 香港嗰條 slug 未撞中，暫時唔寫 |
| `/robots.txt` | 200 | — |

## KKday（www.kkday.com）

| URL | code |
|---|---|
| `/zh-hk/` | **403** |
| `/robots.txt` | **403** |
| `/zh-hk/product/productlist` | 403 |
| `/zh-hk/product/productlist?keyword=深圳` | 403 |
| `/zh-hk/city/` | 403 |
| `/zh-hk/city/shenzhen` | 403 |

兩個唔同 client 都試過：`curl`（Chrome UA ＋ Accept／Accept-Language／
Sec-Fetch-* 全套 header）同 WebFetch，全部 403。**連 `/robots.txt` 都 403**，
即係 kkday 對非瀏覽器一律擋，唔係某條路徑唔存在。

🔴 **結論：本站確認唔到任何一條 kkday URL 係 200，所以一條都唔寫。**
`partners.kkday` 照登記（名、scope、rel、target），但 `links` 入面
零條 kkday entry，並且用 `_pendingUrl` 明寫點解 —— E23 會強制呢個欄位存在，
唔准一個「有 partner、冇連結、又冇解釋」嘅狀態靜靜咁擺喺度。

要寫入嘅話，下一步係喺真瀏覽器開一次目標頁、抄實條 URL、再喺呢度補返
一次紀錄（可以接受「人手喺瀏覽器核實」，但要寫明係人手核，唔可以扮 curl 核過）。

---

## Klook aid=133428 上線後驗證（2026-09-01）

`aid` 由帳戶持有人喺 Klook 後台抄返，帳戶級。組裝後逐條 curl：

| 組裝後嘅 URL | 第一跳 | 跟到底 |
|---|---|---|
| `www.klook.com/zh-HK/esim/?aid=133428` | **302** | 200（1 跳） |
| `www.klook.com/zh-HK/transport/?aid=133428` | **302** | 200（1 跳） |
| `www.klook.com/zh-HK/attractions/?aid=133428` | **302** | 200（1 跳） |

⚠️ **302 唔係壞咗，反而係最好嗰個證據。**同一條 URL 唔加 `aid` 係直接 200，
加咗 `aid` 之後 Klook 自己 302 去：

```
…/zh-HK/esim/?aid=133428&utm_medium=affiliate-alwayson&utm_source=non-network&utm_campaign=133428&utm_term=
```

`utm_campaign` 嗰度出現返 `133428`，`utm_medium=affiliate-alwayson` ——
即係 **Klook 嗰邊真係認得呢個 aid，而且行緊聯盟歸因流程**。
如果 aid 係無效嘅，佢唔會做呢一跳。

（順帶：呢啲 `utm_*` 係 Klook 自己加落自己個網址度嘅，唔關本站事。
本站寫入 `affiliates.json` 嘅 URL 由頭到尾冇 `utm_*` —— E23 亦唔准有。）
