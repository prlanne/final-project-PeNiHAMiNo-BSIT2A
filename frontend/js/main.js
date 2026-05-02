// MAIN GLOBAL INITIALIZATION
const currentPageName = window.location.pathname.split('/').pop() || 'role-select.html';
const isAuthPage = (currentPageName === 'login.html' || currentPageName === 'register.html' || currentPageName === 'admin-login.html' || currentPageName === 'admin-register.html' || currentPageName === 'role-select.html');
const isLandingPage = (currentPageName === 'role-select.html' || currentPageName === '' || currentPageName === '/');

// ONLY redirect to role-select if NOT logged in AND trying to access protected pages
if (!isLoggedIn && !isAuthPage && !isLandingPage) {
    window.location.replace('role-select.html');
}

// ONLY redirect to index if logged in AND on auth pages (login/register), NOT on role-select
if (isLoggedIn && isAuthPage && !isLandingPage) {
    window.location.replace('index.html');
}

document.body.classList.toggle('dark-theme', currentTheme === 'dark');

if ((currentPageName === 'index.html' || currentPageName === '') && localStorage.getItem('bb_welcome_triggered') === 'true') {
    const antiFlashStyle = document.createElement('style');
    antiFlashStyle.id = 'anti-flash-style';
    antiFlashStyle.innerHTML = `
        #loadingOverlay { display: flex !important; opacity: 1 !important; visibility: visible !important; }
        body { overflow: hidden !important; }
    `;
    document.documentElement.appendChild(antiFlashStyle);
}

