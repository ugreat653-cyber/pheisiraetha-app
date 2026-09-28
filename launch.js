(() => {
  const launchScreen = document.getElementById('launchScreen');

  if (!launchScreen) return;

  const startedAt = performance.now();
  const minimumVisibleMs = 1200;

  const dismiss = () => {
    const elapsed = performance.now() - startedAt;
    const delay = Math.max(0, minimumVisibleMs - elapsed);

    window.setTimeout(() => {
      launchScreen.classList.add('launch-screen--hidden');

      const remove = () => launchScreen.remove();

      launchScreen.addEventListener('transitionend', remove, { once: true });
      window.setTimeout(remove, 700);
    }, delay);
  };

  if (document.readyState === 'complete') dismiss();
  else window.addEventListener('load', dismiss, { once: true });
})();
