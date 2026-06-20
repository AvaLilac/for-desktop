(function () {

    if (window.__AVIA_OFFICIAL_REPO_LOADED__) return;
    window.__AVIA_OFFICIAL_REPO_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";
    const OFFICIAL_REPO_URL = "https://raw.githubusercontent.com/AvaLilac/PluginRepo/refs/heads/main/pluginrepobackend.js";
    const THEMES_REGISTRY_URL = "https://raw.githubusercontent.com/AvaLilac/PluginRepo/refs/heads/main/themebackend/themerepobackend.js";

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    let repoContent;
    let currentRepoData = [];
    let currentThemeData = [];
    let searchInput;
    let activeTab = "plugins";

    document.getElementById("avia-official-repo-btn")?.remove();

    function injectStyles() {
        if (document.getElementById("avia-repo-styles")) return;
        const style = document.createElement("style");
        style.id = "avia-repo-styles";
        style.textContent = `
            #avia-official-repo-window * { box-sizing: border-box; }

            #avia-repo-content::-webkit-scrollbar { width: 4px; }
            #avia-repo-content::-webkit-scrollbar-track { background: transparent; }
            #avia-repo-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }

            .avia-repo-plugin-card {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 10px 12px;
                border-radius: 10px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                margin-bottom: 8px;
            }

            .avia-repo-card-top {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .avia-repo-meta { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
            .avia-repo-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.92); word-break: break-word; }
            .avia-repo-author-row { display: flex; align-items: center; gap: 6px; }
            .avia-repo-author-badge {
                font-size: 10px;
                font-weight: 500;
                color: rgba(255,255,255,0.5);
                background: rgba(255,255,255,0.07);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 4px;
                padding: 1px 6px;
                white-space: nowrap;
                max-width: 200px;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .avia-repo-desc { font-size: 11px; color: #fff; word-break: break-word; white-space: normal; line-height: 1.5; }

            .avia-repo-install-btn {
                padding: 5px 13px;
                border-radius: 7px;
                border: 1px solid rgba(255,255,255,0.12);
                background: rgba(255,255,255,0.07);
                color: rgba(255,255,255,0.85);
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                flex-shrink: 0;
                transition: background 0.15s, opacity 0.15s;
                font-family: inherit;
                white-space: nowrap;
            }
            .avia-repo-install-btn:hover:not(:disabled) { background: rgba(255,255,255,0.13); }
            .avia-repo-install-btn:disabled { opacity: 0.4; cursor: default; }

            .avia-repo-theme-card {
                border-radius: 10px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                overflow: hidden;
                margin-bottom: 8px;
                transition: background 0.15s, border-color 0.15s;
            }
            .avia-repo-theme-card:hover {
                background: rgba(255,255,255,0.06);
                border-color: rgba(255,255,255,0.10);
            }
            .avia-repo-theme-preview {
                width: 100%;
                display: block;
                object-fit: cover;
            }
            .avia-repo-theme-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 9px 12px;
                gap: 8px;
            }
            .avia-repo-theme-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.92); }
            .avia-repo-theme-author { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 2px; }

            .avia-repo-tab {
                padding: 8px 14px;
                border: none;
                background: transparent;
                color: rgba(255,255,255,0.4);
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                font-family: inherit;
                position: relative;
                transition: color 0.15s;
                border-bottom: 2px solid transparent;
                margin-bottom: -1px;
            }
            .avia-repo-tab:hover { color: rgba(255,255,255,0.75); }
            .avia-repo-tab.active {
                color: rgba(255,255,255,0.95);
                border-bottom-color: rgba(255,255,255,0.55);
            }

            .avia-repo-search {
                width: 100%;
                padding: 7px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.1);
                outline: none;
                background: rgba(255,255,255,0.05);
                color: #fff;
                font-size: 12px;
                font-family: inherit;
                transition: border-color 0.15s, background 0.15s;
            }
            .avia-repo-search::placeholder { color: rgba(255,255,255,0.3); }
            .avia-repo-search:focus {
                border-color: rgba(255,255,255,0.2);
                background: rgba(255,255,255,0.07);
            }
            .avia-repo-count {
                font-size: 10px;
                font-weight: 500;
                color: rgba(255,255,255,0.35);
                background: rgba(255,255,255,0.06);
                border-radius: 4px;
                padding: 1px 6px;
                margin-left: 4px;
                vertical-align: middle;
            }

            .avia-repo-btn-group { display: flex; flex-direction: row; gap: 6px; flex-shrink: 0; align-items: flex-start; }

            .avia-repo-empty {
                opacity: 0.35;
                text-align: center;
                margin-top: 40px;
                font-size: 13px;
                color: rgba(255,255,255,0.8);
            }
        `;
        document.head.appendChild(style);
    }

    function triggerManagerRefresh() {
        const panel = document.getElementById("avia-plugins-panel");
        if (!panel) return;
        const refreshBtn = Array.from(panel.querySelectorAll("button"))
            .find(b => b.textContent.trim() === "Refresh");
        if (refreshBtn) refreshBtn.click();
    }

    const LOCAL_STORAGE_KEY = "avia_local_plugins";
    const getLocalPlugins = () => JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
    const setLocalPlugins = (data) => localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    function isInstalledLocally(name) {
        return getLocalPlugins().some(p => p.name === name);
    }

    function rawUrlFromLink(link) {
        try {
            const u = new URL(link);

            if (u.hostname === "github.com") {
                const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
                if (m) {
                    return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
                }
                return link;
            }

            if (u.hostname === "raw.githubusercontent.com") return link;

            if (u.hostname === "raw.codeberg.page") return link;

            if (u.hostname === "codeberg.org") {

                if (u.pathname.startsWith("/api/v1/repos/")) return link;

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

                    return `https://codeberg.org/api/v1/repos/${user}/${repo}/raw/${filePath}?ref=${branchName}`;
                }

                if (parts.length >= 4 && parts[2] === "raw") {
                    const user       = parts[0];
                    const repo       = parts[1];
                    const branchName = parts[3];
                    const filePath   = parts.slice(4).join("/");

                    return `https://codeberg.org/api/v1/repos/${user}/${repo}/raw/${filePath}?ref=${branchName}`;
                }

                if (parts.length >= 5 && parts[2] === "src" && parts[3] === "branch") {
                    const user     = parts[0];
                    const repo     = parts[1];
                    const branch   = parts[4];
                    const filePath = parts.slice(5).join("/");
                    return `https://codeberg.org/api/v1/repos/${user}/${repo}/raw/${filePath}?ref=${branch}`;
                }
            }
        } catch (_) {}
        return link;
    }

    async function installToLocal(plugin, btn) {
        btn.disabled = true;
        btn.textContent = "Fetching…";

        const rawUrl = rawUrlFromLink(plugin.link);

        try {
            const res = await fetch(rawUrl);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const code = await res.text();

            const locals = getLocalPlugins();
            if (locals.some(p => p.name === plugin.name)) {
                btn.textContent = "In Local";
                return;
            }

            locals.push({
                id: "local_" + Date.now() + "_" + Math.random().toString(36).slice(2),
                name: plugin.name,
                code,
                enabled: false
            });
            setLocalPlugins(locals);

            window.dispatchEvent(new Event("avia-local-plugin-list-changed"));

            btn.textContent = "In Local";
        } catch (e) {
            btn.disabled = false;
            btn.textContent = "Local ✕";
            setTimeout(() => {
                btn.textContent = "Install to local";
                btn.disabled = false;
            }, 2000);
        }
    }

    function updateInstallStates() {
        if (!repoContent) return;
        const installed = getPlugins().map(p => p.url);
        repoContent.querySelectorAll("[data-link]").forEach(card => {
            const link = card.getAttribute("data-link");
            const name = card.getAttribute("data-name");
            const btn = card.querySelector("button.install-btn");
            const localBtn = card.querySelector("button.local-install-btn");
            if (btn) {
                if (installed.includes(link)) {
                    btn.textContent = "Installed";
                    btn.disabled = true;
                } else {
                    btn.textContent = "Install";
                    btn.disabled = false;
                }
            }
            if (localBtn) {
                if (isInstalledLocally(name)) {
                    localBtn.textContent = "In Local";
                    localBtn.disabled = true;
                } else {
                    localBtn.textContent = "Install to local";
                    localBtn.disabled = false;
                }
            }
        });
    }

    function renderRepo(data, filter = "") {
        if (!repoContent) return;
        currentRepoData = data.plugins;
        repoContent.innerHTML = "";

        const filtered = currentRepoData.filter(p =>
            (p.name + " " + (p.author || "") + " " + (p.description || ""))
                .toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            repoContent.innerHTML = `<div class="avia-repo-empty">No plugins found.</div>`;
            return;
        }

        filtered.forEach(repoPlugin => {
            const card = document.createElement("div");
            card.className = "avia-repo-plugin-card";
            card.setAttribute("data-link", repoPlugin.link);
            card.setAttribute("data-name", repoPlugin.name);

            const topRow = document.createElement("div");
            topRow.style.cssText = "display:flex;align-items:flex-start;gap:10px;";

            const nameMeta = document.createElement("div");
            nameMeta.style.cssText = "display:flex;flex-direction:column;gap:4px;flex:1;min-width:0;";

            const name = document.createElement("div");
            name.className = "avia-repo-name";
            name.textContent = repoPlugin.name;

            const authorRow = document.createElement("div");
            authorRow.className = "avia-repo-author-row";

            const authorBadge = document.createElement("span");
            authorBadge.className = "avia-repo-author-badge";
            authorBadge.textContent = repoPlugin.author || "Unknown";
            authorRow.appendChild(authorBadge);

            nameMeta.appendChild(name);
            nameMeta.appendChild(authorRow);

            const btnGroup = document.createElement("div");
            btnGroup.className = "avia-repo-btn-group";

            const localBtn = document.createElement("button");
            localBtn.className = "avia-repo-install-btn local-install-btn";
            localBtn.textContent = "Install to local";
            localBtn.onclick = () => installToLocal(repoPlugin, localBtn);

            const installBtn = document.createElement("button");
            installBtn.className = "avia-repo-install-btn install-btn";
            installBtn.onclick = () => {
                const plugins = getPlugins();
                if (!plugins.some(p => p.url === repoPlugin.link)) {
                    plugins.push({ name: repoPlugin.name, url: repoPlugin.link, enabled: false });
                    setPlugins(plugins);
                    window.dispatchEvent(new Event("avia-plugin-list-changed"));
                    triggerManagerRefresh();
                    renderRepo({ plugins: currentRepoData }, searchInput.value);
                }
            };

            btnGroup.appendChild(localBtn);
            btnGroup.appendChild(installBtn);

            topRow.appendChild(nameMeta);
            topRow.appendChild(btnGroup);
            card.appendChild(topRow);

            if (repoPlugin.description) {
                const desc = document.createElement("div");
                desc.className = "avia-repo-desc";
                desc.textContent = repoPlugin.description;
                card.appendChild(desc);
            }

            repoContent.appendChild(card);
        });

        updateInstallStates();
    }

    function refetchPlugins() {
        if (!repoContent) return;
        repoContent.innerHTML = `<div class="avia-repo-empty">Loading plugins…</div>`;

        function electronFetch() {
            try {
                const https = require("https");
                https.get(OFFICIAL_REPO_URL, res => {
                    let data = "";
                    res.on("data", chunk => data += chunk);
                    res.on("end", () => renderRepo(JSON.parse(data)));
                }).on("error", () => {
                    repoContent.innerHTML = `<div class="avia-repo-empty">Failed to fetch plugins.</div>`;
                });
            } catch {
                repoContent.innerHTML = `<div class="avia-repo-empty">Failed to fetch plugins.</div>`;
            }
        }

        try {
            fetch(OFFICIAL_REPO_URL)
                .then(res => res.json())
                .then(data => renderRepo(data))
                .catch(() => electronFetch());
        } catch {
            electronFetch();
        }
    }

    const THEMES_STORAGE_KEY = "avia_themes";
    const getStoredThemes = () => JSON.parse(localStorage.getItem(THEMES_STORAGE_KEY) || "[]");
    const setStoredThemes = (data) => localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(data));

    function installThemeCSS(theme, btn) {
        btn.disabled = true;
        btn.textContent = "Installing…";

        fetch(theme.download)
            .then(r => r.text())
            .then(rawCSS => {
                const themes = getStoredThemes();

                const alreadyInstalled = themes.some(t => {
                    const match = t.css.match(/@name\s+(.+)/);
                    return match && match[1].trim() === theme.name;
                });

                if (alreadyInstalled) {
                    btn.textContent = "Installed";
                    return;
                }

                themes.push({ id: crypto.randomUUID(), css: rawCSS, enabled: true });
                setStoredThemes(themes);

                document.querySelectorAll(".avia-theme-style").forEach(e => e.remove());
                getStoredThemes().forEach(t => {
                    if (!t.enabled) return;
                    const s = document.createElement("style");
                    s.className = "avia-theme-style";
                    s.textContent = t.css;
                    document.head.appendChild(s);
                });

                if (typeof window.__avia_refresh_themes_panel === "function") {
                    window.__avia_refresh_themes_panel();
                }

                btn.textContent = "Installed";
            })
            .catch(() => {
                btn.textContent = "Install CSS";
                btn.disabled = false;
                alert("Failed to fetch theme CSS.");
            });
    }

    function renderThemes(filter = "") {
        if (!repoContent) return;
        repoContent.innerHTML = "";

        const filtered = currentThemeData.filter(t =>
            (t.name + " " + (t.author || ""))
                .toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            repoContent.innerHTML = `<div class="avia-repo-empty">No themes found.</div>`;
            return;
        }

        filtered.forEach(theme => {
            const card = document.createElement("div");
            card.className = "avia-repo-theme-card";

            if (theme.preview) {
                const img = document.createElement("img");
                img.src = theme.preview;
                img.alt = theme.name;
                img.className = "avia-repo-theme-preview";
                img.onerror = () => img.style.display = "none";
                card.appendChild(img);
            }

            const info = document.createElement("div");
            info.className = "avia-repo-theme-info";

            const metaDiv = document.createElement("div");
            metaDiv.style.minWidth = "0";
            metaDiv.style.flex = "1";

            const nameDv = document.createElement("div");
            nameDv.className = "avia-repo-theme-name";
            nameDv.textContent = theme.name;

            const authorDv = document.createElement("div");
            authorDv.className = "avia-repo-theme-author";
            authorDv.textContent = theme.author || "Unknown";

            metaDiv.appendChild(nameDv);
            metaDiv.appendChild(authorDv);

            const alreadyInstalled = getStoredThemes().some(t => {
                const match = t.css.match(/@name\s+(.+)/);
                return match && match[1].trim() === theme.name;
            });

            const dlBtn = document.createElement("button");
            dlBtn.className = "avia-repo-install-btn";
            dlBtn.textContent = alreadyInstalled ? "Installed" : "Install CSS";
            dlBtn.disabled = alreadyInstalled;
            dlBtn.onclick = () => installThemeCSS(theme, dlBtn);

            info.appendChild(metaDiv);
            info.appendChild(dlBtn);
            card.appendChild(info);
            repoContent.appendChild(card);
        });
    }

    function refetchThemes() {
        if (!repoContent) return;
        repoContent.innerHTML = `<div class="avia-repo-empty">Loading themes…</div>`;
        currentThemeData = [];

        fetch(THEMES_REGISTRY_URL)
            .then(r => r.json())
            .then(async registry => {
                const sources = registry.sources || [];
                const results = await Promise.allSettled(
                    sources.map(s => fetch(s.url).then(r => r.json()))
                );
                results.forEach(r => {
                    if (r.status === "fulfilled") currentThemeData.push(...(r.value.themes || []));
                });
                renderThemes(searchInput.value);
            })
            .catch(() => {
                if (repoContent) repoContent.innerHTML = `<div class="avia-repo-empty">Failed to fetch themes.</div>`;
            });
    }

    function switchTab(tab, tabPluginsBtn, tabThemesBtn) {
        activeTab = tab;
        tabPluginsBtn.classList.toggle("active", tab === "plugins");
        tabThemesBtn.classList.toggle("active", tab === "themes");

        searchInput.placeholder = tab === "plugins"
            ? "Search plugins or authors…"
            : "Search themes or authors…";
        searchInput.value = "";

        if (tab === "plugins") {
            if (currentRepoData.length > 0) renderRepo({ plugins: currentRepoData });
            else refetchPlugins();
        } else {
            if (currentThemeData.length > 0) renderThemes();
            else refetchThemes();
        }
    }

    function openWindow() {
        let panel = document.getElementById("avia-official-repo-window");
        if (panel) {
            panel.style.display = panel.style.display === "none" ? "flex" : "none";
            return;
        }

        injectStyles();

        panel = document.createElement("div");
        panel.id = "avia-official-repo-window";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "40px",
            width: "420px",
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
            padding: "13px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            position: "relative",
            textAlign: "center",
            userSelect: "none",
            flexShrink: "0"
        });
        header.textContent = "Plugins & Themes Repo";

        const close = document.createElement("div");
        close.textContent = "✕";
        Object.assign(close.style, {
            position: "absolute",
            right: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
            opacity: "0.5",
            fontSize: "13px",
            lineHeight: "1"
        });
        close.onmouseenter = () => close.style.opacity = "1";
        close.onmouseleave = () => close.style.opacity = "0.5";
        close.onclick = () => panel.style.display = "none";
        header.appendChild(close);

        let isDragging = false, offsetX = 0, offsetY = 0;
        header.addEventListener("mousedown", e => {
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            panel.style.bottom = "auto";
            panel.style.right = "auto";
            panel.style.left = rect.left + "px";
            panel.style.top = rect.top + "px";
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mousemove", e => {
            if (!isDragging) return;
            panel.style.left = e.clientX - offsetX + "px";
            panel.style.top = e.clientY - offsetY + "px";
        });
        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });

        const tabBar = document.createElement("div");
        Object.assign(tabBar.style, {
            display: "flex",
            padding: "0 12px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: "0"
        });

        const tabPluginsBtn = document.createElement("button");
        tabPluginsBtn.className = "avia-repo-tab";
        tabPluginsBtn.textContent = "Plugins";

        const tabThemesBtn = document.createElement("button");
        tabThemesBtn.className = "avia-repo-tab";
        tabThemesBtn.textContent = "Themes";

        tabPluginsBtn.onclick = () => switchTab("plugins", tabPluginsBtn, tabThemesBtn);
        tabThemesBtn.onclick = () => switchTab("themes", tabPluginsBtn, tabThemesBtn);

        tabBar.appendChild(tabPluginsBtn);
        tabBar.appendChild(tabThemesBtn);

        const searchWrap = document.createElement("div");
        Object.assign(searchWrap.style, {
            padding: "10px 12px",
            flexShrink: "0",
            borderBottom: "1px solid rgba(255,255,255,0.06)"
        });

        searchInput = document.createElement("input");
        searchInput.className = "avia-repo-search";
        searchInput.placeholder = "Search plugins or authors…";
        searchInput.addEventListener("input", () => {
            if (activeTab === "plugins") renderRepo({ plugins: currentRepoData }, searchInput.value);
            else renderThemes(searchInput.value);
        });

        searchWrap.appendChild(searchInput);

        repoContent = document.createElement("div");
        repoContent.id = "avia-repo-content";
        Object.assign(repoContent.style, {
            flex: "1",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "10px 12px 12px"
        });

        panel.appendChild(header);
        panel.appendChild(tabBar);
        panel.appendChild(searchWrap);
        panel.appendChild(repoContent);
        document.body.appendChild(panel);

        switchTab("plugins", tabPluginsBtn, tabThemesBtn);
        refetchPlugins();
    }

    function injectSettingsButton() {
        if (document.getElementById("avia-official-repo-btn-settings")) return;

        const appearanceBtn = [...document.querySelectorAll("a")]
            .find(a => a.textContent.trim() === "Appearance");
        const referenceNode = document.getElementById("stoat-fake-quickcss");
        if (!appearanceBtn || !referenceNode) return;

        const clone = appearanceBtn.cloneNode(true);
        clone.id = "avia-official-repo-btn-settings";

        const label = [...clone.querySelectorAll("div")].find(d => d.children.length === 0);
        if (label) label.textContent = "(Avia)  Plugins/Themes Repo";

        const iconSpan = clone.querySelector("span.material-symbols-outlined");
        if (iconSpan) {
            iconSpan.textContent = "extension";
            iconSpan.style.fontVariationSettings = "'FILL' 0,'wght' 400,'GRAD' 0";
        }

        clone.onclick = openWindow;
        referenceNode.parentElement.insertBefore(clone, referenceNode.nextSibling);
    }

    function registerWithAviaMenu() {
        if (window.AviaMenu) {
            window.AviaMenu.register({ id: "avia_official_repo", name: "Plugins & Themes Repo", icon: "palette", onClick: openWindow });
        } else {
            const interval = setInterval(() => {
                if (window.AviaMenu) {
                    clearInterval(interval);
                    window.AviaMenu.register({ id: "avia_official_repo", name: "Plugins & Themes Repo", icon: "palette", onClick: openWindow });
                }
            }, 100);
        }
    }

    window.addEventListener("avia-plugin-list-changed", () => {
        if (document.getElementById("avia-official-repo-window")) updateInstallStates();
    });

    window.addEventListener("avia-local-plugin-list-changed", () => {
        if (document.getElementById("avia-official-repo-window")) updateInstallStates();
    });

    new MutationObserver(() => injectSettingsButton())
        .observe(document.body, { childList: true, subtree: true });

    injectSettingsButton();
    registerWithAviaMenu();

})();
