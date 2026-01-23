/**
 * Sistema de armazenamento de analytics
 * Suporta múltiplos backends: arquivo, banco de dados, ou ambos
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { AnalyticsEvent, AnalyticsStorage as IAnalyticsStorage } from '../../../shared/types/analytics';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StorageConfig {
    storageType: 'file' | 'database' | 'file+database';
    logPath?: string;
    dbUrl?: string;
}

/**
 * Implementação de storage baseada em arquivo (JSON Lines)
 * Mantém logs diários: um arquivo por dia (ex: analytics-2024-01-15.jsonl)
 * Remove automaticamente arquivos mais antigos que 30 dias
 */
class FileStorage implements IAnalyticsStorage {
    private baseLogPath: string;
    private currentDate: string | null = null;
    private currentLogPath: string | null = null;

    constructor(baseLogPath: string) {
        this.baseLogPath = baseLogPath;
    }

    /**
     * Obtém o caminho do arquivo de log para o dia atual
     */
    private getCurrentDayLogPath(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;

        // Se mudou o dia, atualiza o caminho
        if (this.currentDate !== dateKey) {
            this.currentDate = dateKey;
            const dir = path.dirname(this.baseLogPath);
            const filename = `analytics-${year}-${month}-${day}.jsonl`;
            this.currentLogPath = path.join(dir, filename);
        }

        return this.currentLogPath!;
    }

    /**
     * Limpa arquivos de log antigos (mantém apenas os últimos 30 dias)
     */
    async cleanupOldLogs(): Promise<void> {
        try {
            const dir = path.dirname(this.baseLogPath);
            const files = await fs.readdir(dir);
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            for (const file of files) {
                // Processa apenas arquivos de analytics no formato correto
                if (!file.startsWith('analytics-') || !file.endsWith('.jsonl')) {
                    continue;
                }

                // Extrai data do nome do arquivo (formato: analytics-YYYY-MM-DD.jsonl)
                const dateMatch = file.match(/analytics-(\d{4})-(\d{2})-(\d{2})\.jsonl/);
                if (!dateMatch) {
                    continue;
                }

                const fileYear = parseInt(dateMatch[1], 10);
                const fileMonth = parseInt(dateMatch[2], 10) - 1; // Month é 0-indexed
                const fileDay = parseInt(dateMatch[3], 10);
                const fileDate = new Date(fileYear, fileMonth, fileDay);

                // Remove arquivos mais antigos que 30 dias
                if (fileDate < thirtyDaysAgo) {
                    const filePath = path.join(dir, file);
                    try {
                        await fs.unlink(filePath);
                        console.log(`Removed old log file (older than 30 days): ${file}`);
                    } catch (err) {
                        console.warn(`Failed to remove old log file ${file}:`, err);
                    }
                }
            }
        } catch (err) {
            // Se o diretório não existe ou não tem permissão, ignora
            console.warn('Failed to cleanup old logs:', err);
        }
    }

    async save(event: AnalyticsEvent): Promise<void> {
        await this.ensureLogDirectory();
        
        const now = new Date();
        const currentDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const previousDate = this.currentDate;
        
        const logPath = this.getCurrentDayLogPath();
        
        // Se mudou o dia, limpa logs antigos (mais de 30 dias)
        if (previousDate !== null && previousDate !== currentDateKey) {
            await this.cleanupOldLogs();
        }
        
        const line = JSON.stringify(event) + '\n';
        await fs.appendFile(logPath, line, 'utf-8');
    }

    async saveBatch(events: AnalyticsEvent[]): Promise<void> {
        if (events.length === 0) return;
        
        await this.ensureLogDirectory();
        
        const now = new Date();
        const currentDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const previousDate = this.currentDate;
        
        const logPath = this.getCurrentDayLogPath();
        
        // Se mudou o dia, limpa logs antigos (mais de 30 dias)
        if (previousDate !== null && previousDate !== currentDateKey) {
            await this.cleanupOldLogs();
        }
        
        const lines = events.map(event => JSON.stringify(event)).join('\n') + '\n';
        await fs.appendFile(logPath, lines, 'utf-8');
    }

