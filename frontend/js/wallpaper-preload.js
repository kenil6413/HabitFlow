(() => {
  try {
    const saved = localStorage.getItem('habitflow_wallpaper_url');
    if (!saved) return;

    const wallpaper = `url('${saved}')`;
    document.documentElement.style.setProperty('--app-wallpaper', wallpaper);
    document.body?.style.setProperty('--app-wallpaper', wallpaper);
  } catch {
    // no-op
  }
})();
