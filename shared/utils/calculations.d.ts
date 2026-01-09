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
export declare function valueToY(value: number, minValue: number, maxValue: number, measureRowTop: number, measureRowHeight: number): number;
/**
 * Calcula a posição Y do topo de uma linha de medida
 * @param measureIdx Índice da medida (0-based)
 * @param topMargin Margem superior
 * @param measureRowHeight Altura da linha de medida
 * @param spacingBetweenMeasures Espaçamento entre linhas de medidas
 * @returns Coordenada Y do topo da linha
 */
export declare function calculateMeasureRowTop(measureIdx: number, topMargin: number, measureRowHeight: number, spacingBetweenMeasures: number): number;
/**
 * Calcula a posição Y do topo da última linha de medida
 * @param measureCount Número de medidas
 * @param topMargin Margem superior
 * @param measureRowHeight Altura da linha de medida
 * @param spacingBetweenMeasures Espaçamento entre linhas de medidas
 * @returns Coordenada Y do topo da última linha
 */
export declare function calculateLastMeasureRowTop(measureCount: number, topMargin: number, measureRowHeight: number, spacingBetweenMeasures: number): number;
/**
 * Calcula a posição X de uma barra
 * @param barIdx Índice da barra (0-based)
 * @param leftMargin Margem esquerda
 * @param barWidth Largura da barra
 * @param barSpacing Espaçamento entre barras
 * @returns Coordenada X da barra
 */
export declare function calculateBarX(barIdx: number, leftMargin: number, barWidth: number, barSpacing: number): number;
/**
 * Calcula a posição X do centro de uma barra (para labels)
 * @param barIdx Índice da barra (0-based)
 * @param leftMargin Margem esquerda
 * @param barWidth Largura da barra
 * @param barSpacing Espaçamento entre barras
 * @returns Coordenada X do centro da barra
 */
export declare function calculateBarCenterX(barIdx: number, leftMargin: number, barWidth: number, barSpacing: number): number;
