(function () {

if (window.__AVIA_FAVORITES_LOADED__) return;
window.__AVIA_FAVORITES_LOADED__ = true;

const STORAGE_KEY = "avia_favorites";

const getFavorites = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const setFavorites = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

function extractYouTubeID(url) {
    const reg = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/;
    const match = url.match(reg);
    return match ? match[1] : null;
}

function toggleFavoritesPanel() {

    let panel = document.getElementById("avia-favorites-panel");
    if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
        return;
    }

    panel = document.createElement("div");
    panel.id = "avia-favorites-panel";

    Object.assign(panel.style, {
        position: "fixed",
        bottom: "40px",
        right: "40px",
        width: "640px",
        height: "580px",
        background: "#1e1e1e",
        color: "#fff",
        borderRadius: "20px",
        boxShadow: "0 12px 35px rgba(0,0,0,0.45)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)"
    });

    const header = document.createElement("div");
    header.textContent = "Favorites";
    Object.assign(header.style, {
        padding: "18px",
        fontWeight: "600",
        fontSize: "16px",
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        cursor: "move",
        position: "relative",
        userSelect: "none"
    });

    const close = document.createElement("div");
    close.textContent = "✕";
    Object.assign(close.style, {
        position: "absolute",
        right: "18px",
        top: "16px",
        cursor: "pointer"
    });
    close.onclick = () => panel.style.display = "none";
    header.appendChild(close);

    const inputRow = document.createElement("div");
    Object.assign(inputRow.style, {
        display: "flex",
        gap: "8px",
        padding: "14px 18px"
    });

    const urlInput = document.createElement("input");
    urlInput.placeholder = "Paste link...";
    Object.assign(urlInput.style, {
        flex: "2",
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        outline: "none"
    });

    const titleInput = document.createElement("input");
    titleInput.placeholder = "Optional title...";
    Object.assign(titleInput.style, {
        flex: "1",
        padding: "10px",
        borderRadius: "10px",
        border: "none",
        outline: "none"
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    Object.assign(addBtn.style, {
        padding: "10px 16px",
        borderRadius: "10px",
        border: "none",
        cursor: "pointer"
    });

    inputRow.appendChild(urlInput);
    inputRow.appendChild(titleInput);
    inputRow.appendChild(addBtn);

    const grid = document.createElement("div");
    Object.assign(grid.style, {
        flex: "1",
        minHeight: "0",
        overflowY: "auto",
        padding: "18px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, 120px)",
        gap: "14px",
        alignContent: "start"
    });

    panel.appendChild(header);
    panel.appendChild(inputRow);
    panel.appendChild(grid);
    document.body.appendChild(panel);

    let isDragging = false, offsetX, offsetY;

    header.addEventListener("mousedown", e => {
        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
    });

    document.addEventListener("mouseup", () => isDragging = false);

    document.addEventListener("mousemove", e => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offsetX) + "px";
        panel.style.top = (e.clientY - offsetY) + "px";
        panel.style.right = "auto";
        panel.style.bottom = "auto";
    });

    function showToast(card) {
        const toast = document.createElement("div");
        toast.textContent = "Copied to clipboard";
        Object.assign(toast.style, {
            position: "absolute",
            bottom: "6px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.85)",
            padding: "6px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            opacity: "0",
            transition: "opacity 0.2s",
            pointerEvents: "none"
        });
        card.appendChild(toast);
        requestAnimationFrame(() => toast.style.opacity = "1");
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 200);
        }, 2000);
    }

    function fallbackCopy(text) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try { document.execCommand("copy"); } catch {}
        document.body.removeChild(textarea);
    }

    function render() {

        grid.innerHTML = "";
        const favorites = getFavorites();

        favorites.forEach(item => {

            const card = document.createElement("div");
            Object.assign(card.style, {
                position: "relative",
                width: "120px",
                height: "120px",
                borderRadius: "14px",
                overflow: "hidden",
                background: "rgba(255,255,255,0.05)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            });

            const remove = document.createElement("div");
            remove.textContent = "✕";
            Object.assign(remove.style, {
                position: "absolute",
                top: "6px",
                right: "8px",
                fontSize: "12px",
                cursor: "pointer",
                background: "rgba(0,0,0,0.6)",
                padding: "2px 6px",
                borderRadius: "6px",
                zIndex: 2
            });

            remove.onclick = (e) => {
                e.stopPropagation();
                setFavorites(favorites.filter(f => f.url !== item.url));
                render();
            };

            card.appendChild(remove);

            let mediaAdded = false;

            const ytID = extractYouTubeID(item.url);
            if (ytID) {
                const img = new Image();
                img.src = `https://img.youtube.com/vi/${ytID}/hqdefault.jpg`;
                Object.assign(img.style, { width:"100%", height:"100%", objectFit:"cover" });
                card.appendChild(img);
                mediaAdded = true;
            }

            if (!mediaAdded) {
                const ext = item.url.split(".").pop().split("?")[0].toLowerCase();
                const isVideo = ["mp4","webm","mov","gifv"].includes(ext);

                if (isVideo) {
                    const video = document.createElement("video");
                    video.src = item.url.replace(".gifv",".mp4");
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    Object.assign(video.style, { width:"100%", height:"100%", objectFit:"cover" });
                    video.onerror = fallback;
                    card.appendChild(video);
                } else {
                    const img = new Image();
                    img.src = item.url;
                    Object.assign(img.style, { width:"100%", height:"100%", objectFit:"cover" });
                    img.onerror = fallback;
                    card.appendChild(img);
                }
            }

            function fallback() {
                card.innerHTML = "";
                card.appendChild(remove);
                const text = document.createElement("div");
                text.textContent = item.title || item.url;
                Object.assign(text.style, {
                    padding:"8px",
                    fontSize:"11px",
                    textAlign:"center",
                    wordBreak:"break-word"
                });
                card.appendChild(text);
            }

            if (item.title) {
                const titleOverlay = document.createElement("div");
                titleOverlay.textContent = item.title;
                Object.assign(titleOverlay.style, {
                    position:"absolute",
                    bottom:"0",
                    width:"100%",
                    background:"rgba(0,0,0,0.6)",
                    fontSize:"11px",
                    padding:"4px",
                    textAlign:"center",
                    whiteSpace:"nowrap",
                    overflow:"hidden",
                    textOverflow:"ellipsis"
                });
                card.appendChild(titleOverlay);
            }

            card.onclick = () => {
                const doToast = () => showToast(card);
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(item.url)
                        .then(doToast)
                        .catch(() => {
                            fallbackCopy(item.url);
                            doToast();
                        });
                } else {
                    fallbackCopy(item.url);
                    doToast();
                }
            };

            grid.appendChild(card);
        });
    }

    addBtn.onclick = () => {
        const url = urlInput.value.trim();
        const title = titleInput.value.trim();
        if (!url) return;
        const favorites = getFavorites();
        if (favorites.some(f => f.url === url)) return;
        favorites.push({ url, title, addedAt: Date.now() });
        setFavorites(favorites);
        urlInput.value = "";
        titleInput.value = "";
        render();
    };

    render();
}

function injectButton() {

    if (document.getElementById("avia-favorites-btn")) return;

    const gifSpan = [...document.querySelectorAll("span.material-symbols-outlined")]
        .find(s => s.textContent.trim() === "gif");

    if (!gifSpan) return;

    const wrapper = gifSpan.closest("div.flex-sh_0");
    if (!wrapper) return;

    const clone = wrapper.cloneNode(true);
    clone.id = "avia-favorites-btn";
    clone.querySelector("span.material-symbols-outlined").textContent = "star";
    clone.querySelector("button").onclick = toggleFavoritesPanel;

    wrapper.parentElement.insertBefore(clone, wrapper.nextSibling);
}

new MutationObserver(injectButton)
.observe(document.body, { childList: true, subtree: true });

injectButton();

})();
