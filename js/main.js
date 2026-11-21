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
  var queued = false;
  function update() {
    queued = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--progress", max > 0 ? Math.min(1, window.scrollY / max) : 0);
  }
  window.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
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
