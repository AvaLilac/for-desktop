(function () {
    if (window.__clientBackup) return;
    window.__clientBackup = true;

    const CLONE_KEY = "data-lsbackup-entry";

    function exportLS() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            data[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
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
        exportBtn.style.cssText = btnStyle + `background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);`;
        exportBtn.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            exportLS();
            status.textContent = `✓ Exported ${localStorage.length} keys`;
        });

        const fileInput = document.createElement("input");
        fileInput.type = "file";
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
        importBtn.style.cssText = btnStyle + `background: var(--md-sys-color-surface-container); color: var(--md-sys-color-on-surface); border: 1px solid var(--md-sys-color-outline-variant);`;
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

    function tryInject() {
        if (document.querySelector(`[${CLONE_KEY}]`)) return;

        const btn = findSpellcheckerBtn();
        if (!btn) return;

        const clone = btn.cloneNode(true);
        clone.setAttribute(CLONE_KEY, "true");

        const cloneLabel = [...clone.querySelectorAll("div, span")].find(
            (el) => el.children.length === 0 && el.textContent.trim() === "Spellchecker",
        );
        if (cloneLabel) cloneLabel.textContent = "AviaClient Backup";

        const cloneDesc = [...clone.querySelectorAll("div, span")].find(
            (el) => el.children.length === 0 && el.textContent.trim() === "Show corrections and suggestions as you type.",
        );
        if (cloneDesc) cloneDesc.textContent = "Backup or Restore all client data";

        const cloneIcon = clone.querySelector("span.material-symbols-outlined");
        if (cloneIcon) cloneIcon.textContent = "database";

        const panel = buildPanel();

        clone.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            panel.style.display = panel.style.display === "flex" ? "none" : "flex";
        });

        const wrapper = document.createElement("div");
        wrapper.style.cssText = "display: flex; flex-direction: column;";
        wrapper.appendChild(clone);
        wrapper.appendChild(panel);

        btn.parentNode.insertBefore(wrapper, btn.nextSibling);
    }

    new MutationObserver(() => tryInject()).observe(document.body, {
        childList: true,
        subtree: true,
    });

})();
