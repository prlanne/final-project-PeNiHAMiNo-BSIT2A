let currentFilter = 'daily'; 

function changeAnalyticsTimeframe(range) {
    currentFilter = range;
    document.querySelectorAll('.timeframe-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${range}`);
    if (activeBtn) activeBtn.classList.add('active');
    updateDashboard(range);
    renderChart(range);
    if (document.getElementById('reportSalesTotal')) generateReport(range);
}

function getFilteredData(dataArray, range) {
    const now = new Date();
    return dataArray.filter(item => {
        const itemDate = new Date(item.date);
        if (isNaN(itemDate)) return true; 
        switch(range) {
            case 'daily':   return itemDate.toDateString() === now.toDateString();
            case 'weekly':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0,0,0,0);
                return itemDate >= startOfWeek;
            case 'monthly': return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            case 'yearly':  return itemDate.getFullYear() === now.getFullYear();
            default:        return true;
        }
    });
}

//  API & AUTH SETUP 
const API_BASE_URL = 'http://127.0.0.1:3000/api';
const AUTH_API_URL = "http://localhost:3000/api/users";

function getUserIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return 'guest';
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || 'guest';
    } catch { return 'guest'; }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- BENTABOARD NOTIFICATION SYSTEM ---
// Toast: replaces all browser alert() calls — pure JS card, no SweetAlert2
function bentaToast(type, message) {
    const cleanMsg = String(message).replace(/^[\u2705\u274C\uD83D\uDEA8\u26A0\uFE0F\u2139\uFE0F\s]+/u, '').trim();

    const cfg = {
        success: { icon: '✓', label: 'Success' },
        error:   { icon: '✕', label: 'Error'   },
        warning: { icon: '!', label: 'Warning'  },
        info:    { icon: 'i', label: 'Info'     }
    };
    const { icon, label } = cfg[type] || cfg.info;

    // Ensure container exists
    let container = document.getElementById('bb-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'bb-toast-container';
        document.body.appendChild(container);
    }

    // Build card - NO X BUTTON for success messages
    const isSuccess = type === 'success';
    const card = document.createElement('div');
    card.className = `bb-toast-card bb-toast-${type}`;
    
    if (isSuccess) {
        // Success: No X button, just text and icon
        card.innerHTML = `
            <div class="bb-toast-icon">
                <span>${icon}</span>
            </div>
            <div style="flex:1; min-width:0; text-align: center;">
                <div class="bb-toast-label">${label}</div>
                <div class="bb-toast-msg">${cleanMsg}</div>
            </div>
        `;
    } else {
        // Error/Warning/Info: Keep X button
        card.innerHTML = `
            <div class="bb-toast-icon">
                <span>${icon}</span>
            </div>
            <div style="flex:1; min-width:0;">
                <div class="bb-toast-label">${label}</div>
                <div class="bb-toast-msg">${cleanMsg}</div>
            </div>
            <button class="bb-toast-x" aria-label="Close">&times;</button>
        `;
    }
    
    container.appendChild(card);

    // Animate in
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('bb-show')));

    // Dismiss logic
    function dismiss() {
        clearTimeout(timer);
        card.classList.remove('bb-show');
        card.classList.add('bb-hide');
        setTimeout(() => card.remove(), 320);
    }

    const timer = setTimeout(dismiss, 3500);
    
    // Only add X button listener if it exists
    const xButton = card.querySelector('.bb-toast-x');
    if (xButton) {
        xButton.addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });
    }
    card.addEventListener('click', dismiss);
}

// SVG icons used in modals
const _bbIcons = {
    warning: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.5" fill="currentColor"/></svg>`,
    success: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    danger:  `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>`
};

