(function () {

    if (window.__AVIA_PLUGINS_LOADED__) return;
    window.__AVIA_PLUGINS_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";

    const runningPlugins = {};
    const pluginErrors = {};
    const injectionQueue = [];

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));


    function normalizePluginUrl(url) {
        try {
            const u = new URL(url);

            if (u.hostname === "github.com") {

                const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
                if (m) {
                    return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
                }

                return url;
            }


            if (u.hostname === "raw.githubusercontent.com") return url;


            if (u.hostname === "raw.codeberg.page") return url;

            if (u.hostname === "codeberg.org") {
                const parts = u.pathname.split("/").filter(Boolean);

                if (parts.length >= 5 && (parts[2] === "raw" || parts[2] === "src")) {
                    const user       = parts[0];
                    const repo       = parts[1];

                    const branchName = parts[3] === "branch" || parts[3] === "commit" || parts[3] === "tag"
                        ? parts[4]
                        : parts[3]; 
                    const fileStart  = parts[3] === "branch" || parts[3] === "commit" || parts[3] === "tag"
                        ? 5
                        : 4;
                    const filePath   = parts.slice(fileStart).join("/");
                    return `https://raw.codeberg.page/${user}/${repo}/@${branchName}/${filePath}`;
                }

                if (parts.length >= 4 && parts[2] === "raw") {
                    const user       = parts[0];
                    const repo       = parts[1];
                    const branchName = parts[3];
                    const filePath   = parts.slice(4).join("/");
                    return `https://raw.codeberg.page/${user}/${repo}/@${branchName}/${filePath}`;
                }
            }
        } catch (_) {

        }
        return url;
    }

    async function processQueue() {
        if (processQueue.running) return;
        processQueue.running = true;
        while (injectionQueue.length) {
            const { plugin, force } = injectionQueue.shift();
            await loadPluginInternal(plugin, force);
        }
        processQueue.running = false;
    }

    function queuePlugin(plugin, force = false) {
        injectionQueue.push({ plugin, force });
        processQueue();
    }

    async function loadPluginInternal(plugin, force = false) {
        if (runningPlugins[plugin.url] && !force) return;
        if (force) stopPlugin(plugin);
        try {
            const fetchUrl = normalizePluginUrl(plugin.url);
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error("Fetch failed");
            const code = await res.text();
            delete pluginErrors[plugin.url];
            const script = document.createElement("script");
            script.textContent = code;
            script.dataset.pluginUrl = plugin.url;
            document.body.appendChild(script);
            runningPlugins[plugin.url] = script;
        } catch {
            pluginErrors[plugin.url] = true;
        }
        renderPanel();
    }

    function stopPlugin(plugin) {
        const script = runningPlugins[plugin.url];
        if (!script) return;
        script.remove();
        delete runningPlugins[plugin.url];
        delete pluginErrors[plugin.url];
        renderPanel();
    }

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

    async function openViewerPanel(plugin) {
        await preloadMonaco();

        const existing = document.getElementById("avia-plugin-viewer-panel");
        if (existing) existing.remove();

        const panel = document.createElement("div");
        panel.id = "avia-plugin-viewer-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            left: "24px",
            width: "700px",
            height: "480px",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
            zIndex: "9999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            color: "#fff"
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
            gap: "10px",
            flex: "0 0 auto"
        });

        const titleText = document.createElement("span");
        titleText.textContent = `Viewing: ${plugin.name}`;
        titleText.style.flex = "1";

        const readOnlyBadge = document.createElement("span");
        readOnlyBadge.textContent = "READ ONLY";
        Object.assign(readOnlyBadge.style, {
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.08em",
            padding: "2px 8px",
            borderRadius: "20px",
            background: "rgba(255,180,0,0.15)",
            color: "#ffb400",
            border: "1px solid rgba(255,180,0,0.3)"
        });

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            cursor: "pointer",
            opacity: "0.6",
            fontSize: "15px",
            lineHeight: "1",
            padding: "2px 4px"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.6";
        closeBtn.onclick = () => panel.remove();

        header.appendChild(titleText);
        header.appendChild(readOnlyBadge);
        header.appendChild(closeBtn);

        const urlBar = document.createElement("div");
        Object.assign(urlBar.style, {
            padding: "8px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "11px",
            color: "rgba(255,255,255,0.35)",
            fontFamily: "monospace",
            background: "rgba(0,0,0,0.15)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: "0 0 auto"
        });
        urlBar.textContent = plugin.url;
        urlBar.title = plugin.url;

        const editorContainer = document.createElement("div");
        editorContainer.style.flex = "1";
        editorContainer.style.overflow = "hidden";

        const loadingMsg = document.createElement("div");
        Object.assign(loadingMsg.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            opacity: "0.4",
            fontSize: "13px"
        });
        loadingMsg.textContent = "Fetching source…";
        editorContainer.appendChild(loadingMsg);

        panel.appendChild(header);
        panel.appendChild(urlBar);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);

        enableDragOn(panel, header);

        let code;
        try {
            const fetchUrl = normalizePluginUrl(plugin.url);
            const res = await fetch(fetchUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            code = await res.text();
        } catch (err) {
            loadingMsg.textContent = `Failed to fetch source: ${err.message}`;
            loadingMsg.style.color = "#ff4d4d";
            loadingMsg.style.opacity = "1";
            return;
        }

        editorContainer.removeChild(loadingMsg);

        monaco.editor.create(editorContainer, {
            value: code,
            language: "javascript",
            theme: "vs-dark",
            readOnly: true,
            automaticLayout: true,
            minimap: { enabled: true },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: "off",
            domReadOnly: true,
            renderValidationDecorations: "off",
            renderLineHighlight: "none",
            cursorStyle: "block",
            cursorBlinking: "solid"
        });
    }

    function togglePluginsPanel() {
        let panel = document.getElementById('avia-plugins-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }
        panel = document.createElement('div');
        panel.id = 'avia-plugins-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '520px',
            height: '460px',
            background: 'var(--md-sys-color-surface, #1e1e1e)',
            color: 'var(--md-sys-color-on-surface, #fff)',
            borderRadius: '16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)'
        });

        const header = document.createElement('div');
        header.textContent = 'Plugins';
        Object.assign(header.style, {
            padding: '14px 16px',
            fontWeight: '600',
            fontSize: '14px',
            background: 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'move'
        });

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '12px',
            right: '16px',
            cursor: 'pointer',
            opacity: '0.7'
        });
        closeBtn.onclick = () => panel.style.display = 'none';

        const controlsBar = document.createElement('div');
        Object.assign(controlsBar.style, {
            padding: '12px 16px',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flex: '0 0 auto'
        });

        const content = document.createElement('div');
        content.id = 'avia-plugins-content';
        Object.assign(content.style, {
            flex: '1',
            overflow: 'auto',
            padding: '16px'
        });

        const nameInput = document.createElement('input');
        nameInput.placeholder = 'Name';
        styleInput(nameInput);
        nameInput.style.width = '110px';

        const urlInput = document.createElement('input');
        urlInput.placeholder = 'Plugin URL';
        styleInput(urlInput);
        urlInput.style.flex = '1';

        const addBtn = document.createElement('button');
        addBtn.textContent = '+ Add';
        styleBtn(addBtn);
        addBtn.onclick = () => {
            const name = nameInput.value.trim();
            const url = urlInput.value.trim();
            if (!name || !url) return;
            const plugins = getPlugins();
            plugins.push({ name, url, enabled: false });
            setPlugins(plugins);
            nameInput.value = '';
            urlInput.value = '';
            renderPanel();
        };

        const refreshAll = document.createElement('button');
        refreshAll.textContent = 'Refresh';
        styleBtn(refreshAll);
        refreshAll.onclick = () => {
            const plugins = getPlugins();
            plugins.forEach(p => {
                if (p.enabled) queuePlugin(p, true);
            });
        };

        controlsBar.appendChild(nameInput);
        controlsBar.appendChild(urlInput);
        controlsBar.appendChild(addBtn);
        controlsBar.appendChild(refreshAll);
        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(controlsBar);
        panel.appendChild(content);
        document.body.appendChild(panel);
        enableDragOn(panel, header);
        renderPanel();
    }

    function renderPanel() {
        const content = document.getElementById('avia-plugins-content');
        if (!content) return;
        content.innerHTML = '';
        const plugins = getPlugins();
        const runningSnapshot = { ...runningPlugins };
        const errorSnapshot = { ...pluginErrors };

        if (plugins.length === 0) {
            const empty = document.createElement('div');
            empty.textContent = 'No plugins yet. Add one above.';
            Object.assign(empty.style, { opacity: '0.4', fontSize: '13px' });
            content.appendChild(empty);
            return;
        }

        plugins.forEach((plugin, index) => {
            const isRunning = !!runningSnapshot[plugin.url];
            const hasError = !!errorSnapshot[plugin.url];

            const row = document.createElement('div');
            Object.assign(row.style, {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)'
            });

            const left = document.createElement('div');
            Object.assign(left.style, { display: 'flex', alignItems: 'center', gap: '10px' });

            const statusDot = document.createElement('div');
            Object.assign(statusDot.style, {
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                flexShrink: '0'
            });
            if (hasError) {
                statusDot.style.background = '#ff4d4d';
                statusDot.style.boxShadow = '0 0 6px #ff4d4d';
            } else if (isRunning) {
                statusDot.style.background = '#4dff88';
                statusDot.style.boxShadow = '0 0 6px #4dff88';
            } else {
                statusDot.style.background = '#777';
            }

            const name = document.createElement('div');
            name.textContent = plugin.name;
            name.style.fontSize = '13px';

            left.appendChild(statusDot);
            left.appendChild(name);

            const controls = document.createElement('div');
            Object.assign(controls.style, { display: 'flex', gap: '6px' });

            const toggle = document.createElement('button');
            toggle.textContent = plugin.enabled ? 'Disable' : 'Enable';
            styleBtn(toggle);
            toggle.onclick = () => {
                plugin.enabled = !plugin.enabled;
                setPlugins(plugins);
                if (plugin.enabled) queuePlugin(plugin);
                else stopPlugin(plugin);
                renderPanel();
            };

            const viewBtn = document.createElement('button');
            viewBtn.textContent = 'View';
            styleBtn(viewBtn, 'rgba(100,160,255,0.15)');
            viewBtn.onclick = () => openViewerPanel(plugin);

            const remove = document.createElement('button');
            remove.textContent = '✕';
            styleBtn(remove, 'rgba(255,80,80,0.15)');
            remove.onclick = () => {
                stopPlugin(plugin);
                plugins.splice(index, 1);
                setPlugins(plugins);
                renderPanel();
            };

            controls.appendChild(toggle);
            controls.appendChild(viewBtn);
            controls.appendChild(remove);
            row.appendChild(left);
            row.appendChild(controls);
            content.appendChild(row);
        });
    }

    function styleInput(input) {
        Object.assign(input.style, {
            padding: '6px 8px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: '13px'
        });
    }

    function styleBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: '5px 12px',
            borderRadius: '8px',
            border: 'none',
            background: bg || 'rgba(255,255,255,0.08)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '12px',
            whiteSpace: 'nowrap'
        });
        btn.onmouseenter = () => btn.style.opacity = '0.75';
        btn.onmouseleave = () => btn.style.opacity = '1';
    }

    function enableDragOn(panel, header) {
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
    }

    function injectButtons() {
        if (document.getElementById('stoat-fake-plugins')) return;
        const appearanceBtn = [...document.querySelectorAll('a')]
            .find(a => a.textContent.trim() === 'Appearance');
        if (!appearanceBtn) return;
        const referenceNode = document.getElementById('stoat-fake-quickcss');
        if (!referenceNode) return;
        const pluginsBtn = appearanceBtn.cloneNode(true);
        pluginsBtn.id = 'stoat-fake-plugins';
        const textNode = [...pluginsBtn.querySelectorAll('div')]
            .find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
        if (textNode) textNode.textContent = "(Avia) Plugins";
        const svgNS = "http://www.w3.org/2000/svg";
        const oldSvg = pluginsBtn.querySelector('svg');
        if (oldSvg) oldSvg.remove();
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";
        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5c1.5 0 2.7 1.2 2.7 2.7S5 16.2 3.5 16.2H2V20a2 2 0 002 2h3.8v-1.5c0-1.5 1.2-2.7 2.7-2.7s2.7 1.2 2.7 2.7V22H17a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z");
        svg.appendChild(path);
        pluginsBtn.insertBefore(svg, pluginsBtn.firstChild);
        pluginsBtn.addEventListener('click', togglePluginsPanel);
        referenceNode.parentElement.insertBefore(pluginsBtn, referenceNode.nextSibling);
    }

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) { obs.disconnect(); callback(); }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        injectButtons();
        preloadMonaco();
    });

    getPlugins().forEach(plugin => {
        if (plugin.enabled) queuePlugin(plugin);
    });

})();
