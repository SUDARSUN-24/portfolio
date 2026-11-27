// Small enhancements only. The page works fully without JavaScript.

var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Bangkok time in the masthead.
(function () {
  var el = document.querySelector("[data-clock]");
  if (!el || !window.Intl) return;
  var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });
  function tick() { el.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 30000);
})();

// Reading progress line under the masthead.
(function () {
  var bar = document.querySelector(".masthead__progress");
  if (!bar) return;
  var queued = false, max = 0;
  // Measure the page height only when it changes; reading it on every scroll
  // frame forced a full layout and made scrolling stutter.
  function measure() { max = document.documentElement.scrollHeight - window.innerHeight; }
  function update() {
    queued = false;
    bar.style.setProperty("--progress", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", function () { measure(); schedule(); });
  if ("ResizeObserver" in window) new ResizeObserver(function () { measure(); schedule(); }).observe(document.body);
  window.addEventListener("load", function () { measure(); schedule(); });
  measure();
  update();
})();

// Stats: count up once when they come into view.
(function () {
  var nums = document.querySelectorAll("[data-count]");
  if (!nums.length || reduceMotion || !("IntersectionObserver" in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      var el = entry.target;
      var end = Number(el.getAttribute("data-count"));
      var start = performance.now();
      var dur = 1400;
      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(step);
      })(start);
    });
  }, { threshold: 0.6 });
  nums.forEach(function (n) { io.observe(n); });
})();

// Hero headline: wrap each word so it can rise into place.
(function () {
  var h = document.querySelector("[data-split]");
  if (!h || reduceMotion) return;
  var i = 0;
  function wrap(node) {
    var outer = document.createElement("span");
    outer.className = "w";
    var inner = document.createElement("span");
    inner.style.setProperty("--wi", i++);
    inner.appendChild(node);
    outer.appendChild(inner);
    return outer;
  }
  Array.prototype.slice.call(h.childNodes).forEach(function (node) {
    if (node.nodeType === 3) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(" ") : wrap(document.createTextNode(part)));
      });
      h.replaceChild(frag, node);
    } else if (node.nodeType === 1) {
      h.replaceChild(wrap(node.cloneNode(true)), node);
    }
  });
})();

// Hero collage: cards drift with the mouse (fine pointers only).
(function () {
  var c = document.querySelector(".collage");
  if (!c || reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var hero = document.querySelector(".hero");
  var raf = 0, px = 0, py = 0;
  hero.addEventListener("mousemove", function (e) {
    var r = c.getBoundingClientRect();
    px = ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2;
    py = ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 2;
    if (!raf) raf = requestAnimationFrame(function () {
      raf = 0;
      c.style.setProperty("--px", px.toFixed(3));
      c.style.setProperty("--py", py.toFixed(3));
    });
  });
  hero.addEventListener("mouseleave", function () {
    c.style.setProperty("--px", 0);
    c.style.setProperty("--py", 0);
  });
})();

// Fade sections in as they scroll into view (only those below the fold).
(function () {
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  var targets = document.querySelectorAll(".chapter__head, .project, .card, .about__grid, .contact__line, .stats");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  targets.forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already visible: leave it alone
    el.classList.add("reveal");
    io.observe(el);
  });
  // Jumping to a project from the index: show it straight away.
  window.addEventListener("hashchange", function () {
    var t = document.getElementById(location.hash.slice(1));
    if (t) { t.classList.add("is-in"); var p = t.querySelectorAll(".reveal"); p.forEach(function (x) { x.classList.add("is-in"); }); }
  });
})();

// Index filters.
(function () {
  var group = document.querySelector(".filters");
  if (!group) return;
  var chips = group.querySelectorAll(".chip");
  var rows = document.querySelectorAll(".index__list > li");
  group.hidden = false;
  group.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var f = chip.getAttribute("data-filter");
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
    rows.forEach(function (r) { r.hidden = f !== "all" && r.getAttribute("data-cat") !== f; });
  });
})();

