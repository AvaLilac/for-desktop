(function () {

    if (window.__WHATS_NEW___) return;
    window.__WHATS_NEW__ = true;

    const BACKEND_URL = "https://raw.githubusercontent.com/AvaLilac/aviaclient-backend-whatsnew/refs/heads/main/backend1-7-0.json";

    function injectStyles() {
        if (document.getElementById("avia-whatsnew-styles")) return;
        const style = document.createElement("style");
        style.id = "avia-whatsnew-styles";
        style.textContent = `
            #avia-whatsnew-scrim {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: rgba(0,0,0,0.6);
                display: grid;
                place-items: center;
                padding: 80px;
                overflow-y: auto;
                animation: aviaScrimIn 0.1s forwards;
            }
            @keyframes aviaScrimIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            #avia-whatsnew-modal {
                opacity: 1;
                padding: 24px;
                min-width: 280px;
                max-width: 560px;
                width: 100%;
                border-radius: 28px;
                display: flex;
                flex-direction: column;
                color: var(--md-sys-color-on-surface, #fff);
                background: var(--md-sys-color-surface-container-high, #2a2a2a);
                box-sizing: border-box;
            }
            #avia-whatsnew-modal * { box-sizing: border-box; }
            .avia-wn-title {
                line-height: 2rem;
                font-size: 1.5rem;
                letter-spacing: 0;
                font-weight: 400;
                margin-bottom: 16px;
            }
            .avia-wn-body {
                color: var(--md-sys-color-on-surface-variant, rgba(255,255,255,0.7));
                line-height: 1.25rem;
                font-size: 0.875rem;
                letter-spacing: 0.015625rem;
                font-weight: 400;
            }
            .avia-wn-body > * + * { margin-top: 0; }
            .avia-wn-date {
                display: block;
                margin-bottom: 12px;
                font-size: 0.875rem;
                color: var(--md-sys-color-on-surface-variant, rgba(255,255,255,0.5));
            }
            .avia-wn-h1 {
                font-size: 2em;
                font-weight: 600;
                margin: 0 0 4px 0;
                color: var(--md-sys-color-on-surface, #fff);
            }
            .avia-wn-h2 {
                font-size: 1.6em;
                font-weight: 600;
                margin: 0 0 4px 0;
                color: var(--md-sys-color-on-surface, #fff);
            }
            .avia-wn-h3 {
                font-size: 1.4em;
                font-weight: 600;
                margin: 0 0 4px 0;
                color: var(--md-sys-color-on-surface, #fff);
            }
            .avia-wn-p {
                margin: 0;
                line-height: 1.6;
            }
            .avia-wn-spacer { display: block; height: 0.75em; }
            .avia-wn-img {
                max-width: 100%;
                height: auto;
                border-radius: 12px;
                display: block;
            }
            .avia-wn-ul {
                padding-left: 1.5em;
                margin: 0;
                list-style-position: outside;
            }
            .avia-wn-ul li {
                list-style-type: disc;
                margin-bottom: 4px;
                line-height: 1.5;
            }
            .avia-wn-ol {
                padding-left: 1.5em;
                margin: 0;
                list-style-position: outside;
            }
            .avia-wn-ol li {
                list-style-type: decimal;
                margin-bottom: 4px;
                line-height: 1.5;
            }
            .avia-wn-hr {
                border: none;
                border-top: 1px solid rgba(255,255,255,0.1);
                margin: 4px 0;
            }
            .avia-wn-code {
                font-family: var(--fonts-monospace, monospace);
                font-size: 0.85em;
                background: #0d1117;
                color: #c9d1d9;
                padding: 1px 4px;
                border-radius: 4px;
            }
            .avia-wn-blockquote {
                border-left: 3px solid rgba(255,255,255,0.2);
                margin: 0;
                padding: 4px 12px;
                color: rgba(255,255,255,0.5);
                font-style: italic;
            }
            .avia-wn-bold { font-weight: bold; }
            .avia-wn-footer {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                margin-top: 24px;
            }
            .avia-wn-close-btn {
                line-height: 1.25rem;
                font-size: 0.875rem;
                letter-spacing: 0.015625rem;
                font-weight: 400;
                position: relative;
                padding: 0 16px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: inherit;
                cursor: pointer;
                border: none;
                transition: opacity 0.15s;
                color: var(--md-sys-color-primary, #90caf9);
                background: transparent;
                height: 40px;
                border-radius: 9999px;
            }
            .avia-wn-close-btn:hover { opacity: 0.75; }
        `;
        document.head.appendChild(style);
    }

    function renderBlock(block) {
        switch (block.type) {
            case "image": {
                const img = document.createElement("img");
                img.src = block.src;
                img.alt = block.alt || "";
                img.className = "avia-wn-img";
                img.loading = "lazy";
                return img;
            }
            case "spacer": {
                const s = document.createElement("span");
                s.className = "avia-wn-spacer";
                return s;
            }
            case "h1": {
                const el = document.createElement("h1");
                el.className = "avia-wn-h1";
                el.textContent = block.text || "";
                return el;
            }
            case "h2": {
                const el = document.createElement("h2");
                el.className = "avia-wn-h2";
                el.textContent = block.text || "";
                return el;
            }
            case "h3": {
                const el = document.createElement("h3");
                el.className = "avia-wn-h3";
                el.textContent = block.text || "";
                return el;
            }
            case "paragraph": {
                const el = document.createElement("p");
                el.className = "avia-wn-p";
                el.innerHTML = renderInline(block.text || "");
                return el;
            }
            case "ul": {
                const ul = document.createElement("ul");
                ul.className = "avia-wn-ul";
                (block.items || []).forEach(item => {
                    const li = document.createElement("li");
                    li.innerHTML = renderInline(item);
                    ul.appendChild(li);
                });
                return ul;
            }
            case "ol": {
                const ol = document.createElement("ol");
                ol.className = "avia-wn-ol";
                (block.items || []).forEach(item => {
                    const li = document.createElement("li");
                    li.innerHTML = renderInline(item);
                    ol.appendChild(li);
                });
                return ol;
            }
            case "hr": {
                const hr = document.createElement("hr");
                hr.className = "avia-wn-hr";
                return hr;
            }
            case "blockquote": {
                const bq = document.createElement("blockquote");
                bq.className = "avia-wn-blockquote";
                bq.innerHTML = renderInline(block.text || "");
                return bq;
            }
            default:
                return null;
        }
    }

    function renderInline(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\*\*(.+?)\*\*/g, '<strong class="avia-wn-bold">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code class="avia-wn-code">$1</code>')
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:inherit;text-decoration:underline;opacity:0.8;">$1</a>');
    }

    function openModal(entry) {
        if (document.getElementById("avia-whatsnew-scrim")) return;

        injectStyles();

        const scrim = document.createElement("div");
        scrim.id = "avia-whatsnew-scrim";
        scrim.onclick = (e) => { if (e.target === scrim) scrim.remove(); };

        const modal = document.createElement("div");
        modal.id = "avia-whatsnew-modal";

        const titleEl = document.createElement("span");
        titleEl.className = "avia-wn-title";
        titleEl.textContent = "What's new";
        modal.appendChild(titleEl);

        const body = document.createElement("div");
        body.className = "avia-wn-body";

        const inner = document.createElement("div");
        inner.style.cssText = "display:flex;flex-direction:column;gap:0;";

        if (entry.date) {
            const dateEl = document.createElement("span");
            dateEl.className = "avia-wn-date";
            dateEl.textContent = entry.date;
            inner.appendChild(dateEl);
        }

        (entry.content || []).forEach(block => {
            const el = renderBlock(block);
            if (el) inner.appendChild(el);
        });

        body.appendChild(inner);
        modal.appendChild(body);

        const footer = document.createElement("div");
        footer.className = "avia-wn-footer";

        const closeBtn = document.createElement("button");
        closeBtn.className = "avia-wn-close-btn";
        closeBtn.textContent = "Close";
        closeBtn.onclick = () => scrim.remove();

        footer.appendChild(closeBtn);
        modal.appendChild(footer);
        scrim.appendChild(modal);
        document.body.appendChild(scrim);
    }

    async function fetchAndOpen() {
        try {
            const res = await fetch(BACKEND_URL);
            const data = await res.json();
            const entries = data.entries || [];
            const latest = entries[0];
            if (latest) openModal(latest);
        } catch (e) {
            injectStyles();
            const scrim = document.createElement("div");
            scrim.id = "avia-whatsnew-scrim";
            scrim.onclick = (e) => { if (e.target === scrim) scrim.remove(); };
            const modal = document.createElement("div");
            modal.id = "avia-whatsnew-modal";
            modal.innerHTML = `<div style="opacity:0.5;text-align:center;padding:24px 0;font-size:13px;">Failed to load What's New.</div>`;
            const footer = document.createElement("div");
            footer.className = "avia-wn-footer";
            const closeBtn = document.createElement("button");
            closeBtn.className = "avia-wn-close-btn";
            closeBtn.textContent = "Close";
            closeBtn.onclick = () => scrim.remove();
            footer.appendChild(closeBtn);
            modal.appendChild(footer);
            scrim.appendChild(modal);
            document.body.appendChild(scrim);
        }
    }

    function injectButton() {
        if (document.getElementById("avia-whatsnew-btn")) return;

        const appearanceBtn = [...document.querySelectorAll("a")]
            .find(a => a.textContent.trim() === "Appearance");
        const referenceNode = document.getElementById("stoat-fake-quickcss");
        if (!appearanceBtn || !referenceNode) return;

        const btn = appearanceBtn.cloneNode(true);
        btn.id = "avia-whatsnew-btn";

        const label = [...btn.querySelectorAll("div")].find(d => d.children.length === 0);
        if (label) label.textContent = "(Avia) What's New";

        const iconSpan = btn.querySelector("span.material-symbols-outlined");
        if (iconSpan) iconSpan.remove();

        const oldSvg = btn.querySelector("svg");
        if (oldSvg) oldSvg.remove();

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.cssText = "margin-right:8px;flex-shrink:0;";

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", "M18 11v2h4v-2zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61M20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4M4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9zm5.03 1.71L11 9.53v4.94l-1.97-1.18-.48-.29H4v-2h4.55zM15.5 12c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34");
        svg.appendChild(path);

        const firstChild = btn.firstChild;
        btn.insertBefore(svg, firstChild);

        btn.onclick = (e) => {
            e.preventDefault();
            fetchAndOpen();
        };

        referenceNode.parentElement.insertBefore(btn, referenceNode.nextSibling);
    }

    injectStyles();

    new MutationObserver(() => injectButton())
        .observe(document.body, { childList: true, subtree: true });

    injectButton();

})();
