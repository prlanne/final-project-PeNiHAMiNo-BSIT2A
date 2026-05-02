// INVENTORY MANAGEMENT
function renderInventory() {
    const body = document.getElementById('fullInventoryBody');
    if (!body) {
        console.log('Inventory body not found on this page');
        return;
    }
    
    const maxStock = 50; 
    
    if (!products || products.length === 0) {
        body.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No products yet. Add your first product above!</td></tr>`;
        return;
    }
    
    console.log('Rendering inventory, products count:', products.length);
    
    body.innerHTML = products.map((p, i) => {
        const stockPercent = Math.min((p.stock / maxStock) * 100, 100);
        let barColorClass = 'bg-success'; 
        let badgeClass    = 'bg-success-subtle text-success border border-success-subtle';
        let statusText    = 'IN STOCK';

        if (p.stock <= 5) { 
            barColorClass = 'bg-danger';
            badgeClass    = 'bg-danger-subtle text-danger border border-danger-subtle';
            statusText    = 'LOW';
        } else if (p.stock <= 20) {
            barColorClass = 'bg-warning';
            badgeClass    = 'bg-warning-subtle text-warning border border-warning-subtle';
            statusText    = 'MODERATE';
        }

        const productName = String(p.name).replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });

        return `
            <tr>
                <td class="fw-bold text-dark" style="font-size: 0.95rem;">${productName}</td>
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
    if (!products[index]) return;
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
            bentaNotify.show('success', 'SUCCESS', 'Product deleted successfully.');
        }
    );
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
                bentaNotify.show('success', 'SUCCESS', 'Product has been saved!');
            } else {
                const error = await response.json();
                bentaNotify.show('error', 'ERROR', error.message || 'Failed to save product');
            }
        } catch (error) {
            console.error('Add product error:', error);
            bentaNotify.show('error', 'ERROR', 'Check if server is running on port 3000.');
        }
    } else {
        bentaNotify.show('warning', 'WARNING', 'Please fill all fields correctly!');
    }
}

// PAGE INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inventory page loaded - initializing table');
    if (typeof renderInventory === 'function') {
        renderInventory();
    }
});