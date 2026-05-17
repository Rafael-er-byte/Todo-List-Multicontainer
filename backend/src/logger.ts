import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : process.env.LOG_LEVEL ?? "info",
  base: {
    service: "todo-api",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const todoLogger = logger.child({ module: "todo-service" });
