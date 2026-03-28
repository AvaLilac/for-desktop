(function () {
    if (window.__BUTTON_FIX__) return;
    window.__BUTTON_FIX__ = true;

    function uninjectButton(button){
        if(button){
            button.parentElement.removeChild(button)
        }
    }
    
    const observer = new MutationObserver(()=>{
        let balls = [];
        document.querySelectorAll('div[class=\'flex-sh_0 d_flex ai_end jc_center w_42px\']').forEach(element=>{
        if(element.id?.includes('avia')){
            balls.push(element)
        }
        })
        
        const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
        .find(s => s.textContent.trim() === "gif");

        if(!gifSpan){
            balls.forEach(element=>{
                uninjectButton(element)
            })
        }
    });
    observer.observe(document.documentElement, {childList: true, subtree: true })
})();