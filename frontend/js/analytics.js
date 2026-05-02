// ANALYTICS CHART
function renderChart(filter = 'all') {
    const chartCtx = document.getElementById('salesChart');
    if (!chartCtx) return;
    const ctx           = chartCtx.getContext('2d');
    const filteredSales = getFilteredData(salesLog, filter);
    const salesByDateObj = {};
    
    // Aggregate sales by appropriate time period based on filter
    filteredSales.forEach(s => {
        const saleDate = new Date(s.date);
        let key = s.date; // default to full date
        
        if (filter === 'monthly') {
            // Group by month name
            key = saleDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (filter === 'yearly') {
            // Group by year only
            key = saleDate.getFullYear().toString();
        }
        // For 'daily' and 'weekly', keep the full date
        
        salesByDateObj[key] = (salesByDateObj[key] || 0) + s.total;
    });
    
    // For monthly view, ensure all months in current year are shown
    let labels = [];
    if (filter === 'monthly') {
        const now = new Date();
        const currentYear = now.getFullYear();
        // Show all months from January to current month
        for (let month = 0; month < now.getMonth() + 1; month++) {
            const monthName = new Date(currentYear, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            labels.push(monthName);
            // Add data if exists, otherwise 0
            if (!salesByDateObj[monthName]) {
                salesByDateObj[monthName] = 0;
            }
        }
    } else {
        labels = Object.keys(salesByDateObj);
        
        // Sort labels chronologically
        if (filter === 'yearly') {
            // For year views, sort chronologically
            labels.sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateA - dateB;
            });
        } else {
            // For daily/weekly, parse as dates and sort
            labels.sort((a, b) => {
                const dateA = new Date(a);
                const dateB = new Date(b);
                return dateA - dateB;
            });
        }
    }
    
    const dataPoints = labels.map(label => salesByDateObj[label] || 0);
    const isDark     = document.body.classList.contains('dark-theme');
    const gridColor  = isDark ? '#334155' : '#f1f5f9';
    
    // Significantly increase bar thickness and reduce gaps
    let barThickness = 50;
    let categoryPercentage = 0.8;
    if (filter === 'yearly') {
        barThickness = 60;
        categoryPercentage = 0.7;
    } else if (filter === 'monthly') {
        barThickness = 55;
        categoryPercentage = 0.75;
    } else if (filter === 'weekly') {
        barThickness = 50;
        categoryPercentage = 0.8;
    } else if (filter === 'daily') {
        barThickness = 48;
        categoryPercentage = 0.85;
    }
    
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
                label: 'Revenue (₱)',
                data:  dataPoints.length > 0 ? dataPoints : [0],
                backgroundColor: '#38bdf8',
                borderColor: '#0ea5e9',
                borderWidth: 1.5,
                borderRadius: 8,
                barThickness: barThickness,
                maxBarThickness: barThickness + 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    titleColor: isDark ? '#e2e8f0' : '#0f172a',
                    bodyColor: isDark ? '#cbd5e1' : '#334155',
                    borderColor: isDark ? '#475569' : '#e2e8f0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Revenue: ₱${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: gridColor },
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                },
                x: { 
                    grid: { display: false },
                    categoryPercentage: categoryPercentage,
                    barPercentage: 0.95,
                    ticks: {
                        maxRotation: filter === 'yearly' ? 0 : 45,
                        minRotation: 0,
                        font: {
                            size: filter === 'monthly' ? 11 : 12
                        }
                    }
                }
            }
        }
    });
}

function changeAnalyticsTimeframe(range) {
    currentFilter = range;
    document.querySelectorAll('.timeframe-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${range}`);
    if (activeBtn) activeBtn.classList.add('active');
    updateDashboard(range);
    renderChart(range);
    if (document.getElementById('reportSalesTotal')) generateReport(range); 
}

// Analytics Page Init
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('salesChart')) {
        renderChart(currentFilter);
    }
});