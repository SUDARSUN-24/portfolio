// Small enhancements only. The page works fully without JavaScript.

// "Copy" button next to the email address.
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
