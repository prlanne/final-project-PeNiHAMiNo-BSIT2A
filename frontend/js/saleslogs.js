// SALES MANAGEMENT
function renderSalesLog() {
    const body = document.getElementById('salesLogBody');
    if (!body) {
        console.log('Sales log body not found on this page');
        return;
    }

    console.log('Rendering sales log, count:', salesLog.length);

    if (!salesLog || salesLog.length === 0) {
        body.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No sales recorded yet. Make your first sale!</td></tr>`;
        return;
    }

    body.innerHTML = salesLog.slice().reverse().map(s => `
        <tr>
            <td class="text-muted small">${s.date}</td>
            <td class="fw-bold text-dark">${s.name}</td>
            <td>${s.qty}</td>
            <td class="text-success fw-bold">₱${s.total.toLocaleString()}</td>
        </tr>
    `).join('');
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

                if (document.getElementById('salesLogBody')) {
                    renderSalesLog();
                }
                if (document.getElementById('fullInventoryBody')) {
                    renderInventory();
                }
                // FIX: explicitly refresh financial summary after a sale
                if (document.getElementById('displaySales') && typeof updateDashboard === 'function') {
                    updateDashboard('all');
                }

                populateSaleSelect();
                form.reset();
                bentaNotify.show('success', 'SUCCESS', 'Sale has been saved!');
            } else {
                bentaNotify.show('error', 'ERROR', 'Failed to save sale.');
            }
        } catch (error) {
            bentaNotify.show('error', 'ERROR', 'Could not connect to backend.');
        }
    } else {
        bentaNotify.show('warning', 'WARNING', 'Insufficient stock or invalid product selection!');
    }
}

async function refreshSalesData() {
    try {
        const response = await fetch(`${API_BASE_URL}/sales`, { headers: getAuthHeaders() });
        if (response.ok) {
            const apiSales = await response.json();
            salesLog = apiSales.map(s => ({
                date:  new Date(s.saleDate).toLocaleDateString(),
                name:  s.productName,
                qty:   s.quantity,
                total: s.total
            }));
            localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(salesLog));
            renderSalesLog();
        }
    } catch (err) {
        console.warn('Could not refresh sales:', err);
    }
}

// PAGE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sales Logs page loaded - initializing table');
    renderSalesLog();
});