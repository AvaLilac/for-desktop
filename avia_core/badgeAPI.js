(function() {
    if (window.__AVIA_PROFILE_BADGESV2__) return;
    window.__AVIA_PROFILE_BADGESV2__ = true;

    const BADGE_URL = "https://raw.githubusercontent.com/AvaLilac/AviaClientBadges/refs/heads/main/userbadgesbackend.js";

    let badgeData = null,
        loadingPromise = null;

    function loadBadges() {
        if (badgeData) return Promise.resolve();
        if (loadingPromise) return loadingPromise;
        loadingPromise = fetch(BADGE_URL + "?t=" + Date.now())
            .then(r => r.text())
            .then(code => {
                new Function(code)();
                badgeData = window.AVIA_USER_BADGES || [];
            })
            .catch(() => {
                badgeData = [];
            });
        return loadingPromise;
    }

    function getUsername(root) {
        const el = root.querySelector('[aria-label="Click to copy username"]');
        if (!el) return null;

        return el.textContent.trim();
    }

    function getUserBadges(username) {
        if (!badgeData) return [];
        const clean = username.trim().toLowerCase();
        return badgeData.filter(b => b.users.some(u => u.toLowerCase() === clean));
    }

    function findCardByTitle(root, title) {
        const allEls = root.querySelectorAll("*");
        for (const el of allEls) {
            if (el.children.length > 0) continue;
            if (el.textContent.trim() !== title) continue;

            let candidate = el.parentElement;
            while (candidate && candidate !== root) {
                if (candidate.children.length >= 2) return candidate;
                candidate = candidate.parentElement;
            }
        }
        return null;
    }

    function findBioCard(root) {
        const allEls = root.querySelectorAll("*");
        for (const el of allEls) {
            if (el.children.length > 0) continue;
            if (el.textContent.trim() !== "Bio") continue;
            let candidate = el.parentElement;
            while (candidate && candidate !== root) {
                if (candidate.children.length >= 2) return candidate;
                candidate = candidate.parentElement;
            }
        }
        return null;
    }

    function findJoinedCard(root) {
        const allEls = root.querySelectorAll("*");
        for (const el of allEls) {
            if (el.children.length > 0) continue;
            if (el.textContent.trim() !== "Joined") continue;
            let candidate = el.parentElement;
            while (candidate && candidate !== root) {
                if (candidate.children.length >= 2) {

                    const hasStorat = [...candidate.querySelectorAll("*")]
                        .some(e => e.children.length === 0 && e.textContent.trim() === "Stoat");
                    if (hasStorat) return candidate;
                    break;
                }
                candidate = candidate.parentElement;
            }
        }
        return null;
    }

    function findOfficialBadgesCard(root) {
        const allEls = root.querySelectorAll("*");
        for (const el of allEls) {
            if (el.children.length > 0) continue;
            if (el.textContent.trim() !== "Badges") continue;
            let candidate = el.parentElement;
            while (candidate && candidate !== root) {
                if (candidate.children.length >= 2) {
                    if (candidate.querySelector("img[aria-label], span[aria-label]")) {
                        return candidate;
                    }
                    break;
                }
                candidate = candidate.parentElement;
            }
        }
        return null;
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
            inner.style.cssText = "background:black;color:white;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:500;letter-spacing:0.03em;line-height:1;";
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
            if (tip) {
                tip.remove();
                tip = null;
            }
        });
        return wrapper;
    }

    function injectBadges(root, username) {
        if (root.querySelector("[data-avia-badge-injected='true']")) return;

        const badges = getUserBadges(username);
        if (!badges.length) return;

        const officialCard = findOfficialBadgesCard(root);
        if (officialCard) {

            const grid = officialCard.querySelector("img[aria-label], span[aria-label]")?.parentElement;
            if (!grid) return;
            badges.forEach(b => grid.appendChild(makeBadgeSpan(b)));
            officialCard.dataset.aviaBadgeInjected = "true";
            return;
        }

        const joinedCard = findJoinedCard(root);
        if (!joinedCard) return;

        const card = joinedCard.cloneNode(false);
        card.dataset.aviaBadgeInjected = "true";
        card.style.overflow = "hidden";

        const joinedHeading = [...joinedCard.querySelectorAll("*")]
            .find(e => e.children.length === 0 && e.textContent.trim() === "Joined");
        const title = joinedHeading ? joinedHeading.cloneNode(false) : document.createElement("span");
        title.textContent = "Badges";
        card.appendChild(title);

        const grid = document.createElement("div");
        grid.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;overflow:hidden;";
        badges.forEach(b => grid.appendChild(makeBadgeSpan(b)));
        card.appendChild(grid);

        joinedCard.insertAdjacentElement("afterend", card);
    }

    function isProfileRoot(el) {
        if (!el || !el.querySelector) return false;
        const hasSvgAvatar = !!el.querySelector('svg[viewBox="0 0 32 32"] foreignObject');
        const hasUsername = !!el.querySelector('[aria-label="Click to copy username"]');
        return hasSvgAvatar && hasUsername;
    }

    function runInjectionFlow(root, username) {
        if (findOfficialBadgesCard(root)) {
            injectBadges(root, username);
            return;
        }

        if (findJoinedCard(root)) {
            injectBadges(root, username);
            return;
        }

        const obs = new MutationObserver(() => {
            if (!findJoinedCard(root)) return;
            obs.disconnect();
            injectBadges(root, username);
        });
        obs.observe(root, {
            childList: true,
            subtree: true
        });
        setTimeout(() => obs.disconnect(), 10000);
    }

    async function processProfile(root) {
        await loadBadges();
        const username = getUsername(root);
        if (!username) return;

        if (findBioCard(root)) {
            runInjectionFlow(root, username);
            return;
        }

        const bioObs = new MutationObserver(() => {
            if (!findBioCard(root)) return;
            bioObs.disconnect();
            runInjectionFlow(root, username);
        });
        bioObs.observe(root, {
            childList: true,
            subtree: true
        });
        setTimeout(() => bioObs.disconnect(), 10000);
    }

    const seen = new WeakSet();
    const observer = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (!(n instanceof HTMLElement)) continue;

                if (isProfileRoot(n) && !seen.has(n)) {
                    seen.add(n);
                    processProfile(n);
                }

                const children = n.querySelectorAll("*");
                for (const child of children) {
                    if (isProfileRoot(child) && !seen.has(child)) {
                        seen.add(child);
                        processProfile(child);
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
