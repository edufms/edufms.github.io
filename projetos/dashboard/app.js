// API pública: CoinGecko (gratuita, sem chave)
const API_BASE = 'https://api.coingecko.com/api/v3';

// Gráficos
let barChart, lineChart, pieChart;

// Buscar preços atuais
async function fetchTopCryptos() {
    const res = await fetch(`${API_BASE}/coins/markets?vs_currency=brl&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`);
    return await res.json();
}

// Buscar histórico de preços (7 dias)
async function fetchPriceHistory(coinId) {
    const res = await fetch(`${API_BASE}/coins/${coinId}/market_chart?vs_currency=brl&days=7`);
    return await res.json();
}

// Buscar dados globais do mercado
async function fetchGlobalData() {
    const res = await fetch(`${API_BASE}/global`);
    const data = await res.json();
    return data.data;
}

// Formatar número em BRL
function formatBRL(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Formatar número grande
function formatLargeNumber(value) {
    if (value >= 1e12) return `R$ ${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `R$ ${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `R$ ${(value / 1e6).toFixed(2)}M`;
    return formatBRL(value);
}

// Formatar variação percentual
function formatPercent(value) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

// Configurações dos gráficos
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#fff' } }
    },
    scales: {
        y: {
            grid: { color: 'rgba(255,255,255,0.1)' },
            ticks: { color: '#fff' }
        },
        x: {
            grid: { display: false },
            ticks: { color: '#fff', maxTicksLimit: 7 }
        }
    }
};

// Inicializar gráfico de barras (preços 24h)
function initBarChart(coins) {
    const ctx = document.getElementById('barChart').getContext('2d');
    if (barChart) barChart.destroy();

    const labels = coins.slice(0, 8).map(c => c.symbol.toUpperCase());
    const prices = coins.slice(0, 8).map(c => c.current_price);
    const colors = coins.slice(0, 8).map(c =>
        c.price_change_percentage_24h >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
    );
    const borderColors = coins.slice(0, 8).map(c =>
        c.price_change_percentage_24h >= 0 ? '#4caf50' : '#f44336'
    );

    barChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Preço (BRL)',
                data: prices,
                backgroundColor: colors,
                borderColor: borderColors,
                borderWidth: 1
            }]
        },
        options: {
            ...chartDefaults,
            plugins: {
                ...chartDefaults.plugins,
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => formatBRL(ctx.raw)
                    }
                }
            }
        }
    });
}

// Inicializar gráfico de linhas (histórico 7 dias)
async function initLineChart(coinId) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    if (lineChart) lineChart.destroy();

    document.getElementById('lineChartLoading').textContent = 'Carregando...';

    try {
        const history = await fetchPriceHistory(coinId);
        const labels = history.prices.map(p => {
            const d = new Date(p[0]);
            return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        });
        const prices = history.prices.map(p => p[1]);

        lineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: `${coinId.toUpperCase()} (7 dias)`,
                    data: prices,
                    borderColor: '#4fc3f7',
                    backgroundColor: 'rgba(79, 195, 247, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2
                }]
            },
            options: {
                ...chartDefaults,
                plugins: {
                    ...chartDefaults.plugins,
                    legend: { display: true, labels: { color: '#fff' } },
                    tooltip: {
                        callbacks: {
                            label: ctx => formatBRL(ctx.raw)
                        }
                    }
                },
                scales: {
                    ...chartDefaults.scales,
                    y: {
                        ...chartDefaults.scales.y,
                        ticks: {
                            ...chartDefaults.scales.y.ticks,
                            callback: value => formatLargeNumber(value)
                        }
                    }
                }
            }
        });

        document.getElementById('lineChartLoading').textContent = '';
    } catch (err) {
        document.getElementById('lineChartLoading').textContent = 'Erro ao carregar dados';
        console.error(err);
    }
}

// Inicializar gráfico de pizza (market share)
function initPieChart(coins) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) pieChart.destroy();

    const top5 = coins.slice(0, 5);
    const othersMarketCap = coins.slice(5).reduce((sum, c) => sum + c.market_cap, 0);

    const labels = [...top5.map(c => c.name), 'Outros'];
    const values = [...top5.map(c => c.market_cap), othersMarketCap];

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#4fc3f7', '#81c784', '#ffb74d',
                    '#e57373', '#ba68c8', '#78909c'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff', padding: 12 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.raw / total) * 100).toFixed(1);
                            return `${ctx.label}: ${formatLargeNumber(ctx.raw)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Atualizar métricas
function updateMetrics(globalData, topCoin) {
    document.getElementById('metricTotal').textContent =
        formatLargeNumber(globalData.total_market_cap.brl);
    document.getElementById('metricAvg').textContent =
        formatLargeNumber(globalData.total_volume.brl);
    document.getElementById('metricChange').textContent =
        formatPercent(globalData.market_cap_change_percentage_24h_usd);

    const changeEl = document.getElementById('metricChange');
    if (globalData.market_cap_change_percentage_24h_usd >= 0) {
        changeEl.classList.add('positive');
        changeEl.classList.remove('negative');
    } else {
        changeEl.classList.add('negative');
        changeEl.classList.remove('positive');
    }
}

// Atualizar tabela de moedas
function updateTable(coins) {
    const tbody = document.getElementById('cryptoTable');
    tbody.innerHTML = coins.slice(0, 10).map(c => {
        const changeClass = c.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        return `
            <tr>
                <td><img src="${c.image}" alt="${c.name}" width="20" style="vertical-align:middle;margin-right:8px;">${c.name}</td>
                <td>${c.symbol.toUpperCase()}</td>
                <td>${formatBRL(c.current_price)}</td>
                <td class="${changeClass}">${formatPercent(c.price_change_percentage_24h)}</td>
                <td>${formatLargeNumber(c.market_cap)}</td>
            </tr>
        `;
    }).join('');
}

// Carregar tudo
async function loadDashboard() {
    document.getElementById('loading').style.display = 'flex';

    try {
        const [coins, globalData] = await Promise.all([
            fetchTopCryptos(),
            fetchGlobalData()
        ]);

        updateMetrics(globalData);
        initBarChart(coins);
        initPieChart(coins);
        updateTable(coins);
        await initLineChart(coins[0].id);

        // Atualizar seletor de moedas
        const select = document.getElementById('coinSelect');
        select.innerHTML = coins.map(c =>
            `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()})</option>`
        ).join('');

        document.getElementById('loading').style.display = 'none';
    } catch (err) {
        document.getElementById('loading').textContent = 'Erro ao carregar dados da API';
        console.error(err);
    }
}

// Event listeners
document.getElementById('coinSelect').addEventListener('change', (e) => {
    initLineChart(e.target.value);
});

// Auto-refresh a cada 60 segundos
setInterval(loadDashboard, 60000);

// Inicialização
document.addEventListener('DOMContentLoaded', loadDashboard);