// Modal: enhanced Sign Out / Thank You / confirm dialogs
const bentaNotify = {
    show: (icon, title, text, callback = null) => {
        const iconType = icon === 'success' ? 'bb-success' : 'bb-warning';
        const svgKey   = icon === 'success' ? 'success' : 'warning';
        Swal.fire({
            html: `
                <div class="bb-modal-icon ${iconType}">${_bbIcons[svgKey]}</div>
                <p class="bb-modal-title">${title.toUpperCase()}</p>
                <p class="bb-modal-body">${text}</p>
            `,
            showConfirmButton: true,
            confirmButtonText: 'CONTINUE',
            customClass: {
                popup:         'bb-modal-popup',
                confirmButton: 'bb-btn-primary',
                actions:       'bb-modal-actions'
            },
            buttonsStyling: false,
            showClass:  { popup: 'swal2-show', backdrop: 'swal2-backdrop-show' },
            hideClass:  { popup: 'swal2-hide', backdrop: 'swal2-backdrop-hide' }
        }).then(() => {
            if (callback) callback();
        });
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
            cancelButtonText:  'CANCEL',
            reverseButtons: true,
            customClass: {
                popup:         'bb-modal-popup',
                confirmButton: btnClass,
                cancelButton:  'bb-btn-cancel',
                actions:       'bb-modal-actions'
            },
            buttonsStyling: false,
            showClass:  { popup: 'swal2-show', backdrop: 'swal2-backdrop-show' },
            hideClass:  { popup: 'swal2-hide', backdrop: 'swal2-backdrop-hide' }
        }).then((result) => {
            if (result.isConfirmed) callback();
        });
    }
};

const uid = getUserIdFromToken();
const STORAGE_KEYS = {
    products: `bb_products_${uid}`,
    sales:    `bb_sales_${uid}`,
    expenses: `bb_expenses_${uid}`
};

// DATA (loaded from localStorage cache; refreshed from API on every page load) 
let products   = JSON.parse(localStorage.getItem(STORAGE_KEYS.products))  || [];
let salesLog   = JSON.parse(localStorage.getItem(STORAGE_KEYS.sales))     || [];
let expenseLog = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses))  || [];
let currentUser  = localStorage.getItem('bb_user') || "User";
let currentTheme = localStorage.getItem('bb_theme') || 'light';
let isLoggedIn   = localStorage.getItem('token') !== null;
let salesChartInstance = null;

// ROUTING GUARD 
const currentPageName = window.location.pathname.split('/').pop() || 'index.html';
const isAuthPage = (currentPageName === 'login.html' || currentPageName === 'register.html');
if (!isLoggedIn && !isAuthPage) window.location.replace('login.html');
if (isLoggedIn && isAuthPage)   window.location.replace('index.html');

document.body.classList.toggle('dark-theme', currentTheme === 'dark');

// FLASH PREVENTION FIX: Force loading screen to show instantly
if ((currentPageName === 'index.html' || currentPageName === '') && localStorage.getItem('bb_welcome_triggered') === 'true') {
    const antiFlashStyle = document.createElement('style');
    antiFlashStyle.id = 'anti-flash-style';
    antiFlashStyle.innerHTML = `
        #loadingOverlay { display: flex !important; opacity: 1 !important; visibility: visible !important; }
        body { overflow: hidden !important; }
    `;
    document.documentElement.appendChild(antiFlashStyle);
}

// THE CORE FIX: Load all user data from MongoDB on page load.
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
        }

        if (expensesRes.ok) {
            const apiExpenses = await expensesRes.json();
            expenseLog = apiExpenses.map(e => ({
                date:     new Date(e.dateLogged).toLocaleDateString(),
                category: e.category,
                amount:   e.amount
            }));
            localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenseLog));
        }

        if (document.getElementById('displaySales'))       updateDashboard(currentFilter);
        if (document.getElementById('fullInventoryBody'))  renderInventory();
        if (document.getElementById('salesLogBody'))       renderSalesLog();
        if (document.getElementById('expenseLogBody'))     renderExpenseLog();
        if (document.getElementById('salesChart'))         renderChart(currentFilter);
        if (document.getElementById('reportSalesTotal'))   generateReport(currentFilter);
        if (document.querySelector('select[name="saleSelect"], #saleSelect, #dashboardSaleSelect')) populateSaleSelect();

    } catch (err) {
        console.warn('Could not load data from API, using local cache:', err.message);
    }
}

