(function () {
  if (window.__AVIA_VERSION_PATCH__) return;
  window.__AVIA_VERSION_PATCH__ = true;

  function patchVersion() {
    document
      .querySelectorAll("span.lh_1rem.fs_0\\.75rem.ls_0\\.03125rem.fw_500")
      .forEach((el) => {
        if (el.dataset.aviaPatched) return;

        if (!el.textContent.trim().startsWith("Stoat for Desktop")) return;

        const stoatVersion = window.native.versions.desktop();

        el.dataset.aviaPatched = "true";

        el.innerHTML = `
Avia Client Desktop<br>
<span style="font-size:10px;opacity:0.7;">
    Based on Stoat ${stoatVersion}
</span>
`;
      });
  }

  const observer = new MutationObserver(patchVersion);

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  patchVersion();
})();
