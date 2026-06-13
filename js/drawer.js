/* ============================================================
   drawer.js — mobile nav drawer (native <dialog>) + the
   contact share button. Link activation closes the drawer and
   moves focus to the target section heading; Esc / close
   returns focus to the hamburger (native dialog behavior).
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var dlg = document.getElementById("drawer");
    var burger = document.getElementById("hamburger");
    var closeBtn = document.getElementById("drawer-close");

    if (dlg && burger && typeof dlg.showModal === "function") {
        function open() {
            dlg.showModal();
            burger.setAttribute("aria-expanded", "true");
            document.documentElement.style.overflow = "hidden";
            if (HG.scroll && HG.scroll.stop) HG.scroll.stop();
            if (closeBtn) closeBtn.focus();
            markCurrent();
        }
        function close() { dlg.close(); }
        dlg.addEventListener("close", function () {
            burger.setAttribute("aria-expanded", "false");
            document.documentElement.style.overflow = "";
            if (HG.scroll && HG.scroll.start) HG.scroll.start();
        });
        burger.addEventListener("click", open);
        if (closeBtn) closeBtn.addEventListener("click", close);
        dlg.addEventListener("click", function (e) {
            if (e.target === dlg) close();          /* backdrop click */
        });

        /* nav links: close, scroll, focus the target heading */
        dlg.querySelectorAll(".drawer__nav a").forEach(function (a) {
            a.addEventListener("click", function (e) {
                e.preventDefault();
                var id = (a.getAttribute("href") || "").slice(1);
                var target = document.getElementById(id);
                close();
                if (!target) return;
                HG.scroll.to(target, { offset: -10 });
                var heading = target.querySelector("h1, h2");
                if (heading) {
                    heading.setAttribute("tabindex", "-1");
                    setTimeout(function () { heading.focus({ preventScroll: true }); }, HG.reduced ? 0 : 450);
                }
            });
        });

        /* aria-current on the link for the section nearest the viewport top */
        function markCurrent() {
            var links = dlg.querySelectorAll(".drawer__nav a");
            var best = null, bestTop = -Infinity, y = window.scrollY + innerHeight * 0.45;
            links.forEach(function (a) {
                var s = document.getElementById((a.getAttribute("href") || "").slice(1));
                a.removeAttribute("aria-current");
                if (s && s.offsetTop <= y && s.offsetTop > bestTop) { bestTop = s.offsetTop; best = a; }
            });
            if (best) best.setAttribute("aria-current", "true");
        }

        /* drawer is mobile-only chrome: close it if the viewport grows past 720px */
        window.addEventListener("resize", function () {
            if (dlg.open && !window.matchMedia("(max-width: 720px)").matches) close();
        }, { passive: true });
    }

    /* ---------- share button (contact) ---------- */
    var share = document.getElementById("ro-share");
    if (share) {
        share.addEventListener("click", function () {
            var url = "https://hashwanthghanta.github.io/";
            var data = { title: "Hashwanth Ghanta — Portfolio", url: url };
            if (navigator.share) {
                navigator.share(data).catch(function () {});
            } else if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function () {
                    HG.announce(HG.data().share_ok || "Link copied");
                }, function () {});
            }
        });
    }
})();