// AUTH FUNCTIONS 
async function handleAuth(e, type) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    if (type === 'signup') {
        const userData = {
            full_name: formData.get('regName'),
            username:  formData.get('regUser'),
            email:     formData.get('regEmail'),
            password:  formData.get('regPass'),
            role:      "Seller"
        };
        try {
            const response = await fetch(`${AUTH_API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await response.json();
            if (response.ok) {
                bentaToast('success', 'Account created! Redirecting to login...');
                setTimeout(() => { window.location.href = 'login.html'; }, 1800);
                form.reset();
            } else {
                bentaToast('error', 'Signup Error: ' + (data.msg || data.error || 'User already exists'));
            }
        } catch (err) {
            bentaToast('error', 'Connection failed. Is your backend server running on port 3000?');
        }
    } else {
        const loginData = {
            username: formData.get('loginUser'),
            password: formData.get('loginPass')
        };
        try {
            const response = await fetch(`${AUTH_API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('bb_user', data.user.username);
                localStorage.setItem('bb_welcome_triggered', 'true');
                window.location.href = 'index.html';
            } else {
                bentaToast('error', 'Login Failed: ' + (data.msg || 'Invalid credentials'));
            }
        } catch (err) {
            bentaToast('error', 'Could not connect to the server.');
        }
    }
}

function executeLogout(e) {
    if(e) e.preventDefault();
    bentaNotify.confirm('Sign Out?', 'Are you sure you want to logout of BentaBoard?', 'Logout', () => {
        bentaNotify.show('success', 'THANK YOU!', 'Thank you for using BentaBoard! We look forward to seeing you again.', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('bb_user');
            window.location.replace('login.html');
        });
    });
}

// SYSTEM FUNCTIONS -
// REAL-TIME CLOCK LOGIC
function startBentaClock() {
    const clockElement = document.getElementById('realTimeClock');
    if (!clockElement) return; 
    function updateTime() {
        clockElement.innerText = new Date().toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    }
    updateTime(); 
    setInterval(updateTime, 1000); 
}
document.addEventListener('DOMContentLoaded', startBentaClock);


function generateReport(filter = 'all') {
    const filteredSales = getFilteredData(salesLog, filter);
    const filteredExp   = getFilteredData(expenseLog, filter);
    const totalSales    = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalExp      = filteredExp.reduce((sum, e) => sum + e.amount, 0);
    const totalItems    = filteredSales.reduce((sum, s) => sum + s.qty, 0);

    if (document.getElementById('reportSalesTotal')) document.getElementById('reportSalesTotal').innerText = `₱${totalSales.toLocaleString()}`;
    if (document.getElementById('reportExpTotal'))   document.getElementById('reportExpTotal').innerText   = `₱${totalExp.toLocaleString()}`;
    if (document.getElementById('reportNet'))        document.getElementById('reportNet').innerText        = `₱${(totalSales - totalExp).toLocaleString()}`;
    if (document.getElementById('reportItems'))      document.getElementById('reportItems').innerText      = totalItems;

    const breakdownBody = document.getElementById('reportBreakdownBody');
    if (breakdownBody) {
        const sortedSales = filteredSales.slice().reverse();
        const sortedExp   = filteredExp.slice().reverse();
        breakdownBody.innerHTML = `
            ${sortedSales.map(s => `
                <tr>
                    <td>${s.date}</td>
                    <td><i data-lucide="shopping-cart" class="text-success me-2" size="14"></i><span class="text-success small fw-bold">Sale</span></td>
                    <td class="fw-bold">${s.name} (Qty: ${s.qty})</td>
                    <td class="text-success fw-bold text-end">₱${s.total.toLocaleString()}</td>
                </tr>`).join('')}
            ${sortedExp.map(e => `
                <tr>
                    <td>${e.date}</td>
                    <td><i data-lucide="trending-down" class="text-danger me-2" size="14"></i><span class="text-danger small fw-bold">Expense</span></td>
                    <td class="fw-bold">${e.category}</td>
                    <td class="text-danger fw-bold text-end">₱${e.amount.toLocaleString()}</td>
                </tr>`).join('')}
            ${sortedSales.length === 0 && sortedExp.length === 0
                ? `<tr><td colspan="4" class="text-center text-muted py-4">No transactions recorded yet.</td></tr>`
                : ''}
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function populateSaleSelect() {
    const selects = Array.from(document.querySelectorAll('#saleSelect, #dashboardSaleSelect, select[name="saleSelect"]'));
    if (!selects.length) return;
    selects.forEach(select => {
        select.innerHTML = '<option value="">-- Choose Product --</option>';
        products.forEach((p, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${p.name} (Stock: ${p.stock})`;
            if (p.stock <= 0) opt.disabled = true;
            select.appendChild(opt);
        });
    });
}