// Index: a screenshot follows the cursor over each project row (mouse only).
(function () {
  var img = document.querySelector(".index__preview");
  if (!img || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  img.hidden = false;

  document.querySelectorAll(".index__row").forEach(function (row) {
    var src = row.getAttribute("data-preview");
    if (!src) return;
    row.addEventListener("mouseenter", function () {
      if (img.getAttribute("src") !== src) img.src = src;
      img.classList.add("is-on");
    });
    row.addEventListener("mouseleave", function () { img.classList.remove("is-on"); });
    row.addEventListener("mousemove", function (e) {
      var x = Math.min(e.clientX + 28, window.innerWidth - img.offsetWidth - 16);
      var y = Math.max(16, Math.min(e.clientY - img.offsetHeight / 2, window.innerHeight - img.offsetHeight - 16));
      img.style.setProperty("--x", x + "px");
      img.style.setProperty("--y", y + "px");
    });
  });
})();

// Galleries: open a screenshot full size in a dialog (without JS the link opens the image).
// Each gallery steps through its own screenshots.
(function () {
  var galleries = document.querySelectorAll("[data-gallery]");
  if (!galleries.length || typeof HTMLDialogElement !== "function") return;

  var dlg = document.createElement("dialog");
  dlg.className = "lightbox";
  dlg.setAttribute("aria-label", "Screenshot viewer");
  dlg.innerHTML =
    '<figure><img alt="" decoding="async"><figcaption><span class="lightbox__text"></span>' +
    '<span class="lightbox__bar"><span class="lightbox__count mono"></span>' +
    '<button type="button" data-step="-1" aria-label="Previous screenshot">←</button>' +
    '<button type="button" data-step="1" aria-label="Next screenshot">→</button>' +
    '<button type="button" data-close aria-label="Close" autofocus>✕</button></span></figcaption></figure>';
  document.body.appendChild(dlg);

  var img = dlg.querySelector("img");
  var text = dlg.querySelector(".lightbox__text");
  var count = dlg.querySelector(".lightbox__count");
  var links = [];
  var current = 0;
  var opener = null;

  function show(i) {
    current = (i + links.length) % links.length;
    var a = links[current];
    var thumb = a.querySelector("img");
    img.src = a.getAttribute("href");
    img.alt = thumb ? thumb.alt : "";
    text.textContent = a.getAttribute("data-caption") || "";
    count.textContent = (current + 1) + " / " + links.length;
  }

  galleries.forEach(function (g) {
    var own = Array.prototype.slice.call(g.querySelectorAll(".shot-link"));
    own.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let "open in new tab" work
        e.preventDefault();
        links = own;
        opener = a;
        show(i);
        dlg.showModal();
      });
    });
  });

  dlg.addEventListener("click", function (e) {
    var t = e.target;
    if (t === dlg || t.hasAttribute("data-close")) { dlg.close(); return; }
    var step = t.getAttribute("data-step");
    if (step) show(current + Number(step));
  });
  dlg.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") show(current + 1);
    if (e.key === "ArrowLeft") show(current - 1);
  });
  dlg.addEventListener("close", function () {
    img.removeAttribute("src");
    if (opener) opener.focus();
  });
})();

// "Copy email" button.
(function () {
  var btn = document.querySelector(".copy-btn");
  var status = document.querySelector(".copy-status");
  if (!btn || !navigator.clipboard || !window.isSecureContext) return;
  btn.hidden = false;
  var timer;
  btn.addEventListener("click", function () {
    navigator.clipboard.writeText(btn.dataset.copy).then(
      function () { say("Copied"); },
      function () { say("Couldn't copy. Select the address instead."); }
    );
  });
  function say(text) {
    status.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(function () { status.textContent = ""; }, 2500);
  }
})();

// ---------- Interaction layer ----------
var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Light / dark toggle (remembers the choice; otherwise follows the system).
(function () {
  var btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  btn.hidden = false;
  var root = document.documentElement;
  function current() {
    return root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  window.toggleTheme = function () {
    var next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  };
  btn.addEventListener("click", window.toggleTheme);
})();

// 3D tilt and a light that follows the pointer on the big screenshots.
(function () {
  if (reduceMotion || !finePointer) return;
  document.querySelectorAll(".project .frame:not(.frame--small), .project__shot--game").forEach(function (el) {
    el.classList.add("tilt");
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", ((x - 0.5) * 5).toFixed(2) + "deg");
      el.style.setProperty("--rx", ((0.5 - y) * 3.5).toFixed(2) + "deg");
      el.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    });
    el.addEventListener("pointerleave", function () {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
})();

// Buttons lean toward the pointer.
(function () {
  if (reduceMotion || !finePointer) return;
  document.querySelectorAll(".btn, .masthead__cta").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.setProperty("--mx", (dx * 8).toFixed(1) + "px");
      el.style.setProperty("--my", (dy * 6).toFixed(1) + "px");
    });
    el.addEventListener("pointerleave", function () {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    });
  });
})();

