// PURCHASES MANAGEMENT
async function renderPurchasesTable() {
    const purchasesLogBody = document.getElementById('purchasesLogBody');
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

function calculatePurchaseTotal() {
    const quantityInput = document.getElementById('quantity');
    const unitCostInput = document.getElementById('unitCost');
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    if (!quantityInput || !unitCostInput || !totalCostDisplay) return;
    const qty  = parseFloat(quantityInput.value) || 0;
    const cost = parseFloat(unitCostInput.value) || 0;
    totalCostDisplay.textContent = (qty * cost).toFixed(2);
}

// Purchases Page DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const purchaseForm = document.getElementById('purchaseForm');
    const quantityInput = document.getElementById('quantity');
    const unitCostInput = document.getElementById('unitCost');
    const totalCostDisplay = document.getElementById('totalCostDisplay');
    
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
                    bentaNotify.show('success', 'SUCCESS', 'Purchase recorded successfully!');
                    purchaseForm.reset();
                    document.getElementById('purchaseDate').valueAsDate = new Date();
                    totalCostDisplay.textContent = "0.00";
                    renderPurchasesTable();
                } else {
                    const err = await response.json();
                    bentaNotify.show('error', 'ERROR', err.message);
                }
            } catch (error) {
                bentaNotify.show('error', 'ERROR', 'Backend connection failed.');
            }
        });
    }

    if (quantityInput && unitCostInput && totalCostDisplay) {
        quantityInput.addEventListener('input', calculatePurchaseTotal);
        unitCostInput.addEventListener('input', calculatePurchaseTotal);
    }

    renderPurchasesTable();
});