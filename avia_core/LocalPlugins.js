(function () {

if (window.__LOCAL_PLUGINS__) return;
window.__LOCAL_PLUGINS__ = true;

const STORAGE_KEY = "avia_local_plugins";
const runningLocalPlugins = {};
const localPluginErrors = {};

const getLocalPlugins = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const setLocalPlugins = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

function rawUrlFromLink(link) {
    try {
        const u = new URL(link);
        if (u.hostname === "github.com") {
            const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
            if (m) return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}/${m[4]}`;
            return link;
        }
        if (u.hostname === "raw.githubusercontent.com") return link;
        if (u.hostname === "raw.codeberg.page") return link;
        if (u.hostname === "codeberg.org") {

            if (u.pathname.startsWith("/api/v1/repos/")) return link;
            const parts = u.pathname.split("/").filter(Boolean);
            if (parts.length >= 5 && (parts[2] === "raw" || parts[2] === "src")) {
                const user = parts[0], repo = parts[1];
                const branchName = (parts[3] === "branch" || parts[3] === "commit" || parts[3] === "tag") ? parts[4] : parts[3];
                const fileStart = (parts[3] === "branch" || parts[3] === "commit" || parts[3] === "tag") ? 5 : 4;
                const filePath = parts.slice(fileStart).join("/");
                return `https://codeberg.org/api/v1/repos/${user}/${repo}/raw/${filePath}?ref=${branchName}`;
            }
            if (parts.length >= 5 && parts[2] === "src" && parts[3] === "branch") {
                const user = parts[0], repo = parts[1], branch = parts[4];
                const filePath = parts.slice(5).join("/");
                return `https://codeberg.org/api/v1/repos/${user}/${repo}/raw/${filePath}?ref=${branch}`;
            }
        }
    } catch (_) {}
    return link;
}

function parseUpdateUrl(code) {
    const m = code.match(/@UPDATEURL:\s*\(?["']?([^"'\)\s]+)["']?\)?/);
    return m ? m[1].trim() : null;
}

function parseVersion(code) {
    const m = code.match(/@VERSION:\s*([\d.a-zA-Z-]+)/);
    return m ? m[1].trim() : null;
}

function showInfoModal(title, message) {
    const existing = document.getElementById("avia-lp-update-modal");
    if (existing) existing.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "avia-lp-update-modal";
    Object.assign(backdrop.style, {
        position: "fixed", inset: "0", zIndex: "99999999",
        background: "rgba(0,0,0,0.6)", display: "grid",
        placeItems: "center", padding: "80px"
    });
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

    const card = document.createElement("div");
    Object.assign(card.style, {
        minWidth: "320px", maxWidth: "480px", padding: "24px", borderRadius: "28px",
        display: "flex", flexDirection: "column",
        color: "var(--md-sys-color-on-surface)",
        background: "var(--md-sys-color-surface-container-high, #2a2a2a)"
    });

    const titleEl = document.createElement("span");
    titleEl.textContent = title;
    Object.assign(titleEl.style, {
        lineHeight: "2rem", fontSize: "1.5rem", fontWeight: "400", marginBottom: "16px"
    });

    const msgEl = document.createElement("div");
    msgEl.textContent = message;
    Object.assign(msgEl.style, {
        color: "var(--md-sys-color-on-surface-variant)",
        fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "8px"
    });

    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, { display: "flex", justifyContent: "flex-end", marginTop: "24px" });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.innerHTML = "<md-ripple aria-hidden='true'></md-ripple>Close";
    Object.assign(closeBtn.style, {
        fontSize: "0.875rem", fontWeight: "400", position: "relative",
        padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", cursor: "pointer", border: "none",
        color: "var(--md-sys-color-primary)", height: "40px",
        borderRadius: "var(--borderRadius-full, 9999px)", background: "none"
    });
    closeBtn.onclick = () => backdrop.remove();

    btnRow.appendChild(closeBtn);
    card.appendChild(titleEl);
    card.appendChild(msgEl);
    card.appendChild(btnRow);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
}

