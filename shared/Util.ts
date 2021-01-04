export class Log {
  static error(...args: any[]) {
    const time = new Date();
    console.trace('[' + time.toISOString() + ']', ...args);
  }

  static info(...args: any[]) {
    const time = new Date();
    console.info("[" + time.toISOString() + "]", ...args);
  }

  static debug(...args: any[]) {
    const time = new Date();
    console.debug("[" + time.toISOString() + "]", ...args);
  }

  static warn(...args: any[]) {
    const time = new Date();
    console.warn("[" + time.toISOString() + "]", ...args);
  }
}

export function tryCatch<A1, A2, A3, A4, A5>(
  callback: (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => void
): (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => void {
  return (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => {
    try {
      callback(a1, a2, a3, a4, a5);
    } catch(e) {
      Log.error(e);
    }
  }
}
