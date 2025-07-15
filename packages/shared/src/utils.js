"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.isValidAgentStatus = isValidAgentStatus;
exports.isValidLogLevel = isValidLogLevel;
exports.createLogEntry = createLogEntry;
exports.sanitizeContext = sanitizeContext;
exports.getAgentHierarchy = getAgentHierarchy;
exports.formatDuration = formatDuration;
exports.calculateUptime = calculateUptime;
exports.getStatusColor = getStatusColor;
exports.getLogLevelColor = getLogLevelColor;
exports.debounce = debounce;
exports.throttle = throttle;
exports.retry = retry;
/**
 * Utility functions for Claude Agent Manager
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function isValidAgentStatus(status) {
    return ['idle', 'active', 'error', 'handoff', 'complete'].includes(status);
}
function isValidLogLevel(level) {
    return ['info', 'warn', 'error', 'debug'].includes(level);
}
function createLogEntry(level, message, metadata) {
    return {
        id: generateId(),
        timestamp: new Date(),
        level,
        message,
        metadata,
    };
}
function sanitizeContext(context) {
    const sanitized = {};
    for (const [key, value] of Object.entries(context)) {
        // Remove sensitive keys
        if (key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret')) {
            continue;
        }
        // Limit string length
        if (typeof value === 'string' && value.length > 10000) {
            sanitized[key] = value.substring(0, 10000) + '... (truncated)';
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
function getAgentHierarchy(agents) {
    const hierarchy = new Map();
    for (const agent of agents) {
        const parentId = agent.parentId || 'root';
        if (!hierarchy.has(parentId)) {
            hierarchy.set(parentId, []);
        }
        hierarchy.get(parentId).push(agent);
    }
    return hierarchy;
}
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0)
        return `${days}d ${hours % 24}h`;
    if (hours > 0)
        return `${hours}h ${minutes % 60}m`;
    if (minutes > 0)
        return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}
function calculateUptime(agent) {
    return Date.now() - agent.created.getTime();
}
function getStatusColor(status) {
    switch (status) {
        case 'idle': return '#6B7280'; // gray
        case 'active': return '#10B981'; // green
        case 'error': return '#EF4444'; // red
        case 'handoff': return '#F59E0B'; // yellow
        case 'complete': return '#8B5CF6'; // purple
        default: return '#6B7280';
    }
}
function getLogLevelColor(level) {
    switch (level) {
        case 'info': return '#3B82F6'; // blue
        case 'warn': return '#F59E0B'; // yellow
        case 'error': return '#EF4444'; // red
        case 'debug': return '#6B7280'; // gray
        default: return '#6B7280';
    }
}
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
function retry(fn, maxAttempts, delay = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const attempt = async () => {
            try {
                const result = await fn();
                resolve(result);
            }
            catch (error) {
                attempts++;
                if (attempts >= maxAttempts) {
                    reject(error);
                }
                else {
                    setTimeout(attempt, delay * attempts);
                }
            }
        };
        attempt();
    });
}
