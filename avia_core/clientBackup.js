(function () {
  if (window.__clientBackup) return;
  window.__clientBackup = true;

  const TARGET_TEXT = "Spellchecker";
  const CLONE_KEY   = "data-lsbackup-cloned";

  function exportLS() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "localstorage-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importLS(file, onDone) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result);
        let count = 0;
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
          count++;
        }
        onDone(null, count);
      } catch (err) {
        onDone(err);
      }
    };
    reader.readAsText(file);
  }

  function buildPanel() {
    const panel = document.createElement("div");
    panel.style.cssText = `
      display: none;
      flex-direction: column;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 8px;
      background: var(--md-sys-color-surface-container-highest);
      border: 1px solid var(--md-sys-color-outline-variant);
      font-size: 12px;
      color: var(--md-sys-color-on-surface);
    `;

    const btnStyle = `
      padding: 5px 12px;
      border-radius: 4px;
      border: none;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    `;

    const status = document.createElement("span");
    status.style.cssText = "font-size: 11px; opacity: 0.7; min-height: 14px;";

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "⬇ Export localStorage";
    exportBtn.style.cssText = btnStyle + `
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
    `;
    exportBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      exportLS();
      status.textContent = `✓ Exported ${localStorage.length} keys`;
    });

    const fileInput = document.createElement("input");
    fileInput.type   = "file";
    fileInput.accept = ".json";
    fileInput.style.cssText = "display: none;";
    fileInput.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      importLS(file, (err, count) => {
        if (err) {
          status.textContent = "✗ Invalid JSON file";
        } else {
          status.textContent = `✓ Imported ${count} keys`;
        }
        fileInput.value = "";
      });
    });

    const importBtn = document.createElement("button");
    importBtn.textContent = "⬆ Import localStorage";
    importBtn.style.cssText = btnStyle + `
      background: var(--md-sys-color-surface-container);
      color: var(--md-sys-color-on-surface);
      border: 1px solid var(--md-sys-color-outline-variant);
    `;
    importBtn.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      fileInput.click();
    });

    panel.appendChild(exportBtn);
    panel.appendChild(importBtn);
    panel.appendChild(fileInput);
    panel.appendChild(status);
    return panel;
  }

  function tryInject() {
    document.querySelectorAll("a.pos_relative").forEach(btn => {
      if (
        btn.hasAttribute(CLONE_KEY) ||
        btn.hasAttribute("data-lsbackup-entry") ||
        !btn.innerText.includes(TARGET_TEXT)
      ) return;

      btn.setAttribute(CLONE_KEY, "true");

      const clone = btn.cloneNode(true);
      clone.removeAttribute(CLONE_KEY);
      clone.setAttribute("data-lsbackup-entry", "true");

      const title = clone.querySelector("div.d_flex.flex-g_1.flex-d_column > div");
      if (title) title.textContent = "AviaClient Backup";

      const desc = clone.querySelector("div.d_flex.flex-g_1.flex-d_column > span");
      if (desc) desc.textContent = "Backup or Restore all client data";

      const iconBtn = document.createElement("div");
      iconBtn.title = "LocalStorage Backup";
      iconBtn.style.cssText = "cursor: pointer; z-index: 10; flex-shrink: 0;";
      iconBtn.innerHTML = `
        <div class="fill_var(--md-sys-color-on-surface) bg_var(--md-sys-color-surface-dim) w_36px h_36px d_flex flex-sh_0 ai_center jc_center bdr_var(--borderRadius-full)">
          <span aria-hidden="true" class="material-symbols-outlined fs_inherit fw_undefined!" style="display: block; font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0;">database</span>
        </div>
      `;

      const existingIcon = clone.querySelector("div.fill_var\\(--md-sys-color-on-surface\\)");
      if (existingIcon) {
        existingIcon.replaceWith(iconBtn);
      } else {
        clone.prepend(iconBtn);
      }

      clone.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        panel.style.display = panel.style.display === "flex" ? "none" : "flex";
      });

      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display: flex; flex-direction: column;";

      const panel = buildPanel();

      wrapper.appendChild(clone);
      wrapper.appendChild(panel);

      btn.parentNode.insertBefore(wrapper, btn.nextSibling);
    });
  }

  tryInject();

  const observer = new MutationObserver(() => tryInject());
  observer.observe(document.body, { childList: true, subtree: true });
})();
