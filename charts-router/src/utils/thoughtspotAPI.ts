/**
 * Utilitários para integração com APIs do ThoughtSpot
 * Para obter informações de usuário e contexto
 */

interface ThoughtSpotUserInfo {
    userId: string;
    userName: string;
    email?: string;
    displayName?: string;
    orgId?: string;
    orgName?: string;
    groups?: string[];
}

interface ThoughtSpotSessionInfo {
    user: ThoughtSpotUserInfo;
    sessionId: string;
    orgId: string;
    orgName: string;
}

/**
 * Obtém informações do usuário atual via API do ThoughtSpot
 */
export async function getCurrentUserInfo(req: any): Promise<ThoughtSpotUserInfo | null> {
    try {
        // Tenta diferentes métodos para obter info do usuário

        // Método 1: Via cookies de sessão do ThoughtSpot
        const sessionInfo = await getSessionInfoFromCookies(req);
        if (sessionInfo) {
            return sessionInfo.user;
        }

        // Método 2: Via API REST do ThoughtSpot
        const userFromAPI = await getUserFromThoughtSpotAPI(req);
        if (userFromAPI) {
            return userFromAPI;
        }

        // Método 3: Via headers customizados (se configurado)
        const userFromHeaders = getUserFromHeaders(req);
        if (userFromHeaders) {
            return userFromHeaders;
        }

        return null;
    } catch (error) {
        console.warn('[ThoughtSpot API] Error getting user info:', error);
        return null;
    }
}

/**
 * Obtém informações da sessão via cookies do ThoughtSpot
 */
async function getSessionInfoFromCookies(req: any): Promise<ThoughtSpotSessionInfo | null> {
    try {
        const thoughtspotUrl = process.env.THOUGHTSPOT_URL;
        if (!thoughtspotUrl) {
            return null;
        }

        // Faz request para API de sessão do ThoughtSpot usando os cookies da requisição
        const response = await fetch(`${thoughtspotUrl}/api/rest/2.0/auth/session/info`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-By': 'CustomCharts',
                'Cookie': req.get('Cookie') || '',
            },
        });

        if (response.ok) {
            const sessionData = await response.json();
            return parseSessionResponse(sessionData);
        }

        return null;
    } catch (error) {
        console.warn('[ThoughtSpot API] Error getting session from cookies:', error);
        return null;
    }
}

/**
 * Obtém usuário via API REST do ThoughtSpot
 */
async function getUserFromThoughtSpotAPI(req: any): Promise<ThoughtSpotUserInfo | null> {
    try {
        const thoughtspotUrl = process.env.THOUGHTSPOT_URL;
        if (!thoughtspotUrl) {
            return null;
        }

        // Tenta usar token de autenticação se disponível
        const authHeader = req.get('Authorization');
        if (!authHeader) {
            return null;
        }

        const response = await fetch(`${thoughtspotUrl}/api/rest/2.0/users/current`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': authHeader,
                'X-Requested-By': 'CustomCharts',
            },
        });

        if (response.ok) {
            const userData = await response.json();
            return parseUserResponse(userData);
        }

        return null;
    } catch (error) {
        console.warn('[ThoughtSpot API] Error getting user from API:', error);
        return null;
    }
}

/**
 * Extrai usuário de headers customizados
 */
function getUserFromHeaders(req: any): ThoughtSpotUserInfo | null {
    const userId = req.get('X-TS-User-ID') ||
        req.get('X-User-ID') ||
        req.get('X-ThoughtSpot-User-ID');

    if (!userId) {
        return null;
    }

    return {
        userId,
        userName: req.get('X-TS-User-Name') ||
            req.get('X-User-Name') ||
            req.get('X-Username') ||
            userId,
        email: req.get('X-TS-User-Email') ||
            req.get('X-User-Email'),
        displayName: req.get('X-TS-Display-Name') ||
            req.get('X-Display-Name'),
        orgId: req.get('X-TS-Org-ID') ||
            req.get('X-Org-ID') ||
            req.get('X-Organization-ID'),
        orgName: req.get('X-TS-Org-Name') ||
            req.get('X-Org-Name') ||
            req.get('X-Organization'),
        groups: parseGroupsHeader(req.get('X-TS-Groups') || req.get('X-Groups')),
    };
}

/**
 * Parseia resposta da API de sessão do ThoughtSpot
 */
function parseSessionResponse(sessionData: any): ThoughtSpotSessionInfo | null {
    try {
        if (!sessionData || !sessionData.user) {
            return null;
        }

        const user = sessionData.user;
        return {
            user: {
                userId: user.id || user.userId || user.guid,
                userName: user.name || user.username || user.displayName,
                email: user.email,
                displayName: user.displayName || user.name,
                orgId: sessionData.org?.id || sessionData.orgId,
                orgName: sessionData.org?.name || sessionData.orgName,
                groups: user.groups?.map((g: any) => g.name || g.id) || [],
            },
            sessionId: sessionData.sessionId || sessionData.id,
            orgId: sessionData.org?.id || sessionData.orgId,
            orgName: sessionData.org?.name || sessionData.orgName,
        };
    } catch (error) {
        console.warn('[ThoughtSpot API] Error parsing session response:', error);
        return null;
    }
}

/**
 * Parseia resposta da API de usuário do ThoughtSpot
 */
function parseUserResponse(userData: any): ThoughtSpotUserInfo | null {
    try {
        if (!userData) {
            return null;
        }

        return {
            userId: userData.id || userData.userId || userData.guid,
            userName: userData.name || userData.username || userData.displayName,
            email: userData.email,
            displayName: userData.displayName || userData.name,
            orgId: userData.org?.id || userData.orgId,
            orgName: userData.org?.name || userData.orgName,
            groups: userData.groups?.map((g: any) => g.name || g.id) || [],
        };
    } catch (error) {
        console.warn('[ThoughtSpot API] Error parsing user response:', error);
        return null;
    }
}

/**
 * Parseia header de grupos
 */
function parseGroupsHeader(groupsHeader?: string): string[] | undefined {
    if (!groupsHeader) {
        return undefined;
    }

    try {
        // Suporta tanto JSON quanto lista separada por vírgula
        if (groupsHeader.startsWith('[')) {
            return JSON.parse(groupsHeader);
        } else {
            return groupsHeader.split(',').map(g => g.trim()).filter(Boolean);
        }
    } catch (error) {
        return groupsHeader.split(',').map(g => g.trim()).filter(Boolean);
    }
}

/**
 * Cache simples para informações de usuário (evita múltiplas chamadas)
 */
const userInfoCache = new Map<string, { info: ThoughtSpotUserInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Obtém informações do usuário com cache
 */
export async function getCachedUserInfo(req: any): Promise<ThoughtSpotUserInfo | null> {
    const sessionId = req.get('X-Session-ID') ||
        req.get('Cookie')?.match(/JSESSIONID=([^;]+)/)?.[1] ||
        'unknown';

    // Verifica cache
    const cached = userInfoCache.get(sessionId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.info;
    }

    // Busca nova informação
    const userInfo = await getCurrentUserInfo(req);

    // Salva no cache se encontrou
    if (userInfo) {
        userInfoCache.set(sessionId, {
            info: userInfo,
            timestamp: Date.now(),
        });
    }

    return userInfo;
}

/**
 * Limpa cache expirado periodicamente
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of userInfoCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            userInfoCache.delete(key);
        }
    }
}, CACHE_TTL);