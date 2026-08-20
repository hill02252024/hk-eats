/* hk_eats — freshness.js
 *
 * 常青殼 / 易耗芯分離機制的執行端。
 *
 * 用法（HTML 側）：
 *   <section class="data-block" data-fresh="guides/border-crossings">
 *     <span data-fresh-key="lowu.hours"></span>
 *     <ul data-fresh-key="risk.warnings"></ul>
 *   </section>
 *
 * data-fresh 的值 = /data/ 之下的相對路徑（<section>/<name>，唔洗寫 .json）。
 * 加咗 section 一層之後，guides/x.html 同 coffee/x.html 唔會再搶同一個資料檔。
 *
 * JSON 格式：
 *   {
 *     "entries": {
 *       "lowu.hours": {
 *         "value": "06:30–24:00",          // 必需；字串／數字／陣列
 *         "verifiedOn": "2026-08",          // 必需；YYYY-MM
 *         "volatility": "low"|"normal"|"high",   // 可選，預設 normal
 *         "volatileNote": "…",              // volatility=high 時的橫幅文案
 *         "needsVerify": "…"                // 未核實：呢個 entry 有 needsVerify
 *                                           // 就唔要 value / verifiedOn，
 *                                           // 頁面會出 {{NEEDS_VERIFY: …}} 標記
 *       }
 *     }
 *   }
 *
 * volatility 三檔，決定「幾耐之後算舊」：
 *   low     12 個曆月   結構性資料（地理位置、接駁路線、機械原理）
 *   normal   6 個曆月   預設（服務時間、費率、限額）
 *   high     永不「過期」，但永遠掛「正在變動中」橫幅（未定案的政策）
 *
 * 兩種提示係兩件唔同嘅事，用兩套獨立 class，唔共用：
 *   .stale-warning   / .data-block.is-stale     資料舊咗 —— 可能已經唔啱
 *   .volatile-banner / .data-block.is-volatile  資料啱，但快變 —— 隨時要重查
 * 一個區塊可以同時中兩樣。
 */

