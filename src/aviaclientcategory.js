(function(){
    if(window.__AVIA_CATEGORY_SETTINGS__) return;
    window.__AVIA_CATEGORY_SETTINGS__ = true;

    function inject(){

        if(document.getElementById('avia-cloned-settings')) return;

        const spans = [...document.querySelectorAll('span')];
        const target = spans.find(s => s.textContent.trim() === "User Settings");
        if(!target) return;

        const container = target.closest('.d_flex.flex-d_column');
        if(!container) return;

        const clone = container.cloneNode(true);
        clone.id = "avia-cloned-settings";

        const header = clone.querySelector('span');
        if(header) header.textContent = "AVIA CLIENT SETTINGS";

        const list = clone.querySelector('.d_flex.flex-d_column.gap_var\\(--gap-s\\)');
        if(list) list.innerHTML = "";

        container.parentNode.insertBefore(clone, container.nextSibling);
        }

        new MutationObserver(() => {
            inject();
        }).observe(document.body, { childList: true, subtree: true });

    inject();

})();
