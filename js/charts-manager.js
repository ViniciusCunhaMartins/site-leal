/**
 * CHARTS_MANAGER.js
 * 
 * Gerenciador de gráficos temporais para o mapa interativo
 * Responsável por renderizar gráficos de evolução temporal de variáveis
 * e exportação de dados em CSV
 */

class ChartsManager {
    constructor(app) {
        this.app = app;
        this.charts = new Map(); // Armazenar instâncias de gráficos por tipo
        this.timeSeriesData = {}; // Dados temporais de todas as variáveis
    }

    /**
     * Carrega dados temporais de uma célula selecionada
     * @param {number} lat - Latitude da célula
     * @param {number} lng - Longitude da célula
     * @param {string} domain - Domínio (D01, D02, D03, D04)
     * @returns {Promise<Object>} Dados temporais de todas as variáveis para aquela célula
     */
    async loadTimeSeriesData(lat, lng, domain) {
        console.log(`[CHARTS] Carregando dados temporais para ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        
        try {
            const timeSeriesData = {};

            // Primeiro, encontrar o índice da célula usando os dados do aplicativo
            let cellIndex = await this.findCellIndex(lat, lng, domain);
            
            if (cellIndex === null) {
                console.warn('[CHARTS] Célula não encontrada no domínio');
                return {};
            }

            console.log(`[CHARTS] Índice da célula encontrado: ${cellIndex}`);

            // Carregar dados para todas as variáveis disponíveis
            const variableKeys = Object.keys(VARIABLES_CONFIG);
            
            for (const variableKey of variableKeys) {
                const config = VARIABLES_CONFIG[variableKey];
                
                if (!config || !config.id) continue;

                // Determinar o ID correto (especialmente para eólico com diferentes alturas)
                let variableId = config.id;
                if (variableKey === 'eolico' && this.app.windHeight) {
                    if (this.app.windHeight === 100) variableId = config.id_100m;
                    if (this.app.windHeight === 150) variableId = config.id_150m;
                }

                // Carregar dados do JSON para cada hora
                const hourlyData = [];
                
                for (let hour = 1; hour <= 73; hour++) {
                    try {
                        const jsonData = await this.loadJsonForHour(variableId, domain, hour);
                        
                        if (jsonData && jsonData.values && Array.isArray(jsonData.values)) {
                            // Extrair o valor do índice da célula
                            const cellValue = jsonData.values[cellIndex];
                            
                            if (cellValue !== null && cellValue !== undefined) {
                                hourlyData.push({
                                    hour,
                                    value: cellValue,
                                    timestamp: this.calculateTimestamp(hour)
                                });
                            }
                        }
                    } catch (e) {
                        console.warn(`[CHARTS] Erro ao carregar dados para ${variableKey} na hora ${hour}:`, e);
                    }
                }

                if (hourlyData.length > 0) {
                    timeSeriesData[variableKey] = {
                        config,
                        data: hourlyData
                    };
                    console.log(`[CHARTS] Carregados ${hourlyData.length} pontos para ${variableKey}`);
                }
            }

            this.timeSeriesData = timeSeriesData;
            return timeSeriesData;
        } catch (error) {
            console.error('[CHARTS] Erro ao carregar série temporal:', error);
            return {};
        }
    }

    /**
     * Encontra o índice da célula baseado nas coordenadas
     */
    async findCellIndex(lat, lng, domain) {
        try {
            // Usar o primeiro variável para carregar o geoJSON
            const geoJsonPath = `geoJSON/${domain}_TEMP.geojson`;
            const response = await fetch(geoJsonPath);
            
            if (!response.ok) {
                console.warn(`[CHARTS] GeoJSON não encontrado: ${geoJsonPath}`);
                return null;
            }
            
            const geoJson = await response.json();
            
            // Procurar pela célula mais próxima
            let closestIndex = 0;
            let minDistance = Infinity;
            
            if (geoJson.features) {
                for (let i = 0; i < geoJson.features.length; i++) {
                    const feature = geoJson.features[i];
                    
                    if (feature.geometry && feature.geometry.type === 'Polygon') {
                        // Calcular centróide do polígono
                        const coords = feature.geometry.coordinates[0];
                        const centroid = this.getCentroid(coords);
                        
                        // Calcular distância até o ponto clicado
                        const distance = this.haversineDistance(lat, lng, centroid.lat, centroid.lng);
                        
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = i;
                        }
                    }
                }
            }
            
            return closestIndex;
        } catch (error) {
            console.error('[CHARTS] Erro ao encontrar índice da célula:', error);
            return null;
        }
    }

    /**
     * Calcula o centróide de um polígono
     */
    getCentroid(coords) {
        let lat = 0, lng = 0;
        
        for (let i = 0; i < coords.length - 1; i++) {
            lng += coords[i][0];
            lat += coords[i][1];
        }
        
        return {
            lat: lat / (coords.length - 1),
            lng: lng / (coords.length - 1)
        };
    }

    /**
     * Calcula a distância Haversine entre dois pontos
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Carrega arquivo JSON para uma hora específica
     */
    async loadJsonForHour(variableId, domain, hour) {
        const id_num = String(hour).padStart(3, '0');
        const filepath = `JSON/${domain}_${variableId}_${id_num}.json`;

        try {
            const response = await fetch(filepath);
            if (!response.ok) {
                console.warn(`[CHARTS] Arquivo não encontrado: ${filepath}`);
                return null;
            }
            const data = await response.json();
            return data;
        } catch (e) {
            console.warn(`[CHARTS] Erro ao carregar ${filepath}:`, e);
            return null;
        }
    }

    /**
    /**
     * Calcula timestamp baseado no índice da hora
     */
    calculateTimestamp(hour) {
        // Usar a data inicial do WRF (2024-06-19 00:00:00 UTC)
        const date = new Date('2024-06-19T00:00:00Z');
        
        // Hora acompanha o índice - 1 (hora 1 = 00:00, hora 2 = 01:00, etc)
        date.setHours(hour - 1);
        
        return date.toISOString();
    }

    /**
     * Renderiza gráficos no sidebar para a variável selecionada
     */
    renderChartsForVariable(variableType, selectedCellData) {
        console.log(`[CHARTS] Renderizando gráficos para ${variableType}`);
        
        const sidebarContent = document.getElementById('sidebarContent');
        if (!sidebarContent) {
            console.error('[CHARTS] Elemento sidebarContent não encontrado');
            return;
        }

        // Remover gráficos anteriores
        const existingCharts = sidebarContent.querySelectorAll('.chart-container');
        console.log(`[CHARTS] Removendo ${existingCharts.length} gráficos anteriores`);
        existingCharts.forEach(chart => chart.remove());

        // Para variáveis solar e eólica, mostrar dois gráficos
        if (variableType === 'solar' || variableType === 'eolico') {
            // Gráfico 1: Valor da variável
            this.renderChart(
                variableType,
                'value',
                selectedCellData,
                sidebarContent
            );

            // Gráfico 2: Produção Energética Acumulada Horária
            this.renderChart(
                variableType,
                'energy',
                selectedCellData,
                sidebarContent
            );
        } else {
            // Para outras variáveis, apenas um gráfico
            this.renderChart(
                variableType,
                'value',
                selectedCellData,
                sidebarContent
            );
        }
        
        console.log('[CHARTS] Gráficos renderizados com sucesso');
    }

    /**
     * Renderiza um gráfico específico
     */
    renderChart(variableType, chartType, selectedCellData, container) {
        if (!this.timeSeriesData || !this.timeSeriesData[variableType]) {
            console.warn(`[CHARTS] Dados não disponíveis para ${variableType}`);
            return;
        }

        const config = VARIABLES_CONFIG[variableType];
        const timeData = this.timeSeriesData[variableType].data;

        // Preparar dados para o Chart.js
        let chartData, chartLabel, chartUnit, chartColor;

        if (chartType === 'value') {
            // Gráfico de valor da variável
            chartData = timeData.map(d => d.value);
            chartLabel = config.label;
            chartUnit = config.unit;
            chartColor = config.colors[config.colors.length - 1]; // Usar última cor do gradiente
        } else if (chartType === 'energy') {
            // Gráfico de produção energética acumulada
            // Usar specificInfo para calcular a produção energética
            chartData = timeData.map(d => {
                try {
                    const specificInfo = config.specificInfo(d.value, {});
                    
                    // Procurar especificamente por "Produção Energética Acumulada" nos items
                    if (specificInfo && specificInfo.items) {
                        // Primeira tentativa: procurar por "Produção Energética"
                        let energyItem = specificInfo.items.find(item => 
                            item.label && item.label.includes('Produção Energética')
                        );
                        
                        // Se não encontrou, procurar por "kWh" ou "Wh"
                        if (!energyItem) {
                            energyItem = specificInfo.items.find(item => 
                                item.label && (
                                    item.label.includes('kWh') ||
                                    item.label.includes('Wh')
                                )
                            );
                        }
                        
                        if (energyItem && energyItem.value) {
                            // Remove símbolos do valor se existir
                            const numValue = parseFloat(energyItem.value.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
                            return isNaN(numValue) ? 0 : numValue;
                        }
                    }
                    return 0;
                } catch (e) {
                    console.warn('[CHARTS] Erro ao calcular energia:', e);
                    return 0;
                }
            });
            
            chartLabel = `Produção Energética Acumulada (1h)`;
            chartUnit = variableType === 'solar' ? 'Wh/m²' : 'kWh';
            chartColor = variableType === 'solar' ? '#FDB462' : '#80B1D3';
        }

        // Criar container do gráfico
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.innerHTML = `
            <div class="chart-header">
                <div class="chart-title">
                    <i class="fas fa-${this.getChartIcon(variableType, chartType)}"></i>
                    ${chartLabel}
                </div>
                <div class="chart-buttons">
                    <button class="chart-expand-btn" data-variable="${variableType}" data-chart-type="${chartType}" title="Expandir gráfico">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="chart-export-btn" data-variable="${variableType}" data-chart-type="${chartType}">
                        <i class="fas fa-download"></i> CSV
                    </button>
                </div>
            </div>
            <div class="chart-canvas-wrapper">
                <canvas id="chart-${variableType}-${chartType}"></canvas>
            </div>
        `;

        container.appendChild(chartContainer);

        // Renderizar o gráfico
        const ctx = document.getElementById(`chart-${variableType}-${chartType}`).getContext('2d');
        
        let chartInstance = this.charts.get(`${variableType}-${chartType}`);
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData.map(d => {
                    const date = new Date(d.timestamp);
                    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }),
                datasets: [{
                    label: chartLabel,
                    data: chartData,
                    borderColor: chartColor,
                    backgroundColor: `${chartColor}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: chartColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 12 },
                            color: '#666',
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: chartColor,
                        borderWidth: 1,
                        padding: 10,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y.toFixed(2)} ${chartUnit}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: '#888',
                            font: { size: 11 },
                            callback: (value) => {
                                return `${value.toFixed(1)}`;
                            }
                        },
                        grid: {
                            color: '#f0f0f0',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: chartUnit
                        }
                    },
                    x: {
                        ticks: {
                            color: '#888',
                            font: { size: 11 }
                        },
                        grid: {
                            color: '#f0f0f0',
                            drawBorder: false
                        }
                    }
                }
            }
        });

        this.charts.set(`${variableType}-${chartType}`, chartInstance);

        // Adicionar event listener para exportação
        const exportBtn = chartContainer.querySelector('.chart-export-btn');
        exportBtn.addEventListener('click', () => {
            this.exportChartToCSV(variableType, chartType, selectedCellData, timeData, chartData);
        });

        // Adicionar event listener para expandir
        const expandBtn = chartContainer.querySelector('.chart-expand-btn');
        expandBtn.addEventListener('click', () => {
            this.expandChart(variableType, chartType, chartLabel, timeData, chartData, chartColor, chartUnit);
        });
    }

    /**

    /**
     * Retorna o ícone apropriado para cada tipo de gráfico
     */
    getChartIcon(variableType, chartType) {
        if (chartType === 'energy') {
            return variableType === 'solar' ? 'solar-panel' : 'fan';
        }

        const icons = {
            solar: 'sun',
            eolico: 'wind',
            temperature: 'thermometer',
            pressure: 'cloud',
            humidity: 'droplet',
            rain: 'cloud-rain'
        };

        return icons[variableType] || 'chart-line';
    }

    /**
     * Exporta dados do gráfico para CSV
     */
    exportChartToCSV(variableType, chartType, selectedCellData, timeData, chartData) {
        console.log(`[CHARTS] Exportando CSV para ${variableType}-${chartType}`);

        const config = VARIABLES_CONFIG[variableType];
        
        // Determinar a unidade para o cabeçalho
        let headerUnit = config.unit;
        
        // Se for gráfico de energia, atualizar a unidade
        if (chartType === 'energy') {
            headerUnit = variableType === 'solar' ? 'Wh/m²' : 'kWh';
        }
        
        // Construir CSV com colunas separadas e unidade no cabeçalho
        let csv = `Data,Hora,Latitude,Longitude,Variável,Valor(${headerUnit})\n`;

        timeData.forEach((d, index) => {
            const date = new Date(d.timestamp);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
            });

            let variableName = config.label;
            let value = d.value;

            if (chartType === 'energy') {
                try {
                    const specificInfo = config.specificInfo(d.value, {});
                    
                    if (specificInfo && specificInfo.items) {
                        // Primeira tentativa: procurar por "Produção Energética"
                        let energyItem = specificInfo.items.find(item => 
                            item.label && item.label.includes('Produção Energética')
                        );
                        
                        // Se não encontrou, procurar por "kWh" ou "Wh"
                        if (!energyItem) {
                            energyItem = specificInfo.items.find(item => 
                                item.label && (
                                    item.label.includes('kWh') ||
                                    item.label.includes('Wh')
                                )
                            );
                        }
                        
                        if (energyItem) {
                            // Usar nome específico para energia no CSV
                            variableName = variableType === 'solar' ? 'Geração Solar' : 'Geração Eólica';
                            value = energyItem.value;
                        }
                    }
                } catch (e) {
                    console.warn('[CHARTS] Erro ao calcular energia para CSV:', e);
                }
            }

            // Apenas o valor numérico na célula (converter para número se for string)
            const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) : parseFloat(value);
            const valueFormatted = isNaN(numValue) ? '0.00' : numValue.toFixed(2);
            csv += `${dateStr},${timeStr},${selectedCellData.lat.toFixed(4)},${selectedCellData.lng.toFixed(4)},"${variableName}",${valueFormatted}\n`;
        });

        // Criar blob e download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        const timestamp = new Date().toISOString().slice(0, 10);
        const energySuffix = chartType === 'energy' ? '_energy' : '';
        const filename = `timeseries_${variableType}${energySuffix}_${timestamp}.csv`;

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`[CHARTS] CSV exportado: ${filename}`);
    }

    /**
     * Expande o gráfico em tela cheia (modal overlay)
     */
    expandChart(variableType, chartType, chartLabel, timeData, chartData, chartColor, chartUnit) {
        console.log(`[CHARTS] Expandindo gráfico ${variableType}-${chartType}`);

        // Criar container modal
        const modal = document.createElement('div');
        modal.className = 'chart-modal-overlay';
        modal.id = `chart-modal-${variableType}-${chartType}`;

        modal.innerHTML = `
            <div class="chart-modal-content">
                <div class="chart-modal-header">
                    <h2>${chartLabel}</h2>
                    <button class="chart-modal-close" title="Fechar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="chart-modal-body">
                    <canvas id="chart-expanded-${variableType}-${chartType}"></canvas>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Renderizar gráfico expandido
        const ctx = document.getElementById(`chart-expanded-${variableType}-${chartType}`).getContext('2d');
        
        let expandedChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData.map(d => {
                    const date = new Date(d.timestamp);
                    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }),
                datasets: [{
                    label: chartLabel,
                    data: chartData,
                    borderColor: chartColor,
                    backgroundColor: `${chartColor}20`,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: chartColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: { size: 14 },
                            color: '#666',
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: chartColor,
                        borderWidth: 2,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.y.toFixed(2)} ${chartUnit}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: '#888',
                            font: { size: 13 },
                            callback: (value) => {
                                return `${value.toFixed(1)}`;
                            }
                        },
                        grid: {
                            color: '#f0f0f0',
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: chartUnit,
                            font: { size: 13, weight: 'bold' },
                            color: '#666'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#888',
                            font: { size: 13 }
                        },
                        grid: {
                            color: '#f0f0f0',
                            drawBorder: false
                        }
                    }
                }
            }
        });

        // Fechar modal ao clicar no X ou fora do conteúdo
        const closeBtn = modal.querySelector('.chart-modal-close');
        closeBtn.addEventListener('click', () => {
            expandedChart.destroy();
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                expandedChart.destroy();
                modal.remove();
            }
        });
    }

    /**
     * Recarrega os gráficos com novos parâmetros customizáveis
     */
    reloadChartsWithNewParameters() {
        console.log('[CHARTS] Recarregando gráficos com novos parâmetros');
        
        // Se há dados carregados e um tipo de variável selecionada, recarregar
        if (this.timeSeriesData && this.app && this.app.state && this.app.state.type && this.app.state.selectedCell) {
            this.renderChartsForVariable(this.app.state.type, this.app.state.selectedCell);
        }
    }

    /**
     * Limpa os gráficos
     */
    clearCharts() {
        this.charts.forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts.clear();
        this.timeSeriesData = {};
    }
}
