/**
 * Utilitários para tooltips do Boxplot Chart
 */

import type { BoxplotStatistics } from '@shared/utils/statistical';
import { formatValue } from '@shared/utils/formatters';

/**
 * Escapa caracteres especiais para uso em SVG title
 */
function escapeXml(text: string): string {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Gera o conteúdo do tooltip em formato texto simples (para elementos SVG <title>)
 */
export function generateTooltipText(
    categoryName: string,
    stats: BoxplotStatistics,
    count: number
): string {
    const parts: string[] = [];
    parts.push(escapeXml(categoryName));
    parts.push(`Max: ${formatValue(stats.max, 'decimal', 2)}`);
    parts.push(`Q3: ${formatValue(stats.q3, 'decimal', 2)}`);
    parts.push(`Mediana: ${formatValue(stats.q2, 'decimal', 2)}`);
    if (stats.mean !== undefined) {
        parts.push(`Média: ${formatValue(stats.mean, 'decimal', 2)}`);
    }
    parts.push(`Q1: ${formatValue(stats.q1, 'decimal', 2)}`);
    parts.push(`Min: ${formatValue(stats.min, 'decimal', 2)}`);
    parts.push(`n=${count}`);
    
    return parts.join('\n');
}

/**
 * Gera o HTML completo do tooltip com tabela formatada
 */
export function generateTooltipHtml(
    categoryName: string,
    stats: BoxplotStatistics,
    count: number
): string {
    const rows: string[] = [];
    
    rows.push(`<tr><td><strong>Max</strong></td><td>${formatValue(stats.max, 'decimal', 2)}</td></tr>`);
    rows.push(`<tr><td><strong>Q3</strong></td><td>${formatValue(stats.q3, 'decimal', 2)}</td></tr>`);
    rows.push(`<tr><td><strong>Mediana</strong></td><td>${formatValue(stats.q2, 'decimal', 2)}</td></tr>`);
    if (stats.mean !== undefined) {
        rows.push(`<tr><td><strong>Média</strong></td><td>${formatValue(stats.mean, 'decimal', 2)}</td></tr>`);
    }
    rows.push(`<tr><td><strong>Q1</strong></td><td>${formatValue(stats.q1, 'decimal', 2)}</td></tr>`);
    rows.push(`<tr><td><strong>Min</strong></td><td>${formatValue(stats.min, 'decimal', 2)}</td></tr>`);
    
    return `
        <div style="padding: 8px; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; min-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">
                ${categoryName}
            </div>
            <table style="width: 100%; border-collapse: collapse;">
                ${rows.join('')}
            </table>
            <div style="margin-top: 8px; padding-top: 4px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
                n = ${count}
            </div>
        </div>
    `.trim();
}

/**
 * Gera atributo title para elementos SVG (tooltip nativo do navegador)
 */
export function generateSvgTitle(
    categoryName: string,
    stats: BoxplotStatistics,
    count: number
): string {
    const text = generateTooltipText(categoryName, stats, count);
    return `<title>${text}</title>`;
}
