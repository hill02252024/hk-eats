/* hk_eats — js/ads.js
 *
 * 廣告位「預留」邏輯。本檔唔載入任何廣告網絡：
 * 冇 adsbygoogle.js、冇 <script> 注入、冇 publisher ID。
 * 全部 slot 而家 enabled: false，本檔只做三件事：
 *   1. 由 data/ad-slots.json 讀 slot 定義，標記狀態到 DOM
 *   2. 本機開發時，喺容器畫一個淡色虛線框（生產環境純空白佔位）
 *   3. 將來開通時，唯一要改嘅係 ad-slots.json 同下面 loadNetwork()
 *
 * 版面高度由 css/main.css 用 min-height 硬預留，同 enabled 狀態無關，
 * 亦同本檔有冇成功載入無關 —— 就算 fetch 失敗，位仍然留住。
 * 本檔絕對唔准修改容器嘅 width / height / min-height / padding / margin /
 * display，否則 CLS 預留就會失效。
 */

(function () {
  "use strict";

  var selfSrc = (document.currentScript && document.currentScript.src) || (function () {
    var all = document.getElementsByTagName("script");
    for (var i = all.length - 1; i >= 0; i--) {
      if (/ads\.js(\?|$)/.test(all[i].src)) return all[i].src;
    }
    return "";
  })();
  var DATA_URL = selfSrc.replace(/js\/ads\.js(\?.*)?$/, "data/ad-slots.json");

  function isLocal() {
    var h = location.hostname;
    return (
      location.protocol === "file:" ||
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "::1" ||
      h === "0.0.0.0" ||
      /\.local$/.test(h) ||
      /^192\.168\./.test(h) ||
      /^10\./.test(h)
    );
  }

  /* 將來真係要開通廣告時，只有呢個 function 需要加嘢。
     而家佢刻意咩都唔做 —— 站內冇任何廣告網絡代碼。 */
  function loadNetwork(/* slot, publisher */) {
    return false;
  }

  function apply(doc) {
    var slots = {};
    ((doc && doc.slots) || []).forEach(function (s) { slots[s.id] = s; });
    var publisher = (doc && doc.publisher) || null;
    var local = isLocal();

    var nodes = document.querySelectorAll("[data-ad-slot]");
    Array.prototype.forEach.call(nodes, function (el) {
      var id = el.getAttribute("data-ad-slot");
      var slot = slots[id];

      if (!slot) {
        el.setAttribute("data-ad-state", "unknown-slot");
        if (local) el.classList.add("is-dev-placeholder");
        return;
      }

      el.setAttribute("data-ad-format", slot.format || "");
      el.setAttribute("aria-hidden", "true");

      if (!slot.enabled) {
        el.setAttribute("data-ad-state", "reserved");
        // 只加 class；虛線框同「廣告位」字樣全部喺 CSS 做，
        // 而且用 ::after 絕對定位，唔會影響容器高度。
        if (local) el.classList.add("is-dev-placeholder");
        return;
      }

      if (!publisher) {
        el.setAttribute("data-ad-state", "no-publisher");
        if (local) el.classList.add("is-dev-placeholder");
        return;
      }

      el.setAttribute("data-ad-state", loadNetwork(slot, publisher) ? "loaded" : "no-network-impl");
    });
  }

  function run() {
    if (!document.querySelector("[data-ad-slot]")) return;
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(apply)
      .catch(function () {
        // fetch 失敗都唔好郁版面：位照留，只標狀態。
        var nodes = document.querySelectorAll("[data-ad-slot]");
        Array.prototype.forEach.call(nodes, function (el) {
          el.setAttribute("data-ad-state", "error");
          el.setAttribute("aria-hidden", "true");
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
