(function () {

    if (window.__AVIA_LOCAL_PLUGINS_LOADED__) return;
    window.__AVIA_LOCAL_PLUGINS_LOADED__ = true;

    const STORAGE_KEY = "avia_local_plugins";

    const runningLocalPlugins = {};
    const localPluginErrors = {};

    const getLocalPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setLocalPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    function runLocalPlugin(plugin) {
        stopLocalPlugin(plugin);
        try {
            const script = document.createElement("script");
            script.textContent = plugin.code || "";
            script.dataset.localPluginId = plugin.id;
            document.body.appendChild(script);
            runningLocalPlugins[plugin.id] = script;
            delete localPluginErrors[plugin.id];
        } catch (e) {
            localPluginErrors[plugin.id] = true;
        }
        renderLocalPanel();
    }

    function stopLocalPlugin(plugin) {
        const script = runningLocalPlugins[plugin.id];
        if (!script) return;
        script.remove();
        delete runningLocalPlugins[plugin.id];
        delete localPluginErrors[plugin.id];
        renderLocalPanel();
    }

    async function openEditorPanel(plugin, onSave) {
        await preloadMonaco();

        // Remove any existing editor panel first
        const existing = document.getElementById("avia-local-editor-panel");
        if (existing) existing.remove();

        const panel = document.createElement("div");
        panel.id = "avia-local-editor-panel";
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

        const editor = monaco.editor.create(editorContainer, {
            value: plugin.code || "// Write your plugin code here\n",
            language: "javascript",
            theme: "vs-dark",
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "on"
        });

        saveBtn.onclick = () => {
            onSave(editor.getValue(), false);

            saveBtn.textContent = "✓ Saved";
            setTimeout(() => saveBtn.textContent = "💾 Save", 1200);
        };

        saveRunBtn.onclick = () => {
            onSave(editor.getValue(), true);
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

    function toggleLocalPanel() {
        let panel = document.getElementById("avia-local-plugins-panel");
        if (panel) {
            panel.style.display = panel.style.display === "none" ? "flex" : "none";
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-local-plugins-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "560px", // sit beside the main plugins panel
            width: "520px",
            height: "460px",
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
        header.textContent = "Local Plugins";
        Object.assign(header.style, {
            padding: "14px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            position: "absolute",
            top: "12px",
            right: "16px",
            cursor: "pointer",
            opacity: "0.7"
        });
        closeBtn.onclick = () => panel.style.display = "none";

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
        addBtn.onclick = () => {
            const name = nameInput.value.trim();
            if (!name) return;
            const plugins = getLocalPlugins();
            const newPlugin = {
                id: "local_" + Date.now(),
                name,
                code: "// " + name + "\n",
                enabled: false
            };
            plugins.push(newPlugin);
            setLocalPlugins(plugins);
            nameInput.value = "";
            renderLocalPanel();
        };

        controlsBar.appendChild(nameInput);
        controlsBar.appendChild(addBtn);

        const content = document.createElement("div");
        content.id = "avia-local-plugins-content";
        Object.assign(content.style, {
            flex: "1",
            overflow: "auto",
            padding: "16px"
        });

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(controlsBar);
        panel.appendChild(content);
        document.body.appendChild(panel);

        let isDragging = false, offsetX, offsetY;
        header.addEventListener("mousedown", e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });
        document.addEventListener("mouseup", () => isDragging = false);
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + "px";
            panel.style.top = (e.clientY - offsetY) + "px";
            panel.style.right = "auto";
            panel.style.bottom = "auto";
        });

        renderLocalPanel();
    }

    function renderLocalPanel() {
        const content = document.getElementById("avia-local-plugins-content");
        if (!content) return;
        content.innerHTML = "";
        const plugins = getLocalPlugins();

        if (plugins.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No local plugins yet. Add one above.";
            empty.style.opacity = "0.4";
            empty.style.fontSize = "13px";
            content.appendChild(empty);
            return;
        }

        plugins.forEach((plugin, index) => {
            const isRunning = !!runningLocalPlugins[plugin.id];
            const hasError = !!localPluginErrors[plugin.id];

            const row = document.createElement("div");
            Object.assign(row.style, {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)"
            });

            // Left: dot + name
            const left = document.createElement("div");
            Object.assign(left.style, { display: "flex", alignItems: "center", gap: "10px" });

            const statusDot = document.createElement("div");
            Object.assign(statusDot.style, { width: "10px", height: "10px", borderRadius: "50%", flexShrink: "0" });
            if (hasError) {
                statusDot.style.background = "#ff4d4d";
                statusDot.style.boxShadow = "0 0 6px #ff4d4d";
            } else if (isRunning) {
                statusDot.style.background = "#4dff88";
                statusDot.style.boxShadow = "0 0 6px #4dff88";
            } else {
                statusDot.style.background = "#777";
            }

            const name = document.createElement("div");
            name.textContent = plugin.name;
            name.style.fontSize = "13px";

            left.appendChild(statusDot);
            left.appendChild(name);

            // Right: controls
            const controls = document.createElement("div");
            Object.assign(controls.style, { display: "flex", gap: "6px" });

            const editBtn = document.createElement("button");
            editBtn.textContent = "✏ Edit";
            styleLocalBtn(editBtn, "rgba(100,140,255,0.2)");
            editBtn.onclick = () => {
                openEditorPanel(plugin, (newCode, andRun) => {
                    const all = getLocalPlugins();
                    const target = all.find(p => p.id === plugin.id);
                    if (target) {
                        target.code = newCode;
                        plugin.code = newCode; // keep local ref in sync
                        setLocalPlugins(all);
                    }
                    if (andRun) {
                        plugin.enabled = true;
                        if (target) target.enabled = true;
                        setLocalPlugins(getLocalPlugins().map(p => p.id === plugin.id ? { ...p, code: newCode, enabled: true } : p));
                        runLocalPlugin(plugin);
                    }
                    renderLocalPanel();
                });
            };

            const toggleBtn = document.createElement("button");
            toggleBtn.textContent = plugin.enabled ? "Disable" : "Enable";
            styleLocalBtn(toggleBtn);
            toggleBtn.onclick = () => {
                const all = getLocalPlugins();
                const target = all.find(p => p.id === plugin.id);
                if (!target) return;
                target.enabled = !target.enabled;
                plugin.enabled = target.enabled;
                setLocalPlugins(all);
                if (target.enabled) runLocalPlugin(plugin);
                else stopLocalPlugin(plugin);
                renderLocalPanel();
            };

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "✕";
            styleLocalBtn(removeBtn, "rgba(255,80,80,0.15)");
            removeBtn.onclick = () => {
                stopLocalPlugin(plugin);
                // Close editor if open for this plugin
                const editorPanel = document.getElementById("avia-local-editor-panel");
                if (editorPanel) editorPanel.remove();
                const all = getLocalPlugins();
                all.splice(all.findIndex(p => p.id === plugin.id), 1);
                setLocalPlugins(all);
                renderLocalPanel();
            };

            controls.appendChild(editBtn);
            controls.appendChild(toggleBtn);
            controls.appendChild(removeBtn);
            row.appendChild(left);
            row.appendChild(controls);
            content.appendChild(row);
        });
    }

    function styleLocalInput(input) {
        Object.assign(input.style, {
            padding: "6px 8px",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "#fff",
            fontSize: "13px"
        });
    }

    function styleLocalBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 12px",
            borderRadius: "8px",
            border: "none",
            background: bg || "rgba(255,255,255,0.08)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            whiteSpace: "nowrap"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.75";
        btn.onmouseleave = () => btn.style.opacity = "1";
    }

    function injectLocalButton() {
        if (document.getElementById("avia-local-plugins-btn")) return;
        const appearanceBtn = [...document.querySelectorAll("a")]
            .find(a => a.textContent.trim() === "Appearance");
        if (!appearanceBtn) return;
        // Anchor to the existing (Avia) Plugins button if present, else fall back
        const aviaPluginsBtn = document.getElementById("stoat-fake-plugins");
        if (!aviaPluginsBtn) return;

        const localBtn = appearanceBtn.cloneNode(true);
        localBtn.id = "avia-local-plugins-btn";

        const textNode = [...localBtn.querySelectorAll("div")]
            .find(d => d.children.length === 0 && d.textContent.trim() === "Appearance");
        if (textNode) textNode.textContent = "(Avia) Local Plugins";

        // Code icon svg
        const oldSvg = localBtn.querySelector("svg");
        if (oldSvg) oldSvg.remove();
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";
        const path = document.createElementNS(svgNS, "path");
        // </> icon path
        path.setAttribute("d", "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z");
        svg.appendChild(path);
        localBtn.insertBefore(svg, localBtn.firstChild);

        localBtn.addEventListener("click", toggleLocalPanel);
        aviaPluginsBtn.parentElement.insertBefore(localBtn, aviaPluginsBtn.nextSibling);
    }


    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) { obs.disconnect(); callback(); }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectLocalButton());
        observer.observe(document.body, { childList: true, subtree: true });
        injectLocalButton();
    });

    // Auto-run enabled local plugins on load
    getLocalPlugins().forEach(plugin => {
        if (plugin.enabled) runLocalPlugin(plugin);
    });

    preloadMonaco();

})();