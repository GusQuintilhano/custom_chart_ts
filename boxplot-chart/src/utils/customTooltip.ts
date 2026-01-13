/**
 * Tooltip customizado para Boxplot Chart
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import { formatValue } from '@shared/utils/formatters';
import type { TooltipConfig } from '../types/boxplotTypes';

/**
 * Cria e gerencia tooltips customizados para elementos SVG
 */
export class CustomTooltip {
    private tooltipElement: HTMLElement | null = null;
    public currentTarget: Element | null = null;
    private tooltipFormat: 'simple' | 'detailed' | 'custom' = 'detailed';
    private customTemplate?: string;

    constructor(tooltipConfig?: TooltipConfig) {
        this.tooltipFormat = (tooltipConfig?.format as 'simple' | 'detailed' | 'custom') || 'detailed';
        this.customTemplate = tooltipConfig?.customTemplate;
        this.createTooltipElement();
    }

    /**
     * Cria o elemento de tooltip no DOM
     */
    private createTooltipElement(): void {
        // Remover tooltip existente se houver
        const existing = document.getElementById('boxplot-custom-tooltip');
        if (existing) {
            existing.remove();
        }

        // Criar novo elemento de tooltip
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.id = 'boxplot-custom-tooltip';
        this.tooltipElement.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            padding: 8px 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            pointer-events: none;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s;
            max-width: 250px;
        `;
        document.body.appendChild(this.tooltipElement);
    }

    /**
     * Gera conteúdo do tooltip baseado no formato configurado
     */
    private generateTooltipContent(
        categoryName: string,
        stats: BoxplotStatistics,
        count: number
    ): string {
        if (this.tooltipFormat === 'custom' && this.customTemplate) {
            // Substituir placeholders no template customizado
            return this.customTemplate
                .replace(/\{categoryName\}/g, this.escapeHtml(categoryName))
                .replace(/\{max\}/g, formatValue(stats.max, 'decimal', 2))
                .replace(/\{q3\}/g, formatValue(stats.q3, 'decimal', 2))
                .replace(/\{median\}/g, formatValue(stats.q2, 'decimal', 2))
                .replace(/\{mean\}/g, stats.mean !== undefined ? formatValue(stats.mean, 'decimal', 2) : 'N/A')
                .replace(/\{q1\}/g, formatValue(stats.q1, 'decimal', 2))
                .replace(/\{min\}/g, formatValue(stats.min, 'decimal', 2))
                .replace(/\{count\}/g, String(count));
        }

        if (this.tooltipFormat === 'simple') {
            // Formato simples: apenas categoria, mediana e count
            return `
                <div style="font-weight: 600; margin-bottom: 4px;">${this.escapeHtml(categoryName)}</div>
                <div style="font-size: 11px; color: #6b7280;">Mediana: ${formatValue(stats.q2, 'decimal', 2)}</div>
                <div style="font-size: 11px; color: #6b7280;">n = ${count}</div>
            `;
        }

        // Formato detalhado (padrão)
        const rows: string[] = [];
        rows.push(`<div style="font-weight: 600; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">${this.escapeHtml(categoryName)}</div>`);
        rows.push(`<div style="display: flex; justify-content: space-between; margin: 2px 0;"><span>Max:</span><span>${formatValue(stats.max, 'decimal', 2)}</span></div>`);
        rows.push(`<div style="display: flex; justify-content: space-between; margin: 2px 0;"><span>Q3:</span><span>${formatValue(stats.q3, 'decimal', 2)}</span></div>`);
        rows.push(`<div style="display: flex; justify-content: space-between; margin: 2px 0;"><span>Mediana:</span><span>${formatValue(stats.q2, 'decimal', 2)}</span></div>`);
        if (stats.mean !== undefined) {
            rows.push(`<div style="display: flex; justify-content: space-between; margin: 2px 0;"><span>Média:</span><span>${formatValue(stats.mean, 'decimal', 2)}</span></div>`);
        }
        rows.push(`<div style="display: flex; justify-content: space-between; margin: 2px 0;"><span>Q1:</span><span>${formatValue(stats.q1, 'decimal', 2)}</span></div>`);
        rows.push(`<div style="display: flex; justify-content: space-between; margin: 2px 0;"><span>Min:</span><span>${formatValue(stats.min, 'decimal', 2)}</span></div>`);
        rows.push(`<div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">n = ${count}</div>`);
        
        return rows.join('');
    }

