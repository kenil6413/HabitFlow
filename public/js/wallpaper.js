import { assetsAPI } from './api.js';

const STORAGE_KEY = 'habitflow_wallpaper_url';
const FALLBACK_WALLPAPER =
  '/img/wp13694694-ultrawide-minimalist-wallpapers.jpg';

function setWallpaperCss(url) {
  const safeUrl = url || FALLBACK_WALLPAPER;
  document.documentElement.style.setProperty(
    '--app-wallpaper',
    `url('${safeUrl}')`
  );
  document.body.style.setProperty('--app-wallpaper', `url('${safeUrl}')`);
}

function getStoredWallpaper() {
  return localStorage.getItem(STORAGE_KEY);
}

function saveWallpaper(url) {
  localStorage.setItem(STORAGE_KEY, url);
}

function pickNextSequential(items, current) {
  if (!items.length) return null;
  const currentIndex = items.indexOf(current);

  if (currentIndex < 0) {
    return items[0];
  }

  return items[(currentIndex + 1) % items.length];
}

async function fetchWallpapers() {
  try {
    const data = await assetsAPI.listWallpapers();
    return Array.isArray(data.wallpapers) ? data.wallpapers : [];
  } catch {
    return [];
  }
}

export function applyStoredWallpaper() {
  const stored = getStoredWallpaper();
  setWallpaperCss(stored || FALLBACK_WALLPAPER);
}

export async function initWallpaperSwitcher(nextButton) {
  applyStoredWallpaper();

  let wallpapers = await fetchWallpapers();
  const ensureWallpapers = async () => {
    if (wallpapers.length) return wallpapers;
    wallpapers = await fetchWallpapers();
    return wallpapers;
  };

  let current = getStoredWallpaper();

  if (wallpapers.length && (!current || !wallpapers.includes(current))) {
    current = wallpapers[0];
    if (current) {
      saveWallpaper(current);
      setWallpaperCss(current);
    }
  }

  if (!nextButton) return;

  nextButton.addEventListener('click', async () => {
    const availableWallpapers = await ensureWallpapers();
    if (!availableWallpapers.length) return;

    const nextWallpaper = pickNextSequential(availableWallpapers, current);
    if (!nextWallpaper) return;

    current = nextWallpaper;
    saveWallpaper(current);
    setWallpaperCss(current);
  });
}
