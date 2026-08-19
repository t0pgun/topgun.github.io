// Fetch and display data
async function loadData() {
    try {
        // Fetch stocks data
        const stocksResponse = await fetch('data/stocks.json');
        const stocksData = await stocksResponse.json();

        // Fetch rates data
        const ratesResponse = await fetch('data/rates.json');
        const ratesData = await ratesResponse.json();

        displayExchangeRate(ratesData);
        displayStocks(stocksData, ratesData);
        updateTimestamp();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('stocksBody').innerHTML = '<tr><td colspan="5">Error loading data</td></tr>';
    }
}

function displayExchangeRate(ratesData) {
    const rate = ratesData.rate;
    const change = ratesData.change || 0;
    const changePercent = ratesData.changePercent || 0;

    document.getElementById('exchangeRate').textContent = `${rate.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} ₩/$`;
    
    const changeColor = change >= 0 ? '#27ae60' : '#e74c3c';
    const changeSymbol = change >= 0 ? '▲' : '▼';
    document.getElementById('rateChange').textContent = `${changeSymbol} ${Math.abs(changePercent).toFixed(2)}%`;
    document.getElementById('rateChange').style.color = changeColor;
    document.getElementById('rateChange').style.borderColor = changeColor;
    
    document.getElementById('rateTime').textContent = `Last updated: ${new Date(ratesData.timestamp).toLocaleString()}`;
}

function displayStocks(stocksData, ratesData) {
    const tbody = document.getElementById('stocksBody');
    tbody.innerHTML = '';

    let totalValueUSD = 0;
    const exchangeRate = ratesData.rate;

    stocksData.stocks.forEach(stock => {
        const totalValue = stock.quantity * stock.price;
        const totalValueKRW = totalValue * exchangeRate;
        totalValueUSD += totalValue;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${stock.symbol}</strong></td>
            <td>${stock.quantity}</td>
            <td>$${stock.price.toFixed(2)}</td>
            <td>$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td>₩${Math.floor(totalValueKRW).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });

    // Update summary
    document.getElementById('totalHoldings').textContent = stocksData.stocks.length;
    document.getElementById('portfolioValue').textContent = `$${totalValueUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('portfolioValueKRW').textContent = `₩${Math.floor(totalValueUSD * exchangeRate).toLocaleString()}`;
}

function updateTimestamp() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleString();
}

// Load data when page loads
window.addEventListener('load', loadData);

// Reload data every 5 minutes
setInterval(loadData, 5 * 60 * 1000);