async function addProduct(e) {
    e.preventDefault();
    const form       = e.target;
    const nameInput  = form.querySelector('[name="pName"]');
    const priceInput = form.querySelector('[name="pPrice"]');
    const stockInput = form.querySelector('[name="pStock"]');

    if (nameInput?.value.trim() && priceInput?.value > 0 && stockInput?.value > 0) {
        const stockQty    = parseInt(stockInput.value);
        const productData = {
            name:  nameInput.value.trim(),
            price: parseFloat(priceInput.value),
            stock: stockQty
        };
        try {
            const response = await fetch(`${API_BASE_URL}/products`, {
                method:  'POST',
                headers: getAuthHeaders(),
                body:    JSON.stringify(productData)
            });
            if (response.ok) {
                const saved = await response.json();
                products.push({ _id: saved.product._id, ...productData, initialStock: stockQty });
                saveData();
                renderInventory();
                populateSaleSelect();
                form.reset();
                bentaToast('success', 'Product has been saved!');
            }
        } catch (error) {
            bentaToast('error', 'Error: Check if server is running on port 3000.');
        }
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.sales,    JSON.stringify(salesLog));
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenseLog));
    if (document.getElementById('displaySales')) updateDashboard(currentFilter);
}

async function recordSale(e) {
    e.preventDefault();
    const form       = e.target;
    const saleSelect = document.querySelector('#saleSelect, #dashboardSaleSelect');
    const qtyInput   = form.querySelector('[name="saleQty"]');
    const index      = saleSelect.value;
    const qty        = parseInt(qtyInput ? qtyInput.value : 0);

    if (index !== "" && products[index] && qty > 0 && products[index].stock >= qty) {
        const saleData = { productName: products[index].name, quantity: qty };
        try {
            const response = await fetch(`${API_BASE_URL}/sales`, {
                method:  'POST',
                headers: getAuthHeaders(),
                body:    JSON.stringify(saleData)
            });
            if (response.ok) {
                const total = products[index].price * qty;
                products[index].stock -= qty;
                salesLog.push({
                    date:  new Date().toLocaleDateString(),
                    name:  products[index].name,
                    qty:   qty,
                    total: total
                });
                saveData();
                renderSalesLog();
                populateSaleSelect();
                form.reset();
                bentaToast('success', 'Sale has been saved!');
            } else {
                bentaToast('error', 'Failed to save sale.');
            }
        } catch (error) {
            bentaToast('error', 'Fatal Error: Could not connect to backend.');
        }
    } else {
        bentaToast('warning', 'Insufficient stock or invalid product selection!');
    }
}

async function logExpense(e) {
    e.preventDefault();
    const form          = e.target;
    const categoryInput = form.querySelector('[name="expCat"]');
    const amountInput   = form.querySelector('[name="expAmt"]');

    if (categoryInput?.value.trim() && amountInput?.value > 0) {
        const expenseData = {
            category: categoryInput.value.trim(),
            amount:   parseFloat(amountInput.value)
        };
        try {
            const response = await fetch(`${API_BASE_URL}/expenses`, {
                method:  'POST',
                headers: getAuthHeaders(),
                body:    JSON.stringify(expenseData)
            });
            if (response.ok) {
                expenseLog.push({ date: new Date().toLocaleDateString(), ...expenseData });
                saveData();
                renderExpenseLog();
                form.reset();
                bentaToast('success', 'Expense has been saved!');
            }
        } catch (error) {
            bentaToast('error', 'Connection Error: Server might be down.');
        }
    }
}

function updateDashboard(filter = 'all') {
    const filteredSales  = getFilteredData(salesLog, filter);
    const filteredExp    = getFilteredData(expenseLog, filter);
    const totalSales     = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalExp       = filteredExp.reduce((sum, e) => sum + e.amount, 0);
    const displaySales   = document.getElementById('displaySales');
    const displayOutflow = document.getElementById('displayOutflow');
    const displayProfit  = document.getElementById('displayProfit');
    if (displaySales)   displaySales.innerText   = `₱${totalSales.toLocaleString()}`;
    if (displayOutflow) displayOutflow.innerText = `₱${totalExp.toLocaleString()}`;
    if (displayProfit)  displayProfit.innerText  = `₱${(totalSales - totalExp).toLocaleString()}`;
}

