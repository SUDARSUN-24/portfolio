// Small enhancements only. The page works fully without JavaScript.

// Bangkok time in the masthead.
(function () {
  var el = document.querySelector("[data-clock]");
  if (!el || !window.Intl) return;
  var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" });
  function tick() { el.textContent = fmt.format(new Date()); }
  tick();
  setInterval(tick, 30000);
})();

// Index: a screenshot follows the cursor over each project row (mouse only).
(function () {
  var img = document.querySelector(".index__preview");
  if (!img || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  img.hidden = false;

  document.querySelectorAll(".index__row").forEach(function (row) {
    var src = row.getAttribute("data-preview");
    if (!src) return;
    new Image().src = src; // warm the cache
    row.addEventListener("mouseenter", function () { img.src = src; img.classList.add("is-on"); });
    row.addEventListener("mouseleave", function () { img.classList.remove("is-on"); });
    row.addEventListener("mousemove", function (e) {
      var x = Math.min(e.clientX + 24, window.innerWidth - img.offsetWidth - 16);
      var y = Math.max(16, Math.min(e.clientY - img.offsetHeight / 2, window.innerHeight - img.offsetHeight - 16));
      img.style.setProperty("--x", x + "px");
      img.style.setProperty("--y", y + "px");
    });
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
