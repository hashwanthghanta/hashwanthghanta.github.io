/* ============================================================
   co2-sim.js — pinned 4-stage CO₂ capture scrollytelling.
   Flow is a function of scroll progress (reverse-scrub reverses
   the sim). CSS position:sticky handles the pin; ScrollTrigger
   supplies progress. Reduced-motion → static figures, no canvas.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var section = document.getElementById("simulation");
    var canvas = document.getElementById("co2-canvas");
    if (!section || !canvas) return;

    var STAGES = [
        { n: "01", name: "FLUE GAS IN" },
        { n: "02", name: "ABSORBER" },
        { n: "03", name: "STRIPPER" },
        { n: "04", name: "OUTPUT" }
    ];
    var CAPTIONS = {
        en: [
            "Flue gas enters the absorber. CO₂ concentration holds near 12.4%.",
            "The solvent stream captures CO₂ — particles turn green and the capture rate climbs.",
            "Heat in the desorber releases a pure CO₂ stream upward; purity passes 95%.",
            "Compressed CO₂ exits. Seven Unity phases, modelled in Blender, driven in C#."
        ],
        de: [
            "Rauchgas strömt in den Absorber. Der CO₂-Anteil liegt bei rund 12,4 %.",
            "Das Lösungsmittel bindet CO₂ — Partikel werden grün, die Abscheiderate steigt.",
            "Wärme im Desorber setzt einen reinen CO₂-Strom nach oben frei; Reinheit über 95 %.",
            "Komprimiertes CO₂ tritt aus. Sieben Unity-Phasen, in Blender modelliert, in C# gesteuert."
        ]
    };

    /* reduced-motion → static fallback, no canvas */
    if (HG.reduced) {
        section.classList.add("no-pin");
        return;
    }

    var ctx = canvas.getContext("2d", { alpha: true });
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var particles = [];
    var progress = 0, curStage = -1, running = false, raf = 0;

    function css(varName, fb) {
        return getComputedStyle(document.body).getPropertyValue(varName).trim() || fb;
    }

    function resize() {
        var r = canvas.getBoundingClientRect();
        W = r.width; H = r.height;
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function spawn() {
        var mobile = window.innerWidth < 760;
        var N = mobile ? 460 : 900;
        particles = [];
        for (var i = 0; i < N; i++) {
            particles.push({
                ph: Math.random(),
                lane: (Math.random() - 0.5),
                sp: 0.8 + Math.random() * 0.5,
                sz: Math.random() < 0.2 ? 2.2 : 1.4
            });
        }
    }

    /* ---- plant geometry (fractions of W×H) ---- */
    function geo() {
        return {
            ax: 0.21 * W, sx: 0.65 * W, colW: 0.05 * W,
            topY: 0.22 * H, baseY: 0.80 * H, hxY: 0.54 * H, hxX: 0.43 * W,
            tankX: 0.90 * W, tankW: 0.055 * W, tankTop: 0.34 * H, tankH: 0.30 * H
        };
    }

    /* particle route along the real loop: flue gas in → up the absorber →
       across the heat exchanger → up the stripper → out into the CO₂ tank.
       (A readable schematic of the process — the live Unity build is rigorous.) */
    function path(u, lane) {
        var g = geo(), x, y, k, sp = lane * 0.5 * g.colW;
        if (u < 0.16)        { k = u / 0.16;          x = (0.03 * W) + k * (g.ax - 0.03 * W); y = g.baseY + lane * 0.03 * H; }
        else if (u < 0.42)   { k = (u - 0.16) / 0.26; x = g.ax + sp;                          y = g.baseY - k * (g.baseY - g.hxY); }
        else if (u < 0.56)   { k = (u - 0.42) / 0.14; x = g.ax + k * (g.sx - g.ax);           y = g.hxY + lane * 0.025 * H; }
        else if (u < 0.82)   { k = (u - 0.56) / 0.26; x = g.sx + sp;                          y = g.hxY - k * (g.hxY - g.topY); }
        else                 { k = (u - 0.82) / 0.18; x = g.sx + k * (g.tankX - g.sx);        y = g.topY + k * (0.46 * H - g.topY) + lane * 0.02 * H; }
        return { x: x, y: y };
    }

    function colorFor(u, ink, sig, amber) {
        if (u < 0.16) return ink;                  /* grey flue gas */
        if (u >= 0.56 && u < 0.64) return amber;   /* reboiler heat at stripper base */
        return sig;                                /* captured solvent / pure CO₂ */
    }

    function rect(x, y, w, h) { ctx.strokeRect(x, y, w, h); }
    function rrect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.stroke();
    }
    function label(text, x, y, color, align) {
        ctx.fillStyle = color;
        ctx.textAlign = align || "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '600 ' + Math.max(9, Math.round(W * 0.0105)) + 'px "JetBrains Mono", ui-monospace, monospace';
        ctx.fillText(text, x, y);
    }
    function arrow(x1, y1, x2, y2, color) {
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.2;
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        var a = Math.atan2(y2 - y1, x2 - x1), s = 5;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - s * Math.cos(a - 0.4), y2 - s * Math.sin(a - 0.4));
        ctx.lineTo(x2 - s * Math.cos(a + 0.4), y2 - s * Math.sin(a + 0.4));
        ctx.closePath(); ctx.fill();
    }

    /* labelled process schematic — towers, heat exchanger, reboiler, CO₂ tank, pipes */
    function drawPlant(sig, line, dim, amber) {
        var g = geo();
        ctx.save();

        /* --- pipes (dashed) --- */
        ctx.setLineDash([5, 4]); ctx.strokeStyle = line; ctx.lineWidth = 1;
        ctx.beginPath();                              /* rich-MEA: absorber base → heat exchanger */
        ctx.moveTo(g.ax + g.colW, g.baseY - 0.04 * H);
        ctx.lineTo(g.hxX, g.baseY - 0.04 * H);
        ctx.lineTo(g.hxX, g.hxY + 0.05 * H);
        ctx.stroke();
        ctx.beginPath();                              /* lean-MEA return: stripper top → absorber top */
        ctx.moveTo(g.sx, g.topY - 0.05 * H);
        ctx.lineTo(g.sx, 0.11 * H);
        ctx.lineTo(g.ax, 0.11 * H);
        ctx.lineTo(g.ax, g.topY);
        ctx.stroke();
        ctx.setLineDash([]);

        var setActive = function (on) { ctx.strokeStyle = on ? sig : line; ctx.lineWidth = on ? 1.8 : 1.2; };

        /* absorber tower + packing hatching */
        setActive(curStage <= 1);
        rrect(g.ax - g.colW, g.topY, g.colW * 2, g.baseY - g.topY, 6);
        ctx.strokeStyle = line; ctx.lineWidth = 0.7;
        for (var hy = g.topY + 14; hy < g.baseY - 8; hy += 13) { ctx.beginPath(); ctx.moveTo(g.ax - g.colW + 5, hy); ctx.lineTo(g.ax + g.colW - 5, hy); ctx.stroke(); }

        /* stripper tower (taller) + packing */
        setActive(curStage === 2);
        var stTop = g.topY - 0.05 * H;
        rrect(g.sx - g.colW, stTop, g.colW * 2, g.baseY - stTop, 6);
        ctx.strokeStyle = line; ctx.lineWidth = 0.7;
        for (var hy2 = stTop + 14; hy2 < g.baseY - 8; hy2 += 13) { ctx.beginPath(); ctx.moveTo(g.sx - g.colW + 5, hy2); ctx.lineTo(g.sx + g.colW - 5, hy2); ctx.stroke(); }

        /* heat exchanger (coil box) */
        setActive(false);
        var hw = 0.052 * W, hh = 0.11 * H;
        rrect(g.hxX - hw / 2, g.hxY - hh / 2, hw, hh, 4);
        ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.beginPath();
        for (var zi = 0; zi <= 4; zi++) {
            var zx = (g.hxX - hw / 2 + 6) + (hw - 12) * (zi / 4);
            var zy = g.hxY + (zi % 2 === 0 ? -(hh / 2 - 7) : (hh / 2 - 7));
            zi === 0 ? ctx.moveTo(zx, zy) : ctx.lineTo(zx, zy);
        }
        ctx.stroke();

        /* reboiler at stripper base — amber when stripping */
        var rbOn = curStage === 2;
        ctx.strokeStyle = rbOn ? amber : line; ctx.lineWidth = rbOn ? 1.8 : 1.2;
        rrect(g.sx - g.colW * 0.7, g.baseY + 3, g.colW * 1.4, 0.06 * H, 3);

        /* CO₂ storage tank */
        setActive(curStage === 3);
        rrect(g.tankX - g.tankW, g.tankTop, g.tankW * 2, g.tankH, 10);

        /* flow arrows */
        for (var sxx = -1; sxx <= 1; sxx++) arrow(g.ax + sxx * g.colW * 0.5, g.topY - 16, g.ax + sxx * g.colW * 0.5, g.topY + 2, dim); /* MEA shower */
        arrow(0.03 * W, g.baseY, g.ax - g.colW - 2, g.baseY, dim);                       /* flue gas in */
        arrow(g.sx + g.colW, g.topY, g.tankX - g.tankW - 2, g.tankTop + 6, dim);         /* CO₂ → tank */

        /* labels */
        label("ABSORBER", g.ax, g.baseY + 0.11 * H, curStage <= 1 ? sig : dim);
        label("STRIPPER", g.sx, stTop - 8, curStage === 2 ? sig : dim);
        label("HEAT EXCH.", g.hxX, g.hxY + hh / 2 + 16, dim);
        label("REBOILER", g.sx + g.colW + 6, g.baseY + 0.055 * H, rbOn ? amber : dim, "left");
        label("CO₂ TANK", g.tankX, g.tankTop - 8, curStage === 3 ? sig : dim);
        label("FLUE GAS IN", 0.03 * W, g.baseY - 12, dim, "left");

        ctx.restore();
    }

    function render(t) {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        var ink = css("--grey-gas", "rgba(228,228,231,0.55)");
        var sig = css("--signal", "#4ADE80");
        var amber = css("--amber", "#FBBF24");
        var line = css("--line", "#26272B");
        var dim = css("--ink-faint", "rgba(228,228,231,0.6)");
        drawPlant(sig, line, dim, amber);

        var p = progress;
        var maxU = 0.40 + 0.60 * p;          /* process front advances with scroll */
        var jitter = (t || 0) * 0.0004;
        for (var i = 0; i < particles.length; i++) {
            var pp = particles[i];
            var u = (p * pp.sp + pp.ph) % 1;
            if (u < 0) u += 1;
            if (u > maxU) u = maxU - (pp.ph * 0.02);
            if (u < 0) u = 0;
            var pos = path(u, pp.lane);
            var jx = Math.sin(jitter * 6 + pp.ph * 9) * 1.2;
            var jy = Math.cos(jitter * 5 + pp.ph * 7) * 1.2;
            ctx.fillStyle = colorFor(u, ink, sig, amber);
            ctx.globalAlpha = u < 0.40 ? 0.6 : 0.9;
            ctx.fillRect(pos.x + jx, pos.y + jy, pp.sz, pp.sz);
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(render);
    }

    /* ---- counters + caption ---- */
    var roCO2 = document.getElementById("ro-co2");
    var roCap = document.getElementById("ro-capture");
    var roPur = document.getElementById("ro-purity");
    var elNum = document.getElementById("sim-stagenum");
    var elName = document.getElementById("sim-stagename");
    var elLabel = document.getElementById("sim-stagelabel");
    var elLabelNum = elLabel ? elLabel.querySelector(".sn") : null;
    var elCap = document.getElementById("sim-caption");
    var elCta = document.getElementById("sim-cta");
    var twTimer = 0;

    function typewrite(text) {
        if (!elCap) return;
        clearInterval(twTimer);
        elCap.textContent = "";
        var i = 0;
        var caret = document.createElement("span");
        caret.className = "tw-caret";
        elCap.appendChild(caret);
        twTimer = setInterval(function () {
            if (i >= text.length) { clearInterval(twTimer); return; }
            caret.insertAdjacentText("beforebegin", text[i]);
            i++;
        }, 16);
    }

    function setStage(s) {
        if (s === curStage) return;
        curStage = s;
        var st = STAGES[s];
        if (elNum) elNum.textContent = "STAGE " + st.n + " / 04";
        if (elName) elName.textContent = st.name;
        if (elLabelNum) elLabelNum.textContent = st.n;
        if (elLabel) { elLabel.classList.remove("glitch"); void elLabel.offsetWidth; elLabel.classList.add("glitch"); }
        typewrite((CAPTIONS[HG.lang] || CAPTIONS.en)[s]);
        if (elCta) elCta.classList.toggle("is-on", s === 3);
    }

    function counters(p) {
        var cap = Math.max(0, Math.min(1, (p - 0.22) / 0.38)) * 95;
        if (roCap) roCap.textContent = (p < 0.22 ? 0 : Math.round(cap)) + "%";
        if (roPur) {
            if (p < 0.5) roPur.textContent = "—";
            else { var pur = 90 + Math.min(1, (p - 0.5) / 0.35) * 7.5; roPur.textContent = ">" + pur.toFixed(1) + "%"; }
        }
        if (roCO2) roCO2.textContent = (12.4 - p * 1.2).toFixed(1) + "%";
    }

    function setProgress(p) {
        progress = Math.max(0, Math.min(1, p));
        setStage(Math.max(0, Math.min(3, Math.floor(progress * 3.999))));
        counters(progress);
    }

    function start() { if (running) return; running = true; raf = requestAnimationFrame(render); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    function initST() {
        if (typeof window.ScrollTrigger === "undefined") {
            /* no GSAP: fall back to static figures */
            section.classList.add("no-pin");
            return;
        }
        window.ScrollTrigger.create({
            trigger: ".sim-track",
            start: "top top",
            end: "bottom bottom",
            onUpdate: function (self) { setProgress(self.progress); },
            onToggle: function (self) { self.isActive ? start() : stop(); }
        });
        /* render whenever in view even if not actively scrolling */
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (en) { en.isIntersecting ? start() : stop(); });
        }, { threshold: 0.01 });
        io.observe(canvas);
    }

    var rt;
    window.addEventListener("resize", function () {
        clearTimeout(rt); rt = setTimeout(function () { resize(); spawn(); }, 180);
    }, { passive: true });

    HG.on("langchange", function () { var s = curStage; curStage = -1; setStage(s < 0 ? 0 : s); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); });

    function boot() {
        resize(); spawn(); setProgress(0); initST();
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot);
    else window.addEventListener("load", boot, { once: true });
})();
