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

    const categoryRegisteredItems = [];

    function findCategoryTemplateButton(){
        return [...document.querySelectorAll(
            `.settings_sidebar .content a.button:has(
                > div
                > svg
                > path[d^='M12 22C6.49 22']
            )`
        )].find((a) => {
            const label = a.querySelector('div > svg + div > div');
            if(label.textContent === "Appearance") return a;
        });
    }

    function buildCategoryButton(item){
        const template = findCategoryTemplateButton();
        if(!template) return null;

        const btn = template.cloneNode(true);
        btn.removeAttribute("id");
        btn.dataset.aviaCategoryId = item.id;

        const label = [...btn.querySelectorAll("div")].find(d => d.children.length === 0);
        if(label) label.textContent = item.name;

        const oldSvg = btn.querySelector("svg");
        if(oldSvg) oldSvg.remove();

        if(item.icon){
            const iconSpan = document.createElement("span");
            iconSpan.className = "material-symbols-outlined";
            iconSpan.textContent = item.icon;
            iconSpan.style.cssText = "margin-right:8px;flex-shrink:0;display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0;font-size:20px;";
            const firstChild = btn.firstChild;
            btn.insertBefore(iconSpan, firstChild);
        }

        btn.onclick = (e) => {
            e.preventDefault();
            try { item.onClick(); }
            catch(err){ console.error("[AviaCategory]", err); }
        };

        return btn;
    }

    function getCategoryList(){
        const clone = document.getElementById('avia-cloned-settings');
        if(!clone) return null;
        return clone.querySelector('div:last-child');
    }

    function renderCategoryItems(){
        const list = getCategoryList();
        if(!list) return;
        for(const item of categoryRegisteredItems){
            if(list.querySelector(`[data-avia-category-id="${item.id}"]`)) continue;
            const btn = buildCategoryButton(item);
            if(btn) list.appendChild(btn);
        }
    }

    window.AviaCategory = {
        register: function(item){
            if(!item || typeof item !== "object"){
                console.error("[AviaCategory] register: item must be an object, got", typeof item); return;
            }
            if(typeof item.id !== "string" || !item.id.trim()){
                console.error("[AviaCategory] register: item.id must be a non-empty string, got", item.id); return;
            }
            if(!item.name || typeof item.name !== "string"){
                console.error("[AviaCategory] register failed for id '%s': item.name must be a non-empty string, got", item.id, item.name); return;
            }
            if(typeof item.onClick !== "function"){
                console.error("[AviaCategory] register failed for id '%s': item.onClick must be a function, got", item.id, typeof item.onClick); return;
            }
            if(categoryRegisteredItems.some(i => i.id === item.id.trim())){
                console.error("[AviaCategory] register: id '%s' is already registered", item.id.trim()); return;
            }
            categoryRegisteredItems.push({
                id: item.id.trim(),
                name: item.name,
                onClick: item.onClick,
                icon: typeof item.icon === "string" && item.icon.trim() ? item.icon.trim() : null
            });
            renderCategoryItems();
        },

        unregister: function(item){
            if(!item || typeof item.id !== "string" || !item.id.trim()){
                console.error("[AviaCategory] unregister: item.id must be a non-empty string, got", item?.id); return;
            }
            const id = item.id.trim();
            const idx = categoryRegisteredItems.findIndex(i => i.id === id);
            if(idx === -1){
                console.error("[AviaCategory] unregister: no item with id '%s' found", id); return;
            }
            categoryRegisteredItems.splice(idx, 1);
            const list = getCategoryList();
            if(list){
                const el = list.querySelector(`[data-avia-category-id="${id}"]`);
                if(el) el.remove();
            }
        }
    };

    new MutationObserver(() => {
        renderCategoryItems();
    }).observe(document.body, { childList: true, subtree: true });

})();
