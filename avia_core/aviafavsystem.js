(function () {
    if (window.__AVIA_FAVORITES_LOADED__) return;
    window.__AVIA_FAVORITES_LOADED__ = true;

    const STORAGE_KEY = "avia_favorites";

    const getFavorites = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setFavorites = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function extractYouTubeID(url) {
        const reg = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/;
        const match = url.match(reg);
        return match ? match[1] : null;
    }

    function fallbackCopy(text) {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;opacity:0;";
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(ta);
    }

    function updateBadge() {
        const badge = document.getElementById("avia-favorites-badge");
        if (!badge) return;
        const count = getFavorites().length;
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
    }

    function showToast(card, msg) {
        const old = card.querySelector(".fav-toast");
        if (old) old.remove();
        const toast = document.createElement("div");
        toast.className = "fav-toast";
        toast.textContent = msg || "Copied!";
        Object.assign(toast.style, {
            position: "absolute",
            bottom: "6px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            color: "#fff",
            opacity: "0",
            transition: "opacity 0.15s",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: "3"
        });
        card.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = "1");
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 150);
        }, 1500);
    }

    function flashDupe(url) {
        const card = document.querySelector(`[data-fav-url="${CSS.escape(url)}"]`);
        if (!card) return;
        card.style.outline = "2px solid rgba(255,80,80,0.9)";
        setTimeout(() => { card.style.outline = ""; }, 700);
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function buildCard(item, onRemove) {
        const card = document.createElement("div");
        card.dataset.favUrl = item.url;
        Object.assign(card.style, {
            position: "relative",
            width: "90px",
            height: "90px",
            borderRadius: "12px",
            overflow: "hidden",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            cursor: "pointer",
            flexShrink: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "border-color 0.2s, transform 0.15s"
        });

        const removeBtn = document.createElement("div");
        removeBtn.textContent = "✕";
        Object.assign(removeBtn.style, {
            position: "absolute",
            top: "4px",
            right: "5px",
            fontSize: "10px",
            cursor: "pointer",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            padding: "1px 4px",
            borderRadius: "4px",
            zIndex: "2",
            opacity: "0",
            transition: "opacity 0.15s"
        });
        removeBtn.onclick = e => {
            e.stopPropagation();
            onRemove(item.url);
        };
        card.appendChild(removeBtn);

        card.addEventListener("mouseenter", () => {
            card.style.borderColor = "rgba(255,255,255,0.25)";
            card.style.transform = "scale(1.04)";
            removeBtn.style.opacity = "1";
        });
        card.addEventListener("mouseleave", () => {
            card.style.borderColor = "rgba(255,255,255,0.08)";
            card.style.transform = "scale(1)";
            removeBtn.style.opacity = "0";
        });

        const ytID = extractYouTubeID(item.url);
        if (ytID) {
            const img = new Image();
            img.draggable = false;
            img.src = `https://img.youtube.com/vi/${ytID}/hqdefault.jpg`;
            Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" });
            img.onerror = () => fallback();
            card.appendChild(img);
        } else {
            const ext = item.url.split(".").pop().split("?")[0].toLowerCase();
            const isVideo = ["mp4", "webm", "mov", "gifv"].includes(ext);

            if (isVideo) {
                const video = document.createElement("video");
                video.src = item.url.replace(".gifv", ".mp4");
                video.autoplay = true; video.loop = true;
                video.muted = true; video.playsInline = true;
                video.draggable = false;
                Object.assign(video.style, { width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" });
                video.onerror = () => fallback();
                card.appendChild(video);
            } else {
                const img = new Image();
                img.draggable = false;
                img.src = item.url;
                Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" });
                img.onerror = () => fallback();
                card.appendChild(img);
            }
        }

        function fallback() {
            [...card.children].forEach(c => { if (c !== removeBtn) c.remove(); });
            const inner = document.createElement("div");
            Object.assign(inner.style, {
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "4px", padding: "6px",
                width: "100%", height: "100%", boxSizing: "border-box", pointerEvents: "none"
            });
            const icon = document.createElement("span");
            icon.className = "material-symbols-outlined";
            icon.textContent = "link";
            icon.style.cssText = "font-size:20px;opacity:0.35;color:#fff;display:block;";
            inner.appendChild(icon);
            const label = document.createElement("div");
            if (item.title) {
                label.textContent = item.title;
            } else {
                try { label.textContent = new URL(item.url).hostname.replace("www.", ""); } catch { label.textContent = "link"; }
            }
            Object.assign(label.style, {
                fontSize: "9px", color: "#fff", opacity: "0.55",
                textAlign: "center", wordBreak: "break-word", overflow: "hidden",
                maxHeight: "36px", lineHeight: "1.3", padding: "0 4px"
            });
            inner.appendChild(label);
            card.appendChild(inner);
        }

        if (item.title) {
            const titleOverlay = document.createElement("div");
            titleOverlay.textContent = item.title;
            Object.assign(titleOverlay.style, {
                position: "absolute",
                bottom: "0",
                width: "100%",
                background: "rgba(0,0,0,0.6)",
                fontSize: "11px",
                padding: "4px",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                zIndex: "1",
                pointerEvents: "none"
            });
            card.appendChild(titleOverlay);
        }

        card.addEventListener("click", () => {
            const done = () => showToast(card, "Copied!");
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(item.url).then(done).catch(() => { fallbackCopy(item.url); done(); });
            } else {
                fallbackCopy(item.url); done();
            }
        });

        return card;
    }

    function toggleFavoritesPanel() {
        let panel = document.getElementById("avia-favorites-panel");
        if (panel) {
            const isHidden = panel.style.display === "none";
            panel.style.display = isHidden ? "flex" : "none";
            if (isHidden) renderGrid();
            return;
        }

        panel = document.createElement("div");
        panel.id = "avia-favorites-panel";
        Object.assign(panel.style, {
            position: "fixed",
            bottom: "24px",
            right: "40px",
            width: "460px",
            height: "400px",
            background: "var(--md-sys-color-surface, #141418)",
            color: "var(--md-sys-color-on-surface, #fff)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            zIndex: "999999",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)"
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
            padding: "13px 16px",
            fontWeight: "600",
            fontSize: "14px",
            background: "var(--md-sys-color-surface-container, rgba(255,255,255,0.04))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            cursor: "move",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: "0"
        });

        const headerIcon = document.createElement("span");
        headerIcon.className = "material-symbols-outlined";
        headerIcon.textContent = "star";
        headerIcon.style.cssText = "font-size:18px;opacity:0.7;display:block;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0;";
        header.appendChild(headerIcon);

        const headerTitle = document.createElement("span");
        headerTitle.textContent = "Favorites";
        header.appendChild(headerTitle);

        const closeBtn = document.createElement("div");
        closeBtn.textContent = "✕";
        Object.assign(closeBtn.style, {
            marginLeft: "auto", cursor: "pointer", opacity: "0.5",
            fontSize: "13px", lineHeight: "1"
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = "1";
        closeBtn.onmouseleave = () => closeBtn.style.opacity = "0.5";
        closeBtn.onclick = () => panel.style.display = "none";
        header.appendChild(closeBtn);

        const inputRow = document.createElement("div");
        Object.assign(inputRow.style, {
            padding: "10px 14px", display: "flex", gap: "6px",
            alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: "0"
        });

        const urlInput = document.createElement("input");
        urlInput.placeholder = "Paste a link...";
        Object.assign(urlInput.style, {
            flex: "1", padding: "7px 10px", borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--md-sys-color-on-surface, #fff)",
            fontSize: "12px", outline: "none", minWidth: "0"
        });

        const titleInput = document.createElement("input");
        titleInput.placeholder = "Title (optional)";
        Object.assign(titleInput.style, {
            width: "110px", flexShrink: "0", padding: "7px 10px",
            borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--md-sys-color-on-surface, #fff)",
            fontSize: "12px", outline: "none"
        });

        const addBtn = document.createElement("button");
        addBtn.textContent = "Add";
        Object.assign(addBtn.style, {
            padding: "7px 14px", borderRadius: "8px", border: "none",
            background: "var(--md-sys-color-primary, rgba(255,255,255,0.15))",
            color: "var(--md-sys-color-on-primary, #fff)",
            fontSize: "12px", fontWeight: "600", cursor: "pointer",
            flexShrink: "0", transition: "opacity 0.15s"
        });
        addBtn.onmouseenter = () => addBtn.style.opacity = "0.8";
        addBtn.onmouseleave = () => addBtn.style.opacity = "1";

        inputRow.appendChild(urlInput);
        inputRow.appendChild(titleInput);
        inputRow.appendChild(addBtn);

        const gridWrapper = document.createElement("div");
        Object.assign(gridWrapper.style, {
            flex: "1", minHeight: "0", overflowY: "auto",
            padding: "14px", boxSizing: "border-box"
        });

        const grid = document.createElement("div");
        grid.id = "avia-favorites-grid";
        Object.assign(grid.style, {
            display: "flex", flexWrap: "wrap", gap: "10px", alignContent: "start"
        });

        gridWrapper.appendChild(grid);
        panel.appendChild(header);
        panel.appendChild(inputRow);
        panel.appendChild(gridWrapper);
        document.body.appendChild(panel);

        let isPanelDragging = false, pOffsetX, pOffsetY;
        header.addEventListener("mousedown", e => {
            isPanelDragging = true;
            const rect = panel.getBoundingClientRect();
            pOffsetX = e.clientX - rect.left;
            pOffsetY = e.clientY - rect.top;
            panel.style.bottom = "auto"; panel.style.right = "auto";
            panel.style.left = rect.left + "px"; panel.style.top = rect.top + "px";
            document.body.style.userSelect = "none";
        });
        document.addEventListener("mouseup", () => {
            isPanelDragging = false;
            document.body.style.userSelect = "";
        });
        document.addEventListener("mousemove", e => {
            if (!isPanelDragging) return;
            panel.style.left = (e.clientX - pOffsetX) + "px";
            panel.style.top = (e.clientY - pOffsetY) + "px";
        });

        function tryAdd() {
            const url = urlInput.value.trim();
            const title = titleInput.value.trim();
            if (!url) return;
            const favs = getFavorites();
            if (favs.some(f => f.url === url)) { flashDupe(url); return; }
            favs.push({ url, title, addedAt: Date.now() });
            setFavorites(favs);
            urlInput.value = ""; titleInput.value = "";
            updateBadge(); renderGrid();
        }

        addBtn.onclick = tryAdd;
        urlInput.addEventListener("keydown", e => { if (e.key === "Enter") tryAdd(); });
        titleInput.addEventListener("keydown", e => { if (e.key === "Enter") tryAdd(); });

        renderGrid();
    }

    function renderGrid() {
        const grid = document.getElementById("avia-favorites-grid");
        if (!grid) return;
        grid.innerHTML = "";

        const favs = getFavorites();

        if (favs.length === 0) {
            const empty = document.createElement("div");
            Object.assign(empty.style, {
                width: "100%", padding: "24px 0", textAlign: "center",
                opacity: "0.35", fontSize: "13px",
                color: "var(--md-sys-color-on-surface, #fff)"
            });
            const emptyIcon = document.createElement("span");
            emptyIcon.className = "material-symbols-outlined";
            emptyIcon.textContent = "star_border";
            emptyIcon.style.cssText = "display:block;font-size:32px;margin-bottom:6px;";
            empty.appendChild(emptyIcon);
            const emptyText = document.createElement("div");
            emptyText.textContent = "No favorites yet";
            empty.appendChild(emptyText);
            grid.appendChild(empty);
            return;
        }

        const onRemove = (url) => {
            setFavorites(getFavorites().filter(f => f.url !== url));
            updateBadge();
            renderGrid();
        };

        favs.forEach(item => grid.appendChild(buildCard(item, onRemove)));
    }

    function injectButton() {
        if (document.getElementById("avia-favorites-btn")) return;
        const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
            .find(s => s.textContent.trim() === "gif");
        if (!gifSpan) return;
        const wrapper = gifSpan.closest("div.flex-sh_0");
        if (!wrapper) return;
        const clone = wrapper.cloneNode(true);
        clone.id = "avia-favorites-btn";
        clone.style.position = "relative";
        clone.querySelector("span.material-symbols-outlined").textContent = "star";
        clone.querySelector("button").onclick = toggleFavoritesPanel;
        const badge = document.createElement("div");
        badge.id = "avia-favorites-badge";
        Object.assign(badge.style, {
            position: "absolute", top: "2px", right: "2px",
            background: "var(--md-sys-color-primary, #6750a4)",
            color: "var(--md-sys-color-on-primary, #fff)",
            borderRadius: "99px", fontSize: "9px", fontWeight: "700",
            minWidth: "14px", height: "14px", display: "none",
            alignItems: "center", justifyContent: "center",
            padding: "0 3px", pointerEvents: "none", zIndex: "1"
        });
        clone.appendChild(badge);
        wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
        updateBadge();
    }

    new MutationObserver(injectButton).observe(document.body, { childList: true, subtree: true });
    injectButton();
})();
