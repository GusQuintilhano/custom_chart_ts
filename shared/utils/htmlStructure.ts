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
    const containerStyle = `padding: 0; margin: 0; width: 100%; height: 100%; ${containerOverflow} display: flex; align-items: flex-start; justify-content: flex-start;`;
    
    // SVG dimensions
    const svgWidth = fitWidth ? '100%' : `${chartWidth}px`;
    const svgHeight = fitHeight ? '100%' : fitWidth ? `${chartHeight}` : `${chartHeight}px`;
    const preserveAspectRatio = fitWidth && fitHeight ? 'xMidYMid meet' : 'none';
    const viewBox = `0 0 ${chartWidth} ${chartHeight}`;

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

