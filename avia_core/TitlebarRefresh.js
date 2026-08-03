(function () {
    if (window.__titlebarRefresh) return;
    window.__titlebarRefresh = true;

    function inject() {
        if (document.querySelector(".avia-refresh-button")) return;

        const minimizeBtn = [...document.querySelectorAll("a")].find(a => {
            const path = a.querySelector("svg path");
            return path && path.getAttribute("d") === "M240-120v-60h481v60z";
        });

        if (!minimizeBtn) return;

        const button = document.createElement("a");
        button.className = "avia-refresh-button";
        Object.assign(button.style, {
            cursor: "pointer",
            position: "relative",
            display: "grid",
            placeItems: "center",
            height: "100%",
            aspectRatio: "3/2"
        });
        button.innerHTML = `
            <md-ripple aria-hidden="true"></md-ripple>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -960 960 960">
                <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"></path>
            </svg>
        `;
        button.addEventListener("click", e => {
            e.preventDefault();
            e.stopPropagation();
            location.reload();
        });

        minimizeBtn.parentElement.insertBefore(button, minimizeBtn);
    }

    inject();

    new MutationObserver(inject).observe(document.body, { childList: true, subtree: true });
})();
