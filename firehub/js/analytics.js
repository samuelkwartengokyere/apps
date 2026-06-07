(function (global) {
  "use strict";

  var STORAGE_KEY = "firehub_analytics";
  var COUNTAPI_NS = "firehub-portfolio";
  var SESSION_FLAG = "firehub_visit_recorded";

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function dateKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function monthKey(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1);
  }

  function yearKey(d) {
    return String(d.getFullYear());
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { visits: [], pageviews: 0 };
  }

  function saveLocal(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function aggregateVisits(visits) {
    var now = new Date();
    var today = dateKey(now);
    var month = monthKey(now);
    var year = yearKey(now);
    var todayCount = 0;
    var monthCount = 0;
    var yearCount = 0;

    visits.forEach(function (v) {
      if (!v || !v.date) return;
      if (v.date === today) todayCount++;
      if (v.date.slice(0, 7) === month) monthCount++;
      if (v.date.slice(0, 4) === year) yearCount++;
    });

    return {
      today: todayCount,
      month: monthCount,
      year: yearCount,
      allTime: visits.length,
    };
  }

  function getLocalStats() {
    var data = loadLocal();
    var stats = aggregateVisits(data.visits || []);
    stats.pageviews = data.pageviews || 0;
    stats.source = "local";
    return stats;
  }

  function countApiGet(key) {
    return fetch(
      "https://api.countapi.xyz/get/" + COUNTAPI_NS + "/" + encodeURIComponent(key)
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        return data && typeof data.value === "number" ? data.value : 0;
      })
      .catch(function () {
        return null;
      });
  }

  function countApiHit(key) {
    return fetch(
      "https://api.countapi.xyz/hit/" + COUNTAPI_NS + "/" + encodeURIComponent(key)
    ).catch(function () {});
  }

  function recordVisit() {
    var now = new Date();
    var today = dateKey(now);
    var data = loadLocal();

    var isNewSession = !sessionStorage.getItem(SESSION_FLAG);
    if (isNewSession) {
      sessionStorage.setItem(SESSION_FLAG, "1");
      data.visits = data.visits || [];
      data.visits.push({
        date: today,
        ts: now.toISOString(),
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      });

      countApiHit("visitors-day-" + today);
      countApiHit("visitors-month-" + monthKey(now));
      countApiHit("visitors-year-" + yearKey(now));
      countApiHit("visitors-total");
    }

    data.pageviews = (data.pageviews || 0) + 1;
    saveLocal(data);

  }

  function fetchGlobalStats() {
    var now = new Date();
    var today = dateKey(now);
    var month = monthKey(now);
    var year = yearKey(now);

    return Promise.all([
      countApiGet("visitors-day-" + today),
      countApiGet("visitors-month-" + month),
      countApiGet("visitors-year-" + year),
      countApiGet("visitors-total"),
    ]).then(function (values) {
      if (values[0] === null && values[1] === null) return null;
      return {
        today: values[0] || 0,
        month: values[1] || 0,
        year: values[2] || 0,
        allTime: values[3] || 0,
        source: "global",
      };
    });
  }

  function getStats() {
    return fetchGlobalStats().then(function (globalStats) {
      var local = getLocalStats();
      if (globalStats) {
        globalStats.pageviews = local.pageviews;
        return globalStats;
      }
      return local;
    });
  }

  global.FirehubAnalytics = {
    recordVisit: recordVisit,
    getLocalStats: getLocalStats,
    fetchGlobalStats: fetchGlobalStats,
    getStats: getStats,
  };

  if (document.body && !document.body.classList.contains("admin-body")) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", recordVisit);
    } else {
      recordVisit();
    }
  }
})(typeof window !== "undefined" ? window : this);
