/**
 * Sistema avançado de rastreamento de usuários para ThoughtSpot
 * Múltiplas estratégias para capturar informações do usuário
 */

export interface UserInfo {
    userId?: string;
    username?: string;
    email?: string;
    displayName?: string;
    orgId?: string;
    orgName?: string;
    groups?: string[];
    roles?: string[];
    sessionInfo?: {
        sessionId: string;
        loginTime?: string;
        lastActivity?: string;
    };
    browserInfo?: {
        userAgent: string;
        language: string;
        timezone: string;
        screenResolution: string;
    };
    source: 'thoughtspot_context' | 'thoughtspot_model' | 'browser_fingerprint' | 'session_storage' | 'url_params' | 'unknown';
}

/**
 * Estratégias para capturar informações do usuário
 */
export class UserTracker {
    private static instance: UserTracker;
    private cachedUserInfo: UserInfo | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    static getInstance(): UserTracker {
        if (!UserTracker.instance) {
            UserTracker.instance = new UserTracker();
        }
        return UserTracker.instance;
    }

    /**
     * Obtém informações do usuário usando múltiplas estratégias
     */
    async getUserInfo(ctx?: any, chartModel?: any): Promise<UserInfo> {
        // Verificar cache primeiro
        if (this.cachedUserInfo && Date.now() < this.cacheExpiry) {
            return this.cachedUserInfo;
        }

        const userInfo: UserInfo = {
            source: 'unknown',
            browserInfo: this.getBrowserInfo(),
        };

        // Estratégia 1: Contexto do ThoughtSpot SDK
        const tsContextInfo = this.extractFromThoughtSpotContext(ctx);
        if (tsContextInfo.userId) {
            Object.assign(userInfo, tsContextInfo);
            userInfo.source = 'thoughtspot_context';
        }

        // Estratégia 2: Modelo de dados do ThoughtSpot
        if (!userInfo.userId && chartModel) {
            const tsModelInfo = this.extractFromThoughtSpotModel(chartModel);
            if (tsModelInfo.userId) {
                Object.assign(userInfo, tsModelInfo);
                userInfo.source = 'thoughtspot_model';
            }
        }

        // Estratégia 3: Parâmetros da URL
        if (!userInfo.userId) {
            const urlInfo = this.extractFromURL();
            if (urlInfo.userId) {
                Object.assign(userInfo, urlInfo);
                userInfo.source = 'url_params';
            }
        }

        // Estratégia 4: Session Storage
        if (!userInfo.userId) {
            const sessionInfo = this.extractFromSessionStorage();
            if (sessionInfo.userId) {
                Object.assign(userInfo, sessionInfo);
                userInfo.source = 'session_storage';
            }
        }

        // Estratégia 5: Browser Fingerprinting (fallback)
        if (!userInfo.userId) {
            const fingerprintInfo = this.generateBrowserFingerprint();
            Object.assign(userInfo, fingerprintInfo);
            userInfo.source = 'browser_fingerprint';
        }

        // Adicionar informações de sessão
        userInfo.sessionInfo = {
            sessionId: this.generateSessionId(),
            lastActivity: new Date().toISOString(),
        };

        // Cache do resultado
        this.cachedUserInfo = userInfo;
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;

        return userInfo;
    }

    /**
     * Estratégia 1: Extrair do contexto do ThoughtSpot SDK
     */
    private extractFromThoughtSpotContext(ctx: any): Partial<UserInfo> {
        if (!ctx) return {};

        try {
            const info: Partial<UserInfo> = {};

            // Tentar diferentes propriedades do contexto
            const possibleUserPaths = [
                'userId', 'user.id', 'user.userId', 'user.username', 'user.email',
                'userInfo.userId', 'userInfo.username', 'userInfo.email',
                'session.userId', 'session.user.id', 'session.user.username',
                'context.userId', 'context.user.id', 'context.user.username',
                'currentUser.id', 'currentUser.username', 'currentUser.email'
            ];

            for (const path of possibleUserPaths) {
                const value = this.getNestedProperty(ctx, path);
                if (value) {
                    if (path.includes('userId') || path.includes('user.id')) {
                        info.userId = String(value);
                    } else if (path.includes('username')) {
                        info.username = String(value);
                    } else if (path.includes('email')) {
                        info.email = String(value);
                    }
                }
            }

            // Tentar obter informações organizacionais
            const orgPaths = ['orgId', 'organization.id', 'org.id', 'tenant.id'];
            for (const path of orgPaths) {
                const value = this.getNestedProperty(ctx, path);
                if (value) {
                    info.orgId = String(value);
                    break;
                }
            }

            const orgNamePaths = ['orgName', 'organization.name', 'org.name', 'tenant.name'];
            for (const path of orgNamePaths) {
                const value = this.getNestedProperty(ctx, path);
                if (value) {
                    info.orgName = String(value);
                    break;
                }
            }

            return info;
        } catch (error) {
            console.warn('Error extracting user info from ThoughtSpot context:', error);
            return {};
        }
    }

