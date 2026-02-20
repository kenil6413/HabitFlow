import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdir } from 'fs/promises';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicImgDir = path.join(__dirname, '../../frontend/img');

const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.avif',
]);

router.get('/wallpapers', async (req, res) => {
  try {
    const files = await readdir(publicImgDir, { withFileTypes: true });
    const wallpapers = files
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/img/${name}`);

    res.status(200).json({ wallpapers });
  } catch (error) {
    console.error('List wallpapers error:', error);
    res.status(500).json({ error: 'Unable to load wallpapers' });
  }
});

export default router;