// Khun Chuay: try the bill split (same maths as the bot, in whole satang).
(function () {
  var form = document.querySelector("[data-billsplit]");
  if (!form) return;
  form.hidden = false;
  var bill = form.querySelector("[data-bill]");
  var people = form.querySelector("[data-people]");
  var extra = form.querySelector("[data-extra]");
  var out = form.querySelector("[data-out]");
  var factor = { none: [100, 100], vat: [107, 100], both: [110 * 107, 10000] };
  function fmt(satang) {
    return (satang / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function update() {
    var b = Math.round(parseFloat(bill.value) * 100);
    var n = parseInt(people.value, 10);
    if (!(b > 0) || !(n >= 1) || n > 50 || b > 1e9) { out.textContent = "Enter a bill and 1–50 people."; return; }
    var f = factor[extra.value];
    var den = f[1] * n;
    var each = Math.floor((b * f[0] + den - 1) / den);
    out.innerHTML = "Each pays <strong>฿" + fmt(each) + "</strong>";
  }
  form.addEventListener("input", update);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  update();
})();

// Quick jump menu: Ctrl/Cmd+K, or "/" when you are not typing.
(function () {
  if (typeof HTMLDialogElement !== "function") return;
  var items = [];
  function add(group, title, hint, run) { items.push({ group: group, title: title, hint: hint, run: run }); }

  document.querySelectorAll(".index__row").forEach(function (a) {
    add("Projects", a.querySelector(".index__name").textContent, a.querySelector(".index__type").textContent,
      function () { location.hash = a.getAttribute("href"); });
  });
  [["Work", "#work"], ["Games", "#games"], ["About", "#about"], ["How I use AI", "#ai"], ["Contact", "#contact"]].forEach(function (s) {
    add("Go to", s[0], "Section", function () { location.hash = s[1]; });
  });
  add("Do", "Switch light / dark", "Theme", function () { if (window.toggleTheme) window.toggleTheme(); });
  var copyBtn = document.querySelector(".copy-btn");
  if (navigator.clipboard && window.isSecureContext && copyBtn) {
    add("Do", "Copy email address", "Clipboard", function () { copyBtn.click(); });
  }
  add("Do", "Download resume (PDF)", "File", function () {
    var a = document.createElement("a");
    a.href = "/assets/resume.pdf"; a.download = "Sudasun-resume.pdf";
    document.body.appendChild(a); a.click(); a.remove();
  });
  add("Do", "Open GitHub", "External", function () { window.open("https://github.com/SUDARSUN-24", "_blank", "noopener"); });
  add("Do", "Open LinkedIn", "External", function () { window.open("https://www.linkedin.com/in/sudarsun-020298348/", "_blank", "noopener"); });

  var dlg = document.createElement("dialog");
  dlg.className = "palette";
  dlg.setAttribute("aria-label", "Quick jump");
  dlg.innerHTML = '<input class="palette__input" type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" placeholder="Jump to a project, section or action…" autocomplete="off" spellcheck="false">' +
    '<ul class="palette__list" id="palette-list" role="listbox" aria-label="Results"></ul>';
  document.body.appendChild(dlg);
  var input = dlg.querySelector("input");
  var list = dlg.querySelector("ul");
  var shown = [];
  var sel = 0;
  var lastFocus = null;

  function render() {
    var q = input.value.trim().toLowerCase();
    shown = items.filter(function (it) { return !q || (it.title + " " + it.hint + " " + it.group).toLowerCase().indexOf(q) !== -1; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = "";
    if (!shown.length) { list.innerHTML = '<li class="palette__empty" role="presentation">Nothing matches.</li>'; input.removeAttribute("aria-activedescendant"); return; }
    var last = "";
    shown.forEach(function (it, i) {
      if (it.group !== last) {
        last = it.group;
        var g = document.createElement("li");
        g.className = "palette__group label"; g.setAttribute("role", "presentation"); g.textContent = last;
        list.appendChild(g);
      }
      var li = document.createElement("li");
      li.className = "palette__item"; li.id = "pal-" + i; li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === sel));
      li.innerHTML = "<span></span><small></small>";
      li.firstChild.textContent = it.title; li.lastChild.textContent = it.hint;
      li.addEventListener("mousemove", function () { if (sel !== i) { sel = i; mark(); } });
      li.addEventListener("click", function () { run(i); });
      list.appendChild(li);
    });
    input.setAttribute("aria-activedescendant", "pal-" + sel);
  }
  function mark() {
    list.querySelectorAll(".palette__item").forEach(function (li, i) { li.setAttribute("aria-selected", String(i === sel)); });
    input.setAttribute("aria-activedescendant", "pal-" + sel);
    var cur = document.getElementById("pal-" + sel);
    if (cur) cur.scrollIntoView({ block: "nearest" });
  }
  function run(i) {
    var it = shown[i];
    if (!it) return;
    dlg.close();
    setTimeout(it.run, 0);
  }
  function open() {
    if (dlg.open) return;
    lastFocus = document.activeElement;
    input.value = ""; sel = 0; render();
    dlg.showModal(); input.focus();
  }

  input.addEventListener("input", function () { sel = 0; render(); });
  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (shown.length) { sel = (sel + 1) % shown.length; mark(); } }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (shown.length) { sel = (sel - 1 + shown.length) % shown.length; mark(); } }
    else if (e.key === "Enter") { e.preventDefault(); run(sel); }
  });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : open(); }
    else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
  });
  var trigger = document.querySelector("[data-palette]");
  if (trigger) {
    trigger.hidden = false;
    if (/Mac|iPhone|iPad/.test(navigator.platform || "")) trigger.querySelector("kbd").textContent = "⌘ K";
    trigger.addEventListener("click", open);
  }
})();

