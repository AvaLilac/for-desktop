(function () {

    if (window.__AVIA_VERSION_PATCH__) return;
    window.__AVIA_VERSION_PATCH__ = true;

    function patchVersion() {

        document
            .querySelectorAll("span.lh_1rem.fs_0\\.75rem.ls_0\\.03125rem.fw_500")
            .forEach(el => {

                if (el.dataset.aviaPatched) return;

                const match = el.textContent.match(/Stoat for Desktop\s+([0-9.]+)/);

                if (!match) return;

                const stoatVersion = match[1];

                el.dataset.aviaPatched = "true";

                el.innerHTML = `
Avia Client Desktop<br>
<span style="font-size:10px;opacity:0.7;">
    Based on Stoat ${stoatVersion}
</span>
`;
            });
    }

    const observer = new MutationObserver(patchVersion);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    patchVersion();

})();
