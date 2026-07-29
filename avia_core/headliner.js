(function () {
  if (window.__headliner) return;
  window.__headliner = true;

  const STYLE_ID = "headliner-style";

  const defaults = {
    content: "Stoat V 1.8.1 - Avia Client",
    left: "32",
    top: "56",
    fontSize: "15",
    fontWeight: "700",
  };

  function loadSettings() {
    try {
      return (
        JSON.parse(localStorage.getItem("headlinerSettings")) || { ...defaults }
      );
    } catch {
      return { ...defaults };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem("headlinerSettings", JSON.stringify(settings));
  }

  function buildCSS(s) {
    return `
            #headliner-titlebar-target {
                position: relative !important;
            }
            #headliner-titlebar-target::before {
                content: "${s.content}";
                position: absolute;
                left: ${s.left}px;
                top: ${s.top}%;
                transform: translateY(-50%);
                font-size: ${s.fontSize}px;
                font-weight: ${s.fontWeight};
                color: var(--md-sys-color-on-surface);
                pointer-events: none;
                z-index: 1;
            }
        `;
  }

  function findTitlebar() {
    const svgPath = document.querySelector('svg path[d^="M466.17 254c-12.65"]');
    if (svgPath) {
      const el =
        svgPath.closest('[style*="height: 29px"]') ||
        svgPath.closest('[style*="height:29px"]');
      if (el) return el;
    }
    const all = document.querySelectorAll('[style*="height: 29px"]');
    for (const el of all) {
      if (el.querySelector("a > svg")) return el;
    }
    return null;
  }

  function applyCSS() {
    const settings = loadSettings();
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }

    const titlebar = findTitlebar();
    if (titlebar && !titlebar.id) {
      titlebar.id = "headliner-titlebar-target";
    }

    style.textContent = buildCSS(settings);
  }

  function removeCSS() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
    const el = document.getElementById("headliner-titlebar-target");
    if (el) el.removeAttribute("id");
  }

  function findSpellcheckerBtn() {
    const spans = [
      ...document.querySelectorAll(
        ".settings_cont span.material-symbols-outlined",
      ),
    ];
    const icon = spans.find((s) => s.textContent.trim() === "spellcheck");
    if (!icon) return null;
    return icon.closest("a");
  }

  function applyActiveStyle(clone) {
    const desc = clone.querySelector("span:not(.material-symbols-outlined)");
    const checkbox = clone.querySelector("mdui-checkbox");

    if (window.__headlinerActive) {
      clone.setAttribute("data-active", "true");
      if (desc) desc.textContent = "Headliner is ON";
      if (checkbox) checkbox.setAttribute("checked", "");
      applyCSS();
    } else {
      clone.setAttribute("data-active", "false");
      if (desc)
        desc.textContent =
          "Modify the Stoat name in the titlebar to say anything you want";
      if (checkbox) checkbox.removeAttribute("checked");
      removeCSS();
    }
  }

  function buildPanel() {
    const s = loadSettings();

    const panel = document.createElement("div");
    panel.id = "headliner-panel";
    panel.style.cssText = `
            display: none;
            flex-direction: column;
            gap: 6px;
            padding: 10px 12px;
            border-radius: 8px;
            background: var(--md-sys-color-surface-container-highest);
            border: 1px solid var(--md-sys-color-outline-variant);
            font-size: 12px;
            color: var(--md-sys-color-on-surface);
        `;

    const fields = [
      { label: "Content", key: "content", type: "text", value: s.content },
      { label: "Left (px)", key: "left", type: "number", value: s.left },
      { label: "Top (%)", key: "top", type: "number", value: s.top },
      {
        label: "Font Size",
        key: "fontSize",
        type: "number",
        value: s.fontSize,
      },
      {
        label: "Font Weight",
        key: "fontWeight",
        type: "number",
        value: s.fontWeight,
      },
    ];

    fields.forEach(({ label, key, type, value }) => {
      const row = document.createElement("div");
      row.style.cssText =
        "display:flex; align-items:center; justify-content:space-between; gap:8px;";

      const lbl = document.createElement("label");
      lbl.textContent = label;
      lbl.style.cssText = "flex-shrink:0; font-size:11px; opacity:0.8;";

      const input = document.createElement("input");
      input.type = type;
      input.value = value;
      input.dataset.key = key;
      input.style.cssText = `
                width: ${type === "text" ? "160px" : "60px"};
                padding: 3px 6px;
                border-radius: 4px;
                border: 1px solid var(--md-sys-color-outline-variant);
                background: var(--md-sys-color-surface-container);
                color: var(--md-sys-color-on-surface);
                font-size: 11px;
            `;

      row.appendChild(lbl);
      row.appendChild(input);
      panel.appendChild(row);
    });

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Apply";
    saveBtn.style.cssText = `
            margin-top: 4px;
            padding: 4px 10px;
            border-radius: 4px;
            border: none;
            background: var(--md-sys-color-primary);
            color: var(--md-sys-color-on-primary);
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            align-self: flex-end;
        `;

    saveBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newSettings = { ...defaults };
      panel.querySelectorAll("input").forEach((input) => {
        newSettings[input.dataset.key] = input.value;
      });
      saveSettings(newSettings);
      if (window.__headlinerActive) applyCSS();
    });

    panel.appendChild(saveBtn);
    return panel;
  }

  function tryInject() {
    if (document.querySelector("[data-headliner-entry]")) return;

    const btn = findSpellcheckerBtn();
    if (!btn) return;

    const labelEl = [...btn.querySelectorAll("div, span")].find(
      (el) =>
        el.children.length === 0 && el.textContent.trim() === "Spellchecker",
    );
    if (!labelEl) return;

    const clone = btn.cloneNode(true);
    clone.setAttribute("data-headliner-entry", "true");
    clone.setAttribute("data-active", "false");

    const cloneLabel = [...clone.querySelectorAll("div, span")].find(
      (el) =>
        el.children.length === 0 && el.textContent.trim() === "Spellchecker",
    );
    if (cloneLabel) cloneLabel.textContent = "Activate headliner";

    const cloneDesc = [...clone.querySelectorAll("div, span")].find(
      (el) =>
        el.children.length === 0 &&
        el.textContent.trim() ===
          "Show corrections and suggestions as you type.",
    );
    if (cloneDesc)
      cloneDesc.textContent =
        "Modify the Stoat name in the titlebar to say anything you want";

    const cloneIcon = clone.querySelector("span.material-symbols-outlined");
    if (cloneIcon) cloneIcon.textContent = "title";

    const settingsBtn = document.createElement("div");
    settingsBtn.title = "Edit headliner settings";
    settingsBtn.style.cssText =
      "cursor:pointer;z-index:10;flex-shrink:0;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:var(--md-sys-color-surface-dim);";
    settingsBtn.innerHTML = `<span aria-hidden="true" class="material-symbols-outlined" style="display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;font-size:20px;">settings</span>`;

    const existingIconWrap = clone.querySelector(
      "span.material-symbols-outlined",
    )?.parentElement;
    if (existingIconWrap && existingIconWrap !== clone) {
      existingIconWrap.replaceWith(settingsBtn);
    } else {
      clone.prepend(settingsBtn);
    }

    const panel = buildPanel();

    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      panel.style.display = panel.style.display === "flex" ? "none" : "flex";
    });

    clone.addEventListener("click", (e) => {
      if (settingsBtn.contains(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      window.__headlinerActive = !window.__headlinerActive;
      localStorage.setItem("headlinerActive", window.__headlinerActive);
      applyActiveStyle(clone);
    });

    applyActiveStyle(clone);

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display:flex;flex-direction:column;";
    wrapper.appendChild(clone);
    wrapper.appendChild(panel);

    btn.parentNode.insertBefore(wrapper, btn.nextSibling);
  }

  new MutationObserver(() => {
    tryInject();

    window.__headlinerActive =
      localStorage.getItem("headlinerActive") === "true";
    if (window.__headlinerActive) applyCSS();
  }).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