// ---------- Effects layer ----------

// Living flow field behind the page: short strokes follow a slow current,
// swirl around the cursor and burst outward on click.
// Smoothness rules: the canvas is cleared and redrawn every frame (no smeared
// leftovers), each stroke has a tail that fades out and fades in/out over
// its life (no popping), motion is time-based (same speed at 60 or 120 Hz, no
// jump after a dropped frame), scrolling drifts the field gently, and a phone's
// address bar showing or hiding never resets it. Fixed-size buffers, so no
// garbage-collection pauses. Stops drawing when the tab is hidden.
(function () {
  var cv = document.createElement("canvas");
  var ctx = cv.getContext && cv.getContext("2d");
  if (!ctx) return;
  cv.className = "field";
  cv.setAttribute("aria-hidden", "true");
  document.body.insertBefore(cv, document.body.firstChild);

  var TAIL = 5;                        // tail points kept per stroke
  var SAMPLE = 7;                      // a tail point every 7 frames: long tails, few segments
  var BUCKETS = 3;                     // alpha levels (one stroke() call each)
  var MAX = 240;                       // most strokes on a big screen
  var R = 160;                         // cursor swirl radius
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var w = 0, h = 0, cw = 0, n = 0, t = 0, raf = 0, last = 0, frame = 0;
  var color = "255,122,82", styles = [];
  var mx = -9999, my = -9999, sx = -9999, sy = -9999, pull = 0, pullTarget = 0;
  var lastScrollY = window.scrollY, drift = 0;

  // per stroke: position, speed, push from a click, age, life; tail as a ring buffer
  var X = new Float32Array(MAX), Y = new Float32Array(MAX), S = new Float32Array(MAX);
  var IX = new Float32Array(MAX), IY = new Float32Array(MAX), AGE = new Float32Array(MAX), LIFE = new Float32Array(MAX);
  var TX = new Float32Array(MAX * TAIL), TY = new Float32Array(MAX * TAIL);
  var HEAD = new Uint8Array(MAX), LEN = new Uint8Array(MAX), ACC = new Float32Array(MAX);

  function readColor() {
    var c = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    var m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) { var v = parseInt(m[1], 16); color = (v >> 16) + "," + ((v >> 8) & 255) + "," + (v & 255); }
    for (var b = 0; b < BUCKETS; b++) styles[b] = "rgba(" + color + "," + (0.7 * (b + 1) / BUCKETS).toFixed(3) + ")";
  }
  function spawn(i, randomAge) {
    X[i] = Math.random() * w; Y[i] = Math.random() * h;
    IX[i] = IY[i] = 0;
    S[i] = 0.55 + Math.random() * 0.9;
    LIFE[i] = 140 + Math.random() * 260;  // in 60 Hz frames
    AGE[i] = randomAge ? Math.random() * LIFE[i] : 0;
    HEAD[i] = 0; LEN[i] = 1; ACC[i] = 0; TX[i * TAIL] = X[i]; TY[i * TAIL] = Y[i];
  }
  function resize() {
    var nw = window.innerWidth, nh = window.innerHeight;
    var widthChanged = nw !== cw;       // a phone's address bar only changes the height
    w = nw; h = nh; cw = nw;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "butt"; ctx.lineJoin = "miter"; ctx.lineWidth = 1.3;
    var target = Math.round(Math.max(90, Math.min(MAX, (w * h) / 5200)));
    if (widthChanged) { for (var i = 0; i < target; i++) spawn(i, true); }
    else { for (var j = n; j < target; j++) spawn(j, true); }
    n = target;
  }
  function angle(x, y) {
    return (Math.sin(x * 0.0021 + t * 0.0045) + Math.cos(y * 0.0026 - t * 0.0036) + Math.sin((x + y) * 0.0012 + t * 0.002)) * 1.7;
  }
  function simulate(dt) {
    t += dt;
    // ease the cursor and its pull so the swirl glides instead of jumping
    var k = 1 - Math.pow(0.8, dt);
    if (sx < -9000 && mx > -9000) { sx = mx; sy = my; }
    sx += (mx - sx) * k; sy += (my - sy) * k;
    pull += (pullTarget - pull) * k;
    var damp = Math.pow(0.93, dt), dy = drift; drift = 0;
    for (var i = 0; i < n; i++) {
      var x = X[i], y = Y[i], a = angle(x, y);
      var vx = Math.cos(a) * S[i], vy = Math.sin(a) * S[i];
      if (pull > 0.01) {
        var ddx = x - sx, ddy = y - sy, d2 = ddx * ddx + ddy * ddy;
        if (d2 < R * R && d2 > 1) {
          var d = Math.sqrt(d2), f = (1 - d / R) * pull;
          f = f * f * (3 - 2 * f);       // smoothstep: soft edge to the swirl
          vx += (ddx / d) * f * 2.0 - (ddy / d) * f * 3.2;
          vy += (ddy / d) * f * 2.0 + (ddx / d) * f * 3.2;
        }
      }
      IX[i] *= damp; IY[i] *= damp;
      x += (vx + IX[i]) * dt; y += (vy + IY[i]) * dt + dy;
      X[i] = x; Y[i] = y;
      var base = i * TAIL;
      if (dy) for (var j = 0; j < TAIL; j++) TY[base + j] += dy;   // the tail drifts too: no streaks
      ACC[i] += dt;
      if (ACC[i] >= SAMPLE) {            // keep a tail point now and then
        ACC[i] = 0;
        HEAD[i] = (HEAD[i] + 1) % TAIL;
        TX[base + HEAD[i]] = x; TY[base + HEAD[i]] = y;
        if (LEN[i] < TAIL) LEN[i]++;
      }
      AGE[i] += dt;
      if (AGE[i] > LIFE[i] || x < -40 || x > w + 40 || y < -40 || y > h + 40) spawn(i, false);
    }
  }
  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (var b = 0; b < BUCKETS; b++) {
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var len = LEN[i];
        var life = AGE[i] / LIFE[i];
        var lf = Math.min(1, life / 0.15, (1 - life) / 0.25);      // fade in, hold, fade out
        if (lf <= 0.05) continue;
        var base = i * TAIL, head = HEAD[i];
        // walk from the oldest tail point to the live position; alpha grows towards
        // the head. Neighbouring segments in the same alpha level join into one line.
        var open = false;
        for (var j = 1; j <= len; j++) {
          var al = lf * (j / len);
          var bk = (al * BUCKETS) | 0; if (bk >= BUCKETS) bk = BUCKETS - 1;
          if (bk !== b || al < 0.1) { open = false; continue; }
          var x1, y1;
          if (j === len) { x1 = X[i]; y1 = Y[i]; }
          else { var p1 = base + (head - len + j + 1 + TAIL) % TAIL; x1 = TX[p1]; y1 = TY[p1]; }
          if (!open) { var p0 = base + (head - len + j + TAIL) % TAIL; ctx.moveTo(TX[p0], TY[p0]); open = true; }
          ctx.lineTo(x1, y1);
        }
      }
      ctx.strokeStyle = styles[b];
      ctx.stroke();
    }
  }
  function visibleAmount() { return Math.max(0.3, Math.min(1, 1 - window.scrollY / (h * 0.85))); }
  var shownOpacity = -1;
  function setOpacity() {
    var o = Math.round(visibleAmount() * 0.85 * 50) / 50;   // coarse steps; CSS eases between them
    if (o !== shownOpacity) { shownOpacity = o; cv.style.opacity = o; }
  }
  function loop(now) {
    raf = 0;
    if (document.hidden) { last = 0; return; }
    var dt = last ? Math.min(3, (now - last) / 16.667) : 1;    // in 60 Hz frames; capped after a stall
    last = now;
    if (++frame % 90 === 0) readColor();
    simulate(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !reduceMotion && !document.hidden) raf = requestAnimationFrame(loop); }

  readColor();
  resize();
  setOpacity();
  if (reduceMotion) {
    for (var k = 0; k < 120; k++) simulate(1);   // one still frame, no animation
    draw();
    cv.style.opacity = "0.5";
  } else {
    start();
  }
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { resize(); setOpacity(); if (reduceMotion) draw(); }, 120);
  });
  window.addEventListener("scroll", function () {
    var y = window.scrollY, d = y - lastScrollY;
    lastScrollY = y;
    drift -= Math.max(-10, Math.min(10, d * 0.25));   // gentle parallax, capped per event
    setOpacity();
  }, { passive: true });
  document.addEventListener("visibilitychange", start);
  window.addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    mx = e.clientX; my = e.clientY; pullTarget = 1;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", function () { pullTarget = 0; });
  window.addEventListener("pointerdown", function (e) {
    if (reduceMotion) return;
    for (var i = 0; i < n; i++) {
      var dx = X[i] - e.clientX, dy = Y[i] - e.clientY, d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < 300) { var f = 1 - d / 300; f = f * f * 9; IX[i] += (dx / d) * f; IY[i] += (dy / d) * f; }
    }
  }, { passive: true });
  new MutationObserver(readColor).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  var mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  if (mq && mq.addEventListener) mq.addEventListener("change", readColor);
})();

