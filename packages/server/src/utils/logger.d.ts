type LogMethod = (message: string, ...args: any[]) => void;
interface Logger {
    info: LogMethod;
    warn: LogMethod;
    error: LogMethod;
    debug: LogMethod;
}
export declare const logger: Logger;
export {};
