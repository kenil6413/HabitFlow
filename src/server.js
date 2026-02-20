import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db/connection.js';
import authRoutes from './routes/auth.js';
import habitRoutes from './routes/habits.js';
import friendRoutes from './routes/friends.js';
import journalRoutes from './routes/journal.js';
import assetsRoutes from './routes/assets.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/assets', assetsRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'HabitFlow API' });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
