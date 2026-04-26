// ADMIN SCRIPT - BentaBoard Admin Functions

const ADMIN_API_BASE = 'http://127.0.0.1:3000/api';

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

// LOGOUT
function executeLogout(e) {
    if(e) e.preventDefault();
    if (typeof bentaNotify !== 'undefined') {
        bentaNotify.confirm('Sign Out?', 'Are you sure you want to logout of the Admin Panel?', 'Logout', () => {
            bentaNotify.show('success', 'THANK YOU!', 'Logging out of Admin Panel...', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('bb_user');
                window.location.replace('role-select.html');
            });
        });
    } else {
        localStorage.removeItem('token');
        localStorage.removeItem('bb_user');
        window.location.replace('role-select.html');
    }
}

// TOAST NOTIFICATION (standalone)
function adminToast(type, message) {
    const cleanMsg = String(message).replace(/^[\u2705\u274C\uD83D\uDEA8\u26A0\uFE0F\u2139\uFE0F\s]+/u, '').trim();
    
    const cfg = {
        success: { icon: '✓', label: 'Success', bg: '#f0fdf4', border: '#22c55e', color: '#16a34a' },
        error: { icon: '✕', label: 'Error', bg: '#fef2f2', border: '#ef4444', color: '#dc2626' },
        warning: { icon: '!', label: 'Warning', bg: '#fffbeb', border: '#f59e0b', color: '#d97706' },
        info: { icon: 'i', label: 'Info', bg: '#eff6ff', border: '#3b82f6', color: '#2563eb' }
    };
    const { icon, label, bg, border, color } = cfg[type] || cfg.info;

    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.style.cssText = 'position:fixed;top:30px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;align-items:center;gap:12px;pointer-events:none;';
        document.body.appendChild(container);
    }

    const card = document.createElement('div');
    card.style.cssText = `
        pointer-events:all;display:flex;align-items:center;gap:15px;
        background:${bg};border-radius:16px;padding:16px 18px;
        min-width:340px;max-width:440px;box-shadow:0 10px 28px rgba(0,0,0,0.1);
        border:1.5px solid ${border};font-family:'Poppins',sans-serif;
        opacity:0;transform:translateY(-32px);transition:all 0.35s ease;cursor:pointer;
    `;

    card.innerHTML = `
        <div style="width:38px;height:38px;border-radius:50%;background:${bg};border:2px solid ${border};
            display:flex;align-items:center;justify-content:center;font-weight:700;color:${color};flex-shrink:0;">
            ${icon}
        </div>
        <div style="flex:1;min-width:0;">
            <div style="font-size:0.75rem;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:${color};">${label}</div>
            <div style="font-size:0.9rem;font-weight:500;color:#374151;">${cleanMsg}</div>
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
        setTimeout(() => card.remove(), 350);
    }

    const timer = setTimeout(dismiss, 3500);
    card.addEventListener('click', dismiss);
}

// LOAD ADMIN DASHBOARD STATS
async function loadAdminStats() {
    try {
        // Get all users
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

        // Get transaction counts
        let totalTransactions = 0;
        try {
            const [salesRes, expensesRes, purchasesRes] = await Promise.all([
                fetch(`${ADMIN_API_BASE}/sales`, { headers: getAuthHeaders() }),
                fetch(`${ADMIN_API_BASE}/expenses`, { headers: getAuthHeaders() }),
                fetch(`${ADMIN_API_BASE}/purchases`, { headers: getAuthHeaders() })
            ]);
            if (salesRes.ok) totalTransactions += (await salesRes.json()).length;
            if (expensesRes.ok) totalTransactions += (await expensesRes.json()).length;
            if (purchasesRes.ok) totalTransactions += (await purchasesRes.json()).length;
        } catch(e) {}
        
        if (document.getElementById('adminTotalTransactions')) document.getElementById('adminTotalTransactions').innerText = totalTransactions;

    } catch (err) {
        console.warn('Could not load admin stats:', err);
    }
}

// ==================== USER MANAGEMENT ====================
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
    if (typeof bentaNotify !== 'undefined') {
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
                        adminToast('success', `User "${username}" deleted successfully.`);
                        loadUsersForManagement();
                        loadAdminStats();
                    } else {
                        adminToast('error', 'Failed to delete user.');
                    }
                } catch (err) {
                    adminToast('error', 'Connection error.');
                }
            }
        );
    } else {
        if (confirm(`Delete user "${username}"?`)) {
            try {
                const res = await fetch(`${ADMIN_API_BASE}/users/${userId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });
                if (res.ok) {
                    adminToast('success', `User deleted.`);
                    loadUsersForManagement();
                }
            } catch(e) {
                adminToast('error', 'Error deleting user.');
            }
        }
    }
}