// ============================================================
// BOLD CANVAS CONFETTI — visible, festive, high-impact
// ============================================================
function launchProfessionalConfetti() {
    // Create a full-screen canvas on top of everything
    const canvas = document.createElement('canvas');
    canvas.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:100%',
        'height:100%',
        'pointer-events:none',
        'z-index:99999'
    ].join(';');
    document.body.appendChild(canvas);

    const ctx    = canvas.getContext('2d');
    const W      = canvas.width  = window.innerWidth;
    const H      = canvas.height = window.innerHeight;

    // Bright BentaBoard palette — wide variety for maximum visual pop
    const COLORS = [
        '#00a8ff', '#0d9cff', '#00d4aa', '#00e5b8',
        '#ffd700', '#ff6b6b', '#ff9f43', '#a29bfe',
        '#fd79a8', '#55efc4', '#fdcb6e', '#e17055',
        '#74b9ff', '#ffffff'
    ];

    // Shape types
    const SHAPES = ['rect', 'circle', 'ribbon', 'star'];

    // Each particle
    class Particle {
        constructor(delay) {
            this.delay   = delay;   // ms before this particle activates
            this.active  = false;
            this.reset(true);
        }

        reset(initial = false) {
            // Spawn from random position near the top or from two side cannons
            const cannon = Math.random();
            if (cannon < 0.33) {
                // Left cannon
                this.x = W * 0.2 + (Math.random() - 0.5) * 60;
                this.y = H * 0.35;
                this.vx = 6  + Math.random() * 8;
                this.vy = -(12 + Math.random() * 10);
            } else if (cannon < 0.66) {
                // Right cannon
                this.x = W * 0.8 + (Math.random() - 0.5) * 60;
                this.y = H * 0.35;
                this.vx = -(6 + Math.random() * 8);
                this.vy = -(12 + Math.random() * 10);
            } else {
                // Center top rain
                this.x  = Math.random() * W;
                this.y  = -20;
                this.vx = (Math.random() - 0.5) * 6;
                this.vy = 4 + Math.random() * 5;
            }

            this.color   = COLORS[Math.floor(Math.random() * COLORS.length)];
            this.shape   = SHAPES[Math.floor(Math.random() * SHAPES.length)];
            this.size    = 8 + Math.random() * 16;       // 8–24 px — clearly visible
            this.rot     = Math.random() * Math.PI * 2;
            this.rotV    = (Math.random() - 0.5) * 0.25; // spin speed
            this.gravity = 0.35 + Math.random() * 0.2;
            this.drag    = 0.985;
            this.alpha   = 1;
            this.fade    = 0.008 + Math.random() * 0.006;
            this.wobble  = Math.random() * Math.PI * 2;
            this.wobbleV = 0.08 + Math.random() * 0.06;
            this.done    = false;
        }

        update() {
            if (!this.active) return;
            this.wobble += this.wobbleV;
            this.vx     *= this.drag;
            this.vy     += this.gravity;
            this.x      += this.vx + Math.sin(this.wobble) * 1.2;
            this.y      += this.vy;
            this.rot    += this.rotV;
            this.alpha  -= this.fade;
            if (this.alpha <= 0 || this.y > H + 40) this.done = true;
        }

        draw() {
            if (!this.active || this.done) return;
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.fillStyle = this.color;

            switch (this.shape) {
                case 'rect':
                    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
                    break;

                case 'circle':
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case 'ribbon':
                    // Thin long streamer
                    ctx.fillRect(-this.size * 0.8, -this.size / 8, this.size * 1.6, this.size / 4);
                    break;

                case 'star': {
                    const spikes = 5;
                    const outer  = this.size / 2;
                    const inner  = outer * 0.42;
                    ctx.beginPath();
                    for (let i = 0; i < spikes * 2; i++) {
                        const r     = i % 2 === 0 ? outer : inner;
                        const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
                        i === 0
                            ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
                            : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
            }
            ctx.restore();
        }
    }

    // Generate 180 particles across 6 staggered waves
    const TOTAL  = 180;
    const particles = [];
    for (let i = 0; i < TOTAL; i++) {
        const wave  = Math.floor(i / 30);           // 6 waves of 30
        const delay = wave * 250 + Math.random() * 200;
        particles.push(new Particle(delay));
    }

    let start    = null;
    let rafId    = null;
    const TOTAL_DURATION = 5500; // ms

    function animate(ts) {
        if (!start) start = ts;
        const elapsed = ts - start;

        ctx.clearRect(0, 0, W, H);

        let anyAlive = false;
        particles.forEach(p => {
            if (!p.active && elapsed >= p.delay) p.active = true;
            p.update();
            p.draw();
            if (!p.done) anyAlive = true;
        });

        if (anyAlive && elapsed < TOTAL_DURATION + 1000) {
            rafId = requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }

    rafId = requestAnimationFrame(animate);

    // Safety cleanup
    setTimeout(() => {
        if (rafId) cancelAnimationFrame(rafId);
        canvas.remove();
    }, TOTAL_DURATION + 2000);
}

async function loadUserDataFromAPI() {
    if (!isLoggedIn || isAuthPage) return;

    try {
        const [productsRes, salesRes, expensesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/products`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/sales`,    { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/expenses`, { headers: getAuthHeaders() })
        ]);

        if (productsRes.ok) {
            const apiProducts = await productsRes.json();
            products = apiProducts.map(p => ({
                _id:          p._id,
                name:         p.name,
                price:        p.price,
                stock:        p.stock,
                initialStock: p.stock
            }));
            localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));

            if (document.getElementById('fullInventoryBody') && typeof renderInventory === 'function') {
                renderInventory();
            }
        }

        if (salesRes.ok) {
            const apiSales = await salesRes.json();
            salesLog = apiSales.map(s => ({
                date:  new Date(s.saleDate).toLocaleDateString(),
                name:  s.productName,
                qty:   s.quantity,
                total: s.total
            }));
            localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(salesLog));

            if (document.getElementById('salesLogBody') && typeof renderSalesLog === 'function') {
                renderSalesLog();
            }
        }

        if (expensesRes.ok) {
            const apiExpenses = await expensesRes.json();
            expenseLog = apiExpenses.map(e => ({
                date:     new Date(e.dateLogged).toLocaleDateString(),
                category: e.category,
                amount:   e.amount
            }));
            localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenseLog));

            if (document.getElementById('expenseLogBody') && typeof renderExpenseLog === 'function') {
                renderExpenseLog();
            }
        }

        // FIX: after all API data loads, refresh dashboard financial summary once
        if (document.getElementById('displaySales') && typeof updateDashboard === 'function') {
            updateDashboard('all');
        }

    } catch (err) {
        console.warn('Could not load data from API, using local cache:', err.message);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPageName) {
            link.classList.add('active');
        }
    });

    if (document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').innerText = currentUser;
    }

    await loadUserDataFromAPI();
    startBentaClock();

    const logoutBtn    = document.getElementById('logoutBtn');
    const hubLogoutBtn = document.getElementById('hubLogoutBtn');
    if (logoutBtn)    logoutBtn.addEventListener('click', executeLogout);
    if (hubLogoutBtn) hubLogoutBtn.addEventListener('click', executeLogout);

    const pageName = currentPageName;

    if (pageName === 'saleslogs.html' && typeof renderSalesLog === 'function') {
        renderSalesLog();
    }

    if (pageName === 'expenses.html' && typeof renderExpenseLog === 'function') {
        renderExpenseLog();
    }

    if (pageName === 'inventory.html' && typeof renderInventory === 'function') {
        renderInventory();
    }

    if (pageName === 'analytics.html' && typeof renderChart === 'function') {
        renderChart(currentFilter);
    }

    if (pageName === 'reports.html' && typeof generateReport === 'function') {
        currentFilter = 'weekly';
        generateReport(currentFilter);

        const reportSelect = document.getElementById('reportTimeframeSelect');
        if (reportSelect) {
            reportSelect.addEventListener('change', (e) => {
                const selectedValue = e.target.value;
                currentFilter = selectedValue;
                generateReport(selectedValue);
                const now = new Date();
                const dateStr = now.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                }) + ' at ' + now.toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit'
                });
                const container = document.querySelector('.main-content .container');
                if (container) container.setAttribute('data-print-date', dateStr);
            });
        }
    }

    if (currentPageName === 'index.html' || currentPageName === '') {
        const flag = localStorage.getItem('bb_welcome_triggered');
        if (flag === 'true' && typeof bootstrap !== 'undefined') {
            const loadingOverlay        = document.getElementById('loadingOverlay');
            const loadingCounter        = document.getElementById('loadingCounter');
            const loadingBar            = document.getElementById('loadingBar');
            const loadingTextContainer  = document.querySelector('.loading-text');
            const loadingContent        = document.querySelector('.loading-content');

            if (loadingOverlay && loadingCounter && loadingBar && loadingTextContainer) {
                loadingOverlay.style.display = 'flex';
                let progress = 0;
                const loadingInterval = setInterval(() => {
                    let increment = Math.floor(Math.random() * 4) + 1;
                    progress += increment;
                    if (progress >= 100) {
                        progress = 100;
                        clearInterval(loadingInterval);
                        loadingCounter.innerText = progress;
                        loadingBar.style.width   = progress + '%';
                        setTimeout(() => {
                            loadingContent.classList.add('loading-complete');
                            loadingTextContainer.innerHTML = 'SYSTEM READY <br><span style="font-size: 0.8rem; opacity: 0.8; letter-spacing: 2px;">ACCESS GRANTED</span>';
                            setTimeout(() => {
                                loadingOverlay.classList.add('exit-animation');
                                setTimeout(() => {
                                    loadingOverlay.style.display = 'none';
                                    const antiFlash = document.getElementById('anti-flash-style');
                                    if (antiFlash) antiFlash.remove();
                                    const userName    = localStorage.getItem('bb_user') || "User";
                                    const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeMotivationalModal'));
                                    const nameEl      = document.getElementById('welcomePopupName');
                                    if (nameEl) nameEl.innerText = userName;
                                    welcomeModal.show();
                                    setTimeout(() => launchProfessionalConfetti(), 100);
                                    const cleanupConfetti = () => {
                                        const c = document.querySelector('canvas[style*="z-index:99999"]');
                                        if (c) c.remove();
                                    };
                                    document.getElementById('welcomeMotivationalModal').addEventListener('hidden.bs.modal', cleanupConfetti);
                                    const accessBtn = document.getElementById('accessDashboardBtn');
                                    if (accessBtn) {
                                        accessBtn.addEventListener('click', () => setTimeout(cleanupConfetti, 500));
                                    }
                                    localStorage.removeItem('bb_welcome_triggered');
                                }, 600);
                            }, 1300);
                        }, 150);
                    } else {
                        loadingCounter.innerText = progress;
                        loadingBar.style.width   = progress + '%';
                    }
                }, 40);
            } else {
                const userName    = localStorage.getItem('bb_user') || "User";
                const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeMotivationalModal'));
                const nameEl      = document.getElementById('welcomePopupName');
                if (nameEl) nameEl.innerText = userName;
                welcomeModal.show();
                setTimeout(() => launchProfessionalConfetti(), 100);
                const cleanupConfetti = () => {
                    const c = document.querySelector('canvas[style*="z-index:99999"]');
                    if (c) c.remove();
                };
                document.getElementById('welcomeMotivationalModal').addEventListener('hidden.bs.modal', cleanupConfetti);
                const accessBtn = document.getElementById('accessDashboardBtn');
                if (accessBtn) {
                    accessBtn.addEventListener('click', () => setTimeout(cleanupConfetti, 500));
                }
                localStorage.removeItem('bb_welcome_triggered');
            }
        }
    }
});