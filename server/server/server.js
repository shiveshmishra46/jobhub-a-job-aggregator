// Load environment variables FIRST and at module import-time
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files in a robust way:
// - Base files first (.env), then local overrides (.env.local)
// - Prefer server/ folder, then project root fallback
const envFilesInOrder = [
  path.join(__dirname, '.env'),              // server/.env (base)
  path.join(__dirname, '.env.local'),        // server/.env.local (overrides)
  path.join(__dirname, '../.env'),           // root/.env (base fallback)
  path.join(__dirname, '../.env.local'),     // root/.env.local (overrides)
];

let loadedEnvFiles = [];
for (const p of envFilesInOrder) {
  if (fs.existsSync(p)) {
    // For base files, don't override existing env; for .env.local, allow override of previously parsed
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

// One-time sanity log (comment out later if you want)
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

// Routes (AI routes will be imported dynamically after polyfills)
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import applicationRoutes from './routes/applications.js';
import messageRoutes from './routes/messages.js';
import userRoutes from './routes/users.js';
import fileRoutes from './routes/files.js';
// import adminRoutes from './routes/admin.js';

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
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting (use env if provided)
const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const maxReq = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const limiter = rateLimit({ windowMs, max: maxReq });
app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE ? String(process.env.MAX_FILE_SIZE) : '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_FILE_SIZE ? String(process.env.MAX_FILE_SIZE) : '10mb' }));

// Initialize Passport (required for passport.authenticate handlers)
app.use(passport.initialize());

// ---------- MongoDB connection helpers ----------
const MONGO_HOST = process.env.MONGO_HOST || 'cluster0.hw1xy3a.mongodb.net';
const MONGO_DB = process.env.MONGO_DB || 'jobhub';
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASS = process.env.MONGO_PASS;

// Build a safe Mongo URI. Priority:
// 1) MONGODB_URI (as-is, trust user to URL-encode password)
// 2) Construct from parts with safe encoding
function makeMongoUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  if (!MONGO_USER || !MONGO_PASS) {
    throw new Error('MONGODB_URI or MONGO_USER/MONGO_PASS must be set. Put them in server/.env');
  }
  const user = encodeURIComponent(MONGO_USER);
  const pass = encodeURIComponent(MONGO_PASS);
  const authSourceParam = process.env.MONGO_AUTH_SOURCE ? `&authSource=${encodeURIComponent(process.env.MONGO_AUTH_SOURCE)}` : '';
  const appNameParam = process.env.MONGO_APP_NAME ? encodeURIComponent(process.env.MONGO_APP_NAME) : 'Cluster0';
  return `mongodb+srv://${user}:${pass}@${MONGO_HOST}/${encodeURIComponent(MONGO_DB)}?retryWrites=true&w=majority&appName=${appNameParam}${authSourceParam}`;
}

// MongoDB
const connectDB = async () => {
  try {
    const uri = makeMongoUri();

    // Optional: small timeout/selection tuning can help during dev
    const conn = await mongoose.connect(uri, {
      // Mongoose 7+ uses sensible defaults; these are left out intentionally
      serverSelectionTimeoutMS: 15000,
      // tls: true, // Atlas uses TLS by default (inferred from SRV)
    });

    console.log(`MongoDB Connected: host=${conn.connection.host} db=${conn.connection.name}`);

    const gfs = GridFS(conn.connection.db, mongoose.mongo);
    gfs.collection('uploads');
    app.set('gfs', gfs);
  } catch (error) {
    // Helpful hints for common failure modes
    if (/bad auth|authentication failed/i.test(String(error?.message))) {
      console.error('Database connection error: Authentication failed. Check username/password. If password has special characters, ensure it is URL-encoded or use MONGO_USER/MONGO_PASS variables.');
    } else if (/ENOTFOUND|getaddrinfo/i.test(String(error?.message))) {
      console.error('Database connection error: DNS resolution failed. Check network or cluster hostname.');
    } else if (/timed out|server selection/i.test(String(error?.message))) {
      console.error('Database connection error: Could not reach Atlas. Ensure your IP is whitelisted in Atlas Network Access.');
    } else {
      console.error('Database connection error:', error);
    }
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
// app.use('/api/admin', adminRoutes);

// Import AI routes AFTER polyfills
try {
  const { default: aiRoutes } = await import('./routes/ai.js');
  app.use('/api/ai', aiRoutes);
  console.log('AI routes loaded.');
} catch (e) {
  console.warn('AI routes not loaded:', e.message);
}

// Health
app.get('/api/health', (req, res) => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    db: {
      state: states[mongoose.connection.readyState],
      host: mongoose.connection?.host || null,
      name: mongoose.connection?.name || null,
    },
  });
});

// Errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
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