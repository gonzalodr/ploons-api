import path from 'node:path';
import winston from 'winston';
import 'winston-daily-rotate-file';

const LOG_DIR = path.resolve(process.cwd(), 'logs');

const fileRotateTransport = new winston.transports.DailyRotateFile({
  dirname: LOG_DIR,
  filename: 'app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '10',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});

const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let line = `${timestamp} [${level}] ${message}`;
      if (stack) line += `\n${stack}`;
      if (Object.keys(meta).length) line += ` ${JSON.stringify(meta)}`;
      return line;
    }),
  ),
});

export const logger = winston.createLogger({
  level: process.env.ENVIRONMENT === 'production' ? 'info' : 'debug',
  transports: [fileRotateTransport, consoleTransport],
});
