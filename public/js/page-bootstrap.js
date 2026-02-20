import { storage, redirect, requireAuth } from './utils.js';
import { initProfileDropdown } from './profile-menu.js';
import { applyStoredWallpaper } from './wallpaper.js';
import { renderAppBar } from './app-shell.js';

export function initAuthenticatedPage({
  activeNav = '',
  applyWallpaper = true,
} = {}) {
  requireAuth();

  if (applyWallpaper) {
    applyStoredWallpaper();
  }

  renderAppBar(activeNav);

  const user = storage.getUser();
  if (!user) {
    redirect('index.html');
    throw new Error('User session missing');
  }

  initProfileDropdown();
  return user;
}
