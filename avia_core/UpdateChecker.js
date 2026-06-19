(function() {
    if (window.__AVIA_UPDATE_CHECKER__) return;
    window.__AVIA_UPDATE_CHECKER__ = true;

    const PACKAGE_URL = "https://raw.githubusercontent.com/AvaLilac/for-desktop/refs/heads/main/package.json";
    const RELEASES_URL = "https://github.com/AvaLilac/for-desktop/releases";
    const STORAGE_KEY = "avia_update_checker_enabled";
    const TARGET_TEXT = "Spellchecker";

    function isEnabled() {
        return localStorage.getItem(STORAGE_KEY) !== "false";
    }

    function setEnabled(val) {
        localStorage.setItem(STORAGE_KEY, val ? "true" : "false");
    }

    function getClientVersion() {
        try {
            return window.native?.versions?.aviaClient?.() || null;
        } catch (_) {
            return null;
        }
    }

    async function fetchLatestVersion() {
        const res = await fetch(PACKAGE_URL);
        const json = await res.json();
        return json.aviaVersion?.trim() || null;
    }

    function showUpdateModal(clientVersion, latestVersion) {
        if (document.getElementById("avia-update-modal")) return;

        const backdrop = document.createElement("div");
        backdrop.id = "avia-update-modal";
        backdrop.className = "top_0 left_0 right_0 bottom_0 pos_fixed z_100 max-h_100% d_grid us_none place-items_center pointer-events_all anim-n_scrimFadeIn anim-dur_0.1s anim-fm_forwards trs_var(--transitions-medium)_all p_80px ov-y_auto";
        backdrop.style.cssText = "--background: rgba(0, 0, 0, 0.6); background: rgba(0, 0, 0, 0.6);";

        const motionWrap = document.createElement("div");
        motionWrap.style.cssText = "opacity: 1; --motion-translateY: 0px; transform: translateY(var(--motion-translateY));";

        const card = document.createElement("div");
        card.style.cssText = "min-width: 320px; max-width: 480px; padding: 24px; border-radius: 28px; display: flex; flex-direction: column; color: var(--md-sys-color-on-surface); background: var(--md-sys-color-surface-container-high);";

        const title = document.createElement("span");
        title.textContent = "Update Available";
        title.style.cssText = "line-height: 2rem; font-size: 1.5rem; letter-spacing: 0; font-weight: 400; margin-bottom: 16px;";

        const body = document.createElement("div");
        body.style.cssText = "color: var(--md-sys-color-on-surface-variant); line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400; display: flex; flex-direction: column; gap: 12px;";

        const currentRow = document.createElement("div");
        currentRow.style.cssText = "display: flex; flex-direction: column; gap: 2px;";
        const currentLabel = document.createElement("span");
        currentLabel.textContent = "Your current version";
        currentLabel.style.cssText = "font-size: 11px; opacity: 0.5; letter-spacing: 0.03em;";
        const currentVersionEl = document.createElement("span");
        currentVersionEl.textContent = clientVersion || "Unknown";
        currentVersionEl.style.cssText = "font-size: 14px; font-weight: 500; color: var(--md-sys-color-on-surface);";
        currentRow.appendChild(currentLabel);
        currentRow.appendChild(currentVersionEl);

        const latestRow = document.createElement("div");
        latestRow.style.cssText = "display: flex; flex-direction: column; gap: 2px;";
        const latestLabel = document.createElement("span");
        latestLabel.textContent = "Latest version";
        latestLabel.style.cssText = "font-size: 11px; opacity: 0.5; letter-spacing: 0.03em;";
        const latestVersionEl = document.createElement("span");
        latestVersionEl.textContent = latestVersion;
        latestVersionEl.style.cssText = "font-size: 14px; font-weight: 600; color: var(--md-sys-color-primary);";
        latestRow.appendChild(latestLabel);
        latestRow.appendChild(latestVersionEl);

        const message = document.createElement("span");
        message.textContent = `You are currently on version ${clientVersion || "Unknown"}. The latest version of AviaClient is ${latestVersion}.`;

        body.appendChild(currentRow);
        body.appendChild(latestRow);
        body.appendChild(message);

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "gap: 8px; display: flex; justify-content: flex-end; margin-top: 24px;";

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.style.cssText = "line-height: 1.25rem; font-size: 0.875rem; font-weight: 400; position: relative; padding: 0 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: inherit; cursor: pointer; border: none; transition: var(--transitions-medium) all; color: var(--md-sys-color-primary); height: 40px; border-radius: var(--borderRadius-full); background: none;";
        closeBtn.innerHTML = "<md-ripple aria-hidden='true'></md-ripple>Close";
        closeBtn.onclick = () => backdrop.remove();

        const updateBtn = document.createElement("button");
        updateBtn.type = "button";
        updateBtn.style.cssText = "line-height: 1.25rem; font-size: 0.875rem; font-weight: 400; position: relative; padding: 0 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-family: inherit; cursor: pointer; border: none; transition: var(--transitions-medium) all; color: var(--md-sys-color-on-primary); height: 40px; border-radius: var(--borderRadius-full); background: var(--md-sys-color-primary);";
        updateBtn.innerHTML = "<md-ripple aria-hidden='true'></md-ripple>Update Now";
        updateBtn.onclick = () => window.open(RELEASES_URL, "_blank");

        btnRow.appendChild(closeBtn);
        btnRow.appendChild(updateBtn);

        card.appendChild(title);
        card.appendChild(body);
        card.appendChild(btnRow);
        motionWrap.appendChild(card);
        backdrop.appendChild(motionWrap);
        document.body.appendChild(backdrop);
    }

    async function check() {
        if (!isEnabled()) return;
        const clientVersion = getClientVersion();
        const latestVersion = await fetchLatestVersion().catch(() => null);
        if (!latestVersion) return;
        if (clientVersion === latestVersion) return;
        showUpdateModal(clientVersion, latestVersion);
    }

    function applyToggleStyle(entry) {
        const desc = entry.querySelector("[data-update-desc]");
        const checkbox = entry.querySelector("mdui-checkbox");
        if (isEnabled()) {
            if (desc) desc.textContent = "Get notified when a new AviaClient version is available";
            if (checkbox) checkbox.setAttribute("checked", "");
        } else {
            if (desc) desc.textContent = "Get notified when a new AviaClient version is available";
            if (checkbox) checkbox.removeAttribute("checked");
        }
    }

    function tryInject() {
        if (document.querySelector("[data-update-checker-entry]")) return;

        const target = [...document.querySelectorAll("a.pos_relative")]
            .find(a => a.innerText.includes(TARGET_TEXT));
        if (!target) return;

        const entry = target.cloneNode(true);
        entry.setAttribute("data-update-checker-entry", "true");

        const iconEl = entry.querySelector("span.material-symbols-outlined, md-icon");
        if (iconEl) iconEl.textContent = "update";

        const titleEl = entry.querySelector("div.d_flex.flex-g_1.flex-d_column > div");
        if (titleEl) titleEl.textContent = "Update Checker";

        const descEl = entry.querySelector("div.d_flex.flex-g_1.flex-d_column > span");
        if (descEl) descEl.setAttribute("data-update-desc", "true");

        applyToggleStyle(entry);

        entry.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            setEnabled(!isEnabled());
            applyToggleStyle(entry);
        });

        target.parentNode.insertBefore(entry, target.nextSibling);
    }

    check();

    const observer = new MutationObserver(() => tryInject());
    observer.observe(document.body, { childList: true, subtree: true });
    tryInject();
})();
