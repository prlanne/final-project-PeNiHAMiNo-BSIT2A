// DASHBOARD PAGE INIT
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard initializing...');
    
    setTimeout(() => {
        if (document.getElementById('fullInventoryBody') && typeof renderInventory === 'function') {
            renderInventory();
            console.log('Inventory rendered, products count:', products.length);
        }
        if (document.getElementById('displaySales') && typeof updateDashboard === 'function') {
            // Dashboard always shows all-time summary, not filtered by currentFilter
            updateDashboard('all');
        }
        if (document.getElementById('salesLogBody') && typeof renderSalesLog === 'function') {
            renderSalesLog();
        }
        if (document.getElementById('expenseLogBody') && typeof renderExpenseLog === 'function') {
            renderExpenseLog();
        }
        if (document.getElementById('salesChart') && typeof renderChart === 'function') {
            renderChart(currentFilter);
        }
        if (document.getElementById('reportSalesTotal') && typeof generateReport === 'function') {
            generateReport(currentFilter);
        }
        if (document.querySelector('select[name="saleSelect"], #saleSelect, #dashboardSaleSelect') && typeof populateSaleSelect === 'function') {
            populateSaleSelect();
        }
    }, 200);

    const productForm = document.getElementById('dashboardProductForm');
    if (productForm && typeof addProduct === 'function') {
        productForm.addEventListener('submit', addProduct);
        console.log('Product form attached');
    }

    const salesForm = document.getElementById('dashboardSalesForm');
    if (salesForm && typeof recordSale === 'function') {
        salesForm.addEventListener('submit', recordSale);
        console.log('Sales form attached');
    }

    const expenseForm = document.getElementById('dashboardExpenseForm');
    if (expenseForm && typeof logExpense === 'function') {
        expenseForm.addEventListener('submit', logExpense);
        console.log('Expense form attached');
    }
});