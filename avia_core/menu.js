(function () {
    if (window.__AVIA_MENU__) return;
    window.__AVIA_MENU__ = true;

    const ITEM_HEIGHT = 32;
    const MAX_VISIBLE = 12;
    const SUBMENU_MAX_VISIBLE = 8;
    const PIN_STORAGE_KEY = "avia_menu_pins";

    const registeredItems = [];
    const submenuParents = [];
    const submenuItems = [];

    let menuEl = null;
    let menuOpen = false;
    let activeSubmenuEl = null;
    let activeSubmenuParentBtn = null;
    let submenuHoverTimeout = null;

    function allIds() {
        return [
            ...registeredItems.map(i => i.id),
            ...submenuParents.map(i => i.id),
            ...submenuItems.map(i => i.id)
        ];
    }

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

    function getSortedMainItems() {
        const pins = getPins();
        const all = [...registeredItems, ...submenuParents];
        const pinned = [];
        for (const id of pins) {
            const found = all.find(i => i.id === id);
            if (found) pinned.push(found);
        }
        const unpinned = all.filter(i => !isPinned(i.id));
        return [...pinned, ...unpinned];
    }

    window.AviaMenu = {
        register: function (item) {
            if (!item || typeof item !== "object") {
                console.error("[AviaMenu] register: item must be an object, got", typeof item); return;
            }
            if (typeof item.id !== "string" || !item.id.trim()) {
                console.error("[AviaMenu] register: item.id must be a non-empty string, got", item.id); return;
            }
            if (!item.name || typeof item.name !== "string") {
                console.error("[AviaMenu] register failed for id '%s': item.name must be a non-empty string, got", item.id, item.name); return;
            }
            if (typeof item.onClick !== "function") {
                console.error("[AviaMenu] register failed for id '%s': item.onClick must be a function, got", item.id, typeof item.onClick); return;
            }
            if (allIds().includes(item.id.trim())) {
                console.error("[AviaMenu] register: id '%s' is already registered", item.id.trim()); return;
            }
            registeredItems.push({
                id: item.id.trim(),
                name: item.name,
                onClick: item.onClick,
                icon: typeof item.icon === "string" && item.icon.trim() ? item.icon.trim() : null
            });
            if (menuEl) rebuildMenu();
        },

        submenuregister: function (item) {
            if (!item || typeof item !== "object") {
                console.error("[AviaMenu] submenuregister: item must be an object, got", typeof item); return;
            }
            if (typeof item.id !== "string" || !item.id.trim()) {
                console.error("[AviaMenu] submenuregister: item.id must be a non-empty string, got", item.id); return;
            }
            if (!item.name || typeof item.name !== "string") {
                console.error("[AviaMenu] submenuregister failed for id '%s': item.name must be a non-empty string, got", item.id, item.name); return;
            }
            if (allIds().includes(item.id.trim())) {
                console.error("[AviaMenu] submenuregister: id '%s' is already registered", item.id.trim()); return;
            }
            submenuParents.push({
                id: item.id.trim(),
                name: item.name,
                icon: typeof item.icon === "string" && item.icon.trim() ? item.icon.trim() : null
            });
            if (menuEl) rebuildMenu();
        },

        submenu: function (item) {
            if (!item || typeof item !== "object") {
                console.error("[AviaMenu] submenu: item must be an object, got", typeof item); return;
            }
            if (typeof item.parent !== "string" || !item.parent.trim()) {
                console.error("[AviaMenu] submenu: item.parent must be a non-empty string, got", item.parent); return;
            }
            if (typeof item.id !== "string" || !item.id.trim()) {
                console.error("[AviaMenu] submenu: item.id must be a non-empty string, got", item.id); return;
            }
            if (!item.name || typeof item.name !== "string") {
                console.error("[AviaMenu] submenu failed for id '%s': item.name must be a non-empty string, got", item.id, item.name); return;
            }
            if (typeof item.onClick !== "function") {
                console.error("[AviaMenu] submenu failed for id '%s': item.onClick must be a function, got", item.id, typeof item.onClick); return;
            }
            if (!submenuParents.find(p => p.id === item.parent.trim())) {
                console.error("[AviaMenu] submenu: no submenuregister found with id '%s'", item.parent.trim()); return;
            }
            if (allIds().includes(item.id.trim())) {
                console.error("[AviaMenu] submenu: id '%s' is already registered", item.id.trim()); return;
            }
            submenuItems.push({
                parent: item.parent.trim(),
                id: item.id.trim(),
                name: item.name,
                onClick: item.onClick,
                icon: typeof item.icon === "string" && item.icon.trim() ? item.icon.trim() : null
            });
            if (menuEl) rebuildMenu();
        },

        updatesubmenu: function (item) {
            if (!item || typeof item !== "object") {
                console.error("[AviaMenu] updatesubmenu: item must be an object, got", typeof item); return;
            }
            if (typeof item.parent !== "string" || !item.parent.trim()) {
                console.error("[AviaMenu] updatesubmenu: item.parent must be a non-empty string, got", item.parent); return;
            }
            if (typeof item.id !== "string" || !item.id.trim()) {
                console.error("[AviaMenu] updatesubmenu: item.id must be a non-empty string, got", item.id); return;
            }
            const entry = submenuItems.find(i => i.parent === item.parent.trim() && i.id === item.id.trim());
            if (!entry) {
                console.error("[AviaMenu] updatesubmenu: no submenu item found with parent '%s' and id '%s'", item.parent.trim(), item.id.trim()); return;
            }
            if (typeof item.text === "string" && item.text.trim()) {
                entry.name = item.text.trim();
            }
            if (typeof item.icon === "string") {
                entry.icon = item.icon.trim() || null;
            }
            if (activeSubmenuEl && activeSubmenuParentBtn) {
                const parentEntry = submenuParents.find(p => p.id === item.parent.trim());
                if (parentEntry) openSubmenu(parentEntry, activeSubmenuParentBtn);
            }
        },

        unregister: function (item) {
            if (!item || typeof item.id !== "string" || !item.id.trim()) {
                console.error("[AviaMenu] unregister: item.id must be a non-empty string, got", item?.id); return;
            }
            const id = item.id.trim();

            const rIdx = registeredItems.findIndex(i => i.id === id);
            if (rIdx !== -1) {
                registeredItems.splice(rIdx, 1);
                if (menuEl) rebuildMenu();
                return;
            }

            const pIdx = submenuParents.findIndex(i => i.id === id);
            if (pIdx !== -1) {
                submenuParents.splice(pIdx, 1);
                const children = submenuItems.filter(i => i.parent === id);
                children.forEach(c => {
                    const cIdx = submenuItems.findIndex(s => s.id === c.id);
                    if (cIdx !== -1) submenuItems.splice(cIdx, 1);
                });
                closeSubmenu();
                if (menuEl) rebuildMenu();
                return;
            }

            const sIdx = submenuItems.findIndex(i => i.id === id);
            if (sIdx !== -1) {
                const parentId = submenuItems[sIdx].parent;
                submenuItems.splice(sIdx, 1);
                const remaining = submenuItems.filter(i => i.parent === parentId);
                if (remaining.length === 0) {
                    const pIdx2 = submenuParents.findIndex(i => i.id === parentId);
                    if (pIdx2 !== -1) submenuParents.splice(pIdx2, 1);
                    closeSubmenu();
                }
                if (menuEl) rebuildMenu();
                return;
            }

            console.error("[AviaMenu] unregister: no item with id '%s' found", id);
        }
    };

    function closeSubmenu() {
        if (activeSubmenuEl) {
            activeSubmenuEl.remove();
            activeSubmenuEl = null;
        }
        activeSubmenuParentBtn = null;
        clearTimeout(submenuHoverTimeout);
    }

    function closeMenu() {
        closeSubmenu();
        if (menuEl) {
            menuEl.remove();
            menuEl = null;
        }
        menuOpen = false;
    }

    function openSubmenu(parentItem, anchorBtn) {
        if (activeSubmenuParentBtn === anchorBtn) return;
        closeSubmenu();
        activeSubmenuParentBtn = anchorBtn;

        const items = submenuItems.filter(i => i.parent === parentItem.id);
        if (items.length === 0) return;

        const sub = document.createElement("div");
        activeSubmenuEl = sub;
        Object.assign(sub.style, {
            position: "fixed",
            zIndex: "9999999",
            background: "var(--md-sys-color-surface, #1e1e1e)",
            borderRadius: "16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            overflow: "hidden",
            minWidth: "180px",
            display: "flex",
            flexDirection: "column"
        });

        const subList = document.createElement("div");
        Object.assign(subList.style, {
            display: "flex",
            flexDirection: "column",
            padding: "8px",
            boxSizing: "border-box",
            maxHeight: (SUBMENU_MAX_VISIBLE * ITEM_HEIGHT + 16) + "px",
            overflowY: items.length > SUBMENU_MAX_VISIBLE ? "auto" : "hidden",
            scrollbarWidth: "none"
        });

        for (const subItem of items) {
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
                flexShrink: "0"
            });

            if (subItem.icon) {
                const iconEl = document.createElement("span");
                iconEl.className = "material-symbols-outlined";
                iconEl.textContent = subItem.icon;
                iconEl.style.cssText = "font-size:20px;display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;flex-shrink:0;opacity:0.85;";
                btn.appendChild(iconEl);
            }

            const label = document.createElement("span");
            label.textContent = subItem.name;
            label.style.flex = "1";
            btn.appendChild(label);

            btn.addEventListener("mouseenter", () => { btn.style.background = "rgba(255,255,255,0.07)"; });
            btn.addEventListener("mouseleave", () => { btn.style.background = "transparent"; });
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                closeMenu();
                try { subItem.onClick(); } catch (err) { console.error("[AviaMenu]", err); }
            });

            subList.appendChild(btn);
        }

        sub.appendChild(subList);
        document.body.appendChild(sub);

        if (items.length > SUBMENU_MAX_VISIBLE) {
            function makeSubArrow(id, rotation) {
                const el = document.createElement("div");
                el.id = id;
                Object.assign(el.style, {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "20px",
                    pointerEvents: "none",
                    flexShrink: "0",
                    visibility: "hidden"
                });
                const icon = document.createElement("span");
                icon.className = "material-symbols-outlined";
                icon.textContent = "arrow_back_2";
                icon.style.cssText = `font-size:16px;display:block;transform:rotate(${rotation}deg);color:var(--md-sys-color-on-surface,#fff);opacity:0.5;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;`;
                el.appendChild(icon);
                return el;
            }

            const subArrowTop = makeSubArrow("avia-submenu-scroll-top", 90);
            const subArrowBot = makeSubArrow("avia-submenu-scroll-bot", 270);
            subArrowBot.style.display = "none";
            subArrowBot.style.visibility = "visible";

            sub.insertBefore(subArrowTop, subList);
            sub.insertBefore(subArrowBot, subList.nextSibling);

            function updateSubArrows() {
                const canUp = subList.scrollTop > 0;
                const canDown = subList.scrollTop + subList.clientHeight < subList.scrollHeight - 1;
                subArrowTop.style.visibility = canUp ? "visible" : "hidden";
                subArrowBot.style.display = canDown ? "flex" : "none";
            }

            subList.addEventListener("scroll", updateSubArrows);
            updateSubArrows();
        }

        const anchorRect = anchorBtn.getBoundingClientRect();
        const subRect = sub.getBoundingClientRect();
        let top = anchorRect.top;
        let left = anchorRect.left - subRect.width - 6;

        if (left < 8) left = anchorRect.right + 6;
        if (top + subRect.height > window.innerHeight - 8) {
            top = window.innerHeight - subRect.height - 8;
        }

        sub.style.top = top + "px";
        sub.style.left = left + "px";

        sub.addEventListener("mouseleave", () => {
            submenuHoverTimeout = setTimeout(closeSubmenu, 120);
        });
        sub.addEventListener("mouseenter", () => {
            clearTimeout(submenuHoverTimeout);
        });
    }

    function rebuildMenu() {
        if (!menuEl) return;
        const list = menuEl.querySelector("#avia-menu-list");
        if (!list) return;
        list.innerHTML = "";

        const sorted = getSortedMainItems();

        if (sorted.length === 0) {
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

        for (const item of sorted) {
            const isParent = submenuParents.some(p => p.id === item.id);
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
                if (isPinned(item.id)) unpinItem(item.id);
                else pinItem(item.id);
                rebuildMenu();
            });

            btn.appendChild(pinBtn);

            if (isParent) {
                const chevron = document.createElement("span");
                chevron.className = "material-symbols-outlined";
                chevron.textContent = "arrow_back_2";
                chevron.style.cssText = "font-size:14px;display:block;transform:rotate(180deg);flex-shrink:0;opacity:0.5;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;";
                btn.insertBefore(chevron, pinBtn);

                btn.addEventListener("mouseenter", () => {
                    btn.style.background = "rgba(255,255,255,0.07)";
                    clearTimeout(submenuHoverTimeout);
                    openSubmenu(item, btn);
                });
                btn.addEventListener("mouseleave", () => {
                    btn.style.background = "transparent";
                    submenuHoverTimeout = setTimeout(() => {
                        if (activeSubmenuParentBtn === btn) closeSubmenu();
                    }, 120);
                });
            } else {
                btn.addEventListener("mouseenter", () => {
                    btn.style.background = "rgba(255,255,255,0.07)";
                    clearTimeout(submenuHoverTimeout);
                    if (activeSubmenuEl) closeSubmenu();
                });
                btn.addEventListener("mouseleave", () => {
                    btn.style.background = "transparent";
                });
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    closeMenu();
                    try { item.onClick(); } catch (err) { console.error("[AviaMenu]", err); }
                });
            }

            list.appendChild(btn);
        }

        const total = sorted.length;
        list.style.maxHeight = (MAX_VISIBLE * ITEM_HEIGHT + 16) + "px";
        list.style.overflowY = total > MAX_VISIBLE ? "auto" : "hidden";
        list.style.scrollbarWidth = "none";

        const existingTop = menuEl.querySelector("#avia-scroll-top");
        const existingBot = menuEl.querySelector("#avia-scroll-bot");
        if (existingTop) existingTop.remove();
        if (existingBot) existingBot.remove();

        if (total > MAX_VISIBLE) {
            function makeArrow(id, rotation) {
                const el = document.createElement("div");
                el.id = id;
                Object.assign(el.style, {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "20px",
                    pointerEvents: "none",
                    flexShrink: "0",
                    visibility: "hidden"
                });
                const icon = document.createElement("span");
                icon.className = "material-symbols-outlined";
                icon.textContent = "arrow_back_2";
                icon.style.cssText = `font-size:16px;display:block;transform:rotate(${rotation}deg);color:var(--md-sys-color-on-surface,#fff);opacity:0.5;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;`;
                el.appendChild(icon);
                return el;
            }

            const arrowTop = makeArrow("avia-scroll-top", 90);
            const arrowBot = makeArrow("avia-scroll-bot", 270);
            arrowBot.style.display = "none";
            arrowBot.style.visibility = "visible";

            menuEl.insertBefore(arrowTop, list);
            menuEl.insertBefore(arrowBot, list.nextSibling);

            function updateArrows() {
                const canUp = list.scrollTop > 0;
                const canDown = list.scrollTop + list.clientHeight < list.scrollHeight - 1;
                arrowTop.style.visibility = canUp ? "visible" : "hidden";
                arrowBot.style.display = canDown ? "flex" : "none";
            }

            list.addEventListener("scroll", updateArrows);
            updateArrows();
        }
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
        if (menuEl && !menuEl.contains(e.target) && (!activeSubmenuEl || !activeSubmenuEl.contains(e.target))) {
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
