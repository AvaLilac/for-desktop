(function () {
  if (window.__LOGIN_WITH_TOKEN__) return;
  window.__LOGIN_WITH_TOKEN__ = true;

  async function loginWithToken(token) {
    const res = await fetch('https://stoat.chat/api/users/@me', {
      headers: { 'x-session-token': token }
    });
    if (!res.ok) throw new Error('Invalid token');
    const user = await res.json();

    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open('localforage');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });

    const tx = db.transaction('keyvaluepairs', 'readwrite');
    await new Promise((resolve, reject) => {
      const r = tx.objectStore('keyvaluepairs').put({
        session: {
          _id: user._id,
          token: token,
          userId: user._id,
          valid: true
        }
      }, 'auth');
      r.onsuccess = () => resolve();
      r.onerror = () => reject(r.error);
    });

    location.reload();
  }

  function openTokenDialog() {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        position: fixed;
        z-index: 100;
        max-height: 100%;
        display: grid;
        user-select: none;
        place-items: center;
        pointer-events: all;
        animation-name: scrimFadeIn;
        animation-duration: 0.1s;
        anim-fill-mode: forwards;
        padding: 80px;
        overflow-y: auto;
        background: rgba(0, 0, 0, 0.6);`;

    backdrop.innerHTML = `
      <div style="opacity: 1; --motion-translateY: 0px; transform: translateY(var(--motion-translateY));">
        <div style="padding: 24px; min-width: 280px max-width: 560px; border-radius: 28px; display: flex; flex-direction: column; color: var(--md-sys-color-on-surface); background: var(--md-sys-color-surface-container-high);">
          <span style="line-height: 2rem; font-size: 1.5rem; letter-spacing: 0; font-weight: 400; margin-block-end: 16px;">Login With Token</span>
          <div style="color: var(--md-sys-color-on-surface-variant) line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400;">
            <div style="display: flex; flex-direction:: column; flex-grow: initial; margin:0; align-items: center; justify-content: initial; gap: var(--gap-md);">
              <mdui-text-field id="lwt-token-input" variant="filled" type="password" name="token" required label="Session Token"></mdui-text-field>
            </div>
          </div>
          <div style="gap: 8px; display: flex; justify-content: end; margin-block-start: 24px;">
            <button id="lwt-close-btn" type="button" style="line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400; position: relative; padding-inline: 16px 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; flex-flow: inherit; cursor: pointer; border: none; transition: var(--transitions-medium) all; color: var(--color); fill: var(--color); height: 40px; border-radius: var(--borderRadius-full); color: var(--md-sys-color-primary);">
              <md-ripple aria-hidden="true"></md-ripple>Close
            </button>
            <button id="lwt-login-btn" type="button" style="line-height: 1.25rem; font-size: 0.875rem; letter-spacing: 0.015625rem; font-weight: 400; position: relative; padding-inline: 16px 16px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; flex-flow: inherit; cursor: pointer; border: none; transition: var(--transitions-medium) all; color: var(--color); fill: var(--color); height: 40px; border-radius: var(--borderRadius-full); color: var(--md-sys-color-on-primary); background-color: var(--md-sys-color-primary)">
              <md-ripple aria-hidden="true"></md-ripple>Login
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeBtn = backdrop.querySelector('#lwt-close-btn');
    const loginBtn = backdrop.querySelector('#lwt-login-btn');
    const tokenInput = backdrop.querySelector('#lwt-token-input');

    function close() { backdrop.remove(); }

    function setLoading(loading) {
      loginBtn.disabled = loading;
      loginBtn.style.cursor = loading ? 'not-allowed' : 'pointer';
      const ripple = loginBtn.querySelector('md-ripple');
      loginBtn.textContent = loading ? 'Logging in…' : 'Login';
      if (ripple) loginBtn.prepend(ripple);
    }

    function setError(msg) {
      loginBtn.disabled = false;
      loginBtn.style.cursor = 'pointer';
      const ripple = loginBtn.querySelector('md-ripple');
      loginBtn.textContent = msg;
      if (ripple) loginBtn.prepend(ripple);
      setTimeout(() => {
        loginBtn.textContent = 'Login';
        if (ripple) loginBtn.prepend(ripple);
      }, 2000);
    }

    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
    closeBtn.addEventListener('click', close);

    loginBtn.addEventListener('click', async () => {
      const token = tokenInput.value?.trim();
      if (!token) {
        setError('Enter a token!');
        return;
      }
      setLoading(true);
      try {
        await loginWithToken(token);
      } catch (err) {
        setError('Invalid token!');
      }
    });
  }

  function injectLoginButton() {
    const signUpBtn = [...document.querySelectorAll('button')]
      .find(b => b.textContent.trim() === 'Sign Up');
    if (!signUpBtn) return;

    const parent = signUpBtn.parentElement;
    if (parent.querySelector('[data-lwt-btn]')) return;

    const clone = signUpBtn.cloneNode(false);
    clone.dataset.lwtBtn = 'true';
    clone.textContent = 'Login With Token';

    const ripple = document.createElement('md-ripple');
    ripple.setAttribute('aria-hidden', 'true');
    clone.prepend(ripple);

    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openTokenDialog();
    });

    signUpBtn.insertAdjacentElement('afterend', clone);
  }

  let debounceTimer = null;
  new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(injectLoginButton, 150);
  }).observe(document.body, { childList: true, subtree: true });

  injectLoginButton();
})();
