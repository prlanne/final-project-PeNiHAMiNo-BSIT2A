// NOTIFICATION SYSTEM 
const _bbIcons = {
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.5" fill="currentColor"/></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    danger:  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`
};

const bentaNotify = {
    show: (icon, title, text, callback = null) => {
        const cfg = {
            success: { symbol: '✓', bg: '#f0fdf4', border: '#22c55e', color: '#16a34a' },
            error:   { symbol: '✕', bg: '#fef2f2', border: '#ef4444', color: '#dc2626' },
            warning: { symbol: '!', bg: '#fffbeb', border: '#f59e0b', color: '#d97706' },
            info:    { symbol: 'i', bg: '#eff6ff', border: '#3b82f6', color: '#2563eb' }
        };
        const c = cfg[icon] || cfg.info;

        let container = document.getElementById('bb-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bb-toast-container';
            container.style.cssText = 'position:fixed;top:30px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;align-items:center;gap:12px;pointer-events:none;';
            document.body.appendChild(container);
        }

        const card = document.createElement('div');
        card.style.cssText = `
            pointer-events:all;display:flex;align-items:center;gap:15px;
            background:${c.bg};border-radius:16px;padding:16px 18px;
            min-width:340px;max-width:440px;box-shadow:0 10px 28px rgba(0,0,0,0.1);
            border:1.5px solid ${c.border};font-family:'Poppins',sans-serif;
            opacity:0;transform:translateY(-32px);transition:all 0.35s ease;cursor:pointer;
        `;
        card.innerHTML = `
            <div style="width:38px;height:38px;border-radius:50%;background:${c.bg};border:2px solid ${c.border};
                display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:${c.color};flex-shrink:0;">
                ${c.symbol}
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${c.color};">${title}</div>
                <div style="font-size:0.9rem;font-weight:500;color:#374151;">${text}</div>
            </div>
        `;
        container.appendChild(card);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });

        function dismiss() {
            clearTimeout(timer);
            card.style.opacity = '0';
            card.style.transform = 'translateY(-32px)';
            setTimeout(() => {
                card.remove();
                if (callback) callback();
            }, 350);
        }

        const timer = setTimeout(dismiss, 3500);
        card.addEventListener('click', dismiss);
    },
    confirm: (title, text, confirmText, callback, dangerMode = true) => {
        const btnClass = dangerMode ? 'bb-btn-danger' : 'bb-btn-primary';
        Swal.fire({
            html: `
                <div class="bb-modal-icon bb-warning">${_bbIcons.warning}</div>
                <p class="bb-modal-title">${title.toUpperCase()}</p>
                <p class="bb-modal-body">${text}</p>
            `,
            showCancelButton: true,
            confirmButtonText: confirmText.toUpperCase(),
            cancelButtonText: 'CANCEL',
            reverseButtons: true,
            customClass: {
                popup: 'bb-modal-popup',
                confirmButton: btnClass,
                cancelButton: 'bb-btn-cancel',
                actions: 'bb-modal-actions'
            },
            buttonsStyling: false,
            showClass: { popup: 'swal2-show', backdrop: 'swal2-backdrop-show' },
            hideClass: { popup: 'swal2-hide', backdrop: 'swal2-backdrop-hide' }
        }).then((result) => {
            if (result.isConfirmed) callback();
        });
    }
};