// ✅ src/lib/logger.ts
type Level = "debug" | "info" | "warn" | "error";
const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const CURRENT = process.env.NODE_ENV === "production" ? LEVELS.info : LEVELS.debug;

function fmt(level: Level, msg: any, meta?: Record<string, any>) {
  const time = new Date().toISOString();
  const base = typeof msg === "string" ? msg : JSON.stringify(msg);
  return `[${time}] [${level.toUpperCase()}] ${base}${meta ? " " + JSON.stringify(meta) : ""}`;
}

export const logger = {
  debug: (msg: any, meta?: Record<string, any>) => { if (CURRENT <= LEVELS.debug) console.debug(fmt("debug", msg, meta)); },
  info:  (msg: any, meta?: Record<string, any>) => { if (CURRENT <= LEVELS.info) console.info(fmt("info", msg, meta)); },
  warn:  (msg: any, meta?: Record<string, any>) => { if (CURRENT <= LEVELS.warn) console.warn(fmt("warn", msg, meta)); },
  error: (msg: any, meta?: Record<string, any>) => { if (CURRENT <= LEVELS.error) console.error(fmt("error", msg, meta)); },
};
