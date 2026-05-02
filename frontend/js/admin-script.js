// ADMIN SCRIPT - BentaBoard Admin Functions

const ADMIN_API_BASE = 'http://localhost:3000/api';

let currentUser = localStorage.getItem('bb_user') || "Admin";

// Check if user is Admin
function checkAdminAccess() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('role-select.html');
        return false;
    }
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'Admin') {
            window.location.replace('index.html');
            return false;
        }
        return true;
    } catch {
        window.location.replace('role-select.html');
        return false;
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ADMIN AUTH (for admin-login.html) 
async function handleAdminAuth(e, type) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const loginData = {
        username: formData.get('loginUser'),
        password: formData.get('loginPass')
    };

    try {
        const response = await fetch(`${ADMIN_API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData)
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('bb_user', data.user.username);
            localStorage.setItem('bb_welcome_triggered', 'true');
            window.location.href = 'admin-dashboard.html';
        } else {
            bentaNotify.show('error', 'ERROR', data.msg || 'Invalid Admin Credentials');
        }
    } catch (err) {
        bentaNotify.show('error', 'ERROR', 'Could not connect to the server.');
    }
}

// ADMIN THEME TOGGLE (for admin-settings.html) 
function toggleAdminTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('bb_theme', theme);
    
    const themeSwitch = document.getElementById('adminThemeSwitch');
    if (themeSwitch) themeSwitch.checked = isDark;
}

// ADMIN THEME ON PAGE LOAD 
(function initAdminTheme() {
    const savedTheme = localStorage.getItem('bb_theme') || 'light';
    const isDark = savedTheme === 'dark';
    
    if (isDark) {
        document.body.classList.add('dark-theme');
    }
    
    const themeSwitch = document.getElementById('adminThemeSwitch');
    if (themeSwitch) {
        themeSwitch.checked = isDark;
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
})();

// REAL-TIME CLOCK
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

// LOGOUT 
function executeLogout(e) {
    if (e) e.preventDefault();
    bentaNotify.confirm('Sign Out?', 'Are you sure you want to logout of BentaBoard?', 'Logout', () => {
        Swal.fire({
            html: `
                <div class="bb-modal-icon bb-success">${_bbIcons.success}</div>
                <p class="bb-modal-title">THANK YOU!</p>
                <p class="bb-modal-body">Thank you for using BentaBoard! We look forward to seeing you again.</p>
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
            localStorage.removeItem('token');
            localStorage.removeItem('bb_user');
            window.location.replace('role-select.html');
        });
    });
}

// LOAD ADMIN DASHBOARD STATS
async function loadAdminStats() {
    try {
        const usersRes = await fetch(`${ADMIN_API_BASE}/users`, { headers: getAuthHeaders() });
        if (usersRes.ok) {
            const users = await usersRes.json();
            const totalUsers = users.length;
            const sellers = users.filter(u => u.role === 'Seller').length;
            const admins = users.filter(u => u.role === 'Admin').length;

            if (document.getElementById('adminTotalUsers')) document.getElementById('adminTotalUsers').innerText = totalUsers;
            if (document.getElementById('adminTotalSellers')) document.getElementById('adminTotalSellers').innerText = sellers;
            if (document.getElementById('adminTotalAdmins')) document.getElementById('adminTotalAdmins').innerText = admins;
        }

        try {
    const salesRes = await fetch(`${ADMIN_API_BASE}/sales`, { headers: getAuthHeaders() });
    if (salesRes.ok) {
        const allSales = await salesRes.json();
        const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        if (document.getElementById('adminTotalRevenue')) {
            document.getElementById('adminTotalRevenue').innerText = `₱${totalRevenue.toLocaleString()}`;
        }
    }
} catch(e) {
    console.warn('Could not load revenue data:', e);
}


    } catch (err) {
        console.warn('Could not load admin stats:', err);
    }
}

