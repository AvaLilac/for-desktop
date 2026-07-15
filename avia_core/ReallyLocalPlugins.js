(function () {

    if (window.__REALLY_LOCAL_PLUGINS__) return;
    window.__REALLY_LOCAL_PLUGINS__ = true;

    const ENABLED_KEY = "avia_reallylocalplugins_status";

    const runningPlugins = {};
    const pluginErrors = {};

    const getEnabled = () => JSON.parse(localStorage.getItem(ENABLED_KEY) || "[]");
    const setEnabled = (arr) => localStorage.setItem(ENABLED_KEY, JSON.stringify(arr));

    function enablePlugin(filename) {
        const enabled = getEnabled();
        if (!enabled.includes(filename)) {
            enabled.push(filename);
            setEnabled(enabled);
        }
    }

    function disablePlugin(filename) {
        setEnabled(getEnabled().filter(f => f !== filename));
    }

    function isEnabled(filename) {
        return getEnabled().includes(filename);
    }

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    function runPlugin(plugin) {
        stopPlugin(plugin);
        try {
            const script = document.createElement("script");
            script.textContent = plugin.code || "";
            script.dataset.reallyLocalId = plugin.filename;
            document.body.appendChild(script);
            runningPlugins[plugin.filename] = script;
            delete pluginErrors[plugin.filename];
        } catch {
            pluginErrors[plugin.filename] = true;
        }
        enablePlugin(plugin.filename);
    }

    function stopPlugin(plugin) {
        const script = runningPlugins[plugin.filename];
        if (script) {
            script.remove();
            delete runningPlugins[plugin.filename];
            delete pluginErrors[plugin.filename];
        }
        disablePlugin(plugin.filename);
    }

    async function openEditorPanel(plugin, onSave) {
        await preloadMonaco();

        const existing = document.getElementById("avia-rlp-editor-panel");
        if (existing) existing.remove();

        const panel = document.createElement("div");
        panel.id = "avia-rlp-editor-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            left: "24px",
            width: "680px",
            height: "460px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            zIndex: "9999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        header.textContent = `Editing: ${plugin.name}`;
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            color: "#fff",
            flex: "0 0 auto"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            position: "absolute",
            top: "12px",
            right: "16px",
            cursor: "pointer",
            opacity: "0.7",
            color: "#fff",
            zIndex: "1"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.7";
        closeBtn.onclick = () => panel.remove();

        const toolbar = document.createElement("div");
        Object.assign(toolbar.style, {
            padding: "8px 16px",
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flex: "0 0 auto"
        });

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "💾 Save";
        styleEditorBtn(saveBtn, "#2d6a4f");

        const saveRunBtn = document.createElement("button");
        saveRunBtn.textContent = "▶ Save & Run";
        styleEditorBtn(saveRunBtn, "#1b4332");

        toolbar.appendChild(saveBtn);
        toolbar.appendChild(saveRunBtn);

        const editorContainer = document.createElement("div");
        editorContainer.style.flex = "1";

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(toolbar);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);

        const code = await window.aviaPlugins.read(plugin.filename) || "";

        const editor = monaco.editor.create(editorContainer, {
            value: code,
            language: "javascript",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on"
        });

        saveBtn.onclick = async () => {
            const newCode = editor.getValue();
            await window.aviaPlugins.write(plugin.filename, newCode);
            plugin.code = newCode;
            onSave(newCode, false);
            saveBtn.textContent = "✓ Saved";
            setTimeout(() => saveBtn.textContent = "💾 Save", 1200);
        };

        saveRunBtn.onclick = async () => {
            const newCode = editor.getValue();
            await window.aviaPlugins.write(plugin.filename, newCode);
            plugin.code = newCode;
            onSave(newCode, true);
            saveRunBtn.textContent = "✓ Ran!";
            setTimeout(() => saveRunBtn.textContent = "▶ Save & Run", 1200);
        };

        enableEditorDrag(panel, header);
    }

    function styleEditorBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 14px",
            borderRadius: "8px",
            border: "none",
            background: bg || "rgba(255,255,255,0.1)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.8";
        btn.onmouseleave = () => btn.style.opacity = "1";
    }

    function enableEditorDrag(panel, handle) {
        let isDragging = false, offsetX, offsetY;
        handle.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });
    }

    function togglePanel() {
        let panel = document.getElementById("avia-rlp-panel");
        if (panel) {
            panel.style.display = panel.style.display === "none" ? "flex" : "none";
            if (panel.style.display === "flex") renderPanel();
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-rlp-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "560px",
            width: "560px",
            height: "520px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            color: "var(--md-sys-color-on-surface, #fff)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            zIndex: "999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)"
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: "0 0 auto"
        });

        const headerTitle = document.createElement("span");
        headerTitle.textContent = "Really Local Plugins";

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            cursor: "pointer",
            opacity: "0.7",
            fontSize: "15px",
            lineHeight: "1",
            padding: "2px 4px"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.7";
        closeBtn.onclick = () => panel.style.display = "none";

        header.appendChild(headerTitle);
        header.appendChild(closeBtn);

        const controlsBar = document.createElement("div");
        Object.assign(controlsBar.style, {
            padding: "12px 16px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flex: "0 0 auto"
        });

        const nameInput = document.createElement("input");
        nameInput.placeholder = "Plugin name";
        styleLocalInput(nameInput);
        nameInput.style.flex = "1";

        const addBtn = document.createElement("button");
        addBtn.textContent = "+ New";
        styleLocalBtn(addBtn);
        addBtn.onclick = async () => {
            const name = nameInput.value.trim();
            if (!name) return;
            const filename = name.endsWith(".js") ? name : name + ".js";
            const ok = await window.aviaPlugins.create(filename);
            if (!ok) return;
            nameInput.value = "";
            renderPanel(searchInput.value.toLowerCase());
        };

        const importBtn = document.createElement("button");
        importBtn.textContent = "Import";
        styleLocalBtn(importBtn, "#2d6a4f");

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".js";
        fileInput.multiple = true;
        fileInput.style.display = "none";

        importBtn.onclick = () => fileInput.click();

        fileInput.onchange = async () => {
            const files = [...fileInput.files];
            if (!files.length) return;
            for (const file of files) {
                const text = await file.text();
                await window.aviaPlugins.write(file.name, text);
            }
            fileInput.value = "";
            renderPanel(searchInput.value.toLowerCase());
        };

        controlsBar.appendChild(nameInput);
        controlsBar.appendChild(addBtn);
        controlsBar.appendChild(importBtn);
        controlsBar.appendChild(fileInput);

        const searchBar = document.createElement("div");
        Object.assign(searchBar.style, {
            padding: "10px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flex: "0 0 auto"
        });

        const searchInput = document.createElement("input");
        searchInput.placeholder = "Search plugins…";
        styleLocalInput(searchInput);
        searchInput.style.width = "100%";
        searchInput.oninput = () => renderPanel(searchInput.value.toLowerCase());
        searchBar.appendChild(searchInput);

        const content = document.createElement("div");
        content.id = "avia-rlp-content";
        Object.assign(content.style, {
            flex: "1",
            overflowY: "auto",
            padding: "12px 16px 16px",
            scrollbarWidth: "none",
            msOverflowStyle: "none"
        });

        if (!document.getElementById("avia-rlp-scrollbar-hide")) {
            const s = document.createElement("style");
            s.id = "avia-rlp-scrollbar-hide";
            s.textContent = "#avia-rlp-content::-webkit-scrollbar{display:none}";
            document.head.appendChild(s);
        }

        panel.appendChild(header);
        panel.appendChild(controlsBar);
        panel.appendChild(searchBar);
        panel.appendChild(content);

        const dropOverlay = document.createElement("div");
        dropOverlay.textContent = "Import JS files";
        Object.assign(dropOverlay.style, {
            position: "absolute",
            inset: "0",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "600",
            color: "#fff",
            opacity: "0",
            pointerEvents: "none",
            transition: "opacity 0.15s ease",
            borderRadius: "16px"
        });
        panel.appendChild(dropOverlay);

        document.body.appendChild(panel);

        let dragDepth = 0;

        panel.addEventListener("dragenter", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth++;
            dropOverlay.style.opacity = "1";
            panel.style.border = "1px dashed rgba(255,255,255,0.4)";
        });
        panel.addEventListener("dragover", e => { e.preventDefault(); e.stopPropagation(); });
        panel.addEventListener("dragleave", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth--;
            if (dragDepth <= 0) {
                dropOverlay.style.opacity = "0";
                panel.style.border = "1px solid rgba(255,255,255,0.08)";
                dragDepth = 0;
            }
        });
        panel.addEventListener("drop", async e => {
            e.preventDefault();
            e.stopPropagation();
            dropOverlay.style.opacity = "0";
            panel.style.border = "1px solid rgba(255,255,255,0.08)";
            dragDepth = 0;
            const files = [...e.dataTransfer.files].filter(f => f.name.endsWith(".js"));
            if (!files.length) return;
            for (const file of files) {
                const text = await file.text();
                await window.aviaPlugins.write(file.name, text);
            }
            renderPanel(searchInput.value.toLowerCase());
        });

        let isDragging = false, offsetX, offsetY;
        header.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => { isDragging = false; document.body.style.userSelect = ""; });
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });

        renderPanel();
    }

    async function renderPanel(filter = "") {
        const content = document.getElementById("avia-rlp-content");
        if (!content) return;
        content.innerHTML = "";

        const files = await window.aviaPlugins.list();

        const filtered = filter
            ? files.filter(p => p.name.toLowerCase().includes(filter))
            : files;

        const visible = [...filtered].reverse();

        if (visible.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = files.length === 0
                ? "No plugins yet. Add one above."
                : "No plugins match your search.";
            Object.assign(empty.style, { opacity: "0.4", fontSize: "13px", textAlign: "center", padding: "24px 0" });
            content.appendChild(empty);
            return;
        }

        const sectionLabel = document.createElement("div");
        sectionLabel.textContent = `Really Local Plugins: ${visible.length}`;
        Object.assign(sectionLabel.style, {
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "10px"
        });
        content.appendChild(sectionLabel);

        const grid = document.createElement("div");
        Object.assign(grid.style, {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "10px"
        });

        visible.forEach(plugin => {
            const running = !!runningPlugins[plugin.filename];
            const hasError = !!pluginErrors[plugin.filename];

            const card = document.createElement("div");
            Object.assign(card.style, {
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${hasError ? "rgba(255,77,77,0.3)" : running ? "rgba(77,255,136,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: "10px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
            });
            card.onmouseenter = () => {
                if (!hasError && !running) card.style.borderColor = "rgba(255,255,255,0.13)";
            };
            card.onmouseleave = () => {
                card.style.borderColor = hasError ? "rgba(255,77,77,0.3)" : running ? "rgba(77,255,136,0.25)" : "rgba(255,255,255,0.06)";
            };

            const topRow = document.createElement("div");
            Object.assign(topRow.style, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" });

            const nameWrap = document.createElement("div");
            Object.assign(nameWrap.style, { display: "flex", alignItems: "center", gap: "7px", minWidth: "0", flex: "1" });

            const dot = document.createElement("div");
            Object.assign(dot.style, {
                width: "8px", height: "8px", borderRadius: "50%", flexShrink: "0",
                background: hasError ? "#ff4d4d" : running ? "#4dff88" : "#555",
                boxShadow: hasError ? "0 0 5px #ff4d4d" : running ? "0 0 5px #4dff88" : "none"
            });

            const nameEl = document.createElement("div");
            nameEl.textContent = plugin.name;
            Object.assign(nameEl.style, { fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });

            nameWrap.appendChild(dot);
            nameWrap.appendChild(nameEl);

            const switchWrap = document.createElement("div");
            Object.assign(switchWrap.style, { position: "relative", width: "36px", height: "20px", flexShrink: "0", cursor: "pointer" });

            const track = document.createElement("div");
            Object.assign(track.style, {
                position: "absolute", inset: "0", borderRadius: "10px",
                background: running ? "rgba(100,160,255,0.6)" : "rgba(255,255,255,0.15)",
                transition: "background 0.2s"
            });

            const thumb = document.createElement("div");
            Object.assign(thumb.style, {
                position: "absolute", top: "3px", left: running ? "19px" : "3px",
                width: "14px", height: "14px", borderRadius: "50%", background: "#fff",
                transition: "left 0.2s", pointerEvents: "none"
            });

            switchWrap.appendChild(track);
            switchWrap.appendChild(thumb);

            switchWrap.onclick = async () => {
                if (runningPlugins[plugin.filename]) {
                    stopPlugin(plugin);
                } else {
                    const code = await window.aviaPlugins.read(plugin.filename);
                    plugin.code = code || "";
                    runPlugin(plugin);
                }
                renderPanel(filter);
            };

            topRow.appendChild(nameWrap);
            topRow.appendChild(switchWrap);

            const footer = document.createElement("div");
            Object.assign(footer.style, { display: "flex", gap: "6px", marginTop: "auto", paddingTop: "2px" });

            const editBtn = document.createElement("button");
            editBtn.textContent = "✏ Edit";
            styleLocalBtn(editBtn, "rgba(100,140,255,0.2)");
            editBtn.style.flex = "1";
            editBtn.onclick = () => {
                openEditorPanel(plugin, (newCode, andRun) => {
                    plugin.code = newCode;
                    if (andRun) runPlugin(plugin);
                    renderPanel(filter);
                });
            };

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "✕";
            styleLocalBtn(removeBtn, "rgba(255,80,80,0.15)");
            removeBtn.onclick = async () => {
                stopPlugin(plugin);
                const editorPanel = document.getElementById("avia-rlp-editor-panel");
                if (editorPanel) editorPanel.remove();
                await window.aviaPlugins.delete(plugin.filename);
                renderPanel(filter);
            };

            footer.appendChild(editBtn);
            footer.appendChild(removeBtn);

            card.appendChild(topRow);
            card.appendChild(footer);
            grid.appendChild(card);
        });

        content.appendChild(grid);
    }

    function styleLocalInput(input) {
        Object.assign(input.style, {
            padding: "6px 8px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff", fontSize: "13px"
        });
    }

    function styleLocalBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 12px", borderRadius: "8px", border: "none",
            background: bg || "rgba(255,255,255,0.08)",
            color: "#fff", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.75";
        btn.onmouseleave = () => btn.style.opacity = "1";
    }

    function injectButton() {
        if (document.getElementById("avia-rlp-btn")) return;
        const appearanceBtn = [...document.querySelectorAll("a")]
            .find(a => a.textContent.trim() === "Appearance");
        if (!appearanceBtn) return;
        const aviaPluginsBtn = document.getElementById("stoat-fake-plugins");
        if (!aviaPluginsBtn) return;

        const localBtn = appearanceBtn.cloneNode(true);
        localBtn.id = "avia-rlp-btn";

        const textNode = [...localBtn.querySelectorAll("div")]
            .find(d => d.children.length === 0 && d.textContent.trim() === "Appearance");
        if (textNode) textNode.textContent = "(Avia) Really Local Plugins";

        const oldSvg = localBtn.querySelector("svg");
        if (oldSvg) oldSvg.remove();
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";
        const pathEl = document.createElementNS(svgNS, "path");
        pathEl.setAttribute("d", "M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5c1.5 0 2.7 1.2 2.7 2.7S5 16.2 3.5 16.2H2V20a2 2 0 002 2h3.8v-1.5c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7V22H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z");
        svg.appendChild(pathEl);
        localBtn.insertBefore(svg, localBtn.firstChild);
        localBtn.addEventListener("click", togglePanel);
        aviaPluginsBtn.parentElement.insertBefore(localBtn, aviaPluginsBtn.nextSibling);
    }

    function registerWithAviaMenu() {
        if (window.AviaMenu) {
            window.AviaMenu.register({ id: "avia_plugins_really_local", name: "Really Local Plugins", icon: "extension", onClick: togglePanel });
        } else {
            const interval = setInterval(() => {
                if (window.AviaMenu) {
                    clearInterval(interval);
                    window.AviaMenu.register({ id: "avia_plugins_really_local", name: "Really Local Plugins", icon: "extension", onClick: togglePanel });
                }
            }, 100);
        }
    }

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) { obs.disconnect(); callback(); }
        }).observe(document.documentElement, { childList: true });
    }

    async function bootEnabledPlugins() {
        const enabled = getEnabled();
        if (!enabled.length) return;
        const files = await window.aviaPlugins.list();
        for (const file of files) {
            if (enabled.includes(file.filename)) {
                const code = await window.aviaPlugins.read(file.filename);
                file.code = code || "";
                const script = document.createElement("script");
                script.textContent = file.code;
                script.dataset.reallyLocalId = file.filename;
                document.body.appendChild(script);
                runningPlugins[file.filename] = script;
            }
        }
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectButton());
        observer.observe(document.body, { childList: true, subtree: true });
        injectButton();
    });

    preloadMonaco();
    registerWithAviaMenu();
    bootEnabledPlugins();

})();
