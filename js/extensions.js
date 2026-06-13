/**
 * EXTENSIONS.js
 * 
 * Exemplos de extensões e features customizadas para o sistema MeteoMap.
 * Use esses exemplos como base para implementar suas próprias features.
 */

/**
 * EXTENSÃO 1: Comparador de Períodos Temporais
 * 
 * Permite comparar dados de múltiplos períodos lado a lado
 */
class TimeComparisonManager {
    constructor(meteoManager) {
        this.meteoManager = meteoManager;
        this.comparisonIndices = [];
        this.comparisonData = {};
    }

    /**
     * Adiciona um período para comparação
     */
    addComparisonPeriod(index) {
        if (!this.comparisonIndices.includes(index)) {
            this.comparisonIndices.push(index);
            this.loadComparisonData(index);
        }
    }

    /**
     * Remove um período da comparação
     */
    removeComparisonPeriod(index) {
        this.comparisonIndices = this.comparisonIndices.filter(i => i !== index);
        delete this.comparisonData[index];
        this.renderComparison();
    }

    /**
     * Carrega dados para um período específico
     */
    loadComparisonData(index) {
        const config = VARIABLES_CONFIG[this.meteoManager.state.type];
        const zoom = this.meteoManager.map.getZoom();
        const domain = this.meteoManager.getDomainFromZoom(zoom);

        if (!domain) return;

        const id_num = String(index).padStart(3, '0');
        const filePath = `JSON/${domain}_${config.id}_${id_num}.json`;

        fetch(filePath)
            .then(res => res.json())
            .then(data => {
                this.comparisonData[index] = data;
                this.renderComparison();
            })
            .catch(err => console.error('Erro ao carregar comparação:', err));
    }

    /**
     * Renderiza a visualização de comparação
     */
    renderComparison() {
        if (this.comparisonIndices.length === 0) return;

        const html = `
            <div class="comparison-panel">
                <h4>Comparação de Períodos</h4>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Valor</th>
                            <th>Mudança</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.comparisonIndices.map((idx, i) => {
                            const data = this.comparisonData[idx];
                            const value = data?.values[0] || 'N/A';
                            const prevValue = i > 0 ? this.comparisonData[this.comparisonIndices[i-1]]?.values[0] : null;
                            const change = prevValue ? ((value - prevValue) / prevValue * 100).toFixed(1) + '%' : '-';
                            
                            return `
                                <tr>
                                    <td>${this.meteoManager.calculateDateTimeFromIndex(idx)}</td>
                                    <td>${typeof value === 'number' ? value.toFixed(2) : value}</td>
                                    <td>${change}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Adicionar à sidebar
        const sidebarContent = document.getElementById('sidebarContent');
        if (sidebarContent) {
            const existing = sidebarContent.querySelector('.comparison-panel');
            if (existing) {
                existing.outerHTML = html;
            } else {
                sidebarContent.insertAdjacentHTML('beforeend', html);
            }
        }
    }
}

/**
 * EXTENSÃO 2: Analisador de Grid com Múltiplas Seleções
 * 
 * Permite selecionar múltiplas células e calcular estatísticas
 */
class GridAnalyzer {
    constructor(meteoManager) {
        this.meteoManager = meteoManager;
        this.selectedCells = [];
        this.isMultiSelectMode = false;
    }

    /**
     * Ativa o modo de seleção múltipla
     */
    enableMultiSelect() {
        this.isMultiSelectMode = true;
        this.meteoManager.map.style.cursor = 'crosshair';
        document.body.style.userSelect = 'none';
    }

    /**
     * Desativa o modo de seleção múltipla
     */
    disableMultiSelect() {
        this.isMultiSelectMode = false;
        this.meteoManager.map.style.cursor = 'grab';
        document.body.style.userSelect = 'auto';
    }

    /**
     * Adiciona uma célula à seleção
     */
    addCell(lat, lng, value) {
        this.selectedCells.push({
            lat: lat,
            lng: lng,
            value: value,
            datetime: this.meteoManager.calculateDateTimeFromIndex(
                this.meteoManager.state.index
            )
        });

        // Destacar célula no mapa
        this.highlightCell(lat, lng);
    }

    /**
     * Remove uma célula da seleção
     */
    removeCell(lat, lng) {
        this.selectedCells = this.selectedCells.filter(cell => 
            !(Math.abs(cell.lat - lat) < 0.001 && Math.abs(cell.lng - lng) < 0.001)
        );
    }

