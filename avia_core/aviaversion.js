(function () {
  if (window.__AVIA_VERSION_PATCH__) return;
  window.__AVIA_VERSION_PATCH__ = true;

  function patchVersion() {
    const button = [
      ...document.querySelectorAll(
        ".settings_cont > div > span + div > div div > a",
      ),
    ].find((a) => {
      const label = a.querySelector("div:last-child > div:first-child");
      if (label?.textContent === "Stoat for Desktop") return a;
    });
    const buttonHeaderLabel = button?.querySelector(
      "div:last-child > div:first-child",
    );
    const buttonSubheaderLabel = button?.querySelector(
      "div:last-child > span:last-child",
    );

    if (
      !button ||
      !buttonHeaderLabel ||
      !buttonSubheaderLabel ||
      buttonHeaderLabel.textContent !== "Stoat for Desktop"
    )
      return;

    const stoatVersion = window.native.versions.desktop();
    const aviaVersion = window.native.versions.aviaClient();

    buttonHeaderLabel.dataset.aviaPatched = "true";
    buttonHeaderLabel.textContent = "Avia Client Desktop";
    buttonSubheaderLabel.textContent = `Verison ${aviaVersion} (Based on Stoat ${stoatVersion})`;
  }

  new MutationObserver(() => patchVersion()).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