    /**
     * Mostra o tooltip com as informações do boxplot
     */
    show(
        categoryName: string,
        stats: BoxplotStatistics,
        count: number,
        x: number,
        y: number
    ): void {
        if (!this.tooltipElement) return;

        this.tooltipElement.innerHTML = this.generateTooltipContent(categoryName, stats, count);
        this.positionTooltip(x, y);
    }

    /**
     * Mostra tooltip para um ponto individual (outlier ou jitter)
     */
    showPoint(
        pointValue: number,
        dimensionValue: string,
        groupName: string,
        x: number,
        y: number
    ): void {
        if (!this.tooltipElement) return;

        const content = `
            <div style="font-weight: 600; margin-bottom: 4px;">${this.escapeHtml(groupName)}</div>
            <div style="font-size: 11px; color: #6b7280; margin: 2px 0;">Dimensão: ${this.escapeHtml(dimensionValue)}</div>
            <div style="font-size: 11px; color: #6b7280;">Valor: ${formatValue(pointValue, 'decimal', 2)}</div>
        `;

        this.tooltipElement.innerHTML = content;
        this.positionTooltip(x, y);
    }

    /**
     * Posiciona o tooltip baseado nas coordenadas do mouse
     */
    private positionTooltip(x: number, y: number): void {
        if (!this.tooltipElement) return;

        const tooltipWidth = this.tooltipElement.offsetWidth || 250;
        const tooltipHeight = this.tooltipElement.offsetHeight || 200;
        const padding = 10;

        let left = x + padding;
        let top = y - tooltipHeight - padding;

        // Ajustar se sair da direita
        if (left + tooltipWidth > window.innerWidth) {
            left = x - tooltipWidth - padding;
        }

        // Ajustar se sair da esquerda
        if (left < 0) {
            left = padding;
        }

        // Ajustar se sair de cima
        if (top < 0) {
            top = y + padding;
        }

        // Ajustar se sair de baixo
        if (top + tooltipHeight > window.innerHeight) {
            top = window.innerHeight - tooltipHeight - padding;
        }

        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
        this.tooltipElement.style.opacity = '1';
    }

