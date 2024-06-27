import express, { Request, Response, NextFunction, Express } from 'express';
import compression from 'compression';
import path from 'path';
import { ApplicationError } from './errors/application-error';
import { router } from './routes';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cors from 'cors';

// Load environment variables
const result = dotenv.config();
if (result.error) {
  dotenv.config({ path: '.env' });
}

// Create a Google OAuth2 client
const client = new OAuth2Client();

// Create an Express application
export const app: Express = express();

// Middleware setup
app.use(compression()); // Compress HTTP responses
app.use(express.json()); // Parse JSON request bodies
app.use(cors()); // Enable CORS
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Set the port for the application
app.set('port', process.env.PORT || 8000);

// Serve static files from the 'public' directory
app.use(
  express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }),
);

// Route handling middleware
app.use('/api', router); // Mount the router under the '/api' prefix

/**
 * Verifies a Google ID token using the provided token and client ID.
 *
 * @param {string} token - The ID token to verify.
 * @param {string} clientId - The client ID of the application.
 * @return {Promise<Object>} The payload of the verified token.
 * @throws {Error} If there is an error verifying the token.
 */
async function verifyGoogleToken(token: string, clientId: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
}

/**
 * Route handler for Google authentication.
 * Verifies the Google ID token and generates a JWT token.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 * @throws {Error} - If there is an error verifying the Google token.
 */
app.post('/api/auth/google', async (req, res) => {
  const { credential, clientId } = req.body;
  try {
    const userInfo = await verifyGoogleToken(credential, clientId);

    // Generate JWT token
    const jwtToken = jwt.sign(userInfo, process.env.SECRET);
    res.json({ token: jwtToken, userInfo });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(400).json({ error: 'Invalid token' });
  }
});

/**
 * Error handling middleware.
 * Handles unhandled errors and sends appropriate error responses.
 *
 * @param {Error} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {void}
 */
app.use(
  (err: ApplicationError, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    // Send error response
    return res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'development' ? err : undefined,
      message: err.message,
    });
  },
);
