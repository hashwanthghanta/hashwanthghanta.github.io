/* ============================================================
   panels.js — renders 05 CAPABILITIES (data.js services[]) and
   08 NOW (live process list). Re-renders on language change.
   Decorative process garnish (PID/uptime) is aria-hidden;
   status is real text, never the dot alone.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var capList = document.getElementById("cap-list");
    var nowList = document.getElementById("now-list");

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
        });
    }

    function renderCaps() {
        if (!capList) return;
        var services = HG.data().services || [];
        capList.innerHTML = services.map(function (s, i) {
            return '<li class="cap-item" data-reveal>' +
                '<span class="cap-num" aria-hidden="true">' + String(i + 1).padStart(2, "0") + "</span>" +
                '<h3 class="cap-name">' + esc(s.name) + "</h3>" +
                '<p class="cap-desc">' + esc(s.desc) + "</p>" +
            "</li>";
        }).join("");
        HG.emit("sections:reveal-scan");
    }

    function renderNow() {
        if (!nowList) return;
        var d = HG.data();
        var procs = [
            { name: d.now_p1_name, desc: d.now_p1_desc, status: d.now_p1_status, pid: "PID 2047", up: "OVGU · HCAI" },
            { name: d.now_p2_name, desc: d.now_p2_desc, status: d.now_p2_status, pid: "PID 1991", up: "GitHub Pages" }
        ];
        nowList.innerHTML = procs.map(function (p) {
            return '<li class="now-proc" data-reveal>' +
                '<span class="now-dot" aria-hidden="true"></span>' +
                '<div class="now-main">' +
                    '<h3 class="now-name">' + esc(p.name) + "</h3>" +
                    '<p class="now-desc">' + esc(p.desc) + "</p>" +
                    '<p class="now-meta" aria-hidden="true">' + esc(p.pid) + " · " + esc(p.up) + "</p>" +
                "</div>" +
                '<span class="now-status">' + esc(p.status) + "</span>" +
            "</li>";
        }).join("");
        HG.emit("sections:reveal-scan");
    }

    function init() {
        renderCaps();
        renderNow();
        HG.on("langchange", function () { renderCaps(); renderNow(); });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