function renderInventory() {
    const body = document.getElementById('fullInventoryBody');
    if (!body) return;
    
    const maxStock = 50; 
    
    body.innerHTML = products.map((p, i) => {
        const stockPercent = Math.min((p.stock / maxStock) * 100, 100);
        let barColorClass = 'bg-success'; 
        let badgeClass    = 'bg-success-subtle text-success border border-success-subtle';
        let statusText    = 'OK';

        if (p.stock <= 5) { 
            barColorClass = 'bg-danger';
            badgeClass    = 'bg-danger-subtle text-danger border border-danger-subtle';
            statusText    = 'LOW';
        } else if (p.stock <= 20) {
            barColorClass = 'bg-warning';
        }

        return `
            <tr>
                <td class="fw-bold text-dark" style="font-size: 0.95rem;">${p.name}</td>
                <td class="text-muted">₱${p.price}</td>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <span class="fw-bold text-dark" style="min-width: 20px;">${p.stock}</span>
                        <div class="progress flex-grow-1" style="height: 6px; max-width: 150px; background-color: var(--border);">
                            <div class="progress-bar ${barColorClass} rounded-pill" role="progressbar" style="width: ${stockPercent}%"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge rounded-pill ${badgeClass} px-3 py-2" style="font-size: 0.75rem; letter-spacing: 0.5px;">
                        ${statusText}
                    </span>
                </td>
                <td>
                    <button class="btn btn-link text-danger text-decoration-none fw-bold p-0 m-0 transition" onclick="deleteProduct(${i})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteProduct(index) {
    bentaNotify.confirm(
        'Delete Product?',
        `Remove "<strong>${products[index].name}</strong>" from your inventory? This cannot be undone.`,
        'Delete',
        async () => {
            const productId = products[index]._id;
            if (productId) {
                try {
                    await fetch(`${API_BASE_URL}/products/${productId}`, {
                        method:  'DELETE',
                        headers: getAuthHeaders()
                    });
                } catch (err) {
                    console.warn('Could not delete from DB:', err);
                }
            }
            products.splice(index, 1);
            saveData();
            renderInventory();
            populateSaleSelect();
            bentaToast('success', 'Product deleted successfully.');
        }
    );
}

function renderSalesLog() {
    const body = document.getElementById('salesLogBody');
    if (!body) return;
    body.innerHTML = salesLog.slice().reverse().map(s => `
        <tr>
            <td class="text-muted small">${s.date}</td>
            <td class="fw-bold text-dark">${s.name}</td>
            <td>${s.qty}</td>
            <td class="text-success fw-bold">₱${s.total.toLocaleString()}</td>
        </tr>`).join('');
}

function renderExpenseLog() {
    const body = document.getElementById('expenseLogBody');
    if (!body) return;
    body.innerHTML = expenseLog.slice().reverse().map(e => `
        <tr>
            <td class="text-muted small">${e.date}</td>
            <td class="fw-bold text-dark">${e.category}</td>
            <td class="text-danger fw-bold">₱${e.amount.toLocaleString()}</td>
        </tr>`).join('');
}

function renderChart(filter = 'all') {
    const chartCtx = document.getElementById('salesChart');
    if (!chartCtx) return;
    const ctx           = chartCtx.getContext('2d');
    const filteredSales = getFilteredData(salesLog, filter);
    const salesByDate   = {};
    filteredSales.forEach(s => { salesByDate[s.date] = (salesByDate[s.date] || 0) + s.total; });
    const labels     = Object.keys(salesByDate);
    const dataPoints = labels.map(label => salesByDate[label]);
    const isDark     = document.body.classList.contains('dark-theme');
    const gridColor  = isDark ? '#334155' : '#f1f5f9';
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                label: 'Revenue (₱)',
                data:  dataPoints.length > 0 ? dataPoints : [0],
                backgroundColor: '#38bdf8',
                borderRadius: 8,
                barThickness: 45,
                maxBarThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor } },
                x: { grid: { display: false } }
            }
        }
    });
}

window.toggleSystemTheme = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    currentTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('bb_theme', currentTheme);
    if (salesChartInstance) renderChart(currentFilter);
};

// --- PAGE INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // ✅ NEW DYNAMIC ACTIVE LINK LOGIC
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

    if (document.getElementById('displaySales'))       updateDashboard(currentFilter);
    if (document.getElementById('fullInventoryBody'))  renderInventory();
    if (document.getElementById('salesLogBody'))       renderSalesLog();
    if (document.getElementById('expenseLogBody'))     renderExpenseLog();
    if (document.getElementById('salesChart'))         renderChart(currentFilter);
    if (document.getElementById('reportSalesTotal'))   generateReport(currentFilter);
    if (document.querySelector('select[name="saleSelect"], #saleSelect, #dashboardSaleSelect')) populateSaleSelect();

    const productForm = document.getElementById('productForm') || document.getElementById('dashboardProductForm');
    if (productForm) productForm.addEventListener('submit', addProduct);

    const salesForm = document.getElementById('salesForm') || document.getElementById('dashboardSalesForm');
    if (salesForm) salesForm.addEventListener('submit', recordSale);

    const expenseForm = document.getElementById('expenseForm') || document.getElementById('dashboardExpenseForm');
    if (expenseForm) expenseForm.addEventListener('submit', logExpense);

    const logoutBtn    = document.getElementById('logoutBtn');
    const hubLogoutBtn = document.getElementById('hubLogoutBtn');
    if (logoutBtn)    logoutBtn.addEventListener('click', executeLogout);
    if (hubLogoutBtn) hubLogoutBtn.addEventListener('click', executeLogout);

    if (currentPageName === 'index.html' || currentPageName === '') {
        const flag = localStorage.getItem('bb_welcome_triggered');
        if (flag === 'true' && typeof bootstrap !== 'undefined') {
            const loadingOverlay       = document.getElementById('loadingOverlay');
            const loadingCounter       = document.getElementById('loadingCounter');
            const loadingBar           = document.getElementById('loadingBar');
            const loadingTextContainer = document.querySelector('.loading-text');
            const loadingContent       = document.querySelector('.loading-content');

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

                                    // CLEANUP FIX: Remove the anti-flash lock once animation finishes                                    
                                    const antiFlash = document.getElementById('anti-flash-style');
                                    if (antiFlash) antiFlash.remove();

                                    const userName     = localStorage.getItem('bb_user') || "User";
                                    const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeMotivationalModal'));
                                    const nameEl       = document.getElementById('welcomePopupName');
                                    if (nameEl) nameEl.innerText = userName;
                                    welcomeModal.show();
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
                const userName     = localStorage.getItem('bb_user') || "User";
                const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeMotivationalModal'));
                const nameEl       = document.getElementById('welcomePopupName');
                if (nameEl) nameEl.innerText = userName;
                welcomeModal.show();
                localStorage.removeItem('bb_welcome_triggered');
            }
        }
    }
});

// PURCHASES PAGE LOGIC
document.addEventListener('DOMContentLoaded', async () => {
    const purchaseForm     = document.getElementById('purchaseForm');
    const quantityInput    = document.getElementById('quantity');
    const unitCostInput    = document.getElementById('unitCost');
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    const purchasesLogBody = document.getElementById('purchasesLogBody');

// Set print date for reports page
if (window.location.pathname.includes('reports.html')) {
    const container = document.querySelector('.main-content .container');
    if (container) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) + ' at ' + now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        container.setAttribute('data-print-date', dateStr);
    }
}

    

    async function renderPurchasesTable() {
        if (!purchasesLogBody) return;
        try {
            const response  = await fetch(`${API_BASE_URL}/purchases`, { headers: getAuthHeaders() });
            const purchases = await response.json();
            if (purchases.length === 0) {
                purchasesLogBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No recorded purchase yet.</td></tr>`;
                return;
            }
            purchasesLogBody.innerHTML = purchases.map(p => `
                <tr>
                    <td>${new Date(p.purchaseDate).toLocaleDateString()}</td>
                    <td class="fw-medium">${p.supplierName}</td>
                    <td>${p.productName}</td>
                    <td>${p.quantity}</td>
                    <td>₱${parseFloat(p.unitCost).toFixed(2)}</td>
                    <td class="fw-bold text-dark">₱${parseFloat(p.totalCost).toFixed(2)}</td>
                </tr>`).join('');
        } catch (error) {
            purchasesLogBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error loading data from server.</td></tr>`;
        }
    }

    if (purchaseForm) {
        purchaseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const purchaseData = {
                productName:  document.getElementById('productId').value,
                supplierName: document.getElementById('supplierName').value,
                quantity:     parseInt(document.getElementById('quantity').value),
                unitCost:     parseFloat(document.getElementById('unitCost').value),
                totalCost:    parseFloat(totalCostDisplay.textContent),
                purchaseDate: document.getElementById('purchaseDate').value || new Date()
            };
            try {
                const response = await fetch(`${API_BASE_URL}/purchases/add`, {
                    method:  'POST',
                    headers: getAuthHeaders(),
                    body:    JSON.stringify(purchaseData)
                });
                if (response.ok) {
                    bentaToast('success', 'Purchase synced to MongoDB!');
                    purchaseForm.reset();
                    document.getElementById('purchaseDate').valueAsDate = new Date();
                    totalCostDisplay.textContent = "0.00";
                    renderPurchasesTable();
                } else {
                    const err = await response.json();
                    bentaToast('error', `Error: ${err.message}`);
                }
            } catch (error) {
                bentaToast('error', 'Backend connection failed.');
            }
        });
    }

    function calculatePurchaseTotal() {
        const qty  = parseFloat(quantityInput.value) || 0;
        const cost = parseFloat(unitCostInput.value) || 0;
        totalCostDisplay.textContent = (qty * cost).toFixed(2);
    }

    if (quantityInput && unitCostInput && totalCostDisplay) {
        quantityInput.addEventListener('input', calculatePurchaseTotal);
        unitCostInput.addEventListener('input', calculatePurchaseTotal);
    }

    renderPurchasesTable();
});

//          SETTINGS WIPE DATA LOGIC

async function wipeAllSystemData() {
    bentaNotify.confirm(
        'Wipe All System Data?',
        'This will permanently delete all products, sales, expenses, and purchases from the database.',
        'Continue',
        () => {
            bentaNotify.confirm(
                'Final Warning',
                'This action <strong>cannot be undone</strong>. All data will be lost forever. Are you sure?',
                'Wipe All Data',
                async () => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/data/wipe`, {
                            method: 'DELETE',
                            headers: getAuthHeaders()
                        });

                        if (response.ok) {
                            localStorage.removeItem(STORAGE_KEYS.products);
                            localStorage.removeItem(STORAGE_KEYS.sales);
                            localStorage.removeItem(STORAGE_KEYS.expenses);

                            products   = [];
                            salesLog   = [];
                            expenseLog = [];

                            if (document.getElementById('fullInventoryBody')) renderInventory();
                            if (document.getElementById('salesLogBody'))      renderSalesLog();
                            if (document.getElementById('expenseLogBody'))    renderExpenseLog();
                            if (document.getElementById('displaySales'))      updateDashboard(currentFilter);
                            if (document.getElementById('reportSalesTotal'))  generateReport(currentFilter);
                            if (document.querySelector('select[name="saleSelect"], #saleSelect, #dashboardSaleSelect')) {
                                populateSaleSelect();
                            }
                            if (salesChartInstance) renderChart(currentFilter);

                            bentaToast('success', 'All system data has been permanently deleted.');
                        } else {
                            const err = await response.json();
                            bentaToast('error', `Failed to wipe data: ${err.message}`);
                        }
                    } catch (error) {
                        console.error('Wipe error:', error);
                        bentaToast('error', 'Could not connect to server. Please check your connection.');
                    }
                }
            );
        }
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const wipeDataButton = document.getElementById('clearDataBtn');
    if (wipeDataButton) {
        wipeDataButton.addEventListener('click', wipeAllSystemData);
    }
});

