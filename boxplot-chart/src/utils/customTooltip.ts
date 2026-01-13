/**
 * Tooltip customizado para Boxplot Chart
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import { formatValue } from '@shared/utils/formatters';

/**
 * Cria e gerencia tooltips customizados para elementos SVG
 */
export class CustomTooltip {
    private tooltipElement: HTMLElement | null = null;
    public currentTarget: Element | null = null;

    constructor() {
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

        // Gerar conteúdo do tooltip
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

        this.tooltipElement.innerHTML = rows.join('');

        // Posicionar tooltip (ajustar para não sair da tela)
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
    boxplotData: { groups: Array<{ dimensionValue: string; stats: BoxplotStatistics; values: number[] }> }
): void {
    console.log('[TOOLTIP] setupCustomTooltips chamado, grupos:', boxplotData.groups.length);
    // Aguardar um pouco para garantir que o DOM foi atualizado
    setTimeout(() => {
        console.log('[TOOLTIP] Executando setup após timeout');
        const tooltip = new CustomTooltip();

        // Encontrar todos os grupos SVG
        const groups = chartElement.querySelectorAll('g[data-group-index]');
        console.log('[TOOLTIP] Grupos encontrados:', groups.length, 'de', boxplotData.groups.length);

        if (groups.length === 0) {
            console.warn('[TOOLTIP] Nenhum grupo SVG encontrado com data-group-index');
            return;
        }

        groups.forEach((group, index) => {
            const groupData = boxplotData.groups[index];
            if (!groupData) return;

            // Adicionar event listeners para todos os elementos filhos do grupo
            const handleMouseEnter = (e: Event) => {
                const mouseEvent = e as MouseEvent;
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
                child.addEventListener('mouseenter', handleMouseEnter);
                child.addEventListener('mousemove', handleMouseMove);
                child.addEventListener('mouseleave', handleMouseLeave);
            });
        });

        // Limpar tooltip quando sair do chart
        chartElement.addEventListener('mouseleave', () => {
            tooltip.hide();
        });
    }, 0);
}
