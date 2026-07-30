(function () {
    if (window.__ACCOUNT_SWITCHER__) return;
    window.__ACCOUNT_SWITCHER__ = true;

    const LS_KEY = "accountswitcher";
    const CDN = "https://cdn.stoatusercontent.com";
    const API = "https://api.stoat.chat";

    function openDB() {
        return new Promise((resolve, reject) => {
            const r = indexedDB.open("localforage");
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        });
    }

    async function getTokens() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const r = db.transaction("keyvaluepairs", "readonly")
                            .objectStore("keyvaluepairs").get(LS_KEY);
                r.onsuccess = () => resolve(Array.isArray(r.result) ? r.result : []);
                r.onerror = () => reject(r.error);
            });
        } catch { return []; }
    }

    async function saveTokens(arr) {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const r = db.transaction("keyvaluepairs", "readwrite")
                            .objectStore("keyvaluepairs").put(arr, LS_KEY);
                r.onsuccess = () => resolve();
                r.onerror = () => reject(r.error);
            });
        } catch {}
    }

    async function addToken(token) {
        const tokens = (await getTokens()).filter(t => t !== token);
        tokens.push(token);
        await saveTokens(tokens);
    }

    async function removeToken(token) {
        await saveTokens((await getTokens()).filter(t => t !== token));
    }

    async function getCurrentToken() {
        try {
            const db = await openDB();
            return new Promise((resolve, reject) => {
                const r = db.transaction("keyvaluepairs", "readonly")
                            .objectStore("keyvaluepairs").get("auth");
                r.onsuccess = () => resolve(r.result?.session?.token || null);
                r.onerror = () => reject(r.error);
            });
        } catch { return null; }
    }

    async function loginWithToken(token) {
        const db = await openDB();
        const res = await fetch(`${API}/users/@me`, {
            headers: { "x-session-token": token }
        });
        if (!res.ok) throw new Error("Token is invalid or expired");
        const user = await res.json();
        await new Promise((resolve, reject) => {
            const r = db.transaction("keyvaluepairs", "readwrite")
                        .objectStore("keyvaluepairs")
                        .put({ session: { _id: user._id, token, userId: user._id, valid: true } }, "auth");
            r.onsuccess = () => resolve();
            r.onerror = () => reject(r.error);
        });
        location.href = "https://stoat.chat/app";
    }

    async function fetchProfile(token) {
        try {
            const res = await fetch(`${API}/users/@me`, {
                headers: { "x-session-token": token }
            });
            if (!res.ok) return null;
            const u = await res.json();
            return {
                displayName: u.display_name || u.username || "Unknown",
                username: u.username || "",
                avatarUrl: u.avatar ? `${CDN}/avatars/${u.avatar._id}` : null
            };
        } catch { return null; }
    }

    async function loginWithCredentials(email, password) {
        const res = await fetch("https://api.stoat.chat/auth/session/login", {
            method: "POST",
            headers: { "accept": "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, friendly_name: "AviaAccountSwitcher" })
        });
        const data = await res.json();
        if (!res.ok || data.result !== "Success") {
            throw new Error(data.type || data.result || "Login failed");
        }
        await addToken(data.token);
        return data.token;
    }

    function ensureStyles() {
        if (document.getElementById("avia-accsw-styles")) return;
        const s = document.createElement("style");
        s.id = "avia-accsw-styles";
        s.textContent = `
            @keyframes accsw-scrim-in { from{opacity:0}to{opacity:1} }
            @keyframes accsw-modal-in { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
            #accsw-modal { animation: accsw-modal-in 0.15s forwards; }
            .accsw-btn {
                height:40px; border-radius:999px; border:none; padding:0 16px;
                font-size:0.875rem; font-weight:500; cursor:pointer;
                display:flex; align-items:center; justify-content:center;
                transition:opacity 0.15s; font-family:inherit;
            }
            .accsw-btn:hover{opacity:0.8}
            .accsw-btn:disabled{cursor:not-allowed;opacity:0.38}
            .accsw-field {
                width:100%; box-sizing:border-box; padding:13px 14px;
                border-radius:12px; border:1px solid rgba(255,255,255,0.12);
                background:rgba(255,255,255,0.06); color:var(--md-sys-color-on-surface,#fff);
                font-size:0.875rem; outline:none; font-family:inherit;
                transition:border-color 0.15s;
            }
            .accsw-field:focus{border-color:var(--md-sys-color-primary,rgba(103,80,164,0.9))}
            .accsw-field::placeholder{color:rgba(255,255,255,0.35)}
            .accsw-list{display:flex;flex-direction:column;gap:8px;max-height:320px;overflow-y:auto;scrollbar-width:thin;}
            .accsw-list::-webkit-scrollbar{width:3px}
            .accsw-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:3px}
            .accsw-item {
                display:flex; align-items:center; gap:12px; padding:10px 14px;
                border-radius:12px; background:rgba(255,255,255,0.04);
                border:1px solid rgba(255,255,255,0.07);
                cursor:pointer; transition:background 0.12s; user-select:none;
            }
            .accsw-item:hover{background:rgba(255,255,255,0.09)}
            .accsw-item.loading{opacity:0.5;pointer-events:none}
            .accsw-avatar {
                width:40px; height:40px; border-radius:50%; flex-shrink:0;
                background:var(--md-sys-color-primary,rgba(103,80,164,0.9));
                display:flex; align-items:center; justify-content:center;
                font-size:16px; font-weight:700; color:#fff; overflow:hidden;
                text-transform:uppercase;
            }
            .accsw-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
            .accsw-info{flex:1;min-width:0}
            .accsw-name{font-size:14px;font-weight:600;color:var(--md-sys-color-on-surface,#fff);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .accsw-sub{font-size:11px;color:rgba(255,255,255,0.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .accsw-del{background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.2);font-size:13px;padding:4px 6px;border-radius:6px;flex-shrink:0;transition:color 0.12s;line-height:1}
            .accsw-del:hover{color:rgba(255,80,80,0.8)}
            .accsw-empty{text-align:center;color:rgba(255,255,255,0.3);font-size:13px;padding:24px 0;font-style:italic}
            .accsw-warning{background:rgba(255,180,0,0.1);border:1px solid rgba(255,180,0,0.25);border-radius:10px;padding:10px 14px;font-size:12px;color:rgba(255,200,80,0.9);line-height:1.5}
            .accsw-hr{border:none;border-top:1px solid rgba(255,255,255,0.07);margin:18px 0}
            .accsw-feedback{font-size:12px;min-height:16px;margin-top:4px;transition:color 0.15s}
            .accsw-icon-btn {
                width:36px;height:36px;border-radius:50%;border:none;
                background:rgba(255,255,255,0.08); cursor:pointer;
                display:flex;align-items:center;justify-content:center;
                color:var(--md-sys-color-on-surface,#fff);
                transition:background 0.15s; flex-shrink:0;
            }
            .accsw-icon-btn:hover{background:rgba(255,255,255,0.15)}
            .accsw-icon-btn .material-symbols-outlined{font-size:20px;display:block;font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0}
        `;
        document.head.appendChild(s);
    }

    function buildLoginForm(onSuccess) {
        const wrap = document.createElement("div");
        Object.assign(wrap.style, { display:"flex", flexDirection:"column", gap:"10px" });

        const emailInput = document.createElement("input");
        emailInput.className = "accsw-field";
        emailInput.type = "email";
        emailInput.placeholder = "Email";

        const passInput = document.createElement("input");
        passInput.className = "accsw-field";
        passInput.type = "password";
        passInput.placeholder = "Password";

        const feedback = document.createElement("div");
        feedback.className = "accsw-feedback";

        const row = document.createElement("div");
        Object.assign(row.style, { display:"flex", justifyContent:"flex-end", gap:"8px" });

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "accsw-btn";
        Object.assign(cancelBtn.style, { color:"var(--md-sys-color-primary,#cfbcff)", background:"transparent" });

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "Add Account";
        submitBtn.className = "accsw-btn";
        Object.assign(submitBtn.style, { background:"var(--md-sys-color-primary,rgba(103,80,164,0.9))", color:"#fff" });

        submitBtn.onclick = async () => {
            const email = emailInput.value.trim();
            const pass = passInput.value;
            if (!email || !pass) {
                feedback.textContent = "Please enter both email and password.";
                feedback.style.color = "rgba(255,100,100,0.9)";
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = "Adding...";
            feedback.textContent = "";
            try {
                await loginWithCredentials(email, pass);
                feedback.textContent = "Account added!";
                feedback.style.color = "rgba(100,220,100,0.9)";
                emailInput.value = "";
                passInput.value = "";
                onSuccess();
            } catch (err) {
                feedback.textContent = "Error: " + (err.message || "Unknown error");
                feedback.style.color = "rgba(255,100,100,0.9)";
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Add Account";
            }
        };

        row.appendChild(cancelBtn);
        row.appendChild(submitBtn);
        wrap.appendChild(emailInput);
        wrap.appendChild(passInput);
        wrap.appendChild(feedback);
        wrap.appendChild(row);

        return { wrap, cancelBtn };
    }

    async function renderList(listEl, statusEl) {
        listEl.innerHTML = "";
        statusEl.textContent = "Loading accounts...";
        statusEl.style.color = "rgba(255,255,255,0.35)";

        const tokens = await getTokens();
        if (!tokens.length) {
            listEl.innerHTML = `<div class="accsw-empty">No accounts saved. Click + to add one.</div>`;
            statusEl.textContent = "";
            return;
        }

        statusEl.textContent = `Fetching ${tokens.length} account(s)...`;
        const profiles = await Promise.all(tokens.map(t => fetchProfile(t).then(p => ({ token: t, profile: p }))));
        statusEl.textContent = "";
        listEl.innerHTML = "";

        [...profiles].reverse().forEach(({ token, profile }) => {
            const item = document.createElement("div");
            item.className = "accsw-item";
            item.title = "Click to switch to this account";

            const avatar = document.createElement("div");
            avatar.className = "accsw-avatar";
            if (profile && profile.avatarUrl) {
                const img = document.createElement("img");
                img.src = profile.avatarUrl;
                img.onerror = () => { img.remove(); avatar.textContent = (profile.displayName || "?")[0]; };
                avatar.appendChild(img);
            } else {
                avatar.textContent = profile ? (profile.displayName || "?")[0] : "?";
            }

            const info = document.createElement("div");
            info.className = "accsw-info";
            const nameEl = document.createElement("div");
            nameEl.className = "accsw-name";
            nameEl.textContent = profile ? profile.displayName : "Unable to fetch";
            const subEl = document.createElement("div");
            subEl.className = "accsw-sub";
            subEl.textContent = profile ? (profile.username ? `@${profile.username}` : "") : "Token may be expired";
            info.appendChild(nameEl);
            info.appendChild(subEl);

            const delBtn = document.createElement("button");
            delBtn.className = "accsw-del";
            delBtn.textContent = "✕";
            delBtn.title = "Remove account";
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                await removeToken(token);
                await renderList(listEl, statusEl);
            };

            item.onclick = async () => {
                item.classList.add("loading");
                try {
                    await loginWithToken(token);
                } catch (err) {
                    item.classList.remove("loading");
                    subEl.textContent = "Switch failed: " + (err.message || "error");
                    subEl.style.color = "rgba(255,100,100,0.8)";
                    nameEl.textContent = "Unable to switch";
                }
            };

            item.appendChild(avatar);
            item.appendChild(info);
            item.appendChild(delBtn);
            listEl.appendChild(item);
        });
    }

    async function openModal() {
        if (document.getElementById("accsw-scrim")) return;
        ensureStyles();

        const scrim = document.createElement("div");
        scrim.id = "accsw-scrim";
        Object.assign(scrim.style, {
            position:"fixed", top:"0", left:"0", right:"0", bottom:"0",
            zIndex:"9999999", display:"grid", placeItems:"center",
            background:"rgba(0,0,0,0.65)", padding:"60px",
            overflowY:"auto", animation:"accsw-scrim-in 0.1s forwards",
            boxSizing:"border-box"
        });
        scrim.addEventListener("click", e => { if (e.target === scrim) scrim.remove(); });

        const modal = document.createElement("div");
        modal.id = "accsw-modal";
        Object.assign(modal.style, {
            padding:"28px", minWidth:"340px", maxWidth:"420px", width:"100%",
            borderRadius:"28px", display:"flex", flexDirection:"column",
            color:"var(--md-sys-color-on-surface,#fff)",
            background:"var(--md-sys-color-surface-container-high,#2b2b2f)",
            boxSizing:"border-box", gap:"0"
        });

        const headerRow = document.createElement("div");
        Object.assign(headerRow.style, {
            display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:"14px"
        });

        const title = document.createElement("span");
        title.textContent = "Account Switcher";
        Object.assign(title.style, { fontSize:"1.5rem", fontWeight:"400", lineHeight:"2rem" });

        const headerBtns = document.createElement("div");
        Object.assign(headerBtns.style, { display:"flex", gap:"8px", alignItems:"center" });

        const addCurrentBtn = document.createElement("button");
        addCurrentBtn.className = "accsw-icon-btn";
        addCurrentBtn.title = "Save currently logged-in account";
        const saveIcon = document.createElement("span");
        saveIcon.className = "material-symbols-outlined";
        saveIcon.textContent = "bookmark_add";
        addCurrentBtn.appendChild(saveIcon);
        addCurrentBtn.onclick = async () => {
            addCurrentBtn.disabled = true;
            try {
                const tok = await getCurrentToken();
                if (!tok) { alert("Could not find a session token. Are you logged in?"); return; }
                const tokens = await getTokens();
                if (tokens.includes(tok)) { alert("This account is already saved."); return; }
                await addToken(tok);
                await renderList(listEl, statusEl);
            } finally { addCurrentBtn.disabled = false; }
        };

        const plusBtn = document.createElement("button");
        plusBtn.className = "accsw-icon-btn";
        plusBtn.title = "Add account with email and password";
        const plusIcon = document.createElement("span");
        plusIcon.className = "material-symbols-outlined";
        plusIcon.textContent = "add";
        plusBtn.appendChild(plusIcon);

        headerBtns.appendChild(addCurrentBtn);
        headerBtns.appendChild(plusBtn);
        headerRow.appendChild(title);
        headerRow.appendChild(headerBtns);
        modal.appendChild(headerRow);

        const warning = document.createElement("div");
        warning.className = "accsw-warning";
        warning.textContent = "Accounts with two-factor authentication are not supported.";
        Object.assign(warning.style, { marginBottom:"16px" });
        modal.appendChild(warning);

        const statusEl = document.createElement("div");
        Object.assign(statusEl.style, { fontSize:"12px", color:"rgba(255,255,255,0.35)", marginBottom:"8px", minHeight:"16px" });
        modal.appendChild(statusEl);

        const listEl = document.createElement("div");
        listEl.className = "accsw-list";
        Object.assign(listEl.style, { marginBottom:"8px" });
        modal.appendChild(listEl);

        const formHr = document.createElement("hr");
        formHr.className = "accsw-hr";
        formHr.style.display = "none";
        modal.appendChild(formHr);

        const formContainer = document.createElement("div");
        formContainer.style.display = "none";
        modal.appendChild(formContainer);

        const bottomRow = document.createElement("div");
        Object.assign(bottomRow.style, { display:"flex", justifyContent:"flex-end", marginTop:"16px" });
        const closeBtn = document.createElement("button");
        closeBtn.textContent = "Close";
        closeBtn.className = "accsw-btn";
        Object.assign(closeBtn.style, { color:"var(--md-sys-color-primary,#cfbcff)", background:"transparent" });
        closeBtn.onclick = () => scrim.remove();
        bottomRow.appendChild(closeBtn);
        modal.appendChild(bottomRow);

        let formVisible = false;
        plusBtn.onclick = () => {
            formVisible = !formVisible;
            if (formVisible) {
                formHr.style.display = "block";
                formContainer.style.display = "block";
                const { wrap, cancelBtn } = buildLoginForm(async () => {
                    await renderList(listEl, statusEl);
                });
                formContainer.innerHTML = "";
                formContainer.appendChild(wrap);
                cancelBtn.onclick = () => {
                    formVisible = false;
                    formHr.style.display = "none";
                    formContainer.style.display = "none";
                };
            } else {
                formHr.style.display = "none";
                formContainer.style.display = "none";
            }
        };

        scrim.appendChild(modal);
        document.body.appendChild(scrim);
        await renderList(listEl, statusEl);
    }

    const CTX_BTN_ID = "avia-accsw-ctx-btn";

    function injectContextMenuButton() {
        const existing = document.getElementById(CTX_BTN_ID);
        if (existing && !document.body.contains(existing)) existing.remove();
        if (document.getElementById(CTX_BTN_ID)) return;

        const menu = [
            ...document.querySelectorAll(
            `#floating > div > div[style^='position: absolute; top:'] > div`,
            ),
        ].find((elem) => {
            if (
                elem.querySelector(
                    `a:first-child
                        > div
                        > svg[viewBox='0 0 32 32']:has(
                            + div
                            > span
                                + span
                        )
                        > g
                        > foreignObject[width='32'][height='32']
                        > div
                        > img[src*='/avatars/']`,
                )
            ) {
                return true;
            }
            return false;
      });

      const aClasses = menu?.lastElementChild?.className;
      const spanClasses = menu?.lastElementChild?.lastElementChild?.className;
      const separator = menu?.firstElementChild?.nextElementSibling;
      if (!menu || !spanClasses || !aClasses || !separator) {
          return;
      }

      const btn = document.createElement("a");
      btn.id = CTX_BTN_ID;
      btn.className = aClasses;
      btn.style.cssText = "cursor:pointer;user-select:none;";

      const iconWrap = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg",
      );

      iconWrap.setAttribute("height", "16px");
      iconWrap.setAttribute("width", "16px");
      iconWrap.setAttribute("viewBox", "0 -960 960 960");
      iconWrap.setAttribute("fill", "currentColor");
      iconWrap.innerHTML = `<path d="M287-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM80-160v-112q0-33 17-62t47-44q51-26 115-44t141-18h14q6 0 12 2-8 18-13.5 37.5T404-360h-4q-71 0-127.5 18T180-306q-9 5-14.5 14t-5.5 20v32h252q6 21 16 41.5t22 38.5H80Zm560 40-12-60q-12-5-22.5-10.5T584-204l-58 18-40-68 46-40q-2-14-2-26t2-26l-46-40 40-68 58 18q11-8 21.5-13.5T628-460l12-60h80l12 60q12 5 22.5 11t21.5 15l58-20 40 70-46 40q2 12 2 25t-2 25l46 40-40 68-58-18q-11 8-21.5 13.5T732-180l-12 60h-80Zm96.5-143.5Q760-287 760-320t-23.5-56.5Q713-400 680-400t-56.5 23.5Q600-353 600-320t23.5 56.5Q647-240 680-240t56.5-23.5Zm-280-320Q480-607 480-640t-23.5-56.5Q433-720 400-720t-56.5 23.5Q320-673 320-640t23.5 56.5Q367-560 400-560t56.5-23.5ZM400-640Zm12 400Z"/>`;

      const label = document.createElement("span");
      label.className = spanClasses;
      label.textContent = "Switch Accounts";

      btn.appendChild(iconWrap);
      btn.appendChild(label);
      btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          openModal();
      });

      separator.insertAdjacentElement("beforebegin", btn);
    }

    function registerWithAviaMenu() {
        const reg = () => window.AviaMenu && window.AviaMenu.register({
            id: "avia_account_switcher",
            name: "Account Switcher",
            icon: "manage_accounts",
            onClick: openModal
        });
        if (window.AviaMenu) reg();
        else {
            const iv = setInterval(() => { if (window.AviaMenu) { clearInterval(iv); reg(); } }, 100);
        }
    }

    let rafPending = false;
    const observer = new MutationObserver(() => {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            injectContextMenuButton();
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    registerWithAviaMenu();

})();
