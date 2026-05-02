(function () {
    if (window.__AVIA_PROFILE_BADGESV2__) return;
    window.__AVIA_PROFILE_BADGESV2__ = true;

    const BADGE_URL = "https://raw.githubusercontent.com/AvaLilac/AviaClientBadges/refs/heads/main/userbadgesbackend.js";

    let badgeData = null, loadingPromise = null;

    function loadBadges() {
        if (badgeData) return Promise.resolve();
        if (loadingPromise) return loadingPromise;

        loadingPromise = fetch(BADGE_URL + "?t=" + Date.now())
            .then(r => r.text())
            .then(code => {
                new Function(code)();
                badgeData = window.AVIA_USER_BADGES || [];
            })
            .catch(() => { badgeData = []; });

        return loadingPromise;
    }

    function getUsername(root) {
        const tag = root.querySelector("span.fw_200");
        if (!tag) return null;
        const span = tag.parentElement;
        return span ? span.textContent.trim() : null;
    }

    function getUserBadges(username) {
        if (!badgeData) return [];
        const clean = username.trim().toLowerCase();
        return badgeData.filter(b =>
            b.users.some(u => u.toLowerCase() === clean)
        );
    }

    function findCardByTitle(root, title) {
        return [...root.querySelectorAll("div.pos_relative")]
            .find(c => {
                const heading = c.querySelector("span.fw_550");
                return heading && heading.textContent.trim() === title;
            });
    }

    function makeBadgeSpan(b) {
        const wrapper = document.createElement("span");
        wrapper.setAttribute("aria-label", b.name);
        wrapper.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;font-size:20px;line-height:1;cursor:default;position:relative;";
        wrapper.textContent = b.icon;

        let tip = null;

        wrapper.addEventListener("mouseenter", () => {
            tip = document.createElement("div");
            tip.style.cssText = "position:fixed;z-index:99999;pointer-events:none;white-space:nowrap;";

            const inner = document.createElement("div");
            inner.className = "c_white bg_black p_var(--gap-md) bdr_var(--borderRadius-md) lh_0.875rem fs_0.6875rem ls_0.03125rem fw_500";
            inner.style.cssText = "";

            const color = b.color || "";
            if (color.includes("gradient")) {
                const textSpan = document.createElement("span");
                textSpan.textContent = b.name;
                textSpan.style.cssText = `background:${color};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;`;
                inner.appendChild(textSpan);
            } else {
                inner.textContent = b.name;
                inner.style.color = color || "white";
            }

            tip.appendChild(inner);
            document.body.appendChild(tip);

            requestAnimationFrame(() => {
                const badgeRect = wrapper.getBoundingClientRect();
                const tipRect = tip.getBoundingClientRect();
                const x = badgeRect.left + badgeRect.width / 2 - tipRect.width / 2;
                const y = badgeRect.top - tipRect.height - 5;
                tip.style.left = Math.max(4, x) + "px";
                tip.style.top = Math.max(4, y) + "px";
            });
        });

        wrapper.addEventListener("mouseleave", () => {
            if (tip) { tip.remove(); tip = null; }
        });

        return wrapper;
    }

    function injectBadges(root, username) {
        if (root.querySelector("[data-avia-badge-injected='true']")) return;

        const badges = getUserBadges(username);
        if (!badges.length) return;

        const nativeBadgesCard = findCardByTitle(root, "Badges");
        if (nativeBadgesCard) {
            const grid = nativeBadgesCard.querySelector("div.d_flex.flex-wrap_wrap");
            if (!grid) return;
            badges.forEach(b => grid.appendChild(makeBadgeSpan(b)));
            nativeBadgesCard.dataset.aviaBadgeInjected = "true";
            return;
        }

        const joinedCard = findCardByTitle(root, "Joined");
        if (!joinedCard) return;

        const card = joinedCard.cloneNode(false);
        card.removeAttribute("data-avia-badge-injected");
        card.dataset.aviaBadgeInjected = "true";
        card.style.cssText = "overflow:hidden;";
        if (!card.classList.contains("asp_1/1")) card.classList.add("asp_1/1");

        const titleSpan = joinedCard.querySelector("span.fw_550");
        const title = titleSpan ? titleSpan.cloneNode(false) : document.createElement("span");
        title.textContent = "Badges";
        card.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "gap_var(--gap-md) d_flex flex-wrap_wrap [&_img,_&_svg]:w_24px [&_img,_&_svg]:h_24px [&_img,_&_svg]:asp_1/1";
        grid.style.overflow = "hidden";
        badges.forEach(b => grid.appendChild(makeBadgeSpan(b)));
        card.appendChild(grid);

        joinedCard.insertAdjacentElement("afterend", card);
    }

    async function processProfile(root) {
        await loadBadges();

        const username = getUsername(root);
        if (!username) return;

        if (findCardByTitle(root, "Badges")) {
            injectBadges(root, username);
            return;
        }

        const obs = new MutationObserver(() => {
            if (!findCardByTitle(root, "Joined")) return;
            if (!findCardByTitle(root, "Bio")) return;
            obs.disconnect();
            injectBadges(root, username);
        });

        obs.observe(root, { childList: true, subtree: true });

        if (findCardByTitle(root, "Joined") && findCardByTitle(root, "Bio")) {
            obs.disconnect();
            injectBadges(root, username);
        }

        setTimeout(() => obs.disconnect(), 10000);
    }

    const observer = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (!(n instanceof HTMLElement)) continue;

                if (n.matches?.("div.will-change_transform")) processProfile(n);
                if (n.matches?.("div.p_24px.min-w_280px.max-w_560px")) processProfile(n);

                const small    = n.querySelector?.("div.will-change_transform");
                const expanded = n.querySelector?.("div.p_24px.min-w_280px.max-w_560px");
                if (small)    processProfile(small);
                if (expanded) processProfile(expanded);
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