    /**
     * Lê eventos dos arquivos de log dos últimos 30 dias
     * @param options Opções de leitura com filtros avançados
     */
    async readEvents(options?: {
        offset?: number;
        limit?: number;
        type?: AnalyticsEvent['type'];
        chartType?: AnalyticsEvent['chartType'];
        userId?: string;
        org?: string;
        orgId?: string;
        model?: string;
        modelId?: string;
        startDate?: string; // ISO date string
        endDate?: string;   // ISO date string
    }): Promise<AnalyticsEvent[]> {
        try {
            const dir = path.dirname(this.baseLogPath);
            await fs.access(dir);
        } catch {
            // Diretório não existe ainda, retorna array vazio
            return [];
        }

        // Busca todos os arquivos de log dos últimos 30 dias
        const files = await this.getLogFilesFromLast30Days();
        
        let allEvents: AnalyticsEvent[] = [];

        // Lê eventos de todos os arquivos (do mais antigo para o mais recente)
        for (const file of files) {
            const filePath = path.join(path.dirname(this.baseLogPath), file);
            try {
                await fs.access(filePath);
            } catch {
                continue; // Arquivo não existe, pula
            }

            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                try {
                    const event = JSON.parse(line) as AnalyticsEvent;
                    
                    // Aplicar filtros básicos
                    if (options?.type && event.type !== options.type) {
                        continue;
                    }
                    if (options?.chartType && event.chartType !== options.chartType) {
                        continue;
                    }
                    
                    // Aplicar filtros de contexto
                    if (options?.userId && event.userId !== options.userId) {
                        continue;
                    }
                    if (options?.org && event.org !== options.org && event.orgId !== options.org) {
                        continue;
                    }
                    if (options?.orgId && event.orgId !== options.orgId && event.org !== options.orgId) {
                        continue;
                    }
                    if (options?.model && event.model !== options.model && event.modelId !== options.model) {
                        continue;
                    }
                    if (options?.modelId && event.modelId !== options.modelId && event.model !== options.modelId) {
                        continue;
                    }
                    
                    // Aplicar filtros de data
                    if (options?.startDate || options?.endDate) {
                        const eventDate = new Date(event.timestamp);
                        if (options?.startDate && eventDate < new Date(options.startDate)) {
                            continue;
                        }
                        if (options?.endDate && eventDate > new Date(options.endDate)) {
                            continue;
                        }
                    }

                    allEvents.push(event);
                } catch (err) {
                    // Ignora linhas inválidas
                    console.warn('Failed to parse analytics event line:', err);
                }
            }
        }

        // Aplica paginação após coletar todos os eventos
        const startIndex = options?.offset || 0;
        const endIndex = options?.limit ? startIndex + options.limit : allEvents.length;
        
        return allEvents.slice(startIndex, endIndex);
    }

    /**
     * Retorna lista de arquivos de log dos últimos 30 dias
     */
    private async getLogFilesFromLast30Days(): Promise<string[]> {
        try {
            const dir = path.dirname(this.baseLogPath);
            const files = await fs.readdir(dir);
            const now = new Date();
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const validFiles: string[] = [];

            for (const file of files) {
                if (!file.startsWith('analytics-') || !file.endsWith('.jsonl')) {
                    continue;
                }

                // Extrai data do nome do arquivo
                const dateMatch = file.match(/analytics-(\d{4})-(\d{2})-(\d{2})\.jsonl/);
                if (!dateMatch) {
                    continue;
                }

                const fileYear = parseInt(dateMatch[1], 10);
                const fileMonth = parseInt(dateMatch[2], 10) - 1;
                const fileDay = parseInt(dateMatch[3], 10);
                const fileDate = new Date(fileYear, fileMonth, fileDay);

                // Inclui apenas arquivos dos últimos 30 dias
                if (fileDate >= thirtyDaysAgo) {
                    validFiles.push(file);
                }
            }

            // Ordena do mais antigo para o mais recente
            return validFiles.sort();
        } catch (err) {
            console.warn('Failed to get log files:', err);
            return [];
        }
    }

    /**
     * Retorna o número total de eventos dos últimos 30 dias
     */
    async getTotalEvents(): Promise<number> {
        try {
            const dir = path.dirname(this.baseLogPath);
            await fs.access(dir);
        } catch {
            return 0;
        }

        const files = await this.getLogFilesFromLast30Days();
        let total = 0;

        for (const file of files) {
            const filePath = path.join(path.dirname(this.baseLogPath), file);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const lines = content.split('\n').filter(line => line.trim() !== '');
                total += lines.length;
            } catch (err) {
                // Ignora erros de leitura
            }
        }

        return total;
    }

    /**
     * Retorna o caminho do arquivo de log atual
     */
    getCurrentLogPath(): string {
        return this.getCurrentDayLogPath();
    }

    private async ensureLogDirectory(): Promise<void> {
        const dir = path.dirname(this.baseLogPath);
        try {
            await fs.access(dir);
        } catch {
            await fs.mkdir(dir, { recursive: true });
        }
    }
}

