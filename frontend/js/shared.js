// SHARED DATA & FUNCTIONS
const uid = getUserIdFromToken();
const STORAGE_KEYS = {
    products: `bb_products_${uid}`,
    sales:    `bb_sales_${uid}`,
    expenses: `bb_expenses_${uid}`
};

let products   = JSON.parse(localStorage.getItem(STORAGE_KEYS.products))  || [];
let salesLog   = JSON.parse(localStorage.getItem(STORAGE_KEYS.sales))     || [];
let expenseLog = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses))  || [];
let currentUser  = localStorage.getItem('bb_user') || "User";
let currentTheme = localStorage.getItem('bb_theme') || 'light';
let isLoggedIn   = localStorage.getItem('token') !== null;
let salesChartInstance = null;

let currentFilter = 'daily';

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

// FIX: saveData only persists data to localStorage.
// It NO LONGER auto-calls updateDashboard — that was causing revenue to
// change whenever a product was added (which also calls saveData).
// Call updateDashboard explicitly only after sales or expense actions.
function saveData() {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.sales,    JSON.stringify(salesLog));
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenseLog));
}

function getFilteredData(dataArray, range) {
    const now = new Date();
    return dataArray.filter(item => {
        const itemDate = new Date(item.date);
        if (isNaN(itemDate)) return true;
        switch (range) {
            case 'daily':
                return itemDate.toDateString() === now.toDateString();
            case 'weekly': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                return itemDate >= startOfWeek;
            }
            case 'monthly':
                return itemDate.getMonth() === now.getMonth() &&
                       itemDate.getFullYear() === now.getFullYear();
            case 'yearly':
                return itemDate.getFullYear() === now.getFullYear();
            default:
                return true; // 'all'
        }
    });
}

// updateDashboard accepts an explicit filter and only updates the three
// financial summary cards. It is safe to call from sales/expense handlers.
// The dashboard page always passes 'all' so it shows all-time totals.
function updateDashboard(filter = 'all') {
    const filteredSales  = getFilteredData(salesLog,   filter);
    const filteredExp    = getFilteredData(expenseLog, filter);
    const totalSales     = filteredSales.reduce((sum, s) => sum + s.total,  0);
    const totalExp       = filteredExp.reduce((sum, e)  => sum + e.amount,  0);

    const displaySales   = document.getElementById('displaySales');
    const displayOutflow = document.getElementById('displayOutflow');
    const displayProfit  = document.getElementById('displayProfit');

    if (displaySales)   displaySales.innerText   = `₱${totalSales.toLocaleString()}`;
    if (displayOutflow) displayOutflow.innerText = `₱${totalExp.toLocaleString()}`;
    if (displayProfit)  displayProfit.innerText  = `₱${(totalSales - totalExp).toLocaleString()}`;
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

window.toggleSystemTheme = () => {
    const isDark = document.body.classList.toggle('dark-theme');
    currentTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('bb_theme', currentTheme);
    if (salesChartInstance && typeof window.renderChart === 'function') {
        window.renderChart(currentFilter);
    } else if (salesChartInstance) {
        if (typeof renderChart === 'function') renderChart(currentFilter);
    }
};