// SETTINGS PROFILE LOGIC
document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    const settingNameInput = document.getElementById('settingName');
    const userNameDisplay = document.getElementById('userNameDisplay');

    if (settingNameInput) {
        settingNameInput.value = currentUser; 
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const newName = settingNameInput.value.trim();
            if (newName) {
                localStorage.setItem('bb_user', newName);
                currentUser = newName;
                if (userNameDisplay) userNameDisplay.innerText = newName;
                bentaToast('success', 'Profile name updated successfully!');
            }
        });
    }
});

// WEATHER PAGE LOGIC (SEPARATED)
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const geoBtn    = document.getElementById('geoBtn');

    // Only run this code if we are actually on the Weather page
    if (cityInput && searchBtn && geoBtn) {
        const API_KEY = '61a3e1f7cc44db9a650ac15efb9862b4';
        const errorContainer = document.getElementById('errorContainer');
        const inlineLoader = document.getElementById('inlineLoader');
        const displayArea = document.getElementById('weatherMainDisplay');

        function toggleLoading(isLoading) {
            inlineLoader.style.display = isLoading ? "flex" : "none";
            if (isLoading) {
                errorContainer.style.display = "none";
                displayArea.style.opacity = "0.3"; 
            } else {
                displayArea.style.opacity = "1";
            }
        }

        function triggerError(msg) {
            document.getElementById('errorMsg').innerText = msg;
            errorContainer.style.display = "flex";
            displayArea.style.display = "none";
            toggleLoading(false);
            setTimeout(() => { errorContainer.style.display = "none"; }, 5000);
        }

        async function fetchWeatherData(lat, lon, label) {
            toggleLoading(true);
            try {
                const [wRes, fRes] = await Promise.all([
                    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
                    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
                ]);

                if (!wRes.ok) throw new Error("City not found. Please try again.");

                updateUI(await wRes.json(), await fRes.json(), label);
                displayArea.style.display = "flex";
                displayArea.classList.add('weather-reveal');
            } catch (err) {
                triggerError(err.message);
            } finally {
                toggleLoading(false);
            }
        }

        async function fetchByCity(cityName) {
            toggleLoading(true);
            try {
                const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`);
                const geoData = await geoRes.json();
                if (!geoData.length) throw new Error("City not found. Please try again.");
                
                const { lat, lon, name, country } = geoData[0];
                await fetchWeatherData(lat, lon, `${name}, ${country}`);
            } catch (err) {
                triggerError(err.message);
            }
        }

        function updateUI(current, forecast, label) {
            document.getElementById('wLocationTitle').innerText = (label === "Sensor") ? `${current.name}, ${current.sys.country}` : label;
            document.getElementById('wMainTemp').innerText = `${Math.round(current.main.temp)}°C`;
            document.getElementById('wMainDesc').innerText = current.weather[0].description;
            document.getElementById('wFeelsLike').innerText = `Feels Like: ${Math.round(current.main.feels_like)}°C`;
            document.getElementById('wDateTime').innerText = `As of ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
            document.getElementById('wMainIcon').src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;
            document.getElementById('wHumidity').innerText = `${current.main.humidity}%`;
            document.getElementById('wWind').innerText = `${current.wind.speed} m/s`;
            document.getElementById('wClouds').innerText = `${current.clouds.all}%`;
            document.getElementById('wPressure').innerText = `${current.main.pressure} hPa`;

            const grid = document.getElementById('forecastGrid');
            grid.innerHTML = '';
            const processed = new Set();
            processed.add(new Date().getDate());

            forecast.list.forEach(item => {
                const d = new Date(item.dt * 1000);
                if (!processed.has(d.getDate()) && d.getHours() >= 12 && processed.size < 6) {
                    processed.add(d.getDate());
                    grid.innerHTML += `
                        <div class="col forecast-day py-3 px-1">
                            <p class="text-primary fw-bold m-0 small">${d.toLocaleDateString('en-US', {weekday:'short'})}</p>
                            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" width="40">
                            <h6 class="fw-bold text-dark m-0">${Math.round(item.main.temp)}°</h6>
                        </div>`;
                }
            });

            generateInsights(current.main.temp, current.weather[0].main);
        }

        function generateInsights(temp, condition) {
            const box = document.getElementById('wInsightsBox');
            let content = "";
            if (temp >= 32) {
                content = `<h6 class="fw-bold text-danger mb-3">☀️ Summer Surge</h6><ul class="small mb-0"><li>Stock Cold Water & Sodas</li><li>Promote Halo-halo / Ice Cream</li></ul>`;
            } else if (condition.includes("Rain")) {
                content = `<h6 class="fw-bold text-primary mb-3">🌧️ Rainy Conditions</h6><ul class="small mb-0"><li>Stock Hot Coffee & Noodles</li><li>Highlight Umbrellas</li></ul>`;
            } else {
                content = `<h6 class="fw-bold text-success mb-3">🌤️ Balanced Demand</h6><ul class="small mb-0"><li>Maintain Daily Essentials</li><li>Display Impulse Snacks</li></ul>`;
            }
            box.innerHTML = content;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        searchBtn.addEventListener('click', () => { if (cityInput.value.trim()) fetchByCity(cityInput.value.trim()); });
        cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });
        
        geoBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (p) => fetchWeatherData(p.coords.latitude, p.coords.longitude, "Sensor"),
                    () => { /* Silent fail per request */ }
                );
            }
        });

        // Auto trigger location fetch on page load
        geoBtn.click();
    }
});