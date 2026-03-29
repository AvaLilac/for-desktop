(function () {
  if (window.__customFrameNativeMenu) return;
  window.__customFrameNativeMenu = true;

  function toggleCheckbox(elem, toggle) {
    const checkbox = elem.querySelector("mdui-checkbox");
    if (!checkbox) return;

    if (toggle) {
      checkbox.setAttribute('checked', '');
      checkbox.setAttribute('value', 'on');
    } else {
      checkbox.removeAttribute('checked');
      checkbox.setAttribute('value', 'off');
    }
  }

  function initCFNM() {
    let elem = document.querySelector("#floating div:not(:empty) div.will-change_transform.flex_1_1_800px div:has(> a) > a:last-child");
    if (!elem) { return; }

    let title = elem.querySelector("div.flex-g_1 > div");
    if (!title || title.textContent.trim() !== "Custom window frame") { return; }

    let desc = elem.querySelector("div.flex-g_1 > span");
    if (!desc || desc.textContent.trim() !== "Let Stoat use its own custom titlebar.") { return; }

    var newElem = elem.cloneNode(true);
    let nTitle = newElem.querySelector("div.flex-g_1 > div");
    let nDesc = newElem.querySelector("div.flex-g_1 > span");
    if (!nTitle || !nDesc) { newElem = null; return; }

    nTitle.textContent = "Native menu on custom window frame";
    nDesc.textContent = "Use the system's native menu on the custom window frame.";

    let config = window.desktopConfig.get();
    toggleCheckbox(newElem, config.customFrameNativeMenu);

    newElem.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      let config = window.desktopConfig.get();
      config.customFrameNativeMenu = !config.customFrameNativeMenu;
      window.desktopConfig.set(config);

      toggleCheckbox(newElem, config.customFrameNativeMenu);
    });

    elem.parentNode.appendChild(newElem);
  }

  initCFNM();

  const observer = new MutationObserver(() => initCFNM());
  observer.observe(document.body, { childList: true, subtree: true });
})();
