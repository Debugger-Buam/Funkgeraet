export class Log {
    static error(...args: any[]) {
        const time = new Date();
        console.error("[" + time.toISOString() + "] ", ...args);
    }

    static info(...args: any[]) {
        const time = new Date();
        console.info("[" + time.toISOString() + "] ", ...args);
    }

    static debug(...args: any[]) {
        const time = new Date();
        console.debug("[" + time.toISOString() + "] ", ...args);
    }

    static warn(...args: any[]) {
        const time = new Date();
        console.warn("[" + time.toISOString() + "] ", ...args);
    }
}
