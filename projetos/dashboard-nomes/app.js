const API_BASE = 'https://servicodados.ibge.gov.br/api/v2/censos/nomes';

// Gráficos
let evolutionChart, genderChart, genderBarChart, rankingChart, rankingPieChart;

// Décadas disponíveis (API vai até 2010, sem dados para 2010s)
const DECADES = ['1930', '1940', '1950', '1960', '1970', '1980', '1990', '2000'];
const DECADE_LABELS = ['30s', '40s', '50s', '60s', '70s', '80s', '90s', '2000s'];

// Buscar frequência por nome
async function fetchNameFrequency(name, state, gender) {
    let url = `${API_BASE}/${encodeURIComponent(name)}`;
    const params = [];

    if (state) params.push(`localidade=${state}`);
    if (gender) params.push(`sexo=${gender}`);

    if (params.length) url += '?' + params.join('&');

    const res = await fetch(url);
    return await res.json();
}

// Buscar ranking
async function fetchRanking(decade, state, gender) {
    let url = `${API_BASE}/ranking`;
    const params = [];

    if (decade) params.push(`decada=${decade}`);
    if (state) params.push(`localidade=${state}`);
    if (gender) params.push(`sexo=${gender}`);

    if (params.length) url += '?' + params.join('&');

    const res = await fetch(url);
    return await res.json();
}

// Converter período da API para década
function periodToDecade(period) {
    const match = period.match(/\d{4}/);
    return match ? match[0] : null;
}

// Converter dados da API para formato dos gráficos
function parseNameData(apiData) {
    const result = {
        decades: DECADE_LABELS,
        frequencies: new Array(8).fill(0),
        total: 0,
        peakDecade: '',
        peakValue: 0
    };

    if (apiData && apiData.length > 0) {
        const nameData = apiData[0];

        if (nameData.res) {
            nameData.res.forEach(item => {
                const decade = periodToDecade(item.periodo);
                const index = DECADES.indexOf(decade);
                if (index !== -1) {
                    result.frequencies[index] = item.frequencia;
                    result.total += item.frequencia;

                    if (item.frequencia > result.peakValue) {
                        result.peakValue = item.frequencia;
                        result.peakDecade = DECADE_LABELS[index];
                    }
                }
            });
        }
    }

    return result;
}

// Parse dados por sexo
function parseGenderData(apiData) {
    const result = {
        decades: DECADE_LABELS,
        male: new Array(8).fill(0),
        female: new Array(8).fill(0),
        maleTotal: 0,
        femaleTotal: 0
    };

    if (apiData && apiData.length > 0) {
        apiData.forEach(nameData => {
            const isMale = nameData.sexo === 'M';
            const isFemale = nameData.sexo === 'F';

            if (nameData.res) {
                nameData.res.forEach(item => {
                    const decade = periodToDecade(item.periodo);
                    const index = DECADES.indexOf(decade);
                    if (index !== -1) {
                        if (isMale) {
                            result.male[index] += item.frequencia;
                            result.maleTotal += item.frequencia;
                        } else if (isFemale) {
                            result.female[index] += item.frequencia;
                            result.femaleTotal += item.frequencia;
                        }
                    }
                });
            }
        });
    }

    return result;
}

// Formatar número
function formatNumber(num) {
    return num.toLocaleString('pt-BR');
}

