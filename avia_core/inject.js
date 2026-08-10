(function () {

    if (window.__AVIA_WEB_LOADED__) return;
    window.__AVIA_WEB_LOADED__ = true;

    const LINKTREE_URL = "https://linktr.ee/GermanAvaLilac";
    const STOAT_SERVER_URL = "https://stt.gg/GvBhcejB";

    function preloadMonaco() {
        return new Promise(resolve => {
            if (window.monaco) return resolve();
            const loader = document.createElement("script");
            loader.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs/loader.js";
            loader.onload = function () {
                require.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs" } });
                require(["vs/editor/editor.main"], () => resolve());
            };
            document.head.appendChild(loader);
        });
    }

    async function toggleQuickCSSPanel() {
        await preloadMonaco();

        let panel = document.getElementById('avia-quickcss-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        panel = document.createElement('div');
        panel.id = 'avia-quickcss-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '650px',
            height: '420px',
            background: 'var(--md-sys-color-surface, #1e1e1e)',
            color: 'var(--md-sys-color-on-surface, #fff)',
            borderRadius: '16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.35)',
            zIndex: '999999',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(12px)'
        });

        const header = document.createElement('div');
        header.textContent = 'QuickCSS';
        Object.assign(header.style, {
            padding: '14px 16px',
            fontWeight: '600',
            fontSize: '14px',
            letterSpacing: '0.3px',
            background: 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            cursor: 'move',
            color: '#fff'
        });

        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        Object.assign(closeBtn.style, {
            position: 'absolute',
            top: '12px',
            right: '16px',
            cursor: 'pointer',
            opacity: '0.7',
            color: '#fff'
        });
        closeBtn.onmouseenter = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseleave = () => closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => panel.style.display = 'none';

        const editorContainer = document.createElement('div');
        editorContainer.style.flex = '1';

        panel.appendChild(header);
        panel.appendChild(closeBtn);
        panel.appendChild(editorContainer);
        document.body.appendChild(panel);

        const editor = monaco.editor.create(editorContainer, {
            value: localStorage.getItem('avia_quickcss') || '',
            language: 'css',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            wordWrap: 'on'
        });

        editor.onDidChangeModelContent(() => {
            const value = editor.getValue();
            localStorage.setItem('avia_quickcss', value);
            applyQuickCSS(value);
        });

        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', e => {
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offsetX) + 'px';
            panel.style.top = (e.clientY - offsetY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
    }

    function applyFont(src, name) {
        const fontName = "CustomFont" + Date.now();
        let styleTag = document.getElementById('custom-font-style');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'custom-font-style';
            document.head.appendChild(styleTag);
        }
        const ext = (name || src).split('.').pop().split('?')[0].toLowerCase();
        const formatMap = {
            ttf: 'truetype',
            otf: 'opentype',
            woff: 'woff',
            woff2: 'woff2',
            eot: 'embedded-opentype'
        };
        const format = formatMap[ext] || '';
        styleTag.textContent = `
            @font-face {
                font-family: '${fontName}';
                src: url('${src}')${format ? " format('" + format + "')" : ""};
                font-weight: normal;
                font-style: normal;
            }
            body, body *:not(.material-symbols-outlined) {
                font-family: '${fontName}', sans-serif !important;
            }
        `;
        if (name) localStorage.setItem('avia_custom_font_name', name);
    }

    function removeFont() {
        localStorage.removeItem('avia_custom_font_url');
        localStorage.removeItem('avia_custom_font_data');
        localStorage.removeItem('avia_custom_font_name');
        const styleTag = document.getElementById('custom-font-style');
        if (styleTag) styleTag.remove();
    }

    (function applySavedFont() {
        const data = localStorage.getItem('avia_custom_font_data');
        const url = localStorage.getItem('avia_custom_font_url');
        const name = localStorage.getItem('avia_custom_font_name') || '';
        if (data) applyFont(data, name);
        else if (url) applyFont(url, name);
    })();

    function showFontLoaderModal() {
        if (document.getElementById('avia-font-modal-scrim')) return;

        const styleEl = document.createElement('style');
        styleEl.id = 'avia-font-modal-styles';
        styleEl.textContent = `
            @keyframes avia-scrim-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes avia-modal-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            #avia-font-modal-inner { animation: avia-modal-in 0.15s forwards; }
            .avia-tab-btn { transition: background 0.15s, color 0.15s; font-family: inherit; }
            .avia-tab-btn:hover { opacity: 0.8; }
            .avia-tab-btn.avia-tab-active {
                background: var(--md-sys-color-primary, rgba(103,80,164,0.9)) !important;
                color: #fff !important;
            }
            .avia-modal-action-btn {
                height: 40px;
                border-radius: 999px;
                border: none;
                padding: 0 16px;
                font-size: 0.875rem;
                font-weight: 500;
                letter-spacing: 0.015625rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.15s;
                font-family: inherit;
            }
            .avia-modal-action-btn:hover { opacity: 0.8; }
            .avia-modal-action-btn:disabled { cursor: not-allowed; opacity: 0.38; }
            .avia-font-input {
                width: 100%;
                box-sizing: border-box;
                padding: 14px 16px;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.12);
                background: rgba(255,255,255,0.06);
                color: var(--md-sys-color-on-surface, #fff);
                font-size: 0.875rem;
                outline: none;
                font-family: inherit;
                transition: border-color 0.15s;
            }
            .avia-font-input:focus { border-color: var(--md-sys-color-primary, rgba(103,80,164,0.9)); }
            .avia-font-input::placeholder { color: rgba(255,255,255,0.4); }
            .avia-file-drop {
                width: 100%;
                box-sizing: border-box;
                border: 2px dashed rgba(255,255,255,0.15);
                border-radius: 12px;
                padding: 28px 16px;
                text-align: center;
                cursor: pointer;
                transition: border-color 0.15s, background 0.15s;
                color: rgba(255,255,255,0.5);
                font-size: 0.875rem;
            }
            .avia-file-drop:hover, .avia-file-drop.avia-drag-over {
                border-color: var(--md-sys-color-primary, rgba(103,80,164,0.9));
                background: rgba(103,80,164,0.08);
            }
        `;
        document.head.appendChild(styleEl);

        const scrim = document.createElement('div');
        scrim.id = 'avia-font-modal-scrim';
        Object.assign(scrim.style, {
            position: 'fixed',
            top: '0', left: '0', right: '0', bottom: '0',
            zIndex: '999983',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(0,0,0,0.6)',
            padding: '80px',
            overflowY: 'auto',
            animation: 'avia-scrim-in 0.1s forwards',
            boxSizing: 'border-box'
        });

        scrim.addEventListener('click', e => {
            if (e.target === scrim) {
                scrim.remove();
                styleEl.remove();
            }
        });

        const modal = document.createElement('div');
        modal.id = 'avia-font-modal-inner';
        Object.assign(modal.style, {
            padding: '24px',
            minWidth: '340px',
            maxWidth: '480px',
            width: '100%',
            borderRadius: '28px',
            display: 'flex',
            flexDirection: 'column',
            color: 'var(--md-sys-color-on-surface, #fff)',
            background: 'var(--md-sys-color-surface-container-high, #2b2b2f)',
            boxSizing: 'border-box'
        });

        const title = document.createElement('span');
        title.textContent = 'Font Loader';
        Object.assign(title.style, {
            lineHeight: '2rem',
            fontSize: '1.5rem',
            letterSpacing: '0',
            fontWeight: '400',
            marginBottom: '6px'
        });
        modal.appendChild(title);

        const activeFontEl = document.createElement('div');
        activeFontEl.id = 'avia-font-active-label';
        Object.assign(activeFontEl.style, {
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: '18px',
            minHeight: '16px'
        });
        const savedName = localStorage.getItem('avia_custom_font_name') || '';
        activeFontEl.textContent = savedName ? 'Active: ' + savedName : 'No custom font active';
        modal.appendChild(activeFontEl);

        const tabRow = document.createElement('div');
        Object.assign(tabRow.style, { display: 'flex', gap: '8px', marginBottom: '18px' });

        const tabUrl = document.createElement('button');
        tabUrl.textContent = 'URL';
        tabUrl.className = 'avia-tab-btn avia-tab-active';
        Object.assign(tabUrl.style, {
            flex: '1', padding: '8px', borderRadius: '8px', border: 'none',
            background: 'var(--md-sys-color-primary, rgba(103,80,164,0.9))',
            color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
        });

        const tabFile = document.createElement('button');
        tabFile.textContent = 'Local File';
        tabFile.className = 'avia-tab-btn';
        Object.assign(tabFile.style, {
            flex: '1', padding: '8px', borderRadius: '8px', border: 'none',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
            fontSize: '13px', fontWeight: '600', cursor: 'pointer'
        });

        tabRow.appendChild(tabUrl);
        tabRow.appendChild(tabFile);
        modal.appendChild(tabRow);

        const body = document.createElement('div');
        Object.assign(body.style, { marginBottom: '20px' });
        modal.appendChild(body);

        const urlInput = document.createElement('input');
        urlInput.className = 'avia-font-input';
        urlInput.type = 'text';
        urlInput.placeholder = 'https://example.com/font.ttf';
        const savedUrl = localStorage.getItem('avia_custom_font_url') || '';
        if (savedUrl) urlInput.value = savedUrl;

        const fileDropZone = document.createElement('div');
        fileDropZone.className = 'avia-file-drop';

        const fileDropText = document.createElement('div');
        fileDropText.style.marginBottom = '6px';
        fileDropText.textContent = 'Drop a font file here or click to browse';

        const fileDropSub = document.createElement('div');
        Object.assign(fileDropSub.style, { fontSize: '11px', opacity: '0.5' });
        fileDropSub.textContent = '.ttf · .otf · .woff · .woff2';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ttf,.otf,.woff,.woff2';
        fileInput.style.display = 'none';

        fileDropZone.appendChild(fileDropText);
        fileDropZone.appendChild(fileDropSub);
        fileDropZone.appendChild(fileInput);

        fileDropZone.addEventListener('click', () => fileInput.click());
        fileDropZone.addEventListener('dragover', e => { e.preventDefault(); fileDropZone.classList.add('avia-drag-over'); });
        fileDropZone.addEventListener('dragleave', () => fileDropZone.classList.remove('avia-drag-over'));
        fileDropZone.addEventListener('drop', e => {
            e.preventDefault();
            fileDropZone.classList.remove('avia-drag-over');
            const f = e.dataTransfer.files[0];
            if (f) handleFileSelected(f);
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) handleFileSelected(fileInput.files[0]);
        });

        let selectedFile = null;
        let currentTab = 'url';

        function handleFileSelected(f) {
            selectedFile = f;
            fileDropText.textContent = f.name;
            fileDropSub.textContent = (f.size / 1024).toFixed(1) + ' KB';
            fileDropZone.style.borderColor = 'var(--md-sys-color-primary, rgba(103,80,164,0.9))';
            fileDropZone.style.background = 'rgba(103,80,164,0.08)';
            applyBtn.disabled = false;
        }

        function renderTab() {
            body.innerHTML = '';
            selectedFile = null;
            if (currentTab === 'url') {
                tabUrl.classList.add('avia-tab-active');
                tabUrl.style.background = 'var(--md-sys-color-primary, rgba(103,80,164,0.9))';
                tabUrl.style.color = '#fff';
                tabFile.classList.remove('avia-tab-active');
                tabFile.style.background = 'rgba(255,255,255,0.06)';
                tabFile.style.color = 'rgba(255,255,255,0.7)';
                applyBtn.disabled = false;
                body.appendChild(urlInput);
            } else {
                tabFile.classList.add('avia-tab-active');
                tabFile.style.background = 'var(--md-sys-color-primary, rgba(103,80,164,0.9))';
                tabFile.style.color = '#fff';
                tabUrl.classList.remove('avia-tab-active');
                tabUrl.style.background = 'rgba(255,255,255,0.06)';
                tabUrl.style.color = 'rgba(255,255,255,0.7)';
                applyBtn.disabled = true;
                body.appendChild(fileDropZone);
            }
        }

        tabUrl.addEventListener('click', () => { currentTab = 'url'; renderTab(); });
        tabFile.addEventListener('click', () => { currentTab = 'file'; renderTab(); });

        const btnRow = document.createElement('div');
        Object.assign(btnRow.style, {
            display: 'flex', justifyContent: 'flex-end',
            gap: '8px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center'
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove Font';
        removeBtn.className = 'avia-modal-action-btn';
        Object.assign(removeBtn.style, {
            color: 'var(--md-sys-color-error, #f2b8b8)',
            background: 'transparent',
            marginRight: 'auto'
        });
        removeBtn.addEventListener('click', () => {
            removeFont();
            activeFontEl.textContent = 'No custom font active';
            fileDropText.textContent = 'Drop a font file here or click to browse';
            fileDropSub.textContent = '.ttf · .otf · .woff · .woff2';
            fileDropZone.style.borderColor = '';
            fileDropZone.style.background = '';
            urlInput.value = '';
            selectedFile = null;
        });

        const closeModalBtn = document.createElement('button');
        closeModalBtn.textContent = 'Close';
        closeModalBtn.className = 'avia-modal-action-btn';
        Object.assign(closeModalBtn.style, {
            color: 'var(--md-sys-color-primary, #cfbcff)',
            background: 'transparent'
        });
        closeModalBtn.addEventListener('click', () => { scrim.remove(); styleEl.remove(); });

        const applyBtn = document.createElement('button');
        applyBtn.textContent = 'Apply';
        applyBtn.className = 'avia-modal-action-btn';
        Object.assign(applyBtn.style, {
            background: 'var(--md-sys-color-primary, rgba(103,80,164,0.9))',
            color: '#fff'
        });

        applyBtn.addEventListener('click', () => {
            if (currentTab === 'url') {
                const url = urlInput.value.trim();
                if (!url) return;
                localStorage.removeItem('avia_custom_font_data');
                localStorage.removeItem('avia_custom_font_name');
                localStorage.setItem('avia_custom_font_url', url);
                const name = url.split('/').pop().split('?')[0];
                applyFont(url, name);
                activeFontEl.textContent = 'Active: ' + name;
            } else {
                if (!selectedFile) return;
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result;
                    localStorage.removeItem('avia_custom_font_url');
                    localStorage.setItem('avia_custom_font_data', dataUrl);
                    applyFont(dataUrl, selectedFile.name);
                    activeFontEl.textContent = 'Active: ' + selectedFile.name;
                };
                reader.readAsDataURL(selectedFile);
            }
        });

        btnRow.appendChild(removeBtn);
        btnRow.appendChild(closeModalBtn);
        btnRow.appendChild(applyBtn);
        modal.appendChild(btnRow);

        scrim.appendChild(modal);
        document.body.appendChild(scrim);

        renderTab();
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

    function openLink(url) {
        return function () {
            window.open(url, "_blank");
        };
    }

    function registerWithAviaMenu() {
        if (window.AviaMenu) {
            window.AviaMenu.register({ id: "avia_fontloader", name: "Font Loader", icon: "upload", onClick: showFontLoaderModal });
            window.AviaMenu.register({ id: "avia_quickcss", name: "QuickCSS", icon: "code", onClick: toggleQuickCSSPanel });
        } else {
            const interval = setInterval(() => {
                if (window.AviaMenu) {
                    clearInterval(interval);
                    window.AviaMenu.register({ id: "avia_fontloader", name: "Font Loader", icon: "upload", onClick: showFontLoaderModal });
                    window.AviaMenu.register({ id: "avia_quickcss", name: "QuickCSS", icon: "code", onClick: toggleQuickCSSPanel });
                }
            }, 100);
        }
    }

    function registerWithAviaCategory() {
        if (window.AviaCategory) {
            window.AviaCategory.register({ id: "avia_linktree", name: "Ava's Linktree", icon: "desktop_windows", onClick: openLink(LINKTREE_URL) });
            window.AviaCategory.register({ id: "avia_stoatserver", name: "Stoat Server", icon: "desktop_windows", onClick: openLink(STOAT_SERVER_URL) });
            window.AviaCategory.register({ id: "avia_fontloader", name: "Font Loader", icon: "upload", onClick: showFontLoaderModal });
            window.AviaCategory.register({ id: "avia_quickcss", name: "QuickCSS", icon: "code", onClick: toggleQuickCSSPanel });
        } else {
            const interval = setInterval(() => {
                if (window.AviaCategory) {
                    clearInterval(interval);
                    window.AviaCategory.register({ id: "avia_linktree", name: "Ava's Linktree", icon: "desktop_windows", onClick: openLink(LINKTREE_URL) });
                    window.AviaCategory.register({ id: "avia_stoatserver", name: "Stoat Server", icon: "desktop_windows", onClick: openLink(STOAT_SERVER_URL) });
                    window.AviaCategory.register({ id: "avia_fontloader", name: "Font Loader", icon: "upload", onClick: showFontLoaderModal });
                    window.AviaCategory.register({ id: "avia_quickcss", name: "QuickCSS", icon: "code", onClick: toggleQuickCSSPanel });
                }
            }, 100);
        }
    }

    preloadMonaco();
    registerWithAviaMenu();
    registerWithAviaCategory();

})();
