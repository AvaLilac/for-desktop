(function () {
  if (window.__AVIA_DESKTOP_PATCH__) return;
  window.__AVIA_DESKTOP_PATCH__ = true;

  function patchButton() {
    const el = document.querySelector(".settings_sidebar .content > div");

    if (!el || el.dataset.aviaPatched) return;

    const textContainer = el.lastElementChild;
    if (!textContainer) return;

    const versionSpan = textContainer.querySelector("span:first-child");
    const nameDiv = versionSpan?.nextElementSibling;

    if (!nameDiv || !versionSpan) return;
    if (!nameDiv.textContent.includes("Stoat for Desktop")) return;

    if (!versionSpan.textContent.includes("Version:")) return;

    const aviaVersion = window.native.versions.aviaClient();
    const stoatVersion = window.native.versions.desktop();

    el.dataset.aviaPatched = "true";

    nameDiv.textContent = "Avia Client Desktop";
    versionSpan.textContent = `Version ${aviaVersion} (Based on Stoat ${stoatVersion})`;

    textContainer.style.whiteSpace = "normal";
    textContainer.style.overflow = "visible";
  }

  const observer = new MutationObserver(patchButton);
  observer.observe(document.body, { childList: true, subtree: true });
  patchButton();
})();
