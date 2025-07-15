"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};
function shouldLog(level) {
    return levels[level] >= levels[LOG_LEVEL];
}
function formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formatted = args.length > 0 ? `${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}` : message;
    return `[${timestamp}] [${level.toUpperCase()}] ${formatted}`;
}
exports.logger = {
    info: (message, ...args) => {
        if (shouldLog('info')) {
            console.log(formatMessage('info', message, ...args));
        }
    },
    warn: (message, ...args) => {
        if (shouldLog('warn')) {
            console.warn(formatMessage('warn', message, ...args));
        }
    },
    error: (message, ...args) => {
        if (shouldLog('error')) {
            console.error(formatMessage('error', message, ...args));
        }
    },
    debug: (message, ...args) => {
        if (shouldLog('debug')) {
            console.debug(formatMessage('debug', message, ...args));
        }
    }
};