// USER MANAGEMENT 
async function loadUsersForManagement() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${ADMIN_API_BASE}/users`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch users');
        
        const users = await res.json();
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td class="fw-bold text-dark">${user.username}</td>
                <td>${user.full_name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <span class="badge rounded-pill ${user.role === 'Admin' ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} px-3 py-1">
                        ${user.role}
                    </span>
                </td>
                <td class="text-muted small">${new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                    ${user.role !== 'Admin' ? `
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteUserAccount('${user._id}', '${user.username}')">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
                        </button>
                    ` : '<span class="text-muted small">Protected</span>'}
                </td>
            </tr>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error loading users.</td></tr>`;
    }
}

async function deleteUserAccount(userId, username) {
    bentaNotify.confirm(
        'Delete User?',
        `Are you sure you want to delete <strong>${username}</strong>? This cannot be undone.`,
        'Delete',
        async () => {
            try {
                const res = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    bentaNotify.show('success', 'SUCCESS', `User "${username}" deleted successfully.`);
                    loadUsersForManagement();
                    loadAdminStats();
                } else {
                    bentaNotify.show('error', 'ERROR', 'Failed to delete user.');
                }
            } catch (err) {
                bentaNotify.show('error', 'ERROR', 'Connection error.');
            }
        }
    );
}

