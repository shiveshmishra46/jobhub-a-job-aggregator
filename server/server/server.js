// Load environment variables FIRST and at module import-time
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files in a robust way (server/.env first)
const envFilesInOrder = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../.env.local'),
];

let loadedEnvFiles = [];
for (const p of envFilesInOrder) {
  if (fs.existsSync(p)) {
    const isLocal = p.endsWith('.env.local');
    const result = dotenv.config({ path: p, override: isLocal });
    loadedEnvFiles.push({
      path: p,
      error: result.error ? result.error.message : null,
      keys: result.parsed ? Object.keys(result.parsed).length : 0,
      override: isLocal,
    });
  }
}
console.log('ENV LOAD ->', loadedEnvFiles);
console.log('ENV CHECK -> PORT:', process.env.PORT);
console.log('ENV CHECK -> MONGODB_URI set?', Boolean(process.env.MONGODB_URI));
console.log('ENV CHECK -> GOOGLE_CLIENT_ID set?', Boolean(process.env.GOOGLE_CLIENT_ID));
console.log('ENV CHECK -> GOOGLE_CLIENT_SECRET set?', Boolean(process.env.GOOGLE_CLIENT_SECRET));

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import GridFS from 'gridfs-stream';
import passport, { configurePassport } from './config/passport.js';

// Routes
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/users.js';
import fileRoutes from './routes/files.js';
import { handleSocketConnection } from './socket/socketHandlers.js';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// Rate limiting
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const maxReq = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
app.use(rateLimit({ windowMs, max: maxReq }));

// General middleware
const bodyLimit = process.env.MAX_FILE_SIZE ? String(process.env.MAX_FILE_SIZE) : '10mb';
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Initialize Passport
app.use(passport.initialize());

// MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set. Put it in server/.env');
    const conn = await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const gfs = GridFS(conn.connection.db, mongoose.mongo);
    gfs.collection('uploads');
    app.set('gfs', gfs);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
await connectDB();

// Socket.io
io.on('connection', (socket) => handleSocketConnection(socket, io));
app.set('io', io);

// Apply Web API polyfills BEFORE AI routes
await (async () => {
  try {
    const undici = await import('undici');
    const { File, fetch, FormData, Headers, Request, Response, Blob } = undici;
    if (!globalThis.fetch) globalThis.fetch = fetch;
    if (!globalThis.FormData) globalThis.FormData = FormData;
    if (!globalThis.Headers) globalThis.Headers = Headers;
    if (!globalThis.Request) globalThis.Request = Request;
    if (!globalThis.Response) globalThis.Response = Response;
    if (!globalThis.Blob) globalThis.Blob = Blob;
    if (!globalThis.File) globalThis.File = File;
    console.log('Undici Web API polyfills applied.');
  } catch (e) {
    console.warn('Undici polyfill setup skipped:', e.message);
  }
})();

// Configure passport AFTER env is loaded
configurePassport();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// Import AI routes AFTER polyfills
try {
  const { default: aiRoutes } = await import('./routes/ai.js');
  app.use('/api/ai', aiRoutes);
  console.log('AI routes loaded.');
} catch (e) {
  console.warn('AI routes not loaded:', e.message);
}

// Health (rich)
app.get('/api/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    db: {
      state: states[mongoose.connection.readyState],
      host: mongoose.connection?.host || null,
      name: mongoose.connection?.name || null
    }
  });
});

// Errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = Number(process.env.PORT) || 5050;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;