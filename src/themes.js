(function () {

if (window.__AVIA_THEMES_LOADED__) return;
window.__AVIA_THEMES_LOADED__ = true;

const STORAGE_KEY = "avia_themes";
let editingTheme = null;

const getThemes = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const setThemes = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

function parseMeta(css){
    const name = css.match(/@name\s+(.+)/)?.[1] || "Unknown Theme";
    const author = css.match(/@author\s+(.+)/)?.[1] || "Unknown";
    const version = css.match(/@version\s+(.+)/)?.[1] || "1.0";
    const description = css.match(/@description\s+(.+)/)?.[1] || "No description";
    return {name,author,version,description};
}

function applyThemes(){
    document.querySelectorAll(".avia-theme-style").forEach(e=>e.remove());
    const themes = getThemes();
    themes.forEach(theme=>{
        if(!theme.enabled) return;
        const style=document.createElement("style");
        style.className="avia-theme-style";
        style.textContent=theme.css;
        document.head.appendChild(style);
    });
}

function makeDraggable(panel, handle){
    let dragging=false,offsetX,offsetY;
    handle.addEventListener("mousedown",e=>{
        dragging=true;
        offsetX=e.clientX-panel.offsetLeft;
        offsetY=e.clientY-panel.offsetTop;
        document.body.style.userSelect="none";
    });
    document.addEventListener("mouseup",()=>{dragging=false;document.body.style.userSelect="";});
    document.addEventListener("mousemove",e=>{
        if(!dragging) return;
        panel.style.left=(e.clientX-offsetX)+"px";
        panel.style.top=(e.clientY-offsetY)+"px";
        panel.style.right="auto";
        panel.style.bottom="auto";
    });
}

function openThemeEditor(theme){
    editingTheme = theme;
    let panel = document.getElementById('avia-theme-editor');
    if(panel){
        panel.style.display="flex";
        panel.querySelector("textarea").value = theme.css;
        return;
    }
    panel=document.createElement("div");
    panel.id="avia-theme-editor";
    Object.assign(panel.style,{
        position:"fixed",
        bottom:"24px",
        right:"24px",
        width:"420px",
        height:"340px",
        background:"var(--md-sys-color-surface,#1e1e1e)",
        color:"var(--md-sys-color-on-surface,#fff)",
        borderRadius:"16px",
        boxShadow:"0 8px 28px rgba(0,0,0,0.35)",
        zIndex:999999,
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.08)"
    });
    const header=document.createElement("div");
    header.textContent="Theme Editor";
    Object.assign(header.style,{
        padding:"14px 16px",
        fontWeight:"600",
        fontSize:"14px",
        background:"rgba(255,255,255,0.04)",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        cursor:"move"
    });
    makeDraggable(panel,header);
    const close=document.createElement("div");
    close.textContent="✕";
    Object.assign(close.style,{position:"absolute",right:"16px",top:"12px",cursor:"pointer"});
    close.onclick=()=>panel.style.display="none";
    const textarea=document.createElement("textarea");
    Object.assign(textarea.style,{
        flex:"1",
        border:"none",
        outline:"none",
        resize:"none",
        padding:"16px",
        background:"transparent",
        color:"inherit",
        fontFamily:"monospace",
        fontSize:"13px"
    });
    textarea.value=theme.css;
    textarea.addEventListener("input",()=>{
        const themes=getThemes();
        const t=themes.find(x=>x.id===editingTheme.id);
        if(!t) return;
        t.css=textarea.value;
        setThemes(themes);
        applyThemes();
        if(window.__avia_refresh_themes_panel){window.__avia_refresh_themes_panel();}
    });
    panel.appendChild(header);
    panel.appendChild(close);
    panel.appendChild(textarea);
    document.body.appendChild(panel);
}

function toggleThemesPanel(){
    let panel=document.getElementById("avia-themes-panel");
    if(panel){
        panel.style.display = panel.style.display==="none"?"flex":"none";
        return;
    }
    panel=document.createElement("div");
    panel.id="avia-themes-panel";
    Object.assign(panel.style,{
        position:"fixed",
        bottom:"40px",
        right:"40px",
        width:"500px",
        height:"380px",
        background:"#1e1e1e",
        color:"#fff",
        borderRadius:"16px",
        boxShadow:"0 12px 35px rgba(0,0,0,0.45)",
        zIndex:999999,
        display:"flex",
        flexDirection:"column",
        overflow:"hidden",
        border:"1px solid rgba(255,255,255,0.08)"
    });
    const header=document.createElement("div");
    header.textContent="Themes";
    Object.assign(header.style,{
        padding:"14px 16px",
        fontWeight:"600",
        fontSize:"14px",
        background:"rgba(255,255,255,0.04)",
        borderBottom:"1px solid rgba(255,255,255,0.08)",
        cursor:"move"
    });
    makeDraggable(panel,header);
    const close=document.createElement("div");
    close.textContent="✕";
    Object.assign(close.style,{position:"absolute",right:"16px",top:"12px",cursor:"pointer"});
    close.onclick=()=>panel.style.display="none";
    const importBtn=document.createElement("button");
    importBtn.textContent="Import Theme";
    Object.assign(importBtn.style,{
        margin:"10px",
        padding:"10px",
        borderRadius:"8px",
        border:"1px solid rgba(255,255,255,0.1)",
        background:"rgba(255,255,255,0.06)",
        color:"#fff",
        fontWeight:"500",
        cursor:"pointer",
        transition:"all .15s ease"
    });
    importBtn.onmouseenter=()=>{importBtn.style.background="rgba(255,255,255,0.12)";};
    importBtn.onmouseleave=()=>{importBtn.style.background="rgba(255,255,255,0.06)";};
    const list=document.createElement("div");
    Object.assign(list.style,{
        flex:"1",
        overflowY:"auto",
        padding:"12px",
        display:"flex",
        flexDirection:"column",
        gap:"8px"
    });
    panel.appendChild(header);
    panel.appendChild(close);
    panel.appendChild(importBtn);
    panel.appendChild(list);
    document.body.appendChild(panel);
    function render(){
        list.innerHTML="";
        const themes=getThemes();
        themes.forEach(theme=>{
            const meta=parseMeta(theme.css);
            const card=document.createElement("div");
            Object.assign(card.style,{
                padding:"10px",
                borderRadius:"10px",
                background:"rgba(255,255,255,0.05)",
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
            });
            const info=document.createElement("div");
            info.innerHTML=`<div style="font-weight:600">${meta.name}</div><div style="font-size:11px;opacity:.7">${meta.author} • v${meta.version}</div><div style="font-size:11px;opacity:.6">${meta.description}</div>`;
            const controls=document.createElement("div");
            const toggle=document.createElement("button");
            toggle.textContent=theme.enabled?"Disable":"Enable";
            toggle.onclick=()=>{
                theme.enabled=!theme.enabled;
                setThemes(themes);
                applyThemes();
                render();
            };
            const edit=document.createElement("button");
            edit.textContent="Edit";
            edit.onclick=()=>openThemeEditor(theme);
            const del=document.createElement("button");
            del.textContent="Delete";
            del.onclick=()=>{
                const updated=themes.filter(t=>t.id!==theme.id);
                setThemes(updated);
                applyThemes();
                render();
            };
            [toggle,edit,del].forEach(b=>{Object.assign(b.style,{marginLeft:"6px",padding:"4px 8px",borderRadius:"6px",border:"none",cursor:"pointer"});controls.appendChild(b);});
            card.appendChild(info);
            card.appendChild(controls);
            list.appendChild(card);
        });
    }
    window.__avia_refresh_themes_panel = render;
    importBtn.onclick=()=>{
        const input=document.createElement("input");
        input.type="file";
        input.accept=".css,.txt";
        input.onchange=async()=>{
            const file=input.files[0];
            if(!file) return;
            const css=await file.text();
            const themes=getThemes();
            themes.push({id:crypto.randomUUID(),css,enabled:true});
            setThemes(themes);
            applyThemes();
            render();
        };
        input.click();
    };
    render();
}

function injectButton(){
    if(document.getElementById("avia-themes-btn")) return;
    const appearanceBtn=[...document.querySelectorAll("a")].find(a=>a.textContent.trim()==="Appearance");
    const quickCSS=document.getElementById("stoat-fake-quickcss");
    if(!appearanceBtn || !quickCSS) return;
    const clone=appearanceBtn.cloneNode(true);
    clone.id="avia-themes-btn";
    const text=[...clone.querySelectorAll("div")].find(d=>d.children.length===0);
    if(text) text.textContent="(Avia) Themes";
    clone.onclick=toggleThemesPanel;
    quickCSS.parentElement.insertBefore(clone, quickCSS.nextSibling);
}

new MutationObserver(injectButton).observe(document.body,{childList:true,subtree:true});
injectButton();
applyThemes();

})();
