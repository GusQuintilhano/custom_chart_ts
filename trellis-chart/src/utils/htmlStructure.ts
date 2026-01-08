/**
 * Utilitários para criação da estrutura HTML/SVG do gráfico
 */

export function createChartHtmlStructure(
    fitWidth: boolean,
    fitHeight: boolean,
    chartWidth: number,
    chartHeight: number,
    secondaryXAxisHtml: string,
    secondaryXAxisLabelsHtml: string,
    yAxesHtml: string,
    dividerLinesBetweenMeasuresHtml: string,
    dividerLinesBetweenBarsHtml: string,
    referenceLinesHtml: string,
    allChartElementsHtml: string,
    xAxis: string,
    xAxisLabels: string,
    backgroundColor: string = 'transparent'
): string {
    // Container overflow
    const containerOverflow = fitWidth && fitHeight ? 'overflow: hidden;'
        : fitWidth ? 'overflow-x: hidden; overflow-y: auto;'
        : fitHeight ? 'overflow-x: auto; overflow-y: hidden;'
        : 'overflow: auto;';
    
    // Wrapper style
    const wrapperStyle = fitWidth ? 'width: 100%; height: 100%;'
        : `width: ${chartWidth}px; height: ${fitHeight ? '100%' : `${chartHeight}px`}; flex-shrink: 0;`;
    
    // Container style
    // Quando fitWidth está ativo, garantir que o container ocupe 100% da largura disponível
    // Usar box-sizing: border-box para incluir padding/margin no cálculo
    // Usar margin negativo se necessário para compensar padding do elemento pai
    const containerStyle = fitWidth 
        ? `padding: 0; margin: 0; width: 100%; height: 100%; ${containerOverflow} display: flex; align-items: flex-start; justify-content: flex-start; box-sizing: border-box; position: relative;`
        : `padding: 0; margin: 0; width: 100%; height: 100%; ${containerOverflow} display: flex; align-items: flex-start; justify-content: flex-start;`;
    
    // SVG dimensions
    const svgWidth = fitWidth ? '100%' : `${chartWidth}px`;
    const svgHeight = fitHeight ? '100%' : fitWidth ? `${chartHeight}px` : `${chartHeight}px`;
    // Quando apenas fitWidth está ativo, usar 'xMidYMin slice' para permitir escala na largura
    // Quando apenas fitHeight está ativo, usar 'xMidYMid meet' para permitir escala na altura
    // Quando ambos estão ativos, usar 'xMidYMid meet' para manter proporção
    const preserveAspectRatio = fitWidth && fitHeight ? 'xMidYMid meet' 
        : fitWidth ? 'xMidYMin slice' 
        : fitHeight ? 'xMidYMid meet' 
        : 'none';
    const viewBox = `0 0 ${chartWidth} ${chartHeight}`;

    // Log de dimensões para debug do fitWidth
    console.log('[FitWidth] Criando estrutura HTML:', {
        fitWidth,
        fitHeight,
        chartWidth,
        chartHeight,
        svgWidth,
        svgHeight,
        preserveAspectRatio,
        wrapperStyle,
        containerStyle: containerStyle.substring(0, 100) + '...', // Truncar para não poluir
    });

    return `
        <div style="${containerStyle}">
            <div style="${wrapperStyle}">
                <svg width="${svgWidth}" height="${svgHeight}" viewBox="${viewBox}" style="overflow: visible;" preserveAspectRatio="${preserveAspectRatio}">
                    <rect width="100%" height="100%" fill="${backgroundColor}" />
                    ${secondaryXAxisHtml}
                    ${secondaryXAxisLabelsHtml}
                    ${yAxesHtml}
                    ${dividerLinesBetweenMeasuresHtml}
                    ${dividerLinesBetweenBarsHtml}
                    ${allChartElementsHtml}
                    ${referenceLinesHtml}
                    ${xAxis}
                    ${xAxisLabels}
                </svg>
            </div>
        </div>
    `;
}

