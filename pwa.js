const WEATHERWISE_SERVICE_WORKER = './service-worker.js';

function registerWeatherWiseServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register(WEATHERWISE_SERVICE_WORKER)
            .catch(error => console.warn('WeatherWise offline support is unavailable.', error));
    });
}

function setupInstallPrompt() {
    let deferredPrompt = null;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!isMobile || isStandalone || sessionStorage.getItem('weatherwise_install_dismissed')) return;

    const prompt = document.createElement('aside');
    prompt.className = 'install-prompt';
    prompt.setAttribute('aria-live', 'polite');
    prompt.innerHTML = `
        <div class="install-prompt-content">
            <strong class="install-prompt-title">Install WeatherWise</strong>
            <span class="install-prompt-copy">${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Tap Share, then Add to Home Screen.' : 'Keep your forecast one tap away, even offline.'}</span>
        </div>
        <div class="install-prompt-actions">
            <button class="install-prompt-install" type="button">Install</button>
            <button class="install-prompt-dismiss" type="button" aria-label="Dismiss install prompt">Later</button>
        </div>`;
    document.body.appendChild(prompt);

    const installButton = prompt.querySelector('.install-prompt-install');
    const dismissButton = prompt.querySelector('.install-prompt-dismiss');

    window.addEventListener('beforeinstallprompt', event => {
        event.preventDefault();
        deferredPrompt = event;
        prompt.hidden = false;
    });

    installButton.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        prompt.remove();
    });

    dismissButton.addEventListener('click', () => {
        sessionStorage.setItem('weatherwise_install_dismissed', 'true');
        prompt.remove();
    });

    if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) prompt.hidden = true;
    window.addEventListener('appinstalled', () => prompt.remove());
}

registerWeatherWiseServiceWorker();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupInstallPrompt, { once: true });
} else {
    setupInstallPrompt();
}