// Cursor ring that inverts whatever it is over and grows on anything clickable.
(function () {
  if (reduceMotion || !finePointer) return;
  var ring = document.createElement("div");
  ring.className = "cursor";
  ring.setAttribute("aria-hidden", "true");
  ring.innerHTML = "<span></span>";
  document.body.appendChild(ring);
  var label = ring.firstChild;
  var x = -100, y = -100, cx = -100, cy = -100, raf = 0;
  function tick() {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    ring.style.translate = cx.toFixed(1) + "px " + cy.toFixed(1) + "px";
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(tick) : 0;
  }
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    ring.classList.add("is-on");
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", function () { ring.classList.remove("is-on"); });
  document.addEventListener("pointerover", function (e) {
    var t = e.target.closest && e.target.closest(".shot-link, .collage__card, .index__row, a, button, summary, select, input, label");
    ring.classList.toggle("is-big", !!t);
    var text = "";
    if (t && t.matches(".shot-link")) text = "View";
    else if (t && t.matches(".collage__card, .index__row")) text = "Open";
    label.textContent = text;
    ring.classList.toggle("has-label", !!text);
  });
  document.addEventListener("pointerdown", function () { ring.classList.add("is-down"); });
  document.addEventListener("pointerup", function () { ring.classList.remove("is-down"); });
})();

