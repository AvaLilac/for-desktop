(function(){
    if(window.__AVIA_CATEGORY_SETTINGS__) return;
    window.__AVIA_CATEGORY_SETTINGS__ = true;

    function inject(){

        if(document.getElementById('avia-cloned-settings')) return;

        const spans = [...document.querySelectorAll('span')];
        const target = spans.find(s => s.textContent.trim() === "User Settings");
        if(!target) return;

        const container = target.parentElement;
        if(!container) return;

        const clone = container.cloneNode(true);
        clone.id = "avia-cloned-settings";

        const header = clone.querySelector('span');
        if(header) header.textContent = "AVIA CLIENT SETTINGS";

        const list = clone.querySelector('div:last-child');
        if(list) list.innerHTML = "";

        container.parentNode.insertBefore(clone, container.nextSibling);
        }

        new MutationObserver(() => {
            inject();
        }).observe(document.body, { childList: true, subtree: true });

    inject();

})();
