// src/logger.ts
import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${String(level).toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    // new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});

export default logger;
