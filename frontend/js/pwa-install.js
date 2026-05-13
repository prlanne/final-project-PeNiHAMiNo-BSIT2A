(function setupBentaBoardInstallPrompt() {
    let deferredPrompt = null;
    const DISMISS_KEY = 'bb_install_dismissed_until';
    const OLD_DISMISS_KEY = 'bb_install_dismissed';
    const DISMISS_DAYS = 7;

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    function isInstallDismissed() {
        const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
        return dismissedUntil > Date.now();
    }

    function dismissInstallPopup() {
        const dismissedUntil = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISS_KEY, String(dismissedUntil));
        localStorage.removeItem(OLD_DISMISS_KEY);
    }

    function isIosSafari() {
        const ua = window.navigator.userAgent;
        const isIos = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome/i.test(ua);
        return isIos && isSafari;
    }

    function ensureInstallPopup() {
        let popup = document.getElementById('installPopup');
        if (popup) return popup;

        popup = document.createElement('div');
        popup.id = 'installPopup';
        popup.className = 'install-popup';
        popup.innerHTML = `
            <div class="install-popup-content">
                <img src="/img/bentaboard.png" alt="BentaBoard Logo" class="install-popup-logo">
                <div class="install-popup-text">
                    <h6>Install BentaBoard</h6>
                    <p id="installPopupMessage">Use it faster from your home screen.</p>
                </div>
                <button id="installNowBtn" class="btn btn-sm btn-primary install-popup-btn" type="button">
                    <i data-lucide="download"></i>
                    <span id="installNowText">Install</span>
                </button>
                <button id="dismissInstallBtn" class="install-popup-close" type="button" aria-label="Dismiss install prompt">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;

        document.body.appendChild(popup);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return popup;
    }

    function showInstallPopup(mode = 'install') {
        if (isStandalone() || isInstallDismissed()) return;

        const popup = ensureInstallPopup();
        const message = document.getElementById('installPopupMessage');
        const buttonText = document.getElementById('installNowText');

        if (mode === 'ios') {
            if (message) message.textContent = 'Tap Share, then Add to Home Screen.';
            if (buttonText) buttonText.textContent = 'How';
        } else {
            if (message) message.textContent = 'Use it faster from your home screen.';
            if (buttonText) buttonText.textContent = 'Install';
        }

        popup.style.display = 'block';
    }

    function hideInstallPopup() {
        const popup = document.getElementById('installPopup');
        if (popup) popup.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        showInstallPopup();
    });

    window.addEventListener('load', () => {
        if (!deferredPrompt && isIosSafari()) {
            showInstallPopup('ios');
        }
    });

    document.addEventListener('click', async (event) => {
        const installButton = event.target.closest('#installNowBtn');
        const dismissButton = event.target.closest('#dismissInstallBtn');

        if (dismissButton) {
            dismissInstallPopup();
            hideInstallPopup();
            return;
        }

        if (!installButton) return;

        if (!deferredPrompt) {
            alert('To install on iPhone or iPad, tap the Share button, then choose Add to Home Screen.');
            return;
        }

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        hideInstallPopup();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallPopup();
        localStorage.removeItem(DISMISS_KEY);
        localStorage.removeItem(OLD_DISMISS_KEY);
    });
})();