// ==================== ALL REPORTS ====================
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
        if (document.getElementById('adminReportPurchases')) document.getElementById('adminReportPurchases').innerText = `₱${totalPurchases.toLocaleString()}`;

        // Build breakdown table
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

        // Sort by date descending
        rows.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (rows.length === 0) {
            breakdownBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No transactions found for selected period.</td></tr>`;
        } else {
            breakdownBody.innerHTML = rows.map(r => `
                <tr>
                    <td>${r.date}</td>
                    <td>
                        <span class="badge ${r.type === 'sale' ? 'bg-success-subtle text-success' : r.type === 'expense' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}">
                            ${r.type.toUpperCase()}
                        </span>
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

// ==================== SYSTEM SETTINGS ====================
async function wipeAllSystemData() {
    if (typeof bentaNotify !== 'undefined') {
        bentaNotify.confirm(
            '⚠️ Wipe ALL System Data?',
            'This will permanently delete <strong>ALL</strong> data across the entire platform - all users, products, sales, expenses, and purchases.',
            'Continue',
            () => {
                bentaNotify.confirm(
                    'FINAL WARNING',
                    'This action <strong>cannot be undone</strong>. The entire database will be wiped. Are you absolutely sure?',
                    'Wipe Everything',
                    async () => {
                        try {
                            const res = await fetch(`${ADMIN_API_BASE}/data/wipe`, {
                                method: 'DELETE',
                                headers: getAuthHeaders()
                            });
                            if (res.ok) {
                                adminToast('success', 'All system data has been permanently deleted.');
                                if (document.getElementById('adminUsersTableBody')) loadUsersForManagement();
                                if (document.getElementById('adminReportBreakdownBody')) loadAllReports();
                                loadAdminStats();
                            } else {
                                adminToast('error', 'Failed to wipe data.');
                            }
                        } catch(e) {
                            adminToast('error', 'Connection error.');
                        }
                    }
                );
            }
        );
    } else {
        if (confirm('Wipe ALL system data? This cannot be undone!')) {
            try {
                await fetch(`${ADMIN_API_BASE}/data/wipe`, { method: 'DELETE', headers: getAuthHeaders() });
                adminToast('success', 'Data wiped.');
            } catch(e) {
                adminToast('error', 'Error.');
            }
        }
    }
}

// ==================== SELLER LIST & PER-SELLER REPORTS ====================

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
        // Fetch this seller's data using userId query param
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
                        <span class="badge ${r.type === 'sale' ? 'bg-success-subtle text-success' : r.type === 'expense' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'}">
                            ${r.type.toUpperCase()}
                        </span>
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

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAccess()) return;

    if (typeof lucide !== 'undefined') lucide.createIcons();
    startBentaClock();

    if (document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').innerText = currentUser;
    }

    // Active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });

    // Load page-specific data
    if (currentPage === 'admin-dashboard.html' || currentPage === '') {
        loadAdminStats();
    }

    if (currentPage === 'admin-users.html') {
        loadUsersForManagement();
        loadAdminStats();
    }

        if (currentPage === 'admin-reports.html') {
        loadSellersList();  // <-- CHANGED: Now loads seller list instead
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', executeLogout);

    // Report filter change
        // Report filter change - now triggers single seller report
    const reportFilter = document.getElementById('adminReportFilter');
    if (reportFilter) {
        reportFilter.addEventListener('change', function() {
            if (currentSellerId) {
                loadSingleSellerReports(this.value);  // <-- CHANGED
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

        function toggleAdminTheme() {
            const isDark = document.body.classList.toggle('dark-theme');
            const theme = isDark ? 'dark' : 'light';
            localStorage.setItem('bb_theme', theme);
            
            const themeSwitch = document.getElementById('adminThemeSwitch');
            if (themeSwitch) themeSwitch.checked = isDark;
        }

        document.addEventListener('DOMContentLoaded', () => {
            const savedTheme = localStorage.getItem('bb_theme') || 'light';
            const isDark = savedTheme === 'dark';
            
            if (isDark) {
                document.body.classList.add('dark-theme');
            }
            
            const themeSwitch = document.getElementById('adminThemeSwitch');
            if (themeSwitch) themeSwitch.checked = isDark;
        });

  // Theme Loader
        (function() {
            const savedTheme = localStorage.getItem('bb_theme') || 'light';
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        })();
    
    // Theme Loader
        (function() {
            const savedTheme = localStorage.getItem('bb_theme') || 'light';
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        })();

    //Theme Loader

        (function() {
            const savedTheme = localStorage.getItem('bb_theme') || 'light';
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        })();