// The ticker speeds up with your scroll and runs backwards when you scroll up.
(function () {
  if (reduceMotion || !document.getAnimations) return;
  var tracks = document.querySelectorAll(".marquee__track");
  if (!tracks.length) return;
  var last = window.scrollY, lastT = performance.now(), rate = 1, target = 1, raf = 0;
  function anims() {
    var out = [];
    tracks.forEach(function (el) { el.getAnimations().forEach(function (a) { out.push(a); }); });
    return out;
  }
  function loop() {
    target += (1 - target) * 0.06;            // settle back to normal speed
    rate += (target - rate) * 0.15;
    anims().forEach(function (a) { a.updatePlaybackRate ? a.updatePlaybackRate(rate) : (a.playbackRate = rate); });
    raf = Math.abs(rate - 1) > 0.02 ? requestAnimationFrame(loop) : 0;
    if (!raf) anims().forEach(function (a) { a.updatePlaybackRate ? a.updatePlaybackRate(1) : (a.playbackRate = 1); });
  }
  window.addEventListener("scroll", function () {
    var now = performance.now(), y = window.scrollY;
    var v = (y - last) / Math.max(16, now - lastT);   // px per ms
    last = y; lastT = now;
    var boost = Math.min(9, Math.abs(v) * 6);
    target = v < 0 ? -(1 + boost) : 1 + boost;
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
})();

// Giant chapter numerals drift against the scroll.
(function () {
  if (reduceMotion) return;
  var nums = document.querySelectorAll(".chapter__num");
  if (!nums.length) return;
  var queued = false;
  function update() {
    queued = false;
    var vh = window.innerHeight;
    nums.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.translate = "0 " + ((r.top - vh / 2) * -0.18).toFixed(1) + "px";
    });
  }
  window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
})();

