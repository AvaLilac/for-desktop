(() => {
  if (window.__FIX_LOGIN_BG__) return;
  window.__FIX_LOGIN_BG__ = true;

  function fixLoginBackground() {
    const elem = document.querySelector(
      `#root > div > div[style^="--url: url('/app/assets/background-"][style$=".jpg');"]`,
    );
    if (!elem) return;

    elem.style.cssText = elem.style.cssText.replace(
      /^--url:/,
      "background-image:",
    );
  }

  new MutationObserver(() => {
    if (window.location.pathname === "/login") {
      fixLoginBackground();
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
