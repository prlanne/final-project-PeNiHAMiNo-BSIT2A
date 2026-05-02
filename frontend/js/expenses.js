// EXPENSES MANAGEMENT
function renderExpenseLog() {
    const body = document.getElementById('expenseLogBody');
    if (!body) {
        console.log('Expense log body not found on this page');
        return;
    }

    console.log('Rendering expense log, count:', expenseLog.length);

    if (!expenseLog || expenseLog.length === 0) {
        body.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">No expenses recorded yet. Add your first expense!</td></tr>`;
        return;
    }

    body.innerHTML = expenseLog.slice().reverse().map(e => `
        <tr>
            <td class="text-muted small">${e.date}</td>
            <td class="fw-bold text-dark">${e.category}</td>
            <td class="text-danger fw-bold">₱${e.amount.toLocaleString()}</td>
        </tr>
    `).join('');
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

                if (document.getElementById('expenseLogBody')) {
                    renderExpenseLog();
                }
                // FIX: explicitly refresh financial summary after an expense
                if (document.getElementById('displaySales') && typeof updateDashboard === 'function') {
                    updateDashboard('all');
                }

                form.reset();
                bentaNotify.show('success', 'SUCCESS', 'Expense has been saved!');
            } else {
                bentaNotify.show('error', 'ERROR', 'Failed to save expense.');
            }
        } catch (error) {
            console.error('Expense error:', error);
            bentaNotify.show('error', 'ERROR', 'Server might be down.');
        }
    } else {
        bentaNotify.show('warning', 'WARNING', 'Please fill all fields correctly!');
    }
}

async function refreshExpensesData() {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`, { headers: getAuthHeaders() });
        if (response.ok) {
            const apiExpenses = await response.json();
            expenseLog = apiExpenses.map(e => ({
                date:     new Date(e.dateLogged).toLocaleDateString(),
                category: e.category,
                amount:   e.amount
            }));
            localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenseLog));
            renderExpenseLog();
        }
    } catch (err) {
        console.warn('Could not refresh expenses:', err);
    }
}

// PAGE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    console.log('Expenses page loaded - initializing table');
    if (typeof renderExpenseLog === 'function') {
        renderExpenseLog();
    }
});