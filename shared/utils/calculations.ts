/**
 * Utilitários para cálculos de posicionamento e dimensões
 */

/**
 * Converte um valor de uma medida em coordenada Y dentro de sua linha
 * SVG: Y aumenta para baixo, então valor máximo fica no topo da linha (menor Y)
 * @param value Valor numérico
 * @param minValue Valor mínimo da medida
 * @param maxValue Valor máximo da medida
 * @param measureRowTop Coordenada Y do topo da linha de medida
 * @param measureRowHeight Altura da linha de medida
 * @returns Coordenada Y do valor no SVG
 */
export function valueToY(
    value: number,
    minValue: number,
    maxValue: number,
    measureRowTop: number,
    measureRowHeight: number
): number {
    if (maxValue === minValue) {
        return measureRowTop + measureRowHeight / 2;
    }
    const ratio = (value - minValue) / (maxValue - minValue);
    // Valores maiores no topo da linha (menor coordenada Y), menores no fundo (maior coordenada Y)
    return measureRowTop + (1 - ratio) * measureRowHeight;
}

/**
 * Calcula a posição Y do topo de uma linha de medida
 * @param measureIdx Índice da medida (0-based)
 * @param topMargin Margem superior
 * @param measureRowHeight Altura da linha de medida
 * @param spacingBetweenMeasures Espaçamento entre linhas de medidas
 * @returns Coordenada Y do topo da linha
 */
export function calculateMeasureRowTop(
    measureIdx: number,
    topMargin: number,
    measureRowHeight: number,
    spacingBetweenMeasures: number
): number {
    return topMargin + measureIdx * (measureRowHeight + spacingBetweenMeasures);
}

/**
 * Calcula a posição Y do topo da última linha de medida
 * @param measureCount Número de medidas
 * @param topMargin Margem superior
 * @param measureRowHeight Altura da linha de medida
 * @param spacingBetweenMeasures Espaçamento entre linhas de medidas
 * @returns Coordenada Y do topo da última linha
 */
export function calculateLastMeasureRowTop(
    measureCount: number,
    topMargin: number,
    measureRowHeight: number,
    spacingBetweenMeasures: number
): number {
    if (measureCount === 0) return topMargin;
    return topMargin + (measureCount - 1) * (measureRowHeight + spacingBetweenMeasures);
}

/**
 * Calcula a posição X de uma barra
 * @param barIdx Índice da barra (0-based)
 * @param leftMargin Margem esquerda
 * @param barWidth Largura da barra
 * @param barSpacing Espaçamento entre barras
 * @returns Coordenada X da barra
 */
export function calculateBarX(
    barIdx: number,
    leftMargin: number,
    barWidth: number,
    barSpacing: number
): number {
    return leftMargin + barIdx * (barWidth + barSpacing);
}

/**
 * Calcula a posição X do centro de uma barra (para labels)
 * @param barIdx Índice da barra (0-based)
 * @param leftMargin Margem esquerda
 * @param barWidth Largura da barra
 * @param barSpacing Espaçamento entre barras
 * @returns Coordenada X do centro da barra
 */
export function calculateBarCenterX(
    barIdx: number,
    leftMargin: number,
    barWidth: number,
    barSpacing: number
): number {
    return calculateBarX(barIdx, leftMargin, barWidth, barSpacing) + barWidth / 2;
}