(function () {
  "use strict";

  // volatility → 幾多個曆月之後算過期。high 用 Infinity：永遠唔會「舊」。
  var THRESHOLDS = { low: 12, normal: 6, high: Infinity };
  var DEFAULT_VOLATILITY = "normal";

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
  function monthsSince(ym, now) {
    return (now.getFullYear() - ym.y) * 12 + (now.getMonth() + 1 - ym.m);
  }

  function normalizeVolatility(v) {
    var key = String(v || DEFAULT_VOLATILITY).toLowerCase();
    return Object.prototype.hasOwnProperty.call(THRESHOLDS, key) ? key : DEFAULT_VOLATILITY;
  }

  function thresholdFor(volatility) {
    return THRESHOLDS[normalizeVolatility(volatility)];
  }

  // 超過門檻先算過期；啱好等於門檻仍然算新鮮。
  function isStale(ym, now, volatility) {
    if (!ym) return false;
    return monthsSince(ym, now) > thresholdFor(volatility);
  }

  function isVolatile(volatility) {
    return normalizeVolatility(volatility) === "high";
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

  /* ---- 未核實標記：寧願留白，唔好作 ---- */

  function fillNeedsVerify(el, description) {
    el.textContent = "";
    var mark = document.createElement("span");
    mark.className = "needs-verify";
    mark.setAttribute("role", "note");
    mark.textContent = "{{NEEDS_VERIFY: " + description + "}}";
    el.appendChild(mark);
    el.setAttribute("data-verify-state", "pending");
    el.removeAttribute("aria-busy");
  }

  /* ---- 「正在變動中」橫幅：放喺區塊最頂 ---- */

  function renderVolatileBanner(block, notes) {
    var banner = document.createElement("aside");
    banner.className = "volatile-banner";
    banner.setAttribute("role", "note");

    var head = document.createElement("strong");
    head.className = "volatile-banner-title";
    head.textContent = "此部分正在變動中";
    banner.appendChild(head);

    notes.forEach(function (text) {
      var p = document.createElement("p");
      p.className = "volatile-banner-note";
      p.textContent = text;
      banner.appendChild(p);
    });

    block.insertBefore(banner, block.firstChild);
  }

  /* ---- 註腳：核實月份 + 「可能已過時」警告 ---- */

  function renderFooter(block, oldest, worst, now, missingKeys, unverifiedKeys) {
    var foot = document.createElement("p");
    foot.className = "freshness";

    var label = document.createElement("span");
    label.className = "verified";
    label.textContent = oldest ? "資料核實於 " + oldest.raw : "資料核實日期不詳";
    foot.appendChild(label);

    if (unverifiedKeys && unverifiedKeys.length) {
      var uv = document.createElement("span");
      uv.className = "unverified-note";
      uv.textContent = "（" + unverifiedKeys.length + " 項待核實，未填數值）";
      foot.appendChild(uv);
    }

    if (missingKeys.length) {
      var miss = document.createElement("span");
      miss.className = "missing";
      miss.textContent = "（" + missingKeys.length + " 項資料未載入）";
      foot.appendChild(miss);
      block.classList.add("is-error");
    }

    if (worst) {
      block.classList.add("is-stale");
      var warn = document.createElement("strong");
      warn.className = "stale-warning";
      warn.setAttribute("role", "note");
      warn.textContent =
        "⚠ 此部分資料可能已過時 —— 最後核實已經係 " + worst.months + " 個月前（" +
        worst.raw + "），已超過「" + worst.volatility + "」類資料嘅 " +
        worst.threshold + " 個月覆核週期，出發前請自行覆核。";
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

  function hydrateBlock(block, entries, now) {
    var targets = block.querySelectorAll("[data-fresh-key]");
    var oldest = null;      // 用嚟顯示「資料核實於」
    var worst = null;       // 超出各自門檻最多嗰項
    var notes = [];         // high 類嘅 volatileNote，去重
    var missing = [];
    var unverified = [];    // 有 needsVerify 嘅 key

    Array.prototype.forEach.call(targets, function (el) {
      var key = el.getAttribute("data-fresh-key");
      var entry = entries[key];

      // volatility 要喺 needsVerify 之前處理：一個「未核實 + 高變動」嘅項目
      // 兩件事都要講 —— 待核實講「而家仲未有數」，變動中橫幅講「就算有咗
      // 都會好快變」。之前呢度早退，令 volatileNote 靜靜咁被丟棄。
      var volatility = normalizeVolatility(entry && entry.volatility);
      if (entry) {
        el.setAttribute("data-volatility", volatility);
        if (isVolatile(volatility)) {
          var note = entry.volatileNote || "呢項資料標記為正在變動中，請以官方最新公布為準。";
          if (notes.indexOf(note) === -1) notes.push(note);
        }
      }

      if (entry && entry.needsVerify) {
        // 未核實：唔當佢係缺失，亦唔計入核實月份 —— 佢係一個明示嘅空位。
        fillNeedsVerify(el, entry.needsVerify);
        unverified.push(key);
        return;
      }
      if (!entry || typeof entry.value === "undefined" || entry.value === null) {
        missing.push(key);
        el.textContent = "—";
        return;
      }
      fillElement(el, entry.value);

      var ym = parseYearMonth(entry.verifiedOn);
      if (!ym) { missing.push(key); return; }
      ym.raw = entry.verifiedOn;

      if (!oldest || monthsSince(ym, now) > monthsSince(oldest, now)) oldest = ym;

      if (isStale(ym, now, volatility)) {
        var months = monthsSince(ym, now);
        var threshold = thresholdFor(volatility);
        var over = months - threshold;
        if (!worst || over > worst.over) {
          worst = {
            raw: ym.raw, months: months, threshold: threshold,
            volatility: volatility, over: over
          };
        }
      }
    });

    if (notes.length) {
      block.classList.add("is-volatile");
      renderVolatileBanner(block, notes);
    }
    if (unverified.length) {
      block.classList.add("is-unverified");
      block.setAttribute("data-unverified-count", String(unverified.length));
    }
    renderFooter(block, oldest, worst, now, missing, unverified);
    block.setAttribute("data-fresh-state", "ready");
  }

  function hydrate(name, blocks, now) {
    return fetch(DATA_BASE + name + ".json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (doc) {
        var entries = (doc && doc.entries) || {};
        blocks.forEach(function (block) { hydrateBlock(block, entries, now); });
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

  // 畀測試用（scripts/test-freshness.mjs 經 node:vm 載入本檔真身）
  window.hkEatsFreshness = {
    parseYearMonth: parseYearMonth,
    monthsSince: monthsSince,
    normalizeVolatility: normalizeVolatility,
    thresholdFor: thresholdFor,
    isStale: isStale,
    isVolatile: isVolatile,
    THRESHOLDS: THRESHOLDS,
    DEFAULT_VOLATILITY: DEFAULT_VOLATILITY
  };
})();
