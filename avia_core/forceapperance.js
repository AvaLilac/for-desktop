(function () {
  "use strict";

  if (window.__AVIA_FORCE_ENGLISH__) return;
  window.__AVIA_FORCE_ENGLISH__ = true;

  function setAppearanceLabel() {
    const label = document.querySelector(
      `.settings_sidebar .content a.button:not([id^='avia-']):not([id^='stoat-fake-'])
          > div> svg:has(> path[d^='M12 22C6.49 22']) + div > div`,
    );
    if (label && label.textContent !== "Appearance") {
      label.textContent = "Appearance";
    }
  }

  function setUserSettingsLabel() {
    const label = document.querySelector(
      `.settings_sidebar .content > div
          > div:nth-child(2):not(#avia-cloned-settings):has(svg > path[d^='M12 2C6.48 2'])
          > span:first-child`,
    );
    if (label && label.textContent !== "User Settings") {
      label.textContent = "User Settings";
    }
  }

  function setUserCardJoinedLabel() {
    const card = document.querySelector(
      `#floating div:not(:has(> div)):has(
          > span:nth-of-type(5),
          > span:nth-of-type(3)
      ):has(> span > div:only-child)`,
    );
    if (!card) return;

    let header = card.firstElementChild;
    let subheader = header?.nextElementSibling?.firstElementChild;

    if (
      header &&
      subheader &&
      header.tagName === "span" &&
      header.textContent !== "Joined" &&
      subheader.tagName === "div" &&
      subheader.textContent === "Stoat"
    ) {
      header.textContent = "Joined";
    }
  }

  new MutationObserver(() => {
    setAppearanceLabel();
    setUserSettingsLabel();
    setUserCardJoinedLabel();
  }).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
