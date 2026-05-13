(function setupBentaBoardInstallPrompt() {
    let deferredPrompt = null;

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
                    <p>Use it faster from your home screen.</p>
                </div>
                <button id="installNowBtn" class="btn btn-sm btn-primary install-popup-btn" type="button">
                    <i data-lucide="download"></i>
                    Install
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

    function showInstallPopup() {
        if (localStorage.getItem('bb_install_dismissed') === 'true') return;

        const popup = ensureInstallPopup();
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

    document.addEventListener('click', async (event) => {
        const installButton = event.target.closest('#installNowBtn');
        const dismissButton = event.target.closest('#dismissInstallBtn');

        if (dismissButton) {
            localStorage.setItem('bb_install_dismissed', 'true');
            hideInstallPopup();
            return;
        }

        if (!installButton || !deferredPrompt) return;

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        hideInstallPopup();
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        hideInstallPopup();
        localStorage.setItem('bb_install_dismissed', 'true');
    });
})();
