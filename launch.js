(() => {
  const launchScreen = document.getElementById('launchScreen');
  const launchImage = launchScreen?.querySelector('.launch-screen__image');

  if (!launchScreen) {
    document.body.classList.remove('is-launching');
    return;
  }

  const minimumVisibleMs = 5000;

  const dismiss = () => {
    launchScreen.classList.add('launch-screen--hidden');

    const remove = () => {
      launchScreen.remove();
      document.body.classList.remove('is-launching');
    };

    launchScreen.addEventListener('transitionend', remove, { once: true });
    window.setTimeout(remove, 900);
  };

  const pageReady = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(resolve => window.addEventListener('load', resolve, { once: true }));

  const imageReady = !launchImage || launchImage.complete
    ? Promise.resolve()
    : new Promise(resolve => {
        launchImage.addEventListener('load', resolve, { once: true });
        launchImage.addEventListener('error', resolve, { once: true });
      });

  const splashPainted = () => new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  Promise.all([pageReady, imageReady])
    .then(splashPainted)
    .then(() => window.setTimeout(dismiss, minimumVisibleMs));
})();
