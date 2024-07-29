import { createLogger, format, transports } from 'winston';
import moment from 'moment';

// Define transports for logging
const logTransports = [
  // Log errors to a file with JSON format
  new transports.File({
    level: 'error',
    filename: `./logs/${moment().format(
      'DD-MMM-YYYY',
    )}/Activity-${moment().format('hha')}.log`,
    format: format.json({
      replacer: (key, value) => {
        if (key === 'error') {
          return {
            message: (value as Error).message,
            stack: (value as Error).stack,
          };
        }
        return value;
      },
    }),
  }),
  // Log debug messages to the console with pretty printing
  new transports.Console({
    level: 'debug',
    format: format.prettyPrint(),
  }),
  // Log info messages to a file with pretty printing
  new transports.File({
    level: 'info',
    filename: `./logs/${moment().format(
      'DD-MMM-YYYY',
    )}/Activity-${moment().format('hha')}.log`,
    format: format.prettyPrint(),
  }),
];
// Create the logger instance
export const logger = createLogger({
  format: format.combine(format.timestamp()), // Include timestamps in logs
  transports: logTransports, // Use the defined transports for logging
  defaultMeta: { service: 'api' }, // Default metadata for all log messages
});
