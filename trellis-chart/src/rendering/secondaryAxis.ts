/**
 * Funções de renderização do eixo X secundário (agrupamento hierárquico)
 */

import type { ChartDataPoint } from '../types/chartTypes';
import { groupDataBySecondaryDimension, sortGroupsByStartIndex, type DataGroup } from '../utils/grouping';
import { calculateBarX, calculateBarCenterX } from '../utils/calculations';

/**
 * Renderiza o eixo X secundário (labels agrupadas na parte superior)
 * @param chartData Dados do gráfico
 * @param leftMargin Margem esquerda
 * @param barWidth Largura da barra
 * @param barSpacing Espaçamento entre barras
 * @param measureCols Array de medidas
 * @param topMargin Margem superior
 * @param measureRowHeight Altura da linha de medida
 * @param spacingBetweenMeasures Espaçamento entre linhas de medidas
 * @param labelFontSize Tamanho da fonte dos labels
 * @param dividerLinesColor Cor das linhas divisórias
 * @param showGridLines Se deve mostrar linhas divisórias
 * @param dividerLinesBetweenGroups Se deve mostrar linhas entre grupos
 * @param dateFormat Formato de data (opcional)
 * @returns Objeto com HTML do eixo secundário e das labels
 */
export function renderSecondaryXAxis(
    chartData: ChartDataPoint[],
    leftMargin: number,
    barWidth: number,
    barSpacing: number,
    measureCols: any[],
    topMargin: number,
    measureRowHeight: number,
    spacingBetweenMeasures: number,
    labelFontSize: number,
    dividerLinesColor: string,
    dividerLinesWidth: number,
    showGridLines: boolean,
    dividerLinesBetweenGroups: boolean,
    dateFormat?: string
): { axisHtml: string; labelsHtml: string } {
    const groups = groupDataBySecondaryDimension(chartData, 0, dateFormat);
    const groupEntries = sortGroupsByStartIndex(groups);
    
    const labelY = 15; // Posição fixa no topo do SVG (dentro do topMargin)
    const lastMeasureRowTop = topMargin + (measureCols.length - 1) * (measureRowHeight + spacingBetweenMeasures);
    const dividerLineTop = 0; // Começar do topo para dividir também a área dos nomes das categorias
    const dividerLineBottom = lastMeasureRowTop + measureRowHeight; // Até o fim do gráfico
    
    let axisHtml = '';
    let labelsHtml = '';
    
    groupEntries.forEach((group, groupIdx) => {
        // Calcular posições baseadas nas bordas do grupo (não centro das barras)
        // startX = borda esquerda da primeira barra do grupo
        const startX = calculateBarX(group.startIdx, leftMargin, barWidth, barSpacing);
        // endX = borda direita da última barra do grupo
        const endX = calculateBarX(group.endIdx, leftMargin, barWidth, barSpacing) + barWidth;
        // centerX = centro do grupo (entre as bordas)
        const centerX = (startX + endX) / 2;
        
        // Label centralizada no grupo (estilo cabeçalho de coluna)
        labelsHtml += `
            <text 
                x="${centerX}" 
                y="${labelY}" 
                text-anchor="middle"
                font-size="${labelFontSize}"
                fill="#374151"
                font-weight="600"
            >${group.label}</text>
        `;
        
        // Adicionar linha divisória após cada grupo (exceto o último, se habilitado)
        if (groupIdx < groupEntries.length - 1 && showGridLines && dividerLinesBetweenGroups) {
            const dividerX = endX + barSpacing / 2; // Posição entre o último item deste grupo e o primeiro do próximo
            axisHtml += `
                <line 
                    x1="${dividerX}" 
                    y1="${dividerLineTop}" 
                    x2="${dividerX}" 
                    y2="${dividerLineBottom}" 
                    stroke="${dividerLinesColor}" 
                    stroke-width="${dividerLinesWidth}"
                />
            `;
        }
    });
    
    return { axisHtml, labelsHtml };
}

