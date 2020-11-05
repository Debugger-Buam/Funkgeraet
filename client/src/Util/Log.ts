export class Log {
    static error(...args: any[]) {
        const time = new Date();
        console.error("[" + time.toLocaleTimeString() + "] ", ...args);
    }

    static info(...args: any[]) {
        const time = new Date();
        console.info("[" + time.toLocaleTimeString() + "] ", ...args);
    }

    static warn(...args: any[]) {
        const time = new Date();
        console.warn("[" + time.toLocaleTimeString() + "] ", ...args);
    }
}
