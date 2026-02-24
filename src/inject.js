(function () {

    if (window.__AVIA_WEB_LOADED__) return;
    window.__AVIA_WEB_LOADED__ = true;

    const LINKTREE_URL = "https://linktr.ee/GermanAvaLilac";
    const STOAT_SERVER_URL = "https://stt.gg/GvBhcejB";

    function toggleQuickCSSPanel() {
        let panel = document.getElementById('avia-quickcss-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-quickcss-panel';
        panel.style.position = 'fixed';
        panel.style.bottom = '24px';
        panel.style.right = '24px';
        panel.style.width = '420px';
        panel.style.height = '340px';
        panel.style.background = 'var(--md-sys-color-surface, #1e1e1e)';
        panel.style.color = 'var(--md-sys-color-on-surface, #fff)';
        panel.style.borderRadius = '16px';
        panel.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)';
        panel.style.zIndex = '999999';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.overflow = 'hidden';
        panel.style.border = '1px solid rgba(255,255,255,0.08)';
        panel.style.backdropFilter = 'blur(12px)';

        const header = document.createElement('div');
        header.textContent = 'QuickCSS';
        header.style.padding = '14px 16px';
        header.style.fontWeight = '600';
        header.style.fontSize = '14px';
        header.style.letterSpacing = '0.3px';
        header.style.background = 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))';
        header.style.borderBottom = '1px solid rgba(255,255,255,0.08)';
        header.style.cursor = 'move';

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '16px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.opacity = '0.7';
        closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => panel.style.display = 'none';

        const textarea = document.createElement('textarea');
        textarea.style.flex = '1';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.resize = 'none';
        textarea.style.padding = '16px';
        textarea.style.background = 'transparent';
        textarea.style.color = 'inherit';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '13px';
        textarea.style.lineHeight = '1.4';
        textarea.value = localStorage.getItem('avia_quickcss') || '';

        textarea.addEventListener('input', () => {
            localStorage.setItem('avia_quickcss', textarea.value);
            applyQuickCSS(textarea.value);
        });

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(textarea);
        document.body.appendChild(panel);

        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
    }

    function setIcon(button, type) {
        const oldSvg = button.querySelector('svg');
        if (oldSvg) oldSvg.remove();

        const icons = {
            monitor: "M3 4h18v12H3V4zm2 2v8h14V6H5zm3 12h8v2H8v-2z",
            upload: "M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h4.66V9h3.84L12 2z",
            refresh: "M17.65 6.35A7.95 7.95 0 0012 4V1L7 6l5 5V7a5 5 0 11-5 5H5a7 7 0 107.75-6.65z",
            code: "M8.7 16.3L4.4 12l4.3-4.3 1.4 1.4L7.2 12l2.9 2.9-1.4 1.4zm6.6 0l-1.4-1.4L16.8 12l-2.9-2.9 1.4-1.4L19.6 12l-4.3 4.3z"
        };

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "20");
        svg.setAttribute("height", "20");
        svg.setAttribute("fill", "currentColor");
        svg.style.marginRight = "8px";

        const path = document.createElementNS(svgNS, "path");
        path.setAttribute("d", icons[type]);
        svg.appendChild(path);

        button.insertBefore(svg, button.firstChild);
    }

    function showFontLoaderPopup() {
        removeExistingPopup();
        const popup = document.createElement('div');
        popup.id = 'avia-font-loader-popup';
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '16px',
            background: '#1e1e1e',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            zIndex: 999999,
            minWidth: '320px'
        });
        popup.innerHTML = `
            <div style="margin-bottom:8px;">Paste font URL (.ttf, .woff, etc.)</div>
            <input id="avia-font-url" type="text" style="width:100%; padding:6px; margin-bottom:8px; border-radius:6px; border:none; outline:none;"/>
            <div style="display:flex; justify-content:flex-end; gap:8px;">
                <button id="avia-font-apply" style="padding:6px 12px;">Apply</button>
                <button id="avia-font-cancel" style="padding:6px 12px;">Cancel</button>
            </div>
        `;
        document.body.appendChild(popup);
        document.getElementById('avia-font-apply').onclick = () => {
            const url = document.getElementById('avia-font-url').value;
            if (!url) return;
            localStorage.setItem('avia_custom_font_url', url);
            applyFont(url);
            alert("Font Applied.");
            popup.remove();
        };
        document.getElementById('avia-font-cancel').onclick = () => popup.remove();
    }

    function showRemoveFontPopup() {
        removeExistingPopup();
        const popup = document.createElement('div');
        popup.id = 'avia-remove-font-popup';
        Object.assign(popup.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '16px',
            background: '#1e1e1e',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
            zIndex: 999999,
            minWidth: '280px',
            textAlign: 'center'
        });
        popup.innerHTML = `
            <div style="margin-bottom:12px;">Are you sure you want to remove the custom font?</div>
            <button id="avia-font-remove" style="padding:6px 12px;">Remove Font</button>
            <button id="avia-font-cancel" style="padding:6px 12px; margin-left:6px;">Cancel</button>
        `;
        document.body.appendChild(popup);
        document.getElementById('avia-font-remove').onclick = () => {
            removeFont();
            popup.remove();
        };
        document.getElementById('avia-font-cancel').onclick = () => popup.remove();
    }

    function removeExistingPopup() {
        const existing = document.getElementById('avia-font-loader-popup') || document.getElementById('avia-remove-font-popup');
        if (existing) existing.remove();
    }

    function applyFont(url) {
        const fontName = "CustomFont" + Date.now();
        let styleTag = document.getElementById('custom-font-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-font-style';
            document.head.appendChild(styleTag);
        }
        let ext = url.split('.').pop().toLowerCase();
        let formatMap = {
            ttf: 'truetype',
            otf: 'opentype',
            woff: 'woff',
            woff2: 'woff2',
            eot: 'embedded-opentype',
            css: 'truetype'
        };
        let format = formatMap[ext] || '';
        styleTag.textContent = `
            @font-face {
                font-family: '${fontName}';
                src: url('${url}')${format ? " format('" + format + "')" : ""};
                font-weight: normal;
                font-style: normal;
            }
            body, body *:not(.material-symbols-outlined) {
                font-family: '${fontName}', sans-serif !important;
            }
        `;
    }

    function removeFont() {
        localStorage.removeItem('avia_custom_font_url');
        const styleTag = document.getElementById('custom-font-style');
        if (styleTag) styleTag.remove();
        alert("Reverted Font To Original Settings.");
    }

    (function applySavedFont() {
        const savedUrl = localStorage.getItem('avia_custom_font_url');
        if (savedUrl) applyFont(savedUrl);
    })();

    function injectButtons() {
        const appearanceBtn = Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === 'Appearance');
        if (!appearanceBtn) return;

        const targetBtn = document.querySelector(
            'a.pos_relative.min-w_0.d_flex.ai_center.p_6px_8px.bdr_8px.fw_500.me_12px.fs_15px.us_none.trs_background-color_0\\.1s_ease-in-out.c_var\\(\\--md-sys-color-on-surface\\).fill_var\\(\\--md-sys-color-on-surface\\).bg_unset'
        );
        if (!targetBtn) return;

        if (!document.getElementById('stoat-fake-linktree')) {
            const linktreeBtn = appearanceBtn.cloneNode(true);
            linktreeBtn.id = 'stoat-fake-linktree';
            const textNode = Array.from(linktreeBtn.querySelectorAll('div')).find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
            if (textNode) textNode.textContent = "(Avia) Ava's Linktree";
            setIcon(linktreeBtn, "monitor");
            linktreeBtn.addEventListener('click', () => window.open(LINKTREE_URL, "_blank"));
            targetBtn.parentElement.insertBefore(linktreeBtn, targetBtn);

            const stoatBtn = appearanceBtn.cloneNode(true);
            stoatBtn.id = 'stoat-fake-stoatserver';
            const stoatTextNode = Array.from(stoatBtn.querySelectorAll('div')).find(d => d.children.length === 0 && d.textContent.trim() === 'Appearance');
            if (stoatTextNode) stoatTextNode.textContent = "(Avia) Stoat Server";
            setIcon(stoatBtn, "monitor");
            stoatBtn.addEventListener('click', () => window.open(STOAT_SERVER_URL, "_blank"));
            linktreeBtn.parentElement.insertBefore(stoatBtn, linktreeBtn.nextSibling);
        }

        if (!document.getElementById('stoat-fake-loadfont')) {
            const newBtn = appearanceBtn.cloneNode(true);
            newBtn.id = 'stoat-fake-loadfont';
            const textNode = Array.from(newBtn.querySelectorAll('div')).find(d => d.children.length === 0);
            if (textNode) textNode.textContent = "(Avia) Font Loader";
            setIcon(newBtn, "upload");
            newBtn.addEventListener('click', showFontLoaderPopup);

            const stoatBtn = document.getElementById('stoat-fake-stoatserver');
            stoatBtn ? stoatBtn.parentElement.insertBefore(newBtn, stoatBtn.nextSibling) :
                       document.getElementById('stoat-fake-linktree').parentElement.insertBefore(newBtn, document.getElementById('stoat-fake-linktree').nextSibling);

            if (!document.getElementById('stoat-fake-removefont')) {
                const removeBtn = appearanceBtn.cloneNode(true);
                removeBtn.id = 'stoat-fake-removefont';
                const removeTextNode = Array.from(removeBtn.querySelectorAll('div')).find(d => d.children.length === 0);
                if (removeTextNode) removeTextNode.textContent = "(Avia) Remove selected font";
                setIcon(removeBtn, "refresh");
                removeBtn.addEventListener('click', showRemoveFontPopup);
                newBtn.parentElement.insertBefore(removeBtn, newBtn.nextSibling);
            }
        }

        if (!document.getElementById('stoat-fake-quickcss')) {
            const quickCssBtn = appearanceBtn.cloneNode(true);
            quickCssBtn.id = 'stoat-fake-quickcss';
            const quickCssTextNode = Array.from(quickCssBtn.querySelectorAll('div')).find(d => d.children.length === 0);
            if (quickCssTextNode) quickCssTextNode.textContent = "(Avia) QuickCSS";
            setIcon(quickCssBtn, "code");
            quickCssBtn.addEventListener('click', toggleQuickCSSPanel);

            const lastBtn = document.getElementById('stoat-fake-removefont') || 
                            document.getElementById('stoat-fake-loadfont') || 
                            document.getElementById('stoat-fake-stoatserver') || 
                            document.getElementById('stoat-fake-linktree');
            lastBtn.parentElement.insertBefore(quickCssBtn, lastBtn.nextSibling);
        }
    }

    function applyQuickCSS(css) {
        let styleTag = document.getElementById('avia-quickcss-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'avia-quickcss-style';
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = css;
    }

    (function applySavedQuickCSS() {
        const savedCSS = localStorage.getItem('avia_quickcss');
        if (savedCSS) applyQuickCSS(savedCSS);
    })();

    function waitForBody(callback) {
        if (document.body) callback();
        else new MutationObserver((obs) => {
            if (document.body) {
                obs.disconnect();
                callback();
            }
        }).observe(document.documentElement, { childList: true });
    }

    waitForBody(() => {
        const observer = new MutationObserver(() => injectButtons());
        observer.observe(document.body, { childList: true, subtree: true });
        injectButtons();
    });

})();