/**
 * Implementação de storage para banco de dados (placeholder para futuro)
 */
class DatabaseStorage implements IAnalyticsStorage {
    private dbUrl: string;

    constructor(dbUrl: string) {
        this.dbUrl = dbUrl;
    }

    async save(event: AnalyticsEvent): Promise<void> {
        // TODO: Implementar quando necessário
        // Por enquanto, apenas log para não quebrar
        console.warn('Database storage not yet implemented. Event:', event.type);
    }

    async saveBatch(events: AnalyticsEvent[]): Promise<void> {
        // TODO: Implementar quando necessário
        for (const event of events) {
            await this.save(event);
        }
    }
}

/**
 * Storage composto que escreve em múltiplos backends
 */
class CompositeStorage implements IAnalyticsStorage {
    private storages: IAnalyticsStorage[];

    constructor(storages: IAnalyticsStorage[]) {
        this.storages = storages;
    }

    async save(event: AnalyticsEvent): Promise<void> {
        // Executa em paralelo, mas não falha se um falhar
        const promises = this.storages.map(storage =>
            storage.save(event).catch(err => {
                console.error('Error saving to storage:', err);
            })
        );
        await Promise.allSettled(promises);
    }

    async saveBatch(events: AnalyticsEvent[]): Promise<void> {
        const promises = this.storages.map(storage =>
            storage.saveBatch(events).catch(err => {
                console.error('Error saving batch to storage:', err);
            })
        );
        await Promise.allSettled(promises);
    }
}

/**
 * Factory para criar storage baseado na configuração
 */
export function createAnalyticsStorage(config: StorageConfig): IAnalyticsStorage {
    const storages: IAnalyticsStorage[] = [];

    if (config.storageType === 'file' || config.storageType === 'file+database') {
        const logPath = config.logPath || path.join(__dirname, '../../../logs/analytics.jsonl');
        storages.push(new FileStorage(logPath));
    }

    if (config.storageType === 'database' || config.storageType === 'file+database') {
        if (!config.dbUrl) {
            throw new Error('ANALYTICS_DB_URL is required when using database storage');
        }
        storages.push(new DatabaseStorage(config.dbUrl));
    }

    if (storages.length === 0) {
        throw new Error('No storage backend configured');
    }

    return storages.length === 1 ? storages[0] : new CompositeStorage(storages);
}

/**
 * Storage singleton (inicializado uma vez)
 */
let storageInstance: IAnalyticsStorage | null = null;
let fileStorageInstance: FileStorage | null = null;

export function getAnalyticsStorage(): IAnalyticsStorage {
    if (!storageInstance) {
        const storageType = (process.env.ANALYTICS_STORAGE_TYPE || 'file') as 'file' | 'database' | 'file+database';
        const logPath = process.env.ANALYTICS_LOG_PATH;
        const dbUrl = process.env.ANALYTICS_DB_URL;

        storageInstance = createAnalyticsStorage({
            storageType,
            logPath,
            dbUrl,
        });
    }

    return storageInstance;
}

/**
 * Obtém instância do FileStorage para leitura de eventos
 */
export function getFileStorage(): FileStorage {
    if (!fileStorageInstance) {
        const logPath = process.env.ANALYTICS_LOG_PATH || path.join(__dirname, '../../../logs/analytics.jsonl');
        fileStorageInstance = new FileStorage(logPath);
    }
    return fileStorageInstance;
}

