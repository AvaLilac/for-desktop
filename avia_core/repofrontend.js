(function () {

    if (window.__AVIA_OFFICIAL_REPO_LOADED__) return;
    window.__AVIA_OFFICIAL_REPO_LOADED__ = true;

    const STORAGE_KEY = "avia_plugins";
    const OFFICIAL_REPO_URL = "https://avalilac.github.io/PluginRepo/pluginrepobackend.js";
    const THEMES_REGISTRY_URL = "https://avalilac.github.io/PluginRepo/themebackend/themerepobackend.js";

    const getPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    let repoContent;
    let currentRepoData = [];
    let currentThemeData = [];
    let searchInput;
    let activeTab = "plugins"; // "plugins" | "themes"

    document.getElementById("avia-official-repo-btn")?.remove();

    function triggerManagerRefresh() {
        const panel = document.getElementById("avia-plugins-panel");
        if (!panel) return;
        const refreshBtn = Array.from(panel.querySelectorAll("button"))
        .find(b => b.textContent.trim() === "Refresh");
        if (refreshBtn) refreshBtn.click();
    }

    function updateInstallStates() {
        if (!repoContent) return;
        const installed = getPlugins().map(p => p.url);
        repoContent.querySelectorAll("[data-link]").forEach(row => {
            const link = row.getAttribute("data-link");
            const btn = row.querySelector("button.install-btn");
            if (!btn) return;
            if (installed.includes(link)) {
                btn.textContent = "Installed";
                btn.disabled = true;
            } else {
                btn.textContent = "Install";
                btn.disabled = false;
            }
        });
    }

    function renderRepo(data, filter = "") {
        if (!repoContent) return;

        currentRepoData = data.plugins;
        repoContent.innerHTML = "";

        const filtered = currentRepoData.filter(p =>
            (p.name + " " + (p.author || "") + " " + (p.description || ""))
            .toLowerCase()
            .includes(filter.toLowerCase())
            );

        if (filtered.length === 0) {
            repoContent.innerHTML = `<div style="opacity:0.5;text-align:center;margin-top:30px;">No plugins found.</div>`;
            return;
        }

        filtered.forEach(repoPlugin => {
            const row = document.createElement("div");
            row.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;width:100%;min-width:0;";
            row.setAttribute("data-link", repoPlugin.link);

            const left = document.createElement("div");
            left.style.cssText = "display:flex;flex-direction:column;flex:1;min-width:0;";

            const title = document.createElement("div");
            title.textContent = `${repoPlugin.name} — ${repoPlugin.author || "Unknown"}`;
            title.style.cssText = "font-weight:500;word-break:break-word;";

            const desc = document.createElement("div");
            desc.textContent = repoPlugin.description || "";
            desc.style.cssText = "font-size:12px;opacity:0.7;word-break:break-word;";

            left.appendChild(title);
            left.appendChild(desc);

            const installBtn = document.createElement("button");
            installBtn.className = "install-btn";
            Object.assign(installBtn.style, {
                padding: "6px 10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                flexShrink: "0"
            });

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

            row.appendChild(left);
            row.appendChild(installBtn);
            repoContent.appendChild(row);
        });

        updateInstallStates();
    }

    function refetchPlugins() {
        if (!repoContent) return;
        repoContent.innerHTML = "Loading...";

        function electronFetch() {
            try {
                const https = require("https");
                https.get(OFFICIAL_REPO_URL, res => {
                    let data = "";
                    res.on("data", chunk => data += chunk);
                    res.on("end", () => renderRepo(JSON.parse(data)));
                }).on("error", () => {
                    repoContent.innerHTML = "Failed to fetch repo.";
                });
            } catch {
                repoContent.innerHTML = "Failed to fetch repo.";
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

    function buildThemeCSS(theme, rawCSS) {

        const header = `/* @name ${theme.name}\n   @author ${theme.author || "Unknown"}\n   @version 1.0\n   @description Installed from Trusted Themes Repo\n*/\n`;
        return header + rawCSS;
    }

    function installThemeCSS(theme, btn) {
        btn.disabled = true;
        btn.textContent = "Installing…";

        fetch(theme.download)
        .then(r => r.text())
        .then(rawCSS => {
            const css = buildThemeCSS(theme, rawCSS);
            const themes = getStoredThemes();

            const alreadyInstalled = themes.some(t => {
                const match = t.css.match(/@name\s+(.+)/);
                return match && match[1].trim() === theme.name;
            });

            if (alreadyInstalled) {
                btn.textContent = "Installed";

                return;
            }

            themes.push({ id: crypto.randomUUID(), css, enabled: true });
            setStoredThemes(themes);

            document.querySelectorAll(".avia-theme-style").forEach(e => e.remove());
            getStoredThemes().forEach(t => {
                if (!t.enabled) return;
                const style = document.createElement("style");
                style.className = "avia-theme-style";
                style.textContent = t.css;
                document.head.appendChild(style);
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
            .toLowerCase()
            .includes(filter.toLowerCase())
            );

        if (filtered.length === 0) {
            repoContent.innerHTML = `<div style="opacity:0.5;text-align:center;margin-top:30px;">No themes found.</div>`;
            return;
        }

        filtered.forEach(theme => {
            const card = document.createElement("div");
            card.style.cssText = "margin-bottom:14px;background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);";

            if (theme.preview) {
                const img = document.createElement("img");
                img.src = theme.preview;
                img.alt = theme.name;
                img.style.cssText = "width:100%;display:block;background:#111;object-fit:contain;";
                img.onerror = () => img.style.display = "none";
                card.appendChild(img);
            }

            const info = document.createElement("div");
            info.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:10px 12px;gap:8px;";

            const meta = document.createElement("div");
            meta.style.cssText = "display:flex;flex-direction:column;min-width:0;flex:1;";

            const name = document.createElement("div");
            name.textContent = theme.name;
            name.style.cssText = "font-weight:500;word-break:break-word;";

            const author = document.createElement("div");
            author.textContent = `by ${theme.author || "Unknown"}`;
            author.style.cssText = "font-size:12px;opacity:0.6;";

            meta.appendChild(name);
            meta.appendChild(author);

            const alreadyInstalled = getStoredThemes().some(t => {
                const match = t.css.match(/@name\s+(.+)/);
                return match && match[1].trim() === theme.name;
            });

            const dlBtn = document.createElement("button");
            dlBtn.textContent = alreadyInstalled ? "Installed" : "Install CSS";
            dlBtn.disabled = alreadyInstalled;
            Object.assign(dlBtn.style, {
                padding: "6px 10px",
                borderRadius: "8px",
                border: "none",
                cursor: alreadyInstalled ? "default" : "pointer",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                flexShrink: "0",
                fontSize: "12px",
                whiteSpace: "nowrap"
            });
            dlBtn.onclick = () => installThemeCSS(theme, dlBtn);

            info.appendChild(meta);
            info.appendChild(dlBtn);
            card.appendChild(info);
            repoContent.appendChild(card);
        });
    }

    function refetchThemes() {
        if (!repoContent) return;
        repoContent.innerHTML = "Loading themes...";
        currentThemeData = [];

        fetch(THEMES_REGISTRY_URL)
        .then(r => r.json())
        .then(async registry => {
            const sources = registry.sources || [];
            const results = await Promise.allSettled(
                sources.map(s => fetch(s.url).then(r => r.json()))
                );
            results.forEach(r => {
                if (r.status === "fulfilled") {
                    currentThemeData.push(...(r.value.themes || []));
                }
            });
            renderThemes(searchInput.value);
        })
        .catch(() => {
            if (repoContent) repoContent.innerHTML = "Failed to fetch themes.";
        });
    }

    function switchTab(tab, tabPluginsBtn, tabThemesBtn) {
        activeTab = tab;
        const isPlugins = tab === "plugins";

        tabPluginsBtn.style.background = isPlugins ? "rgba(255,255,255,0.12)" : "transparent";
        tabPluginsBtn.style.color = isPlugins ? "#fff" : "rgba(255,255,255,0.45)";
        tabThemesBtn.style.background = !isPlugins ? "rgba(255,255,255,0.12)" : "transparent";
        tabThemesBtn.style.color = !isPlugins ? "#fff" : "rgba(255,255,255,0.45)";

        searchInput.placeholder = isPlugins
        ? "Search plugins, authors, or descriptions"
        : "Search themes or authors";
        searchInput.value = "";

        if (isPlugins) {
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

        panel = document.createElement("div");
        panel.id = "avia-official-repo-window";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "40px",
            right: "40px",
            width: "420px",
            height: "520px",
            background: "#1e1e1e",
            color: "#fff",
            borderRadius: "20px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)"
        });

        const header = document.createElement("div");
        header.textContent = "Plugins & Themes Repo";
        Object.assign(header.style, {
            padding: "18px",
            fontWeight: "600",
            fontSize: "16px",
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            position: "relative",
            textAlign: "center",
            userSelect: "none"
        });

        let isDragging = false, offsetX = 0, offsetY = 0;
        header.addEventListener("mousedown", (e) => {
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
        document.addEventListener("mousemove", (e) => {
            if (!isDragging) return;
            panel.style.left = e.clientX - offsetX + "px";
            panel.style.top = e.clientY - offsetY + "px";
        });
        document.addEventListener("mouseup", () => {
            isDragging = false;
            document.body.style.userSelect = "";
        });

        const close = document.createElement("div");
        close.textContent = "✕";
        Object.assign(close.style, { position: "absolute", right: "18px", top: "16px", cursor: "pointer" });
        close.onclick = () => panel.style.display = "none";
        header.appendChild(close);

        const tabs = document.createElement("div");
        tabs.style.cssText = "display:flex;gap:6px;padding:10px 12px 0;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.08);";

        const tabStyle = "padding:6px 16px;border-radius:8px 8px 0 0;border:none;cursor:pointer;font-size:13px;font-weight:500;transition:background 0.15s,color 0.15s;font-family:inherit;";

        const tabPluginsBtn = document.createElement("button");
        tabPluginsBtn.textContent = "Plugins";
        tabPluginsBtn.style.cssText = tabStyle;

        const tabThemesBtn = document.createElement("button");
        tabThemesBtn.textContent = "Themes";
        tabThemesBtn.style.cssText = tabStyle;

        tabPluginsBtn.onclick = () => switchTab("plugins", tabPluginsBtn, tabThemesBtn);
        tabThemesBtn.onclick = () => switchTab("themes", tabPluginsBtn, tabThemesBtn);

        tabs.appendChild(tabPluginsBtn);
        tabs.appendChild(tabThemesBtn);

        searchInput = document.createElement("input");
        searchInput.placeholder = "Search plugins, authors, or descriptions";
        Object.assign(searchInput.style, {
            margin: "12px",
            padding: "8px",
            borderRadius: "8px",
            border: "none",
            outline: "none",
            background: "rgba(255,255,255,0.06)",
            color: "#fff"
        });
        searchInput.addEventListener("input", () => {
            if (activeTab === "plugins") renderRepo({ plugins: currentRepoData }, searchInput.value);
            else renderThemes(searchInput.value);
        });

        repoContent = document.createElement("div");
        Object.assign(repoContent.style, {
            flex: "1",
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0 12px 12px"
        });

        const container = document.createElement("div");
        Object.assign(container.style, { flex: "1", display: "flex", flexDirection: "column", overflow: "hidden" });
        container.appendChild(searchInput);
        container.appendChild(repoContent);

        panel.appendChild(header);
        panel.appendChild(tabs);
        panel.appendChild(container);
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

    window.addEventListener("avia-plugin-list-changed", () => {
        if (document.getElementById("avia-official-repo-window")) {
            updateInstallStates();
        }
    });

    new MutationObserver(() => injectSettingsButton())
    .observe(document.body, { childList: true, subtree: true });

    injectSettingsButton();

})();
