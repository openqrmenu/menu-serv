import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const fileRotateTransport = new DailyRotateFile({
    filename: "./logs/debug-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxFiles: "14d",
    level: "debug"
  });

const options: winston.LoggerOptions = {
    transports: [
        new winston.transports.Console({
            level: process.env.NODE_ENV === "production" ? "error" : "debug"
        }),
        fileRotateTransport
    ],
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.errors({ stack: true }),
        winston.format.timestamp({
          format: "YYYY-MM-DD hh:mm:ss.SSS A",
        }),
       // winston.format.align(),
        winston.format.printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
      ),
      exceptionHandlers: [
        new winston.transports.File({ filename: "./logs/exception.log" }),
        new winston.transports.Console({
          level: process.env.NODE_ENV === "production" ? "error" : "debug"
        }),
      ],
};

const logger = winston.createLogger(options);

if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging initialized 12 at debug level");
}

export default logger;