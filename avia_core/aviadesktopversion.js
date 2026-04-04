(function () {
  if (window.__AVIA_DESKTOP_PATCH__) return;
  window.__AVIA_DESKTOP_PATCH__ = true;

  function patchButton() {
    document
      .querySelectorAll("a.pos_relative.gap_16px.p_13px")
      .forEach((el) => {
        if (el.dataset.aviaPatched) return;

        const textContainer = el.querySelector(
          "div.d_flex.flex-g_1.flex-d_column",
        );
        if (!textContainer) return;

        const nameDiv = textContainer.querySelector("div");
        const versionSpan = textContainer.querySelector("span.lh_1rem");

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
      });
  }

  const observer = new MutationObserver(patchButton);
  observer.observe(document.body, { childList: true, subtree: true });
  patchButton();
})();