function showUpdateModal(pluginName, localVersion, remoteVersion, wasRunning, onAccept) {
    const existing = document.getElementById("avia-lp-update-modal");
    if (existing) existing.remove();

    const backdrop = document.createElement("div");
    backdrop.id = "avia-lp-update-modal";
    Object.assign(backdrop.style, {
        position: "fixed", inset: "0", zIndex: "99999999",
        background: "rgba(0,0,0,0.6)", display: "grid",
        placeItems: "center", padding: "80px"
    });
    backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove(); };

    const card = document.createElement("div");
    Object.assign(card.style, {
        minWidth: "320px", maxWidth: "480px", padding: "24px", borderRadius: "28px",
        display: "flex", flexDirection: "column",
        color: "var(--md-sys-color-on-surface)",
        background: "var(--md-sys-color-surface-container-high, #2a2a2a)"
    });

    const titleEl = document.createElement("span");
    titleEl.textContent = "Update Available";
    Object.assign(titleEl.style, {
        lineHeight: "2rem", fontSize: "1.5rem", fontWeight: "400", marginBottom: "16px"
    });

    const body = document.createElement("div");
    Object.assign(body.style, {
        color: "var(--md-sys-color-on-surface-variant)",
        fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "12px"
    });

    const pluginRow = document.createElement("div");
    pluginRow.style.cssText = "display:flex;flex-direction:column;gap:2px;";
    const pluginLabel = document.createElement("span");
    pluginLabel.textContent = "Plugin";
    pluginLabel.style.cssText = "font-size:11px;opacity:0.5;letter-spacing:0.03em;";
    const pluginNameEl = document.createElement("span");
    pluginNameEl.textContent = pluginName;
    pluginNameEl.style.cssText = "font-size:14px;font-weight:500;color:var(--md-sys-color-on-surface);";
    pluginRow.appendChild(pluginLabel);
    pluginRow.appendChild(pluginNameEl);

    const currentRow = document.createElement("div");
    currentRow.style.cssText = "display:flex;flex-direction:column;gap:2px;";
    const currentLabel = document.createElement("span");
    currentLabel.textContent = "Current version";
    currentLabel.style.cssText = "font-size:11px;opacity:0.5;letter-spacing:0.03em;";
    const currentVersionEl = document.createElement("span");
    currentVersionEl.textContent = localVersion;
    currentVersionEl.style.cssText = "font-size:14px;font-weight:500;color:var(--md-sys-color-on-surface);";
    currentRow.appendChild(currentLabel);
    currentRow.appendChild(currentVersionEl);

    const latestRow = document.createElement("div");
    latestRow.style.cssText = "display:flex;flex-direction:column;gap:2px;";
    const latestLabel = document.createElement("span");
    latestLabel.textContent = "Latest version";
    latestLabel.style.cssText = "font-size:11px;opacity:0.5;letter-spacing:0.03em;";
    const latestVersionEl = document.createElement("span");
    latestVersionEl.textContent = remoteVersion;
    latestVersionEl.style.cssText = "font-size:14px;font-weight:600;color:var(--md-sys-color-primary);";
    latestRow.appendChild(latestLabel);
    latestRow.appendChild(latestVersionEl);

    const warningEl = document.createElement("span");
    warningEl.textContent = wasRunning
        ? "Any local changes you made to this plugin will be overwritten. Since this plugin is currently running, you will need to restart your client for the update to take effect."
        : "Any local changes you made to this plugin will be overwritten.";
    warningEl.style.cssText = "font-size:12px;opacity:0.55;margin-top:4px;";

    body.appendChild(pluginRow);
    body.appendChild(currentRow);
    body.appendChild(latestRow);
    body.appendChild(warningEl);

    const btnRow = document.createElement("div");
    Object.assign(btnRow.style, { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "24px" });

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.innerHTML = "<md-ripple aria-hidden='true'></md-ripple>Cancel";
    Object.assign(cancelBtn.style, {
        fontSize: "0.875rem", fontWeight: "400", position: "relative",
        padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", cursor: "pointer", border: "none",
        color: "var(--md-sys-color-primary)", height: "40px",
        borderRadius: "var(--borderRadius-full, 9999px)", background: "none"
    });
    cancelBtn.onclick = () => backdrop.remove();

    const updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.innerHTML = "<md-ripple aria-hidden='true'></md-ripple>Update";
    Object.assign(updateBtn.style, {
        fontSize: "0.875rem", fontWeight: "400", position: "relative",
        padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "inherit", cursor: "pointer", border: "none",
        color: "var(--md-sys-color-on-primary)", height: "40px",
        borderRadius: "var(--borderRadius-full, 9999px)",
        background: "var(--md-sys-color-primary)"
    });
    updateBtn.onclick = () => {
        backdrop.remove();
        onAccept();
    };

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(updateBtn);
    card.appendChild(titleEl);
    card.appendChild(body);
    card.appendChild(btnRow);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
}

