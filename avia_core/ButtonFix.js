(function () {
  if (window.__BUTTON_FIX__) return;
  window.__BUTTON_FIX__ = true;

  function getChatBarButtons(append) {
    return document.querySelectorAll(
      `.app_body main > div:last-child > div > div:last-child > div > div ${append ?? ""}`,
    );
  }

  function uninjectButton(button) {
    if (button?.parentElement) {
      button.parentElement.removeChild(button);
    }
  }

  function hasGifButton() {
    return [
      ...getChatBarButtons("button > span.material-symbols-outlined"),
    ].some((button) => button?.textContent.trim() === "gif");
  }

  const observer = new MutationObserver(() => {
    const injectedButtons = [];

    getChatBarButtons().forEach((element) => {
      if (element.id?.startsWith("avia-")) {
        injectedButtons.push(element);
      }
    });

    if (!hasGifButton()) {
      injectedButtons.forEach(uninjectButton);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
})();