    /**
     * Esconde o tooltip
     */
    hide(): void {
        if (this.tooltipElement) {
            this.tooltipElement.style.opacity = '0';
        }
        this.currentTarget = null;
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Remove o tooltip do DOM
     */
    destroy(): void {
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
    }
}

/**
 * Configura tooltips customizados para grupos do boxplot
 */
export function setupCustomTooltips(
    chartElement: HTMLElement,
    boxplotData: { groups: Array<{ dimensionValue: string; stats: BoxplotStatistics; values: number[] }> },
    tooltipConfig?: TooltipConfig
): void {
    // Aguardar um pouco para garantir que o DOM foi atualizado
    setTimeout(() => {
        const tooltip = new CustomTooltip(tooltipConfig);

        // Encontrar todos os grupos SVG
        const groups = chartElement.querySelectorAll('g[data-group-index]');

        if (groups.length === 0) {
            return;
        }

        groups.forEach((group, index) => {
            const groupData = boxplotData.groups[index];
            if (!groupData) return;

            // Adicionar event listeners para todos os elementos filhos do grupo
            const handleMouseEnter = (e: Event) => {
                const mouseEvent = e as MouseEvent;
                const target = e.target as Element;
                
                // Verificar se o target é um ponto (outlier ou jitter) - se for, não fazer nada
                // Os handlers específicos dos pontos vão tratar (e já fizeram stopPropagation)
                if (target.hasAttribute('data-jitter')) {
                    return;
                }
                
                // Verificar se o target está dentro de um grupo de outlier
                const outlierGroup = target.closest('[data-outlier]');
                if (outlierGroup) {
                    return;
                }
                
                if (tooltip.currentTarget === group) return; // Já está mostrando para este grupo
                
                tooltip.currentTarget = group;
                tooltip.show(
                    groupData.dimensionValue,
                    groupData.stats,
                    groupData.values.length,
                    mouseEvent.clientX,
                    mouseEvent.clientY
                );
            };

            const handleMouseMove = (e: Event) => {
                const mouseEvent = e as MouseEvent;
                const target = e.target as Element;
                
                // Verificar se o target é um ponto (outlier ou jitter) - se for, não fazer nada
                if (target.hasAttribute('data-jitter')) {
                    return;
                }
                
                // Verificar se o target está dentro de um grupo de outlier
                const outlierGroup = target.closest('[data-outlier]');
                if (outlierGroup) {
                    return;
                }
                
                if (tooltip.currentTarget === group) {
                    tooltip.show(
                        groupData.dimensionValue,
                        groupData.stats,
                        groupData.values.length,
                        mouseEvent.clientX,
                        mouseEvent.clientY
                    );
                }
            };

            const handleMouseLeave = () => {
                if (tooltip.currentTarget === group) {
                    tooltip.hide();
                }
            };

            // Adicionar listeners ao grupo e a todos os elementos filhos
            group.addEventListener('mouseenter', handleMouseEnter);
            group.addEventListener('mousemove', handleMouseMove);
            group.addEventListener('mouseleave', handleMouseLeave);

            // Também adicionar aos elementos filhos diretamente (para garantir que funcione)
            const childElements = group.querySelectorAll('rect, path, circle, line');
            childElements.forEach(child => {
                // Pular elementos que são outliers ou jitter (têm handlers próprios)
                // Não adicionar listeners a elementos que estão dentro de grupos com data-outlier ou data-jitter
                if (child.closest('[data-outlier], [data-jitter]')) {
                    return;
                }
                // Não adicionar listeners a elementos que têm data-jitter diretamente
                if (child.hasAttribute('data-jitter')) {
                    return;
                }
                child.addEventListener('mouseenter', handleMouseEnter);
                child.addEventListener('mousemove', handleMouseMove);
                child.addEventListener('mouseleave', handleMouseLeave);
            });
        });

        // Adicionar tooltips para outliers
        const outliers = chartElement.querySelectorAll('[data-outlier="true"]');
        outliers.forEach(outlier => {
            const groupIndex = parseInt(outlier.getAttribute('data-group-index') || '0', 10);
            const pointValue = parseFloat(outlier.getAttribute('data-outlier-value') || '0');
            const groupData = boxplotData.groups[groupIndex];
            
            if (!groupData) return;

            const handleOutlierEnter = (e: Event) => {
                e.stopPropagation(); // Impedir que o evento chegue aos handlers do grupo
                const mouseEvent = e as MouseEvent;
                tooltip.showPoint(
                    pointValue,
                    formatValue(pointValue, 'decimal', 2), // Usar valor formatado como dimensão
                    groupData.dimensionValue,
                    mouseEvent.clientX,
                    mouseEvent.clientY
                );
            };

            const handleOutlierMove = (e: Event) => {
                e.stopPropagation(); // Impedir que o evento chegue aos handlers do grupo
                const mouseEvent = e as MouseEvent;
                tooltip.showPoint(
                    pointValue,
                    formatValue(pointValue, 'decimal', 2),
                    groupData.dimensionValue,
                    mouseEvent.clientX,
                    mouseEvent.clientY
                );
            };

            const handleOutlierLeave = () => {
                tooltip.hide();
            };

            outlier.addEventListener('mouseenter', handleOutlierEnter);
            outlier.addEventListener('mousemove', handleOutlierMove);
            outlier.addEventListener('mouseleave', handleOutlierLeave);
        });

        // Adicionar tooltips para pontos de jitter
        const jitterPoints = chartElement.querySelectorAll('[data-jitter="true"]');
        jitterPoints.forEach(point => {
            const groupIndex = parseInt(point.getAttribute('data-group-index') || '0', 10);
            const pointValue = parseFloat(point.getAttribute('data-point-value') || '0');
            const groupData = boxplotData.groups[groupIndex];
            
            if (!groupData) return;

            const handleJitterEnter = (e: Event) => {
                e.stopPropagation(); // Impedir que o evento chegue aos handlers do grupo
                const mouseEvent = e as MouseEvent;
                tooltip.showPoint(
                    pointValue,
                    formatValue(pointValue, 'decimal', 2), // Usar valor formatado como dimensão
                    groupData.dimensionValue,
                    mouseEvent.clientX,
                    mouseEvent.clientY
                );
            };

            const handleJitterMove = (e: Event) => {
                e.stopPropagation(); // Impedir que o evento chegue aos handlers do grupo
                const mouseEvent = e as MouseEvent;
                tooltip.showPoint(
                    pointValue,
                    formatValue(pointValue, 'decimal', 2),
                    groupData.dimensionValue,
                    mouseEvent.clientX,
                    mouseEvent.clientY
                );
            };

            const handleJitterLeave = () => {
                tooltip.hide();
            };

            point.addEventListener('mouseenter', handleJitterEnter);
            point.addEventListener('mousemove', handleJitterMove);
            point.addEventListener('mouseleave', handleJitterLeave);
        });

        // Limpar tooltip quando sair do chart
        chartElement.addEventListener('mouseleave', () => {
            tooltip.hide();
        });
    }, 0);
}
