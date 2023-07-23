import { createLogger, format, transports } from "winston";

const logger = createLogger({
  exitOnError: false,
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.simple(),
    format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize({ all: true })),
      handleExceptions: true,
      handleRejections: true,
    }),
    new transports.File({
      filename: `logs/${new Date().toISOString()}.log`,
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});

export default logger;
