(function () {

    if (window.__AVIA_THEMES_LOADED__) return;
    window.__AVIA_THEMES_LOADED__ = true;

    const STORAGE_KEY = "avia_themes";
    let editingTheme = null;

    const TEMPLATE = `/*
@name Whatever name here
@author Whatever Author Here
@version 1.0
@description Whatever description here
*/

`;

    const getThemes = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const setThemes = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    function parseMeta(css){
        const name = css.match(/@name\s+(.+)/)?.[1] || "Unknown Theme";
        const author = css.match(/@author\s+(.+)/)?.[1] || "Unknown";
        const version = css.match(/@version\s+(.+)/)?.[1] || "1.0";
        const rawDescription = css.match(/@description\s+(.+)/)?.[1] || "No Description Available";
        const description = rawDescription.trim() === "*/" ? "No Description Available" : rawDescription;
        return {name,author,version,description};
    }

    function sanitizeFilename(name) {
        return name
            .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
            .replace(/\s+/g, "_")
            .replace(/\.+$/, "")
            .trim() || "theme";
    }

    function downloadTheme(theme) {
        const name = parseMeta(theme.css).name;
        const filename = sanitizeFilename(name) + ".css";
        const blob = new Blob([theme.css], { type: "text/css" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
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

    function styleBtn(btn, bg) {
        Object.assign(btn.style, {
            padding: "5px 12px",
            borderRadius: "8px",
            border: "none",
            background: bg || "rgba(255,255,255,0.08)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "12px",
            whiteSpace: "nowrap",
            fontWeight: "500"
        });
        btn.onmouseenter = () => btn.style.opacity = "0.75";
        btn.onmouseleave = () => btn.style.opacity = "1";
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
            border:"1px solid rgba(255,255,255,0.08)",
            backdropFilter:"blur(12px)"
        });
        const header=document.createElement("div");
        header.textContent="Theme Editor";
        Object.assign(header.style,{
            padding:"14px 16px",
            fontWeight:"600",
            fontSize:"14px",
            background:"var(--md-sys-color-surface-container,rgba(255,255,255,0.04))",
            borderBottom:"1px solid rgba(255,255,255,0.08)",
            cursor:"move"
        });
        makeDraggable(panel,header);
        const close=document.createElement("div");
        close.textContent="✕";
        Object.assign(close.style,{
            position:"absolute",
            right:"16px",
            top:"12px",
            cursor:"pointer",
            opacity:"0.6",
            fontSize:"15px",
            lineHeight:"1",
            padding:"2px 4px"
        });
        close.onmouseenter=()=>close.style.opacity="1";
        close.onmouseleave=()=>close.style.opacity="0.6";
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
            height:"460px",
            background:"var(--md-sys-color-surface,#1e1e1e)",
            color:"var(--md-sys-color-on-surface,#fff)",
            borderRadius:"16px",
            boxShadow:"0 8px 28px rgba(0,0,0,0.35)",
            zIndex:999999,
            display:"flex",
            flexDirection:"column",
            overflow:"hidden",
            border:"1px solid rgba(255,255,255,0.08)",
            backdropFilter:"blur(12px)"
        });

        const header=document.createElement("div");
        header.textContent="Themes";
        Object.assign(header.style,{
            padding:"14px 16px",
            fontWeight:"600",
            fontSize:"14px",
            background:"var(--md-sys-color-surface-container,rgba(255,255,255,0.04))",
            borderBottom:"1px solid rgba(255,255,255,0.08)",
            cursor:"move"
        });
        makeDraggable(panel,header);

        const close=document.createElement("div");
        close.textContent="✕";
        Object.assign(close.style,{
            position:"absolute",
            right:"16px",
            top:"12px",
            cursor:"pointer",
            opacity:"0.6",
            fontSize:"15px",
            lineHeight:"1",
            padding:"2px 4px"
        });
        close.onmouseenter=()=>close.style.opacity="1";
        close.onmouseleave=()=>close.style.opacity="0.6";
        close.onclick=()=>panel.style.display="none";

        const btnRow=document.createElement("div");
        Object.assign(btnRow.style,{
            display:"flex",
            gap:"8px",
            padding:"12px 16px",
            borderBottom:"1px solid rgba(255,255,255,0.08)",
            flex:"0 0 auto"
        });

        const importBtn=document.createElement("button");
        importBtn.textContent="Import Theme";
        styleBtn(importBtn);
        importBtn.style.flex="1";
        importBtn.style.padding="8px 12px";

        const newBtn=document.createElement("button");
        newBtn.textContent="+ New";
        styleBtn(newBtn);
        newBtn.style.flex="1";
        newBtn.style.padding="8px 12px";

        btnRow.appendChild(importBtn);
        btnRow.appendChild(newBtn);

        const list=document.createElement("div");
        Object.assign(list.style,{
            flex:"1",
            overflowY:"auto",
            padding:"16px",
            display:"flex",
            flexDirection:"column",
            gap:"8px"
        });

        const dropOverlay=document.createElement("div");
        dropOverlay.textContent="Drop .css or .txt files here";
        Object.assign(dropOverlay.style,{
            position:"absolute",
            inset:"0",
            background:"rgba(0,0,0,0.6)",
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            fontSize:"18px",
            fontWeight:"600",
            color:"#fff",
            opacity:"0",
            pointerEvents:"none",
            transition:"opacity 0.15s ease",
            borderRadius:"16px"
        });

        panel.appendChild(header);
        panel.appendChild(close);
        panel.appendChild(btnRow);
        panel.appendChild(list);
        panel.appendChild(dropOverlay);
        document.body.appendChild(panel);

        let dragDepth = 0;

        panel.addEventListener("dragenter", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth++;
            dropOverlay.style.opacity = "1";
            panel.style.border = "1px dashed rgba(255,255,255,0.4)";
        });

        panel.addEventListener("dragover", e => {
            e.preventDefault();
            e.stopPropagation();
        });

        panel.addEventListener("dragleave", e => {
            e.preventDefault();
            e.stopPropagation();
            dragDepth--;
            if (dragDepth <= 0) {
                dropOverlay.style.opacity = "0";
                panel.style.border = "1px solid rgba(255,255,255,0.08)";
                dragDepth = 0;
            }
        });

        panel.addEventListener("drop", async e => {
            e.preventDefault();
            e.stopPropagation();
            dropOverlay.style.opacity = "0";
            panel.style.border = "1px solid rgba(255,255,255,0.08)";
            dragDepth = 0;

            const files = [...e.dataTransfer.files].filter(f => f.name.endsWith(".css") || f.name.endsWith(".txt"));
            if (!files.length) return;

            const themes = getThemes();
            for (const file of files) {
                const css = await file.text();
                themes.push({ id: crypto.randomUUID(), css, enabled: true });
            }
            setThemes(themes);
            applyThemes();
            render();
        });

        function render(){
            list.innerHTML="";
            const themes=getThemes();

            if(themes.length === 0){
                const empty=document.createElement("div");
                empty.textContent="No themes yet. Import or create one above.";
                Object.assign(empty.style,{opacity:"0.4",fontSize:"13px"});
                list.appendChild(empty);
                return;
            }

            themes.forEach(theme=>{
                const meta=parseMeta(theme.css);

                const card=document.createElement("div");
                Object.assign(card.style,{
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"center",
                    padding:"10px 12px",
                    borderRadius:"10px",
                    background:"rgba(255,255,255,0.04)",
                    border:"1px solid rgba(255,255,255,0.06)",
                    marginBottom:"0"
                });

                const left=document.createElement("div");
                Object.assign(left.style,{display:"flex",alignItems:"center",gap:"10px"});

                const dot=document.createElement("div");
                Object.assign(dot.style,{
                    width:"10px",
                    height:"10px",
                    borderRadius:"50%",
                    flexShrink:"0",
                    background: theme.enabled ? "#4dff88" : "#777",
                    boxShadow: theme.enabled ? "0 0 6px #4dff88" : "none"
                });

                const info=document.createElement("div");
                info.innerHTML=`<div style="font-weight:600;font-size:13px">${meta.name}</div><div style="font-size:11px;opacity:.5">${meta.author} • v${meta.version}</div><div style="font-size:11px;opacity:.4">${meta.description}</div>`;

                left.appendChild(dot);
                left.appendChild(info);

                const controls=document.createElement("div");
                Object.assign(controls.style,{display:"flex",gap:"6px"});

                const toggle=document.createElement("button");
                toggle.textContent=theme.enabled?"Disable":"Enable";
                styleBtn(toggle);
                toggle.onclick=()=>{
                    theme.enabled=!theme.enabled;
                    setThemes(themes);
                    applyThemes();
                    render();
                };

                const edit=document.createElement("button");
                edit.textContent="Edit";
                styleBtn(edit, "rgba(100,160,255,0.15)");
                edit.onclick=()=>openThemeEditor(theme);

                const dlBtn=document.createElement("button");
                dlBtn.textContent="Export";
                styleBtn(dlBtn, "rgba(80,200,120,0.15)");
                dlBtn.title="Download theme as .css";
                dlBtn.onclick=(e)=>{
                    e.stopPropagation();
                    downloadTheme(theme);
                };

                const del=document.createElement("button");
                del.textContent="✕";
                styleBtn(del, "rgba(255,80,80,0.15)");
                del.onclick=()=>{
                    const updated=themes.filter(t=>t.id!==theme.id);
                    setThemes(updated);
                    applyThemes();
                    render();
                };

                controls.appendChild(toggle);
                controls.appendChild(edit);
                controls.appendChild(dlBtn);
                controls.appendChild(del);
                card.appendChild(left);
                card.appendChild(controls);
                list.appendChild(card);
            });
        }

        window.__avia_refresh_themes_panel = render;

        importBtn.onclick=()=>{
            const input=document.createElement("input");
            input.type="file";
            input.accept=".css,.txt";
            input.multiple=true;
            input.onchange=async()=>{
                const files=[...input.files];
                if(!files.length) return;
                const themes=getThemes();
                for(const file of files){
                    const css=await file.text();
                    themes.push({id:crypto.randomUUID(),css,enabled:true});
                }
                setThemes(themes);
                applyThemes();
                render();
            };
            input.click();
        };

        newBtn.onclick=()=>{
            const themes=getThemes();
            themes.push({id:crypto.randomUUID(),css:TEMPLATE,enabled:true});
            setThemes(themes);
            applyThemes();
            render();
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
