(function () {
  if (window.__headliner) return;
  window.__headliner = true;

  window.__headlinerActive = localStorage.getItem("headlinerActive") === "true";

  const TARGET_TEXT = "Spellchecker";
  const CLONE_KEY   = "data-headliner-cloned";
  const STYLE_ID    = "headliner-style";

  const defaults = {
    content:    "Stoat V 1.5.0 - Avia Client",
    left:       "32",
    top:        "56",
    fontSize:   "15",
    fontWeight: "700"
  };

  function loadSettings() {
    try {
      return JSON.parse(localStorage.getItem("headlinerSettings")) || { ...defaults };
    } catch {
      return { ...defaults };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem("headlinerSettings", JSON.stringify(settings));
  }

  function buildCSS(s) {
    return `
      svg path[d^="M466.17 254c-12.65"],
      svg path[d^="M734.245 254c-15.377"] {
        display: none !important;
      }
      .flex-sh_0.h_29px.us_none.d_flex.ai_center.fill_var\\(--md-sys-color-on-surface\\).c_var\\(--md-sys-color-outline\\).bg_var\\(--md-sys-color-surface-container-high\\) {
        position: relative !important;
      }
      .flex-sh_0.h_29px.us_none.d_flex.ai_center.fill_var\\(--md-sys-color-on-surface\\).c_var\\(--md-sys-color-outline\\).bg_var\\(--md-sys-color-surface-container-high\\)::before {
        content: "${s.content}";
        position: absolute;
        left: ${s.left}px;
        top: ${s.top}%;
        transform: translateY(-50%);
        font-size: ${s.fontSize}px;
        font-weight: ${s.fontWeight};
        color: var(--md-sys-color-on-surface);
        pointer-events: none;
      }
    `;
  }

  function applyCSS() {
    const settings = loadSettings();
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = buildCSS(settings);
  }

  function removeCSS() {
    const style = document.getElementById(STYLE_ID);
    if (style) style.remove();
  }

  if (window.__headlinerActive) applyCSS();

  function applyActiveStyle(clone) {
    const desc     = clone.querySelector("div.d_flex.flex-g_1.flex-d_column > span");
    const checkbox = clone.querySelector("mdui-checkbox");

    if (window.__headlinerActive) {
      clone.setAttribute("data-active", "true");
      if (desc)     desc.textContent = "Headliner is ON";
      if (checkbox) checkbox.setAttribute("checked", "");
      applyCSS();
    } else {
      clone.setAttribute("data-active", "false");
      if (desc)     desc.textContent = "Modify the Stoat name in the titlebar to say anything you want";
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
      { label: "Content",     key: "content",    type: "text",   value: s.content    },
      { label: "Left (px)",   key: "left",       type: "number", value: s.left       },
      { label: "Top (%)",     key: "top",        type: "number", value: s.top        },
      { label: "Font Size",   key: "fontSize",   type: "number", value: s.fontSize   },
      { label: "Font Weight", key: "fontWeight", type: "number", value: s.fontWeight }
    ];

    fields.forEach(({ label, key, type, value }) => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:8px;";

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

    saveBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const newSettings = { ...defaults };
      panel.querySelectorAll("input").forEach(input => {
        newSettings[input.dataset.key] = input.value;
      });
      saveSettings(newSettings);
      if (window.__headlinerActive) applyCSS();
    });

    panel.appendChild(saveBtn);
    return panel;
  }

  function tryInject() {
    document.querySelectorAll("a.pos_relative").forEach(btn => {
      if (
        btn.hasAttribute(CLONE_KEY) ||
        btn.hasAttribute("data-headliner-entry") ||
        !btn.innerText.includes(TARGET_TEXT)
      ) return;

      btn.setAttribute(CLONE_KEY, "true");

      const clone = btn.cloneNode(true);
      clone.removeAttribute(CLONE_KEY);
      clone.setAttribute("data-headliner-entry", "true");
      clone.setAttribute("data-active", "false");

      const title = clone.querySelector("div.d_flex.flex-g_1.flex-d_column > div");
      if (title) title.textContent = "Activate headliner";

      const settingsBtn = document.createElement("div");
      settingsBtn.title = "Edit headliner settings";
      settingsBtn.style.cssText = "cursor: pointer; z-index: 10; flex-shrink: 0;";
      settingsBtn.innerHTML = `
        <div class="fill_var(--md-sys-color-on-surface) bg_var(--md-sys-color-surface-dim) w_36px h_36px d_flex flex-sh_0 ai_center jc_center bdr_var(--borderRadius-full)">
          <span aria-hidden="true" class="material-symbols-outlined fs_inherit fw_undefined!" style="display: block; font-variation-settings: &quot;FILL&quot; 0, &quot;wght&quot; 400, &quot;GRAD&quot; 0;">settings</span>
        </div>
      `;

      const existingIcon = clone.querySelector("div.fill_var\\(--md-sys-color-on-surface\\)");
      if (existingIcon) {
        existingIcon.replaceWith(settingsBtn);
      } else {
        clone.prepend(settingsBtn);
      }

      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display: flex; flex-direction: column;";

      const panel = buildPanel();

      settingsBtn.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        panel.style.display = panel.style.display === "flex" ? "none" : "flex";
      });

      clone.addEventListener("click", e => {
        if (settingsBtn.contains(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        window.__headlinerActive = !window.__headlinerActive;
        localStorage.setItem("headlinerActive", window.__headlinerActive);
        applyActiveStyle(clone);
      });

      applyActiveStyle(clone);

      wrapper.appendChild(clone);
      wrapper.appendChild(panel);

      btn.parentNode.insertBefore(wrapper, btn.nextSibling);
    });
  }

  tryInject();

  const observer = new MutationObserver(() => tryInject());
  observer.observe(document.body, { childList: true, subtree: true });
})();
