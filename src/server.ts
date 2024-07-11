import dotenv from 'dotenv';
import { app } from './app';
import MongoConnection from './mongo-connection';
import { logger } from './logger';

const result = dotenv.config();
if (result.error) {
  dotenv.config({ path: '.env' });
}

const mongoConnection = new MongoConnection(process.env.MONGO_URL);
console.log(mongoConnection)
if (process.env.MONGO_URL == null) {
  logger.log({
    level: 'error',
    message: 'MONGO_URL not specified in environment',
  });
  process.exit(1);
} else {
  mongoConnection.connect(() => {
    app.listen(app.get('port'), (): void => {
      console.log(
        '\x1b[36m%s\x1b[0m', // eslint-disable-line
        `🌏 Express server started at http://localhost:${app.get('port')}   `,
      );
    });
  });
}

// Close the Mongoose connection, when receiving SIGINT
process.on('SIGINT', async () => {
  logger.info('Gracefully shutting down');
  try {
    await mongoConnection.close();
    process.exit(0);
  } catch (err) {
    logger.log({
      level: 'error',
      message: 'Error shutting closing mongo connection',
      error: err,
    });
    process.exit(1); // Exit with a failure code
  }
});