// ALL REPORTS 
async function loadAllReports(filter = 'all') {
    const breakdownBody = document.getElementById('adminReportBreakdownBody');
    if (!breakdownBody) return;

    try {
        const [salesRes, expensesRes, purchasesRes] = await Promise.all([
            fetch(`${ADMIN_API_BASE}/sales`, { headers: getAuthHeaders() }),
            fetch(`${ADMIN_API_BASE}/expenses`, { headers: getAuthHeaders() }),
            fetch(`${ADMIN_API_BASE}/purchases`, { headers: getAuthHeaders() })
        ]);

        const sales = salesRes.ok ? await salesRes.json() : [];
        const expenses = expensesRes.ok ? await expensesRes.json() : [];
        const purchases = purchasesRes.ok ? await purchasesRes.json() : [];

        const now = new Date();
        const filterData = (data, dateField) => {
            return data.filter(item => {
                const itemDate = new Date(item[dateField]);
                if (isNaN(itemDate)) return true;
                switch(filter) {
                    case 'daily': return itemDate.toDateString() === now.toDateString();
                    case 'weekly':
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay());
                        startOfWeek.setHours(0,0,0,0);
                        return itemDate >= startOfWeek;
                    case 'monthly': return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                    case 'yearly': return itemDate.getFullYear() === now.getFullYear();
                    default: return true;
                }
            });
        };

        const filteredSales = filterData(sales, 'saleDate');
        const filteredExpenses = filterData(expenses, 'dateLogged');
        const filteredPurchases = filterData(purchases, 'purchaseDate');

        const totalSales = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
        const totalItems = filteredSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

        if (document.getElementById('adminReportSales')) document.getElementById('adminReportSales').innerText = `₱${totalSales.toLocaleString()}`;
        if (document.getElementById('adminReportExp')) document.getElementById('adminReportExp').innerText = `₱${totalExp.toLocaleString()}`;
        if (document.getElementById('adminReportNet')) document.getElementById('adminReportNet').innerText = `₱${(totalSales - totalExp).toLocaleString()}`;
        if (document.getElementById('adminReportItems')) document.getElementById('adminReportItems').innerText = totalItems;
        if (document.getElementById('adminReportPurchases')) document.getElementById('adminReportPurchases').innerText = `₱${totalPurchases.toLocaleString()}`;

        let rows = [];
        
        filteredSales.forEach(s => {
            rows.push({
                date: new Date(s.saleDate).toLocaleDateString(),
                type: 'sale',
                description: `${s.productName} (Qty: ${s.quantity})`,
                amount: s.total,
                user: s.userId || 'N/A'
            });
        });

        filteredExpenses.forEach(e => {
            rows.push({
                date: new Date(e.dateLogged).toLocaleDateString(),
                type: 'expense',
                description: e.category,
                amount: e.amount,
                user: e.userId || 'N/A'
            });
        });

        filteredPurchases.forEach(p => {
            rows.push({
                date: new Date(p.purchaseDate).toLocaleDateString(),
                type: 'purchase',
                description: `${p.productName} from ${p.supplierName} (Qty: ${p.quantity})`,
                amount: p.totalCost,
                user: p.userId || 'N/A'
            });
        });

        rows.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (rows.length === 0) {
            breakdownBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No transactions found for selected period.</td></tr>`;
        } else {
           breakdownBody.innerHTML = rows.map(r => `
    <tr>
        <td>${r.date}</td>
        <td>
            <span class="badge screen-only ${r.type === 'sale' ? 'bg-success-subtle text-success' : r.type === 'expense' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}">
                ${r.type.toUpperCase()}
            </span>
            <span class="print-only-text">${r.type.toUpperCase()}</span>
        </td>
        <td>${r.description}</td>
        <td class="fw-bold ${r.type === 'expense' ? 'text-danger' : 'text-success'}">₱${r.amount.toLocaleString()}</td>
        <td class="text-muted small">${r.user}</td>
    </tr>
`).join('');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        console.error('Error loading reports:', err);
    }
}

// SYSTEM SETTINGS 
async function wipeAllSystemData() {
    bentaNotify.confirm(
        '⚠️ Wipe ALL System Data?',
        'This will permanently delete <strong>ALL</strong> data across the entire platform - all users, products, sales, expenses, and purchases.',
        'Continue',
        () => {
            bentaNotify.confirm(
                'FINAL WARNING',
                'This action <strong>cannot be undone</strong>. The entire database will be wiped. Are you sure?',
                'Wipe Everything',
                async () => {
                    try {
                        const res = await fetch(`${ADMIN_API_BASE}/data/wipe`, {
                            method: 'DELETE',
                            headers: getAuthHeaders()
                        });
                        if (res.ok) {
                            bentaNotify.show('success', 'SUCCESS', 'All system data has been permanently deleted.');
                            if (document.getElementById('adminUsersTableBody')) loadUsersForManagement();
                            if (document.getElementById('adminReportBreakdownBody')) loadAllReports();
                            loadAdminStats();
                        } else {
                            bentaNotify.show('error', 'ERROR', 'Failed to wipe data.');
                        }
                    } catch(e) {
                        bentaNotify.show('error', 'ERROR', 'Connection error.');
                    }
                }
            );
        }
    );
}

// SELLER LIST & PER-SELLER REPORTS 
let allSellers = [];
let currentSellerId = null;

async function loadSellersList() {
    const tbody = document.getElementById('adminSellersTableBody');
    if (!tbody) return;

    try {
        const res = await fetch(`${ADMIN_API_BASE}/users`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Failed to fetch users');
        
        const users = await res.json();
        // Filter only sellers
        allSellers = users.filter(u => u.role === 'Seller');

        if (allSellers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No sellers found.</td></tr>`;
            return;
        }

        renderSellerTable(allSellers);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error loading sellers.</td></tr>`;
    }
}

function renderSellerTable(sellers) {
    const tbody = document.getElementById('adminSellersTableBody');
    if (!tbody) return;

    tbody.innerHTML = sellers.map(seller => `
        <tr>
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="bg-success rounded-circle d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;">
                        <span class="text-white fw-bold small">${seller.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span class="fw-bold text-dark">${seller.full_name}</span>
                </div>
            </td>
            <td>@${seller.username}</td>
            <td class="text-muted">${seller.email || 'N/A'}</td>
            <td class="text-muted small">${new Date(seller.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-lift" onclick='viewSellerReports(${JSON.stringify(seller)})'>
                    <i data-lucide="eye" style="width: 14px; height: 14px;"></i> View Reports
                </button>
            </td>
        </tr>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function filterSellerList() {
    const searchTerm = document.getElementById('sellerSearchInput').value.toLowerCase();
    const filtered = allSellers.filter(s => 
        s.full_name.toLowerCase().includes(searchTerm) || 
        s.username.toLowerCase().includes(searchTerm) ||
        (s.email && s.email.toLowerCase().includes(searchTerm))
    );
    renderSellerTable(filtered);
}

function viewSellerReports(seller) {
    currentSellerId = seller._id;
    
    // Hide seller list, show report view
    document.getElementById('sellerListView').style.display = 'none';
    document.getElementById('singleSellerReportView').style.display = 'block';
    
    // Set seller info
    document.getElementById('sellerReportName').innerText = seller.full_name;
    document.getElementById('sellerReportUsername').innerText = '@' + seller.username;
    
    // Load their reports
    loadSingleSellerReports('all');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function goBackToSellerList() {
    document.getElementById('sellerListView').style.display = 'block';
    document.getElementById('singleSellerReportView').style.display = 'none';
    currentSellerId = null;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function loadSingleSellerReports(filter = 'all') {
    if (!currentSellerId) return;

    const breakdownBody = document.getElementById('adminReportBreakdownBody');
    if (!breakdownBody) return;

    try {
        const [salesRes, expensesRes, purchasesRes, productsRes] = await Promise.all([
            fetch(`${ADMIN_API_BASE}/sales?userId=${currentSellerId}`, { headers: getAuthHeaders() }),
            fetch(`${ADMIN_API_BASE}/expenses?userId=${currentSellerId}`, { headers: getAuthHeaders() }),
            fetch(`${ADMIN_API_BASE}/purchases?userId=${currentSellerId}`, { headers: getAuthHeaders() }),
            fetch(`${ADMIN_API_BASE}/products?userId=${currentSellerId}`, { headers: getAuthHeaders() })
        ]);

        const sales = salesRes.ok ? await salesRes.json() : [];
        const expenses = expensesRes.ok ? await expensesRes.json() : [];
        const purchases = purchasesRes.ok ? await purchasesRes.json() : [];
        const products = productsRes.ok ? await productsRes.json() : [];

        // Apply filter
        const now = new Date();
        const filterData = (data, dateField) => {
            return data.filter(item => {
                const itemDate = new Date(item[dateField]);
                if (isNaN(itemDate)) return true;
                switch(filter) {
                    case 'daily': return itemDate.toDateString() === now.toDateString();
                    case 'weekly':
                        const startOfWeek = new Date(now);
                        startOfWeek.setDate(now.getDate() - now.getDay());
                        startOfWeek.setHours(0,0,0,0);
                        return itemDate >= startOfWeek;
                    case 'monthly': return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
                    case 'yearly': return itemDate.getFullYear() === now.getFullYear();
                    default: return true;
                }
            });
        };

        const filteredSales = filterData(sales, 'saleDate');
        const filteredExpenses = filterData(expenses, 'dateLogged');
        const filteredPurchases = filterData(purchases, 'purchaseDate');

        const totalSales = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
        const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
        const totalItems = filteredSales.reduce((sum, s) => sum + (s.quantity || 0), 0);

        if (document.getElementById('adminReportSales')) document.getElementById('adminReportSales').innerText = `₱${totalSales.toLocaleString()}`;
        if (document.getElementById('adminReportExp')) document.getElementById('adminReportExp').innerText = `₱${totalExp.toLocaleString()}`;
        if (document.getElementById('adminReportNet')) document.getElementById('adminReportNet').innerText = `₱${(totalSales - totalExp).toLocaleString()}`;
        if (document.getElementById('adminReportItems')) document.getElementById('adminReportItems').innerText = totalItems;
        if (document.getElementById('adminReportProducts')) document.getElementById('adminReportProducts').innerText = products.length;
        if (document.getElementById('adminReportPurchases')) document.getElementById('adminReportPurchases').innerText = `₱${totalPurchases.toLocaleString()}`;

        // Build breakdown table
        let rows = [];
        
        filteredSales.forEach(s => {
            rows.push({
                date: new Date(s.saleDate).toLocaleDateString(),
                type: 'sale',
                description: `${s.productName} (Qty: ${s.quantity})`,
                amount: s.total
            });
        });

        filteredExpenses.forEach(e => {
            rows.push({
                date: new Date(e.dateLogged).toLocaleDateString(),
                type: 'expense',
                description: e.category,
                amount: e.amount
            });
        });

        filteredPurchases.forEach(p => {
            rows.push({
                date: new Date(p.purchaseDate).toLocaleDateString(),
                type: 'purchase',
                description: `${p.productName} from ${p.supplierName} (Qty: ${p.quantity})`,
                amount: p.totalCost
            });
        });

        // Sort by date descending
        rows.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (rows.length === 0) {
            breakdownBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No transactions found for selected period.</td></tr>`;
        } else {
           breakdownBody.innerHTML = rows.map(r => `
    <tr>
        <td>${r.date}</td>
        <td>
            <span class="badge screen-only ${r.type === 'sale' ? 'bg-success-subtle text-success' : r.type === 'expense' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}">
                ${r.type.toUpperCase()}
            </span>
            <span class="print-only-text">${r.type.toUpperCase()}</span>
        </td>
        <td>${r.description}</td>
        <td class="fw-bold ${r.type === 'expense' ? 'text-danger' : 'text-success'}">₱${r.amount.toLocaleString()}</td>
    </tr>
`).join('');
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (err) {
        console.error('Error loading seller reports:', err);
    }
}


// INITIALIZATION 
document.addEventListener('DOMContentLoaded', async () => {
    const currentPage = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
    
    if (currentPage !== 'admin-login.html') {
        if (!checkAdminAccess()) return;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    startBentaClock();

    if (document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').innerText = currentUser;
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // LOADING SCREEN FOR ADMIN DASHBOARD
    if (currentPage === 'admin-dashboard.html' || currentPage === '') {
        const flag = localStorage.getItem('bb_welcome_triggered');
        if (flag === 'true') {
            const loadingOverlay = document.getElementById('loadingOverlay');
            const loadingCounter = document.getElementById('loadingCounter');
            const loadingBar = document.getElementById('loadingBar');
            const loadingTextContainer = document.querySelector('.loading-text');
            const loadingContent = document.querySelector('.loading-content');

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
                        loadingBar.style.width = progress + '%';
                        setTimeout(() => {
                            loadingContent.classList.add('loading-complete');
                            loadingTextContainer.innerHTML = 'SYSTEM READY <br><span style="font-size: 0.8rem; opacity: 0.8; letter-spacing: 2px;">ACCESS GRANTED</span>';
                            setTimeout(() => {
                                loadingOverlay.classList.add('exit-animation');
                                setTimeout(() => {
                                    loadingOverlay.style.display = 'none';
                                    
                                    // ADMIN WELCOME MODAL 
                                    const adminName = localStorage.getItem('bb_user') || 'Admin';
                                    const nameEl = document.getElementById('adminWelcomeName');
                                    if (nameEl) nameEl.innerText = adminName;
                                    
                                    const welcomeModal = new bootstrap.Modal(document.getElementById('adminWelcomeModal'));
                                    welcomeModal.show();
                                    
                                    localStorage.removeItem('bb_welcome_triggered');
                                }, 600);
                            }, 1300);
                        }, 150);
                    } else {
                        loadingCounter.innerText = progress;
                        loadingBar.style.width = progress + '%';
                    }
                }, 40);
            } else {
                localStorage.removeItem('bb_welcome_triggered');
            }
        }
    }

    // Load page-specific data
    if (currentPage === 'admin-dashboard.html' || currentPage === '') {
        loadAdminStats();
    }

    if (currentPage === 'admin-users.html') {
        loadUsersForManagement();
        loadAdminStats();
    }

    if (currentPage === 'admin-reports.html') {
        loadSellersList();
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', executeLogout);

    // Report filter change
    const reportFilter = document.getElementById('adminReportFilter');
    if (reportFilter) {
        reportFilter.addEventListener('change', function() {
            if (currentSellerId) {
                loadSingleSellerReports(this.value);
            }
        });
    }

    // Set print date for admin reports
    if (currentPage === 'admin-reports.html') {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }) + ' at ' + now.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit' 
            });
            mainContent.setAttribute('data-print-date', dateStr);
        }
    }
});