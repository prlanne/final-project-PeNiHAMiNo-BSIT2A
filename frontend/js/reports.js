// REPORTS GENERATION
async function generateReport(filter = 'all') {
    const filteredSales = getFilteredData(salesLog, filter);
    const filteredExp   = getFilteredData(expenseLog, filter);
    const totalSales    = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalExp      = filteredExp.reduce((sum, e) => sum + e.amount, 0);
    const totalItems    = filteredSales.reduce((sum, s) => sum + s.qty, 0);

    let purchases = [];
    try {
        const purchasesRes = await fetch(`${API_BASE_URL}/purchases`, {
            headers: getAuthHeaders()
        });
        if (purchasesRes.ok) {
            purchases = await purchasesRes.json();
        }
    } catch (err) {
        console.warn('Could not fetch purchases for report:', err);
    }

    const filteredPurchases = getFilteredData(
        purchases.map(p => ({ date: new Date(p.purchaseDate).toLocaleDateString(), ...p })),
        filter
    );

    if (document.getElementById('reportSalesTotal')) document.getElementById('reportSalesTotal').innerText = `₱${totalSales.toLocaleString()}`;
    if (document.getElementById('reportExpTotal'))   document.getElementById('reportExpTotal').innerText   = `₱${totalExp.toLocaleString()}`;
    if (document.getElementById('reportNet'))        document.getElementById('reportNet').innerText        = `₱${(totalSales - totalExp).toLocaleString()}`;
    if (document.getElementById('reportItems'))      document.getElementById('reportItems').innerText      = totalItems;

    const breakdownBody = document.getElementById('reportBreakdownBody');
    if (breakdownBody) {
        const sortedSales = filteredSales.slice().reverse();
        const sortedExp   = filteredExp.slice().reverse();
        const sortedPurchases = filteredPurchases.slice().reverse();

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
            ${sortedPurchases.map(p => `
                <tr>
                    <td>${p.date}</td>
                    <td><i data-lucide="shopping-bag" class="text-primary me-2" size="14"></i><span class="text-primary small fw-bold">Purchase</span></td>
                    <td class="fw-bold">${p.productName} from ${p.supplierName} (Qty: ${p.quantity})</td>
                    <td class="text-primary fw-bold text-end">₱${parseFloat(p.totalCost).toLocaleString()}</td>
                </tr>`).join('')}
            ${sortedSales.length === 0 && sortedExp.length === 0 && sortedPurchases.length === 0
                ? `<tr><td colspan="4" class="text-center text-muted py-4">No transactions recorded yet.</td></tr>`
                : ''}
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Reports Page Init
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reportSalesTotal')) {
        generateReport(currentFilter);
    }
    
    const container = document.querySelector('.main-content .container');
    if (container && window.location.pathname.includes('reports.html')) {
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
});