// Gráfico de evolução
function initEvolutionChart(data) {
    const ctx = document.getElementById('evolutionChart').getContext('2d');
    if (evolutionChart) evolutionChart.destroy();

    evolutionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.decades,
            datasets: [{
                label: 'Nascimentos por Década',
                data: data.frequencies,
                borderColor: '#f9a825',
                backgroundColor: 'rgba(249, 168, 37, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#f9a825',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${formatNumber(ctx.raw)} registros`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: '#fff',
                        callback: value => formatNumber(value)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

// Gráfico de pizza (sexo)
function initGenderPieChart(data) {
    const ctx = document.getElementById('genderChart').getContext('2d');
    if (genderChart) genderChart.destroy();

    const total = data.maleTotal + data.femaleTotal;

    genderChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Masculino', 'Feminino'],
            datasets: [{
                data: [data.maleTotal, data.femaleTotal],
                backgroundColor: ['#4fc3f7', '#f48fb1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff', padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const t = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.raw / t) * 100).toFixed(1);
                            return `${ctx.label}: ${formatNumber(ctx.raw)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de barras (sexo)
function initGenderBarChart(data) {
    const ctx = document.getElementById('genderBarChart').getContext('2d');
    if (genderBarChart) genderBarChart.destroy();

    genderBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.decades,
            datasets: [
                {
                    label: 'Masculino',
                    data: data.male,
                    backgroundColor: 'rgba(79, 195, 247, 0.7)',
                    borderColor: '#4fc3f7',
                    borderWidth: 1
                },
                {
                    label: 'Feminino',
                    data: data.female,
                    backgroundColor: 'rgba(244, 143, 177, 0.7)',
                    borderColor: '#f48fb1',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#fff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: '#fff',
                        callback: value => formatNumber(value)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

// Gráfico de ranking (barras horizontais)
function initRankingChart(rankingData) {
    const ctx = document.getElementById('rankingChart').getContext('2d');
    if (rankingChart) rankingChart.destroy();

    // Extrair dados do array de resposta
    const items = rankingData[0]?.res || rankingData;
    const top10 = items.slice(0, 10);
    const names = top10.map(r => r.nome);
    const frequencies = top10.map(r => r.frequencia);

    rankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: names,
            datasets: [{
                label: 'Frequência',
                data: frequencies,
                backgroundColor: [
                    '#f9a825', '#ffb300', '#ffc107', '#ffca28', '#ffd54f',
                    '#ffe082', '#ffecb3', '#fff8e1', '#4fc3f7', '#81d4fa'
                ],
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${formatNumber(ctx.raw)} registros`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: {
                        color: '#fff',
                        callback: value => formatNumber(value)
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

// Gráfico de pizza (ranking)
function initRankingPieChart(rankingData) {
    const ctx = document.getElementById('rankingPieChart').getContext('2d');
    if (rankingPieChart) rankingPieChart.destroy();

    // Extrair dados do array de resposta
    const items = rankingData[0]?.res || rankingData;
    const top5 = items.slice(0, 5);
    const othersFreq = items.slice(5).reduce((sum, r) => sum + r.frequencia, 0);

    const labels = [...top5.map(r => r.nome), 'Outros'];
    const values = [...top5.map(r => r.frequencia), othersFreq];

    rankingPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#f9a825', '#4fc3f7', '#81c784', '#e57373', '#ba68c8', '#78909c'
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
                    labels: { color: '#fff', padding: 10 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => {
                            const t = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = ((ctx.raw / t) * 100).toFixed(1);
                            return `${ctx.label}: ${formatNumber(ctx.raw)} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Atualizar tabela do ranking
function updateRankingTable(rankingData) {
    const tbody = document.getElementById('rankingTableBody');
    const section = document.getElementById('rankingTableSection');
    section.style.display = 'block';

    // Extrair dados do array de resposta
    const items = rankingData[0]?.res || rankingData;

    tbody.innerHTML = items.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${r.nome}</td>
            <td>${formatNumber(r.frequencia)}</td>
        </tr>
    `).join('');
}

// Atualizar métricas
function updateMetrics(data) {
    document.getElementById('metricTotal').textContent = formatNumber(data.total);
    document.getElementById('metricDecade').textContent = data.peakDecade || '-';
    document.getElementById('metricPeak').textContent = formatNumber(data.peakValue);
}

// Buscar e renderizar nome
async function searchName() {
    const name = document.getElementById('nameInput').value.trim();
    const state = document.getElementById('stateSelect').value;
    const gender = document.getElementById('genderSelect').value;

    if (!name) {
        alert('Digite um nome para buscar');
        return;
    }

    try {
        // Buscar dados gerais (todos)
        const allData = await fetchNameFrequency(name, state, '');
        const parsed = parseNameData(allData);
        updateMetrics(parsed);
        initEvolutionChart(parsed);

        // Parse dados por sexo
        const parsedGender = parseGenderData(allData);
        initGenderPieChart(parsedGender);
        initGenderBarChart(parsedGender);
    } catch (err) {
        console.error('Erro ao buscar nome:', err);
        alert('Erro ao buscar dados. Tente novamente.');
    }
}

// Buscar e renderizar ranking
async function searchRanking() {
    const decade = document.getElementById('rankingDecade').value;
    const state = document.getElementById('rankingState').value;
    const gender = document.getElementById('rankingGender').value;

    try {
        const data = await fetchRanking(decade, state, gender);
        initRankingChart(data);
        initRankingPieChart(data);
        updateRankingTable(data);
    } catch (err) {
        console.error('Erro ao buscar ranking:', err);
        alert('Erro ao buscar ranking. Tente novamente.');
    }
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', searchName);
document.getElementById('rankingBtn').addEventListener('click', searchRanking);

// Enter no input
document.getElementById('nameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchName();
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    searchName();
    searchRanking();
});
