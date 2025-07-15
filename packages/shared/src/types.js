"use strict";
/**
 * Core types for Claude Agent Manager
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.NotFoundError = exports.ValidationError = exports.AgentManagerError = void 0;
/**
 * Error types
 */
class AgentManagerError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'AgentManagerError';
    }
}
exports.AgentManagerError = AgentManagerError;
class ValidationError extends AgentManagerError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AgentManagerError {
    constructor(message) {
        super(message, 'NOT_FOUND', 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AgentManagerError {
    constructor(message) {
        super(message, 'CONFLICT', 409);
    }
}
exports.ConflictError = ConflictError;