    /**
     * Estratégia 2: Extrair do modelo de dados do ThoughtSpot
     */
    private extractFromThoughtSpotModel(chartModel: any): Partial<UserInfo> {
        if (!chartModel) return {};

        try {
            const info: Partial<UserInfo> = {};

            // Verificar propriedades do modelo
            const modelPaths = [
                'userId', 'user.id', 'user.username', 'user.email',
                'metadata.userId', 'metadata.user.id', 'metadata.user.username',
                'context.userId', 'context.user.id', 'context.user.username'
            ];

            for (const path of modelPaths) {
                const value = this.getNestedProperty(chartModel, path);
                if (value) {
                    if (path.includes('userId') || path.includes('user.id')) {
                        info.userId = String(value);
                    } else if (path.includes('username')) {
                        info.username = String(value);
                    } else if (path.includes('email')) {
                        info.email = String(value);
                    }
                }
            }

            return info;
        } catch (error) {
            console.warn('Error extracting user info from chart model:', error);
            return {};
        }
    }

    /**
     * Estratégia 3: Extrair de parâmetros da URL
     */
    private extractFromURL(): Partial<UserInfo> {
        if (typeof window === 'undefined') return {};

        try {
            const params = new URLSearchParams(window.location.search);
            const info: Partial<UserInfo> = {};

            // Parâmetros comuns de usuário
            const userParams = ['userId', 'user_id', 'username', 'user', 'email'];
            for (const param of userParams) {
                const value = params.get(param);
                if (value) {
                    if (param.includes('userId') || param.includes('user_id')) {
                        info.userId = value;
                    } else if (param.includes('username') || param === 'user') {
                        info.username = value;
                    } else if (param.includes('email')) {
                        info.email = value;
                    }
                }
            }

            // Parâmetros organizacionais
            const orgId = params.get('orgId') || params.get('org_id') || params.get('tenantId');
            if (orgId) info.orgId = orgId;

            const orgName = params.get('orgName') || params.get('org_name') || params.get('tenant');
            if (orgName) info.orgName = orgName;

            return info;
        } catch (error) {
            console.warn('Error extracting user info from URL:', error);
            return {};
        }
    }

    /**
     * Estratégia 4: Extrair do Session Storage
     */
    private extractFromSessionStorage(): Partial<UserInfo> {
        if (typeof window === 'undefined') return {};

        try {
            const info: Partial<UserInfo> = {};

            // Chaves comuns no session storage
            const storageKeys = [
                'userId', 'user_id', 'username', 'user', 'email',
                'thoughtspot_user', 'ts_user', 'current_user'
            ];

            for (const key of storageKeys) {
                const value = sessionStorage.getItem(key) || localStorage.getItem(key);
                if (value) {
                    try {
                        const parsed = JSON.parse(value);
                        if (typeof parsed === 'object' && parsed !== null) {
                            if (parsed.userId) info.userId = String(parsed.userId);
                            if (parsed.username) info.username = String(parsed.username);
                            if (parsed.email) info.email = String(parsed.email);
                            if (parsed.orgId) info.orgId = String(parsed.orgId);
                        } else {
                            if (key.includes('userId') || key.includes('user_id')) {
                                info.userId = String(parsed);
                            } else if (key.includes('username') || key === 'user') {
                                info.username = String(parsed);
                            } else if (key.includes('email')) {
                                info.email = String(parsed);
                            }
                        }
                    } catch {
                        // Se não for JSON, usar como string
                        if (key.includes('userId') || key.includes('user_id')) {
                            info.userId = value;
                        } else if (key.includes('username') || key === 'user') {
                            info.username = value;
                        } else if (key.includes('email')) {
                            info.email = value;
                        }
                    }
                }
            }

            return info;
        } catch (error) {
            console.warn('Error extracting user info from storage:', error);
            return {};
        }
    }

    /**
     * Estratégia 5: Gerar fingerprint do browser (fallback)
     */
    private generateBrowserFingerprint(): Partial<UserInfo> {
        if (typeof window === 'undefined') return {};

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.textBaseline = 'top';
                ctx.font = '14px Arial';
                ctx.fillText('Browser fingerprint', 2, 2);
            }

            const fingerprint = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                canvas.toDataURL()
            ].join('|');

            // Gerar hash simples
            let hash = 0;
            for (let i = 0; i < fingerprint.length; i++) {
                const char = fingerprint.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }

            return {
                userId: `browser_${Math.abs(hash).toString(36)}`,
                username: `anonymous_${Math.abs(hash).toString(36).substring(0, 8)}`,
            };
        } catch (error) {
            console.warn('Error generating browser fingerprint:', error);
            return {
                userId: `fallback_${Date.now()}`,
                username: 'anonymous_user',
            };
        }
    }

    /**
     * Obter informações do browser
     */
    private getBrowserInfo(): UserInfo['browserInfo'] {
        if (typeof window === 'undefined') {
            return {
                userAgent: 'server-side',
                language: 'unknown',
                timezone: 'unknown',
                screenResolution: 'unknown',
            };
        }

        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
        };
    }

    /**
     * Gerar ID de sessão único
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Obter propriedade aninhada de um objeto usando notação de ponto
     */
    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Limpar cache (útil para testes ou mudanças de usuário)
     */
    clearCache(): void {
        this.cachedUserInfo = null;
        this.cacheExpiry = 0;
    }
}

/**
 * Instância singleton para uso direto
 */
export const userTracker = UserTracker.getInstance();