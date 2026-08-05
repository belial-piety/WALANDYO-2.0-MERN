const express = require('express');
const path = require('path');
const { connectDB } = require('./server/config/db');
const app = require('./server/app');
const seed = require('./server/scripts/seed');
const User = require('./server/models/User');

const PORT = 3000;

async function startServer() {
  try {
    console.log('[Server] Connecting to database...');
    await connectDB();

    // Check if database needs seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Running initial seed...');
      await seed();
    }

    // Attach Vite middleware in development or serve static built client in production
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = require('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
        root: path.resolve(__dirname, 'client'),
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.resolve(__dirname, 'dist/public');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Walandyo POS server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('[Server Error] Startup failed:', err);
    process.exit(1);
  }
}

startServer();
