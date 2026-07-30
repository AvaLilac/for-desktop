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

    if (!versionSpan.textContent.toLowerCase().startsWith("version: ")) return;

    const aviaVersion = window.native.versions.aviaClient();

    el.dataset.aviaPatched = "true";

    nameDiv.style.cssText = versionSpan.style.cssText;
    nameDiv.className = versionSpan.className;

    versionSpan.textContent = `Web: ${versionSpan.textContent.substring(9)}`;
    nameDiv.textContent = `Avia Client Desktop: ${aviaVersion}`;
  }

  const observer = new MutationObserver(patchButton);
  observer.observe(document.body, { childList: true, subtree: true });
  patchButton();
})();
