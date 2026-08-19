/* hk_eats — freshness.js
 *
 * 常青殼 / 易耗芯分離機制的執行端。
 *
 * 用法（HTML 側）：
 *   <section class="data-block" data-fresh="border-crossings">
 *     <span data-fresh-key="lowu.serviceHours"></span>
 *     <ul data-fresh-key="lowu.transitLines"></ul>
 *   </section>
 *
 * data-fresh 的值 = /data/ 下同名 JSON 檔（唔洗寫 .json）。
 * JSON 格式：
 *   {
 *     "title": "…",              // 可選，只作人手閱讀
 *     "entries": {
 *       "lowu.serviceHours": { "value": "06:30–24:00", "verifiedOn": "2026-08" }
 *     }
 *   }
 *
 * 每個 entry 必須有 value 同 verifiedOn（"YYYY-MM"）。
 * 區塊的核實月份 = 該區塊實際用到的所有 entry 之中最舊的 verifiedOn。
 * 距今超過 6 個月 → 加 .is-stale 同一段顯眼提示。
 */

(function () {
  "use strict";

  var STALE_AFTER_MONTHS = 6;

  /* ---- 找出 /data/ 的位置：由本 script 自己的 URL 推，唔靠絕對路徑，
         咁樣 GitHub Pages 放喺 repo 子路徑一樣行得 ---- */
  var selfSrc = (document.currentScript && document.currentScript.src) || (function () {
    var all = document.getElementsByTagName("script");
    for (var i = all.length - 1; i >= 0; i--) {
      if (/freshness\.js(\?|$)/.test(all[i].src)) return all[i].src;
    }
    return "";
  })();
  var DATA_BASE = selfSrc.replace(/js\/freshness\.js(\?.*)?$/, "data/");

  /* ---- 月份計算 ---- */

  // "2026-08" -> { y: 2026, m: 8 }；格式唔啱就回 null
  function parseYearMonth(s) {
    var m = /^(\d{4})-(\d{2})$/.exec(String(s || "").trim());
    if (!m) return null;
    var year = parseInt(m[1], 10);
    var month = parseInt(m[2], 10);
    if (month < 1 || month > 12) return null;
    return { y: year, m: month };
  }

  // 純粹用曆月相減，唔用毫秒差，避免「大小月」同時區影響。
  // 2026-02 對 2026-08 = 6，仍然算新鮮；7 先算過時。
  function monthsSince(ym, now) {
    return (now.getFullYear() - ym.y) * 12 + (now.getMonth() + 1 - ym.m);
  }

  function isStale(ym, now) {
    return monthsSince(ym, now) > STALE_AFTER_MONTHS;
  }

  /* ---- 填值 ---- */

  function fillElement(el, value) {
    if (Array.isArray(value)) {
      if (el.tagName === "UL" || el.tagName === "OL") {
        el.textContent = "";
        value.forEach(function (item) {
          var li = document.createElement("li");
          li.textContent = String(item);
          el.appendChild(li);
        });
      } else {
        el.textContent = value.join("、");
      }
    } else {
      el.textContent = String(value);
    }
    el.removeAttribute("aria-busy");
  }

  /* ---- 註腳 ---- */

  function renderFooter(block, oldest, now, missingKeys) {
    var foot = document.createElement("p");
    foot.className = "freshness";

    var label = document.createElement("span");
    label.className = "verified";
    label.textContent = oldest
      ? "資料核實於 " + oldest.raw
      : "資料核實日期不詳";
    foot.appendChild(label);

    if (missingKeys.length) {
      var miss = document.createElement("span");
      miss.className = "missing";
      miss.textContent = "（" + missingKeys.length + " 項資料未載入）";
      foot.appendChild(miss);
      block.classList.add("is-error");
    }

    if (oldest && isStale(oldest, now)) {
      block.classList.add("is-stale");
      var warn = document.createElement("strong");
      warn.className = "freshness-warning";
      warn.setAttribute("role", "note");
      warn.textContent =
        "⚠ 此部分資料可能已過時 — 最後核實已經係 " +
        monthsSince(oldest, now) + " 個月前（" + oldest.raw + "），出發前請自行覆核。";
      foot.appendChild(warn);
    }

    block.appendChild(foot);
  }

  function fail(block, message) {
    block.classList.add("is-error");
    var foot = document.createElement("p");
    foot.className = "freshness";
    foot.textContent = "資料載入失敗：" + message;
    block.appendChild(foot);
  }

  /* ---- 主流程 ---- */

  function hydrate(name, blocks, now) {
    return fetch(DATA_BASE + name + ".json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (doc) {
        var entries = (doc && doc.entries) || {};
        blocks.forEach(function (block) {
          var targets = block.querySelectorAll("[data-fresh-key]");
          var oldest = null;
          var missing = [];

          Array.prototype.forEach.call(targets, function (el) {
            var key = el.getAttribute("data-fresh-key");
            var entry = entries[key];
            if (!entry || typeof entry.value === "undefined") {
              missing.push(key);
              el.textContent = "—";
              return;
            }
            fillElement(el, entry.value);
            var ym = parseYearMonth(entry.verifiedOn);
            if (!ym) { missing.push(key); return; }
            ym.raw = entry.verifiedOn;
            if (!oldest || monthsSince(ym, now) > monthsSince(oldest, now)) oldest = ym;
          });

          renderFooter(block, oldest, now, missing);
          block.setAttribute("data-fresh-state", "ready");
        });
      })
      .catch(function (err) {
        blocks.forEach(function (block) {
          fail(block, err.message);
          block.setAttribute("data-fresh-state", "error");
        });
      });
  }

  function run() {
    var all = document.querySelectorAll("[data-fresh]");
    if (!all.length) return;

    var now = new Date();
    var byFile = {};
    Array.prototype.forEach.call(all, function (block) {
      var name = block.getAttribute("data-fresh");
      (byFile[name] = byFile[name] || []).push(block);
    });

    Object.keys(byFile).forEach(function (name) {
      hydrate(name, byFile[name], now);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // 畀 build script 以外的工具（或者將來的測試）用
  window.hkEatsFreshness = {
    parseYearMonth: parseYearMonth,
    monthsSince: monthsSince,
    isStale: isStale,
    STALE_AFTER_MONTHS: STALE_AFTER_MONTHS
  };
})();
