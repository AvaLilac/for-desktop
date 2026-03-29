(function () {
  if (window.__disableTrayClick) return;
  window.__disableTrayClick = true;

  function toggleCheckbox(elem, value) {
    const checkbox = elem.querySelector("mdui-checkbox");
    if (!checkbox) return;

    if (value) {
      checkbox.setAttribute("checked", "");
      checkbox.setAttribute("value", "on");
    } else {
      checkbox.removeAttribute("checked");
      checkbox.setAttribute("value", "off");
    }
  }

  function createButton(baseElem) {
    const newElem = baseElem.cloneNode(true);

    newElem.setAttribute("data-disable-tray-click", "true");

    const title = newElem.querySelector("div.d_flex.flex-g_1 > div");
    const desc = newElem.querySelector("div.d_flex.flex-g_1 > span");
    const icon = newElem.querySelector("div.w_36px span.material-symbols-outlined");

    if (title) title.textContent = "Disable Tray Icon Click";
    if (desc) desc.textContent = "Prevents tray icon from toggling the app window.";
    if (icon) icon.textContent = "block";

    let config = window.desktopConfig.get();
    toggleCheckbox(newElem, config.disableTrayClick);

    newElem.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      let config = window.desktopConfig.get();
      config.disableTrayClick = !config.disableTrayClick;
      window.desktopConfig.set(config);

      toggleCheckbox(newElem, config.disableTrayClick);
    });

    return newElem;
  }

  function injectButton() {
    const base = Array.from(document.querySelectorAll("a")).find((e) => {
      const t = e.querySelector("div.d_flex.flex-g_1 > div");
      return t && t.textContent.trim() === "Discord RPC";
    });

    if (!base) return;
    if (document.querySelector("[data-disable-tray-click]")) return;

    const newButton = createButton(base);
    base.parentNode.appendChild(newButton);
  }

  injectButton();

  const observer = new MutationObserver(() => injectButton());

  observer.observe(document.body, { childList: true, subtree: true });
})();