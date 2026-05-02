// SETTINGS PAGE LOGIC
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

                            if (document.getElementById('fullInventoryBody') && typeof renderInventory === 'function') renderInventory();
                            if (document.getElementById('salesLogBody') && typeof renderSalesLog === 'function') renderSalesLog();
                            if (document.getElementById('expenseLogBody') && typeof renderExpenseLog === 'function') renderExpenseLog();
                            if (document.getElementById('displaySales') && typeof updateDashboard === 'function') updateDashboard(currentFilter);
                            if (document.getElementById('reportSalesTotal') && typeof generateReport === 'function') generateReport(currentFilter);
                            if (document.querySelector('select[name="saleSelect"], #saleSelect, #dashboardSaleSelect') && typeof populateSaleSelect === 'function') {
                                populateSaleSelect();
                            }
                            if (salesChartInstance && typeof renderChart === 'function') renderChart(currentFilter);

                            bentaNotify.show('success', 'SUCCESS', 'All system data has been permanently deleted.');
                        } else {
                            const err = await response.json();
                            bentaNotify.show('error', 'ERROR', `Failed to wipe data: ${err.message}`);
                        }
                    } catch (error) {
                        console.error('Wipe error:', error);
                        bentaNotify.show('error', 'ERROR', 'Could not connect to server. Please check your connection.');
                    }
                }
            );
        }
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsForm');
    const settingNameInput = document.getElementById('settingName');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const wipeDataButton = document.getElementById('clearDataBtn');

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
                bentaNotify.show('success', 'SUCCESS', 'Profile name updated successfully!');
            }
        });
    }

    if (wipeDataButton) {
        wipeDataButton.addEventListener('click', wipeAllSystemData);
    }
});