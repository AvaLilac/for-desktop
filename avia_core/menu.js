(function () {
    if (window.__AVIA_MENU__) return;
    window.__AVIA_MENU__ = true;

    const ITEM_HEIGHT = 32;
    const MAX_VISIBLE = 12;
    const PIN_STORAGE_KEY = "avia_menu_pins";

    const registeredItems = [];
    let menuEl = null;
    let menuOpen = false;

    function getPins() {
        try { return JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || "[]"); }
        catch { return []; }
    }

    function savePins(arr) {
        localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(arr));
    }

    function pinItem(id) {
        const pins = getPins().filter(p => p !== id);
        pins.unshift(id);
        savePins(pins);
    }

    function unpinItem(id) {
        savePins(getPins().filter(p => p !== id));
    }

    function isPinned(id) {
        return getPins().includes(id);
    }

    function getSortedItems() {
        const pins = getPins();
        const pinned = [];
        for (const id of pins) {
            const found = registeredItems.find(i => i.id === id);
            if (found) pinned.push(found);
        }
        const unpinned = registeredItems.filter(i => !isPinned(i.id));
        return [...pinned, ...unpinned];
    }

    window.AviaMenu = {
        register: function (item) {
            if (!item || typeof item !== "object") {
                console.error("[AviaMenu] Registration failed: item must be an object, got", typeof item);
                return;
            }
            if (typeof item.id !== "string" || !item.id.trim()) {
                console.error("[AviaMenu] Registration failed: item.id must be a non-empty string, got", item.id);
                return;
            }
            if (!item.name || typeof item.name !== "string") {
                console.error("[AviaMenu] Registration failed for id '%s': item.name must be a non-empty string, got", item.id, item.name);
                return;
            }
            if (typeof item.onClick !== "function") {
                console.error("[AviaMenu] Registration failed for id '%s': item.onClick must be a function, got", item.id, typeof item.onClick);
                return;
            }
            if (registeredItems.find(i => i.id === item.id.trim())) {
                console.error("[AviaMenu] Registration failed: an item with id '%s' is already registered", item.id.trim());
                return;
            }
            registeredItems.push({
                id: item.id.trim(),
                name: item.name,
                onClick: item.onClick,
                icon: typeof item.icon === "string" && item.icon.trim() ? item.icon.trim() : null
            });
            if (menuEl) rebuildMenu();
        },

        unregister: function (item) {
            if (!item || typeof item.id !== "string" || !item.id.trim()) {
                console.error("[AviaMenu] Unregister failed: item.id must be a non-empty string");
                return;
            }
            const id = item.id.trim();
            const idx = registeredItems.findIndex(i => i.id === id);
            if (idx === -1) {
                console.error("[AviaMenu] Unregister failed: no item with id '%s' found", id);
                return;
            }
            registeredItems.splice(idx, 1);
            if (menuEl) rebuildMenu();
        }
    };

    function closeMenu() {
        if (menuEl) {
            menuEl.remove();
            menuEl = null;
        }
        menuOpen = false;
    }

    function rebuildMenu() {
        if (!menuEl) return;
        const list = menuEl.querySelector("#avia-menu-list");
        if (!list) return;
        list.innerHTML = "";

        if (registeredItems.length === 0) {
            const empty = document.createElement("div");
            empty.textContent = "No buttons registered";
            Object.assign(empty.style, {
                padding: "12px 16px",
                fontSize: "13px",
                opacity: "0.4",
                color: "var(--md-sys-color-on-surface, #fff)",
                userSelect: "none"
            });
            list.appendChild(empty);
            list.style.maxHeight = "";
            list.style.overflowY = "hidden";
            list.style.scrollbarWidth = "none";
            return;
        }

        const sorted = getSortedItems();

        for (const item of sorted) {
            const pinned = isPinned(item.id);

            const btn = document.createElement("div");
            Object.assign(btn.style, {
                padding: "0 12px",
                height: ITEM_HEIGHT + "px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                fontWeight: "500",
                color: "var(--md-sys-color-on-surface, #fff)",
                cursor: "pointer",
                borderRadius: "10px",
                transition: "background 0.12s",
                userSelect: "none",
                flexShrink: "0",
                position: "relative"
            });

            if (item.icon) {
                const iconEl = document.createElement("span");
                iconEl.className = "material-symbols-outlined";
                iconEl.textContent = item.icon;
                iconEl.style.cssText = "font-size:20px;display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;flex-shrink:0;opacity:0.85;";
                btn.appendChild(iconEl);
            }

            const label = document.createElement("span");
            label.textContent = item.name;
            label.style.flex = "1";
            btn.appendChild(label);

            const pinBtn = document.createElement("span");
            pinBtn.className = "material-symbols-outlined";
            pinBtn.textContent = "push_pin";
            Object.assign(pinBtn.style, {
                fontSize: "14px",
                display: "block",
                fontVariationSettings: pinned ? "'FILL' 1,'wght' 400,'GRAD' 0" : "'FILL' 0,'wght' 400,'GRAD' 0",
                color: pinned ? "var(--md-sys-color-primary, #cfbcff)" : "rgba(255,255,255,0.3)",
                flexShrink: "0",
                transition: "color 0.12s, font-variation-settings 0.12s",
                cursor: "pointer"
            });

            pinBtn.addEventListener("mouseenter", (e) => {
                e.stopPropagation();
                pinBtn.style.color = pinned ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)";
            });
            pinBtn.addEventListener("mouseleave", (e) => {
                e.stopPropagation();
                pinBtn.style.color = pinned ? "var(--md-sys-color-primary, #cfbcff)" : "rgba(255,255,255,0.3)";
            });
            pinBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (isPinned(item.id)) {
                    unpinItem(item.id);
                } else {
                    pinItem(item.id);
                }
                rebuildMenu();
            });

            btn.appendChild(pinBtn);

            btn.addEventListener("mouseenter", () => {
                btn.style.background = "rgba(255,255,255,0.07)";
            });
            btn.addEventListener("mouseleave", () => {
                btn.style.background = "transparent";
            });
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeMenu();
                try { item.onClick(); } catch (err) { console.error("[AviaMenu]", err); }
            });

            list.appendChild(btn);
        }

        const total = getSortedItems().length;
        list.style.maxHeight = (MAX_VISIBLE * ITEM_HEIGHT) + "px";
        list.style.overflowY = total > MAX_VISIBLE ? "auto" : "hidden";
        list.style.scrollbarWidth = "none";
    }

    function openMenu(anchorEl) {
        if (menuOpen) { closeMenu(); return; }

        menuEl = document.createElement("div");
        Object.assign(menuEl.style, {
            position: "fixed",
            zIndex: "9999999",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            overflow: "hidden",
            minWidth: "200px",
            display: "flex",
            flexDirection: "column"
        });

        const list = document.createElement("div");
        list.id = "avia-menu-list";
        Object.assign(list.style, {
            display: "flex",
            flexDirection: "column",
            padding: "8px",
            boxSizing: "border-box"
        });

        menuEl.appendChild(list);
        document.body.appendChild(menuEl);

        rebuildMenu();

        const rect = anchorEl.getBoundingClientRect();
        const menuRect = menuEl.getBoundingClientRect();
        let top = rect.bottom + 6;
        let left = rect.left;

        if (left + menuRect.width > window.innerWidth - 8) {
            left = window.innerWidth - menuRect.width - 8;
        }
        if (top + menuRect.height > window.innerHeight - 8) {
            top = rect.top - menuRect.height - 6;
        }

        menuEl.style.top = top + "px";
        menuEl.style.left = left + "px";

        menuOpen = true;

        setTimeout(() => {
            document.addEventListener("click", onOutsideClick, { once: true });
        }, 0);
    }

    function onOutsideClick(e) {
        if (menuEl && !menuEl.contains(e.target)) {
            closeMenu();
        }
    }

    function injectToolbarButton() {
        if (document.getElementById("avia-menu-toolbar-btn")) return;

        const pinBtn = document.querySelector('button[aria-label="View pinned messages"]');
        if (!pinBtn) return;

        const btn = pinBtn.cloneNode(false);
        btn.id = "avia-menu-toolbar-btn";
        btn.setAttribute("aria-label", "Avia Menu");

        const ripple = document.createElement("md-ripple");
        ripple.setAttribute("aria-hidden", "true");
        btn.appendChild(ripple);

        const icon = document.createElement("span");
        icon.className = "material-symbols-outlined";
        icon.style.cssText = "display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;font-size:24px;";
        icon.textContent = "apps";
        btn.appendChild(icon);

        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            openMenu(btn);
        });

        pinBtn.insertAdjacentElement("afterend", btn);
    }

    const observer = new MutationObserver(() => {
        injectToolbarButton();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    injectToolbarButton();
})();
