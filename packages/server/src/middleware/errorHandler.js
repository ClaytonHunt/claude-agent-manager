"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const shared_1 = require("@claude-agent-manager/shared");
const logger_1 = require("../utils/logger");
function errorHandler(error, req, res, next) {
    logger_1.logger.error('Error occurred:', error);
    if (error instanceof shared_1.AgentManagerError) {
        res.status(error.statusCode).json({
            error: true,
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString()
        });
        return;
    }
    // Handle validation errors
    if (error.name === 'ValidationError') {
        res.status(400).json({
            error: true,
            code: 'VALIDATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
        return;
    }
    // Handle JSON parsing errors
    if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({
            error: true,
            code: 'INVALID_JSON',
            message: 'Invalid JSON format',
            timestamp: new Date().toISOString()
        });
        return;
    }
    // Default error response
    res.status(500).json({
        error: true,
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString()
    });
}
