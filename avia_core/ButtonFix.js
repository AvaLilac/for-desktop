(function () {
    if (window.__BUTTON_FIX__) return;
    window.__BUTTON_FIX__ = true;

    function uninjectButton(button) {
        if (button?.parentElement) {
            button.parentElement.removeChild(button);
        }
    }

    function hasGifButton() {
        return [...document.querySelectorAll("button")].some(button =>
            button.querySelector(".material-symbols-outlined")?.textContent.trim() === "gif"
        );
    }

    const observer = new MutationObserver(() => {
        const injectedButtons = [];

        document.querySelectorAll("div").forEach(element => {
            if (element.id?.includes("avia")&&element.parentElement!=document.body) {
                injectedButtons.push(element);
            }
        });

        if (!hasGifButton()) {
            injectedButtons.forEach(uninjectButton);
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
