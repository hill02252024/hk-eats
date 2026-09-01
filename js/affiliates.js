/* hk_eats — affiliates.js
 *
 * 全站 affiliate 連結由 /data/affiliates.json 單一來源注入。
 * 頁面只寫 key，唔准寫任何 affiliate URL 或 tracking 參數
 * （scripts/build.mjs 會掃 HTML，發現硬編碼就 exit 1）。
 *
 * 用法（HTML 側）：
 *   <a data-aff="klook-china-esim">內地上網數據卡／eSIM</a>
 *
 * JSON 格式：
 *   {
 *     "partners": {
 *       "klook": {
 *         "name": "Klook",
 *         "params": { "aid": "…", "aff_adid": "…" },   // 全 partner 共用
 *         "rel": "sponsored nofollow noopener",
 *         "target": "_blank"
 *       }
 *     },
 *     "links": {
 *       "klook-china-esim": {
 *         "partner": "klook",
 *         "url": "https://…",            // 未帶 tracking 的落地頁
 *         "params": { "spm": "…" },      // 該連結專用，覆寫 partner 同名參數
 *         "label": "內地上網數據卡／eSIM", // 可選：元素本身冇字先會填
 *         "verifiedOn": "2026-08"
 *       }
 *     }
 *   }
 *
 * 找唔到 key 或者載入失敗：該 <a> 保持冇 href（CSS 會令佢變成普通灰字），
 * 唔會變成死連結，亦唔會靜靜地跳去錯嘅地方。
 */

(function () {
  "use strict";

  var selfSrc = (document.currentScript && document.currentScript.src) || (function () {
    var all = document.getElementsByTagName("script");
    for (var i = all.length - 1; i >= 0; i--) {
      if (/affiliates\.js(\?|$)/.test(all[i].src)) return all[i].src;
    }
    return "";
  })();
  var DATA_URL = selfSrc.replace(/js\/affiliates\.js(\?.*)?$/, "data/affiliates.json");

  function buildUrl(link, partner) {
    var url;
    try {
      url = new URL(link.url);
    } catch (e) {
      return null;
    }
    var params = {};
    if (partner && partner.params) {
      Object.keys(partner.params).forEach(function (k) { params[k] = partner.params[k]; });
    }
    if (link.params) {
      Object.keys(link.params).forEach(function (k) { params[k] = link.params[k]; });
    }
    Object.keys(params).forEach(function (k) {
      if (params[k] === null || params[k] === "") return;
      url.searchParams.set(k, params[k]);
    });
    return url.toString();
  }

  function apply(doc) {
    var links = (doc && doc.links) || {};
    var partners = (doc && doc.partners) || {};
    var nodes = document.querySelectorAll("[data-aff]");

    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute("data-aff");
      var link = links[key];
      if (!link) {
        el.setAttribute("data-aff-state", "missing");
        return;
      }
      var partner = partners[link.partner] || {};
      var href = buildUrl(link, partner);
      if (!href) {
        el.setAttribute("data-aff-state", "bad-url");
        return;
      }

      if (el.tagName === "A") {
        el.setAttribute("href", href);
        el.setAttribute("rel", link.rel || partner.rel || "sponsored nofollow noopener");
        var target = link.target || partner.target;
        if (target) el.setAttribute("target", target);
      } else {
        el.setAttribute("data-aff-href", href);
      }

      if (link.label && !el.textContent.trim()) el.textContent = link.label;
      if (partner.name && !el.getAttribute("title")) {
        el.setAttribute("title", "由 " + partner.name + " 提供（推廣連結）");
      }
      el.setAttribute("data-aff-state", "ready");
    });
  }

  function run() {
    if (!document.querySelector("[data-aff]")) return;
    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(apply)
      .catch(function () {
        var nodes = document.querySelectorAll("[data-aff]");
        Array.prototype.forEach.call(nodes, function (el) {
          el.setAttribute("data-aff-state", "error");
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
