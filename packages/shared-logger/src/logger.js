"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLogger = void 0;
const pino_1 = __importDefault(require("pino"));
const uuid_1 = require("uuid");
class AppLogger {
    logger;
    context = {};
    constructor(options) {
        const isDev = options.isDevelopment ?? process.env.NODE_ENV === 'development';
        this.logger = (0, pino_1.default)({
            name: options.name,
            level: options.level || 'info',
            transport: isDev
                ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:standard',
                        ignore: 'pid,hostname',
                    },
                }
                : undefined,
        });
    }
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    getContext() {
        return this.context;
    }
    info(message, data) {
        this.logger.info({ ...this.context, ...data }, message);
    }
    error(message, error, data) {
        const errorData = error instanceof Error ? { error: error.message, stack: error.stack } : error;
        this.logger.error({ ...this.context, ...errorData, ...data }, message);
    }
    warn(message, data) {
        this.logger.warn({ ...this.context, ...data }, message);
    }
    debug(message, data) {
        this.logger.debug({ ...this.context, ...data }, message);
    }
    trace(message, data) {
        this.logger.trace({ ...this.context, ...data }, message);
    }
    fatal(message, error, data) {
        const errorData = error instanceof Error ? { error: error.message, stack: error.stack } : error;
        this.logger.fatal({ ...this.context, ...errorData, ...data }, message);
    }
    generateCorrelationId() {
        return (0, uuid_1.v4)();
    }
    generateRequestId() {
        return (0, uuid_1.v4)();
    }
    generateJobId() {
        return (0, uuid_1.v4)();
    }
}
exports.AppLogger = AppLogger;
