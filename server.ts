import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment configurations
dotenv.config();

// Initialize DB schema files if running locally
import { db } from './server/config/db.js';

// Import Express Routers
import authRouter from './server/routes/auth.js';
import scansRouter from './server/routes/scans.js';
import chatsRouter from './server/routes/chats.js';
import adminRouter from './server/routes/admin.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Body Parsing Middlewares with generous bounds for Base64 vision uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API ROUTINGS REGISTER
  app.use('/api/auth', authRouter);
  app.use('/api/scans', scansRouter);
  app.use('/api/chat', chatsRouter);
  app.use('/api/admin', adminRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      database: db.isMySQL() ? 'MySQL Connected' : 'Local Sandbox File Engine',
      hasApiKey: !!process.env.GEMINI_API_KEY
    });
  });

  // VITE DEV SERVER OR STATIC COMBINE SERVE
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.log('Hosting: Running in DEVELOPMENT mode with Vite Middleware HMR wrapper');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000,
        hmr: process.env.DISABLE_HMR !== 'true'
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Hosting: Running in PRODUCTION mode serving statically compiled bundles');
    const distPath = path.join(process.cwd(), 'dist');

app.use('/assets', express.static(path.join(distPath, 'assets')));
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
  }

  // Bind server listener on port 3000 on host 0.0.0.0
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoSmart AI Server listening securely on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal: Server startup crash:', error);
});