async function checkPluginUpdate(plugin, updateBtn) {
    const updateUrl = parseUpdateUrl(plugin.code || "");
    const localVersion = parseVersion(plugin.code || "");

    if (!updateUrl || !localVersion) {
        showInfoModal(
            "Cannot Update",
            `"${plugin.name}" does not have @UPDATEURL and @VERSION defined in its header. The plugin author must add these for update checking to work.`
        );
        return;
    }

    updateBtn.style.opacity = "0.5";
    updateBtn.style.pointerEvents = "none";
    updateBtn.title = "Checking...";

    try {
        const rawUrl = rawUrlFromLink(updateUrl);
        const bustChar = rawUrl.includes("?") ? "&" : "?";
        const res = await fetch(rawUrl + bustChar + "_t=" + Date.now());
        if (!res.ok) throw new Error("HTTP " + res.status);
        const remoteCode = await res.text();
        const remoteVersion = parseVersion(remoteCode);

        if (!remoteVersion) {
            showInfoModal("Cannot Update", `The remote plugin at the update URL does not have a @VERSION defined. Cannot compare versions.`);
            return;
        }

        if (localVersion === remoteVersion) {
            showInfoModal("Up to Date", `"${plugin.name}" is already on the latest version (${localVersion}).`);
            return;
        }

        const wasRunning = !!runningLocalPlugins[plugin.id];
        showUpdateModal(plugin.name, localVersion, remoteVersion, wasRunning, () => {
            const all = getLocalPlugins();
            const target = all.find(p => p.id === plugin.id);
            if (target) {
                target.code = remoteCode;
                plugin.code = remoteCode;
                setLocalPlugins(all);
            }
            renderLocalPanel();
            showInfoModal("Updated", `"${plugin.name}" has been updated to version ${remoteVersion}.`);
        });

    } catch (e) {
        showInfoModal("Update Failed", `Could not fetch the update for "${plugin.name}". Check that the @UPDATEURL is correct and accessible.\n\n${e.message}`);
    } finally {
        updateBtn.style.opacity = "";
        updateBtn.style.pointerEvents = "";
        updateBtn.title = "Check for update";
    }
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

function exportPlugin(plugin) {
    const filename = plugin.name.endsWith(".js") ? plugin.name : plugin.name + ".js";
    const blob = new Blob([plugin.code || ""], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
    const existing = document.getElementById("avia-local-editor-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id = "avia-local-editor-panel";
    Object.assign(panel.style, {
        position: "fixed", bottom: "24px", left: "24px", width: "680px", height: "460px",
        background: "var(--md-sys-color-surface, #1e1e1e)", borderRadius: "16px",
        boxShadow: "0 8px 28px rgba(0,0,0,0.35)", zIndex: "9999999",
        display: "flex", flexDirection: "column", overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)"
    });

    const header = document.createElement("div");
    header.textContent = `Editing: ${plugin.name}`;
    Object.assign(header.style, {
        padding: "14px 16px", fontWeight: "600", fontSize: "14px",
        background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
        borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "move",
        color: "#fff", flex: "0 0 auto"
    });

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "✕";
    Object.assign(closeBtn.style, {
        position: "absolute", top: "12px", right: "16px",
        cursor: "pointer", opacity: "0.7", color: "#fff", zIndex: "1"
    });
    closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
    closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.7";
    closeBtn.onclick = () => panel.remove();

    const toolbar = document.createElement("div");
    Object.assign(toolbar.style, {
        padding: "8px 16px", display: "flex", gap: "8px",
        borderBottom: "1px solid rgba(255,255,255,0.08)", flex: "0 0 auto"
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
        value: plugin.code || "", language: "javascript", theme: "vs-dark",
        automaticLayout: true, minimap: { enabled: false },
        fontSize: 13, scrollBeyondLastLine: false, wordWrap: "on"
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
        padding: "5px 14px", borderRadius: "8px", border: "none",
        background: bg || "rgba(255,255,255,0.1)", color: "#fff",
        cursor: "pointer", fontSize: "12px", fontWeight: "500"
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
    document.addEventListener("mouseup", () => { isDragging = false; document.body.style.userSelect = ""; });
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
        if (panel.style.display === "none") { panel.style.display = "flex"; renderLocalPanel(); }
        else panel.style.display = "none";
        return;
    }

    panel = document.createElement("div");
    panel.id = "avia-local-plugins-panel";
    Object.assign(panel.style, {
        position: "fixed", bottom: "24px", right: "560px", width: "560px", height: "520px",
        background: "var(--md-sys-color-surface, #1e1e1e)", color: "var(--md-sys-color-on-surface, #fff)",
        borderRadius: "16px", boxShadow: "0 8px 28px rgba(0,0,0,0.35)", zIndex: "999999",
        display: "flex", flexDirection: "column", overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)"
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
        padding: "14px 16px", fontWeight: "600", fontSize: "14px",
        background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
        borderBottom: "1px solid rgba(255,255,255,0.08)", cursor: "move",
        display: "flex", alignItems: "center", justifyContent: "space-between", flex: "0 0 auto"
    });

    const headerTitle = document.createElement("span");
    headerTitle.textContent = "Local Plugins";

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "✕";
    Object.assign(closeBtn.style, { cursor: "pointer", opacity: "0.7", fontSize: "15px", lineHeight: "1", padding: "2px 4px" });
    closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
    closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.7";
    closeBtn.onclick = () => panel.style.display = "none";

    header.appendChild(headerTitle);
    header.appendChild(closeBtn);

    const controlsBar = document.createElement("div");
    Object.assign(controlsBar.style, {
        padding: "12px 16px", display: "flex", gap: "8px", alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)", flex: "0 0 auto"
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
        const newPlugin = { id: "local_" + Date.now(), name, code: "", enabled: false };
        plugins.push(newPlugin);
        setLocalPlugins(plugins);
        nameInput.value = "";
        renderLocalPanel(searchInput.value.toLowerCase());
    };

    const importBtn = document.createElement("button");
    importBtn.textContent = "Import";
    styleLocalBtn(importBtn, "#2d6a4f");
    importBtn.onmouseenter = () => importBtn.style.opacity = "0.75";
    importBtn.onmouseleave = () => importBtn.style.opacity = "1";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".js";
    fileInput.multiple = true;
    fileInput.style.display = "none";

    importBtn.onclick = () => fileInput.click();
    fileInput.onchange = async () => {
        const files = [...fileInput.files];
        if (!files.length) return;
        const plugins = getLocalPlugins();
        for (const file of files) {
            const text = await file.text();
            const name = file.name.replace(/\.js$/i, "");
            plugins.push({ id: "local_" + Date.now() + "_" + Math.random(), name, code: text, enabled: false });
        }
        setLocalPlugins(plugins);
        fileInput.value = "";
        renderLocalPanel(searchInput.value.toLowerCase());
    };

    controlsBar.appendChild(nameInput);
    controlsBar.appendChild(addBtn);
    controlsBar.appendChild(importBtn);
    controlsBar.appendChild(fileInput);

    const searchBar = document.createElement("div");
    Object.assign(searchBar.style, { padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", flex: "0 0 auto" });

    const searchInput = document.createElement("input");
    searchInput.placeholder = "Search plugins…";
    styleLocalInput(searchInput);
    searchInput.style.width = "100%";
    searchInput.oninput = () => renderLocalPanel(searchInput.value.toLowerCase());
    searchBar.appendChild(searchInput);

    const content = document.createElement("div");
    content.id = "avia-local-plugins-content";
    Object.assign(content.style, {
        flex: "1", overflowY: "auto", padding: "12px 16px 16px",
        scrollbarWidth: "none", msOverflowStyle: "none"
    });

    if (!document.getElementById("avia-local-scrollbar-hide")) {
        const s = document.createElement("style");
        s.id = "avia-local-scrollbar-hide";
        s.textContent = "#avia-local-plugins-content::-webkit-scrollbar{display:none}";
        document.head.appendChild(s);
    }

    panel.appendChild(header);
    panel.appendChild(controlsBar);
    panel.appendChild(searchBar);
    panel.appendChild(content);

    const dropOverlay = document.createElement("div");
    dropOverlay.textContent = "Import JS files";
    Object.assign(dropOverlay.style, {
        position: "absolute", inset: "0", background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "18px", fontWeight: "600", color: "#fff", opacity: "0",
        pointerEvents: "none", transition: "opacity 0.15s ease", borderRadius: "16px"
    });
    panel.appendChild(dropOverlay);
    document.body.appendChild(panel);

    let dragDepth = 0;
    panel.addEventListener("dragenter", e => { e.preventDefault(); e.stopPropagation(); dragDepth++; dropOverlay.style.opacity = "1"; panel.style.border = "1px dashed rgba(255,255,255,0.4)"; });
    panel.addEventListener("dragover", e => { e.preventDefault(); e.stopPropagation(); });
    panel.addEventListener("dragleave", e => { e.preventDefault(); e.stopPropagation(); dragDepth--; if (dragDepth <= 0) { dropOverlay.style.opacity = "0"; panel.style.border = "1px solid rgba(255,255,255,0.08)"; dragDepth = 0; } });
    panel.addEventListener("drop", async e => {
        e.preventDefault(); e.stopPropagation();
        dropOverlay.style.opacity = "0"; panel.style.border = "1px solid rgba(255,255,255,0.08)"; dragDepth = 0;
        const files = [...e.dataTransfer.files].filter(f => f.name.endsWith(".js"));
        if (!files.length) return;
        const plugins = getLocalPlugins();
        for (const file of files) {
            const text = await file.text();
            const name = file.name.replace(/\.js$/i, "");
            plugins.push({ id: "local_" + Date.now() + "_" + Math.random(), name, code: text, enabled: false });
        }
        setLocalPlugins(plugins);
        renderLocalPanel(searchInput.value.toLowerCase());
    });

    let isDragging = false, offsetX, offsetY;
    header.addEventListener("mousedown", e => { isDragging = true; offsetX = e.clientX - panel.offsetLeft; offsetY = e.clientY - panel.offsetTop; document.body.style.userSelect = "none"; });
    document.addEventListener("mouseup", () => { isDragging = false; document.body.style.userSelect = ""; });
    document.addEventListener("mousemove", e => { if (!isDragging) return; panel.style.left = (e.clientX - offsetX) + "px"; panel.style.top = (e.clientY - offsetY) + "px"; panel.style.right = "auto"; panel.style.bottom = "auto"; });

    renderLocalPanel();
}

function renderLocalPanel(filter = "") {
    const content = document.getElementById("avia-local-plugins-content");
    if (!content) return;
    content.innerHTML = "";

    const plugins = getLocalPlugins();
    const runSnap = { ...runningLocalPlugins };
    const errSnap = { ...localPluginErrors };

    const filtered = filter ? plugins.filter(p => p.name.toLowerCase().includes(filter)) : plugins;
    const visible = [...filtered].reverse();

    if (visible.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = plugins.length === 0 ? "No local plugins yet. Add one above." : "No plugins match your search.";
        Object.assign(empty.style, { opacity: "0.4", fontSize: "13px", textAlign: "center", padding: "24px 0" });
        content.appendChild(empty);
        return;
    }

    const sectionLabel = document.createElement("div");
    sectionLabel.textContent = `Local Plugins: ${visible.length}`;
    Object.assign(sectionLabel.style, {
        fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "10px"
    });
    content.appendChild(sectionLabel);

    const grid = document.createElement("div");
    Object.assign(grid.style, { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "10px" });

    visible.forEach((plugin) => {
        const isRunning = !!runSnap[plugin.id];
        const hasError = !!errSnap[plugin.id];

        const card = document.createElement("div");
        Object.assign(card.style, {
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${hasError ? "rgba(255,77,77,0.3)" : isRunning ? "rgba(77,255,136,0.25)" : "rgba(255,255,255,0.06)"}`,
            borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px"
        });
        card.onmouseenter = () => { if (!hasError && !isRunning) card.style.borderColor = "rgba(255,255,255,0.13)"; };
        card.onmouseleave = () => { card.style.borderColor = hasError ? "rgba(255,77,77,0.3)" : isRunning ? "rgba(77,255,136,0.25)" : "rgba(255,255,255,0.06)"; };

        const topRow = document.createElement("div");
        Object.assign(topRow.style, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" });

        const nameWrap = document.createElement("div");
        Object.assign(nameWrap.style, { display: "flex", alignItems: "center", gap: "7px", minWidth: "0", flex: "1" });

        const dot = document.createElement("div");
        Object.assign(dot.style, {
            width: "8px", height: "8px", borderRadius: "50%", flexShrink: "0",
            background: hasError ? "#ff4d4d" : isRunning ? "#4dff88" : "#555",
            boxShadow: hasError ? "0 0 5px #ff4d4d" : isRunning ? "0 0 5px #4dff88" : "none"
        });

        const nameEl = document.createElement("div");
        nameEl.textContent = plugin.name;
        Object.assign(nameEl.style, { fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });

        nameWrap.appendChild(dot);
        nameWrap.appendChild(nameEl);

        const switchWrap = document.createElement("div");
        Object.assign(switchWrap.style, { position: "relative", width: "36px", height: "20px", flexShrink: "0", cursor: "pointer" });

        const track = document.createElement("div");
        Object.assign(track.style, { position: "absolute", inset: "0", borderRadius: "10px", background: plugin.enabled ? "rgba(100,160,255,0.6)" : "rgba(255,255,255,0.15)", transition: "background 0.2s" });

        const thumb = document.createElement("div");
        Object.assign(thumb.style, { position: "absolute", top: "3px", left: plugin.enabled ? "19px" : "3px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", pointerEvents: "none" });

        switchWrap.appendChild(track);
        switchWrap.appendChild(thumb);
        switchWrap.onclick = () => {
            const all = getLocalPlugins();
            const target = all.find(p => p.id === plugin.id);
            if (!target) return;
            target.enabled = !target.enabled;
            plugin.enabled = target.enabled;
            setLocalPlugins(all);
            if (target.enabled) runLocalPlugin(plugin);
            else stopLocalPlugin(plugin);
            renderLocalPanel(filter);
        };

        topRow.appendChild(nameWrap);
        topRow.appendChild(switchWrap);

        const footer = document.createElement("div");
        Object.assign(footer.style, { display: "flex", gap: "6px", marginTop: "auto", paddingTop: "2px" });

        const updateIconBtn = document.createElement("button");
        updateIconBtn.title = "Check for update";
        updateIconBtn.type = "button";
        Object.assign(updateIconBtn.style, {
            padding: "5px 8px", borderRadius: "8px", border: "none",
            background: "rgba(255,255,255,0.06)", color: "#fff",
            cursor: "pointer", fontSize: "12px", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: "0"
        });
        updateIconBtn.onmouseenter = () => updateIconBtn.style.opacity = "0.75";
        updateIconBtn.onmouseleave = () => updateIconBtn.style.opacity = "1";

        const updateIcon = document.createElement("span");
        updateIcon.className = "material-symbols-outlined";
        updateIcon.textContent = "update";
        updateIcon.style.cssText = "font-size:16px;display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;";
        updateIconBtn.appendChild(updateIcon);
        updateIconBtn.onclick = () => checkPluginUpdate(plugin, updateIconBtn);

        const exportBtn = document.createElement("button");
        exportBtn.textContent = "Export";
        styleLocalBtn(exportBtn, "rgba(80,200,120,0.15)");
        exportBtn.title = "Download as .js file";
        exportBtn.onclick = () => exportPlugin(plugin);

        const editBtn = document.createElement("button");
        editBtn.textContent = "✏ Edit";
        styleLocalBtn(editBtn, "rgba(100,140,255,0.2)");
        editBtn.style.flex = "1";
        editBtn.onclick = () => {
            openEditorPanel(plugin, (newCode, andRun) => {
                const all = getLocalPlugins();
                const target = all.find(p => p.id === plugin.id);
                if (target) { target.code = newCode; plugin.code = newCode; setLocalPlugins(all); }
                if (andRun) {
                    plugin.enabled = true;
                    setLocalPlugins(getLocalPlugins().map(p => p.id === plugin.id ? { ...p, code: newCode, enabled: true } : p));
                    runLocalPlugin(plugin);
                }
                renderLocalPanel(filter);
            });
        };

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "✕";
        styleLocalBtn(removeBtn, "rgba(255,80,80,0.15)");
        removeBtn.onclick = () => {
            stopLocalPlugin(plugin);
            const editorPanel = document.getElementById("avia-local-editor-panel");
            if (editorPanel) editorPanel.remove();
            const all = getLocalPlugins();
            all.splice(all.findIndex(p => p.id === plugin.id), 1);
            setLocalPlugins(all);
            renderLocalPanel(filter);
        };

        footer.appendChild(updateIconBtn);
        footer.appendChild(exportBtn);
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
        padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "13px"
    });
}

function styleLocalBtn(btn, bg) {
    Object.assign(btn.style, {
        padding: "5px 12px", borderRadius: "8px", border: "none",
        background: bg || "rgba(255,255,255,0.08)", color: "#fff",
        cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap"
    });
    btn.onmouseenter = () => btn.style.opacity = "0.75";
    btn.onmouseleave = () => btn.style.opacity = "1";
}

function registerWithAviaMenu() {
    const reg = () => window.AviaMenu && window.AviaMenu.register({ id: "avia_plugins_local", name: "Local Plugins", icon: "extension", onClick: toggleLocalPanel });
    if (window.AviaMenu) reg();
    else { const iv = setInterval(() => { if (window.AviaMenu) { clearInterval(iv); reg(); } }, 100); }
}

function registerWithAviaCategory() {
    const reg = () => window.AviaCategory && window.AviaCategory.register({ id: "avia_plugins_local", name: "Local Plugins", icon: "extension", onClick: toggleLocalPanel });
    if (window.AviaCategory) reg();
    else { const iv = setInterval(() => { if (window.AviaCategory) { clearInterval(iv); reg(); } }, 100); }
}

getLocalPlugins().forEach(plugin => { if (plugin.enabled) runLocalPlugin(plugin); });
preloadMonaco();
registerWithAviaMenu();
registerWithAviaCategory();

})();
