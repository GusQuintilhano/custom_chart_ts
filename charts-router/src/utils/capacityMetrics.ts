/**
 * Métricas de capacidade do processo e do container (Kubernetes/Docker).
 * Lê process.memoryUsage() e, quando disponível, cgroup (memória do container).
 */

import fs from 'fs';
import path from 'path';

export interface ProcessMemory {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    arrayBuffers: number;
}

export interface ContainerMemory {
    usageBytes: number;
    limitBytes: number | null;
    usagePercent: number | null;
}

export interface CapacityMetrics {
    timestamp: string;
    process: {
        memory: ProcessMemory;
        uptimeSeconds: number;
    };
    container: {
        memory: ContainerMemory | null;
        cgroupVersion: 1 | 2 | null;
    } | null;
}

/**
 * Lê uso de memória do processo (sempre disponível).
 */
export function getProcessMemory(): ProcessMemory {
    const m = process.memoryUsage();
    return {
        heapUsed: m.heapUsed,
        heapTotal: m.heapTotal,
        rss: m.rss,
        external: m.external,
        arrayBuffers: m.arrayBuffers ?? 0,
    };
}

/**
 * Tenta obter o path do cgroup do processo atual.
 * Retorna { version: 2, path } ou { version: 1, path } ou null.
 */
function getCgroupPath(): { version: 1 | 2; path: string } | null {
    try {
        const content = fs.readFileSync('/proc/self/cgroup', 'utf8');
        const lines = content.trim().split('\n');
        for (const line of lines) {
            const parts = line.split(':');
            if (parts.length < 3) continue;
            const controllers = parts[1];
            const cgroupPath = parts[2];
            if (!cgroupPath) continue;
            // cgroup v2: controllers vazios, path é o único
            if (controllers === '') {
                return { version: 2, path: cgroupPath };
            }
            // cgroup v1: memory controller
            if (controllers.split(',').includes('memory')) {
                return { version: 1, path: cgroupPath };
            }
        }
    } catch {
        // Não estamos em Linux ou sem permissão
    }
    return null;
}

/**
 * Lê memória do container via cgroup v2 (memory.current, memory.max).
 */
function readCgroupV2Memory(cgroupPath: string): ContainerMemory | null {
    const base = path.join('/sys/fs/cgroup', cgroupPath);
    try {
        const currentRaw = fs.readFileSync(path.join(base, 'memory.current'), 'utf8').trim();
        const maxRaw = fs.readFileSync(path.join(base, 'memory.max'), 'utf8').trim();
        const usageBytes = parseInt(currentRaw, 10);
        if (Number.isNaN(usageBytes)) return null;
        const limitBytes = maxRaw === 'max' ? null : parseInt(maxRaw, 10);
        if (limitBytes !== null && Number.isNaN(limitBytes)) return null;
        const usagePercent =
            limitBytes != null && limitBytes > 0 ? (usageBytes / limitBytes) * 100 : null;
        return { usageBytes, limitBytes, usagePercent };
    } catch {
        return null;
    }
}

/**
 * Lê memória do container via cgroup v1 (memory.usage_in_bytes, memory.limit_in_bytes).
 */
function readCgroupV1Memory(cgroupPath: string): ContainerMemory | null {
    const base = path.join('/sys/fs/cgroup/memory', cgroupPath);
    try {
        const usageRaw = fs.readFileSync(path.join(base, 'memory.usage_in_bytes'), 'utf8').trim();
        const limitRaw = fs.readFileSync(path.join(base, 'memory.limit_in_bytes'), 'utf8').trim();
        const usageBytes = parseInt(usageRaw, 10);
        if (Number.isNaN(usageBytes)) return null;
        const limitBytes = parseInt(limitRaw, 10);
        if (Number.isNaN(limitBytes) || limitBytes > Number.MAX_SAFE_INTEGER) return null;
        const effectiveLimit = limitBytes > 0 ? limitBytes : null;
        const usagePercent =
            effectiveLimit != null && effectiveLimit > 0
                ? (usageBytes / effectiveLimit) * 100
                : null;
        return {
            usageBytes,
            limitBytes: effectiveLimit,
            usagePercent,
        };
    } catch {
        return null;
    }
}

/**
 * Retorna métricas de capacidade: processo (sempre) e container (quando em cgroup).
 */
export function getCapacityMetrics(): CapacityMetrics {
    const processMemory = getProcessMemory();
    const uptimeSeconds = process.uptime();

    const cgroup = getCgroupPath();
    let container: CapacityMetrics['container'] = null;

    if (cgroup) {
        const memory =
            cgroup.version === 2
                ? readCgroupV2Memory(cgroup.path)
                : readCgroupV1Memory(cgroup.path);
        container = {
            memory: memory ?? {
                usageBytes: 0,
                limitBytes: null,
                usagePercent: null,
            },
            cgroupVersion: cgroup.version,
        };
    }

    return {
        timestamp: new Date().toISOString(),
        process: {
            memory: processMemory,
            uptimeSeconds,
        },
        container,
    };
}
