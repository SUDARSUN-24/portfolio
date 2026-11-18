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
