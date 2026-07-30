(function () {
    if (window.__disableTrayClick) return;
    window.__disableTrayClick = true;

    function toggleCheckbox(elem, value) {
        const checkbox = elem.querySelector("mdui-checkbox");
        if (!checkbox) return;
        if (value) {
            checkbox.setAttribute("checked", "");
            checkbox.setAttribute("value", "on");
        } else {
            checkbox.removeAttribute("checked");
            checkbox.setAttribute("value", "off");
        }
    }

    function findDiscordRPCBtn() {
        const spans = [
            ...document.querySelectorAll(
                ".settings_cont span.material-symbols-outlined",
            ),
        ];
        const icon = spans.find((s) => s.textContent.trim() === "groups_2");
        if (!icon) return null;
        return icon.closest("a");
    }

    function tryInject() {
        if (document.querySelector("[data-disable-tray-click]")) return;

        const btn = findDiscordRPCBtn();
        if (!btn) return;

        const clone = btn.cloneNode(true);
        clone.setAttribute("data-disable-tray-click", "true");

        const cloneLabel = [...clone.querySelectorAll("div, span")].find(
            (el) =>
                el.children.length === 0 && el.textContent.trim() === "Discord RPC",
        );
        if (cloneLabel) cloneLabel.textContent = "Disable Tray Icon Click";

        const cloneDesc = [...clone.querySelectorAll("div, span")].find(
            (el) =>
                el.children.length === 0 &&
                el.textContent.trim() === "Rep Stoat using Discord rich presence.",
        );
        if (cloneDesc) cloneDesc.textContent = "Prevents tray icon from toggling the app window.";

        const cloneIcon = clone.querySelector("span.material-symbols-outlined");
        if (cloneIcon) cloneIcon.textContent = "block";

        const checkbox = clone.querySelector("mdui-checkbox");
        if (checkbox) {
            let config = window.desktopConfig.get();
            toggleCheckbox(clone, config.disableTrayClick);
        }

        clone.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            let config = window.desktopConfig.get();
            config.disableTrayClick = !config.disableTrayClick;
            window.desktopConfig.set(config);
            toggleCheckbox(clone, config.disableTrayClick);
        });

        btn.parentNode.insertBefore(clone, btn.nextSibling);
    }

    new MutationObserver(() => {
        tryInject();
    }).observe(document.body, {
        childList: true,
        subtree: true,
    });

})();
