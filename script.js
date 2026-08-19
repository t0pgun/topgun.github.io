// Fetch and display data
async function loadData() {
    try {
        console.log('Loading data...');
        
        // Fetch stocks data from GitHub (relative path)
        const stocksResponse = await fetch('./data/stocks.json');
        const stocksData = await stocksResponse.json();
        console.log('Stocks loaded:', stocksData);

        // Fetch live exchange rate
        const ratesData = await getExchangeRate();
        console.log('Exchange rate loaded:', ratesData);

        displayExchangeRate(ratesData);
        displayStocks(stocksData, ratesData);
        updateTimestamp();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('stocksBody').innerHTML = '<tr><td colspan="5">Error loading data: ' + error.message + '</td></tr>';
    }
}

async function getExchangeRate() {
    // Fetch real-time USD to KRW exchange rate
    // Using multiple free APIs as fallback
    
    try {
        // Try exchangerate-api.com (free, no key needed)
        console.log('Trying exchangerate.host...');
        const response = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=KRW');
        const data = await response.json();
        console.log('exchangerate.host response:', data);
        
        if (data.rates && data.rates.KRW) {
            console.log('✓ Got rate from exchangerate.host');
            return {
                rate: data.rates.KRW,
                change: 0,
                changePercent: 0,
                timestamp: new Date().toISOString(),
                source: 'exchangerate.host'
            };
        }
    } catch (e) {
        console.log('exchangerate.host failed:', e);
    }

    try {
        // Fallback: Try open-exchange-rates (free tier)
        console.log('Trying openexchangerates.org...');
        const response = await fetch('https://openexchangerates.org/api/latest.json?base=USD&symbols=KRW&app_id=free');
        const data = await response.json();
        console.log('openexchangerates response:', data);
        
        if (data.rates && data.rates.KRW) {
            console.log('✓ Got rate from openexchangerates.org');
            return {
                rate: data.rates.KRW,
                change: 0,
                changePercent: 0,
                timestamp: new Date().toISOString(),
                source: 'openexchangerates.org'
            };
        }
    } catch (e) {
        console.log('openexchangerates failed:', e);
    }

    try {
        // Fallback: Try fixer.io
        console.log('Trying fixer.io...');
        const response = await fetch('https://api.fixer.io/latest?base=USD&symbols=KRW');
        const data = await response.json();
        console.log('fixer.io response:', data);
        
        if (data.rates && data.rates.KRW) {
            console.log('✓ Got rate from fixer.io');
            return {
                rate: data.rates.KRW,
                change: 0,
                changePercent: 0,
                timestamp: new Date().toISOString(),
                source: 'fixer.io'
            };
        }
    } catch (e) {
        console.log('fixer.io failed:', e);
    }

    // If all APIs fail, use cached value
    console.warn('All APIs failed, using cached exchange rate');
    return {
        rate: 1200.50,
        change: 0,
        changePercent: 0,
        timestamp: new Date().toISOString(),
        source: 'cached'
    };
}

async function getStockPrice(symbol) {
    // Fetch stock price from free APIs
    
    try {
        // Using Finnhub free API (no key required for basic usage)
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=free`);
        const data = await response.json();
        
        if (data.c) {
            return data.c; // Current price
        }
    } catch (e) {
        console.log(`Failed to fetch ${symbol} from Finnhub:`, e);
    }

    return null;
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