// Games band: the page goes dark and you light it with a lantern.
(function () {
  if (reduceMotion || !finePointer) return;
  var band = document.querySelector(".band");
  if (!band) return;
  band.addEventListener("pointermove", function (e) {
    var r = band.getBoundingClientRect();
    band.style.setProperty("--lx", (e.clientX - r.left).toFixed(0) + "px");
    band.style.setProperty("--ly", (e.clientY - r.top).toFixed(0) + "px");
    band.classList.add("is-lit");
  });
  band.addEventListener("pointerleave", function () { band.classList.remove("is-lit"); });
})();

// ---------- Scroll effects (whole page) ----------
(function () {
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  var vh = window.innerHeight;
  window.addEventListener("resize", function () { vh = window.innerHeight; });

  var seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  function graphemes(word) {
    if (!seg) return word.split("");
    var out = [], it = seg.segment(word)[Symbol.iterator](), s;
    while (!(s = it.next()).done) out.push(s.value.segment);
    return out;
  }
  // Wrap every text node's words (and optionally letters) in spans, keeping <em> etc.
  function split(el, mode) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (word) {
            if (!word) return;
            if (/^\s+$/.test(word)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span");
            if (mode === "chars") {
              w.className = "cw";
              graphemes(word).forEach(function (ch) {
                var c = document.createElement("span");
                c.className = "ch"; c.style.setProperty("--ci", i++); c.textContent = ch;
                w.appendChild(c);
              });
            } else {
              w.className = "sw"; w.textContent = word; i++;
            }
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains("sr-only")) {
          walk(n);
        }
      });
    })(el);
    return i;
  }

  // 1. Big titles: letters fly in when they arrive, and ripple when you hover them.
  var titles = document.querySelectorAll(".project__title, .card__title, .chapter__title, .contact__line");
  var tio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("chars-in"); tio.unobserve(e.target); }
    });
  }, { threshold: 0.25 });
  titles.forEach(function (el) {
    if (el.querySelector("a")) return;          // keep links (contact) intact
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    split(el, "chars");
    Array.prototype.forEach.call(el.children, function (c) { c.setAttribute("aria-hidden", "true"); });
    el.classList.add("chars");
    tio.observe(el);
  });

  // 2. Ledes: words light up one by one as you scroll through them.
  var ledes = [];
  document.querySelectorAll(".project__lede, .about__lede, .ai__lede, .chapter__note").forEach(function (el) {
    var n = split(el, "words");
    el.classList.add("scrub");
    ledes.push({ el: el, words: el.querySelectorAll(".sw"), n: n, lit: -1 });
  });

  // 3. Staggered entrances inside each project (meta rows, tags, thumbnails) and the index.
  function stagger(list) { Array.prototype.forEach.call(list, function (el, i) { el.style.setProperty("--si", i); }); }
  document.querySelectorAll(".project, .card").forEach(function (p) {
    stagger(p.querySelectorAll(".project__meta > div"));
    stagger(p.querySelectorAll(".tags li"));
    stagger(p.querySelectorAll(".gallery li"));
  });
  var idx = document.querySelector(".index__list");
  if (idx && idx.getBoundingClientRect().top > vh) {
    stagger(idx.children);
    idx.classList.add("stagger");
    var iio = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { idx.classList.add("is-in"); iio.disconnect(); }
    }, { threshold: 0.1 });
    iio.observe(idx);
  }

  // 4. Screenshots drift inside their frames (parallax).
  var shots = Array.prototype.slice.call(document.querySelectorAll(".project .frame:not(.frame--small) > img, .project .frame .shot-link img, .project__shot--game img"));
  shots.forEach(function (img) { img.classList.add("para"); });

  // 5. Headings lean with scroll speed.
  var skew = 0, lastY = window.scrollY, lastT = performance.now(), shownSkew = "";
  // The lean is set on the headings themselves: a custom property on <html>
  // would make the browser restyle the whole page every frame.
  // Only headings on screen lean (each heading is split into letters, so
  // restyling all of them every frame was expensive).
  var leaners = document.querySelectorAll(".project__title, .chapter__title, .card__title");
  var onScreen = [];
  if ("IntersectionObserver" in window) {
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = onScreen.indexOf(e.target);
        if (e.isIntersecting && i < 0) { onScreen.push(e.target); e.target.style.setProperty("--skew", shownSkew || "0deg"); }
        else if (!e.isIntersecting && i >= 0) { onScreen.splice(i, 1); e.target.style.setProperty("--skew", "0deg"); }
      });
    }, { rootMargin: "100px 0px" });
    Array.prototype.forEach.call(leaners, function (el) { lio.observe(el); });
  } else onScreen = Array.prototype.slice.call(leaners);
  function setSkew(v) {
    if (v === shownSkew) return;
    shownSkew = v;
    for (var i = 0; i < onScreen.length; i++) onScreen[i].style.setProperty("--skew", v);
  }

  var queued = false, ledeRects = [], shotRects = [];
  function frame() {
    queued = false;
    vh = window.innerHeight;
    // Read every position first, then write: mixing them forces extra layouts.
    for (var a = 0; a < ledes.length; a++) ledeRects[a] = ledes[a].el.getBoundingClientRect();
    for (var b = 0; b < shots.length; b++) shotRects[b] = shots[b].parentNode.getBoundingClientRect();
    // ledes
    ledes.forEach(function (l, k) {
      var r = ledeRects[k];
      if (r.bottom < -50 || r.top > vh + 50) return;
      var p = Math.max(0, Math.min(1, (vh * 0.92 - r.top) / (vh * 0.5)));
      var lit = Math.round(p * l.n);
      if (lit === l.lit) return;
      l.lit = lit;
      for (var i = 0; i < l.words.length; i++) l.words[i].classList.toggle("on", i < lit);
    });
    // parallax
    shots.forEach(function (img, k) {
      var box = shotRects[k];
      if (box.bottom < -100 || box.top > vh + 100) return;
      var off = ((box.top + box.height / 2) - vh / 2) / vh;      // -1 .. 1 roughly
      var py = (off * -7).toFixed(2) + "%";
      if (img.__py !== py) { img.__py = py; img.style.setProperty("--py", py); }
    });
    // skew decays back to zero
    skew *= 0.85;
    if (Math.abs(skew) > 0.05) { setSkew(skew.toFixed(2) + "deg"); queued = true; requestAnimationFrame(frame); }
    else { skew = 0; setSkew("0deg"); }
  }
  window.addEventListener("scroll", function () {
    var now = performance.now(), y = window.scrollY;
    var v = (y - lastY) / Math.max(8, now - lastT);
    lastY = y; lastT = now;
    var target = Math.max(-5, Math.min(5, v * -2.2));
    if (Math.abs(target) > Math.abs(skew)) skew = target;
    window.__scrollVel = v;
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  }, { passive: true });
  frame();
})();