    /**
     * Calcula estatísticas das células selecionadas
     */
    calculateStatistics() {
        const values = this.selectedCells.map(c => c.value);
        
        if (values.length === 0) return null;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return {
            count: values.length,
            mean: mean,
            min: Math.min(...values),
            max: Math.max(...values),
            stdDev: stdDev,
            sum: values.reduce((a, b) => a + b, 0),
            range: Math.max(...values) - Math.min(...values)
        };
    }

    /**
     * Exporta dados das células selecionadas
     */
    exportAsCSV() {
        const config = VARIABLES_CONFIG[this.meteoManager.state.type];
        let csv = 'Latitude,Longitude,Valor,Unidade,Data/Hora\n';

        this.selectedCells.forEach(cell => {
            csv += `${cell.lat.toFixed(4)},${cell.lng.toFixed(4)},${cell.value.toFixed(2)},${config.unit},${cell.datetime}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analise_grid_${Date.now()}.csv`;
        a.click();
    }

    /**
     * Renderiza análise de grid
     */
    showAnalysis() {
        const stats = this.calculateStatistics();
        if (!stats) return;

        const config = VARIABLES_CONFIG[this.meteoManager.state.type];
        const html = `
            <div class="grid-analysis-panel">
                <h4>Análise de Grid</h4>
                <p>Células Selecionadas: ${stats.count}</p>
                <div class="stats-container">
                    <div class="stat-item">
                        <span class="stat-label">Média</span>
                        <span class="stat-value">${stats.mean.toFixed(2)} ${config.unit}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Mínimo</span>
                        <span class="stat-value">${stats.min.toFixed(2)} ${config.unit}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Máximo</span>
                        <span class="stat-value">${stats.max.toFixed(2)} ${config.unit}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Desvio Padrão</span>
                        <span class="stat-value">${stats.stdDev.toFixed(2)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Amplitude</span>
                        <span class="stat-value">${stats.range.toFixed(2)}</span>
                    </div>
                </div>
                <button class="control-btn" onclick="gridAnalyzer.exportAsCSV()">
                    <i class="fas fa-download"></i> Exportar CSV
                </button>
            </div>
        `;

        const sidebarContent = document.getElementById('sidebarContent');
        if (sidebarContent) {
            sidebarContent.insertAdjacentHTML('beforeend', html);
        }
    }

    highlightCell(lat, lng) {
        // Implementar highlight visual no mapa
    }
}

/**
 * EXTENSÃO 3: Gerador de Relatórios
 * 
 * Cria relatórios formatados com análises dos dados
 */
class ReportGenerator {
    constructor(meteoManager) {
        this.meteoManager = meteoManager;
    }

    /**
     * Gera relatório HTML
     */
    generateHTMLReport(title, data) {
        const config = VARIABLES_CONFIG[this.meteoManager.state.type];
        const date = new Date();

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; border-bottom: 2px solid #667eea; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background-color: #667eea; color: white; }
                    .metadata { background: #f5f5f5; padding: 10px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="metadata">
                    <p><strong>Gerado em:</strong> ${date.toLocaleString('pt-BR')}</p>
                    <p><strong>Variável:</strong> ${config.label}</p>
                    <p><strong>Unidade:</strong> ${config.unit}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Métrica</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(data).map(([key, value]) => 
                            `<tr><td>${key}</td><td>${value}</td></tr>`
                        ).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        return html;
    }

    /**
     * Exporta relatório como PDF
     */
    exportAsPDF(title, data) {
        // Nota: Requer biblioteca como jsPDF
        console.log('Implementar exportação em PDF com jsPDF');
    }

    /**
     * Exporta relatório como Excel
     */
    exportAsExcel(title, data) {
        // Nota: Requer biblioteca como SheetJS
        console.log('Implementar exportação em Excel com SheetJS');
    }
}

/**
 * EXTENSÃO 4: Sistema de Alertas
 * 
 * Define e monitora limiares para valores meteorológicos
 */
class AlertSystem {
    constructor(meteoManager) {
        this.meteoManager = meteoManager;
        this.thresholds = {};
        this.alerts = [];
    }

    /**
     * Define um alerta para uma variável
     */
    setAlert(variable, threshold, condition = 'above') {
        this.thresholds[variable] = {
            threshold: threshold,
            condition: condition // 'above' ou 'below'
        };
    }

    /**
     * Verifica se um valor dispara algum alerta
     */
    checkAlerts(variable, value) {
        const config = this.thresholds[variable];
        if (!config) return false;

        const triggered = config.condition === 'above' 
            ? value > config.threshold
            : value < config.threshold;

        if (triggered) {
            this.createAlert(variable, value, config);
        }

        return triggered;
    }

    /**
     * Cria um alerta visual
     */
    createAlert(variable, value, config) {
        const alert = {
            variable: variable,
            value: value,
            timestamp: new Date(),
            message: `Alerta: ${variable} = ${value} (limite: ${config.threshold})`
        };

        this.alerts.push(alert);
        this.displayAlert(alert);
    }

    /**
     * Exibe alerta na tela
     */
    displayAlert(alert) {
        const notification = document.createElement('div');
        notification.className = 'alert-notification';
        notification.textContent = alert.message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 2000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

/**
 * EXTENSÃO 5: Cache inteligente de dados
 * 
 * Armazena dados em localStorage para melhor performance
 */
class DataCache {
    constructor(meteoManager, maxSize = 50) {
        this.meteoManager = meteoManager;
        this.maxSize = maxSize;
        this.cache = {};
        this.loadFromStorage();
    }

    /**
     * Obtém dados do cache ou carrega se não existir
     */
    async get(domain, variable, index) {
        const key = `${domain}_${variable}_${index}`;
        
        if (this.cache[key]) {
            return this.cache[key];
        }

        return this.load(key, domain, variable, index);
    }

    /**
     * Carrega dados e adiciona ao cache
     */
    async load(key, domain, variable, index) {
        const id_num = String(index).padStart(3, '0');
        const filePath = `JSON/${domain}_${variable}_${id_num}.json`;

        try {
            const response = await fetch(filePath);
            const data = await response.json();
            
            this.set(key, data);
            return data;
        } catch (err) {
            console.error('Erro ao carregar:', err);
            return null;
        }
    }

    /**
     * Adiciona item ao cache
     */
    set(key, value) {
        // Limpar itens antigos se cache está cheio
        if (Object.keys(this.cache).length >= this.maxSize) {
            const firstKey = Object.keys(this.cache)[0];
            delete this.cache[firstKey];
        }

        this.cache[key] = value;
        this.saveToStorage();
    }

    /**
     * Salva cache no localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('meteomap_cache', JSON.stringify(this.cache));
        } catch (err) {
            console.warn('Erro ao salvar cache:', err);
        }
    }

    /**
     * Carrega cache do localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('meteomap_cache');
            if (stored) {
                this.cache = JSON.parse(stored);
            }
        } catch (err) {
            console.warn('Erro ao carregar cache:', err);
        }
    }

    /**
     * Limpa o cache
     */
    clear() {
        this.cache = {};
        localStorage.removeItem('meteomap_cache');
    }
}

/**
 * EXTENSÃO 6: Exportador de Dados Múltiplos Formatos
 * 
 * Exporta dados em diferentes formatos
 */
class DataExporter {
    constructor(meteoManager) {
        this.meteoManager = meteoManager;
    }

    /**
     * Exporta como GeoJSON
     */
    exportAsGeoJSON(cells) {
        const features = cells.map(cell => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [cell.lng, cell.lat]
            },
            properties: {
                value: cell.value,
                datetime: cell.datetime
            }
        }));

        const geojson = {
            type: 'FeatureCollection',
            features: features
        };

        this.downloadFile(
            JSON.stringify(geojson, null, 2),
            'application/json',
            `export_${Date.now()}.geojson`
        );
    }

    /**
     * Exporta como CSV
     */
    exportAsCSV(cells, filename = null) {
        const config = VARIABLES_CONFIG[this.meteoManager.state.type];
        let csv = 'Latitude,Longitude,Valor,Unidade,Data/Hora\n';

        cells.forEach(cell => {
            csv += `${cell.lat},${cell.lng},${cell.value},${config.unit},${cell.datetime}\n`;
        });

        this.downloadFile(
            csv,
            'text/csv',
            filename || `export_${Date.now()}.csv`
        );
    }

    /**
     * Exporta como JSON
     */
    exportAsJSON(cells, filename = null) {
        const data = {
            exported: new Date().toISOString(),
            variable: VARIABLES_CONFIG[this.meteoManager.state.type].label,
            cells: cells
        };

        this.downloadFile(
            JSON.stringify(data, null, 2),
            'application/json',
            filename || `export_${Date.now()}.json`
        );
    }

    /**
     * Utilitário para download de arquivo
     */
    downloadFile(content, mimeType, filename) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }
}

// Exportar para uso modular
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TimeComparisonManager,
        GridAnalyzer,
        ReportGenerator,
        AlertSystem,
        DataCache,
        DataExporter
    };
}
