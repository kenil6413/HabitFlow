const PROFILE_ICON = `
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
`;

const NAV_LINKS = [
  { key: 'dashboard', href: 'dashboard.html', label: 'Dashboard' },
  { key: 'friends', href: 'friends.html', label: 'Friends' },
];

function renderNavLinks(activeNavKey) {
  return NAV_LINKS.map((link) => {
    const activeClass = link.key === activeNavKey ? ' active' : '';
    return `<a href="${link.href}" class="nav-link${activeClass}">${link.label}</a>`;
  }).join('');
}

export function renderAppBar(activeNavKey = '') {
  const mount = document.getElementById('appBarMount');
  if (!mount) return;

  mount.innerHTML = `
    <header class="app-bar app-bar-glass">
      <div class="container">
        <a href="home.html" class="app-bar-brand">HabitFlow</a>
        <nav class="app-bar-nav">
          ${renderNavLinks(activeNavKey)}
          <div class="profile-dropdown">
            <button
              type="button"
              class="profile-btn"
              id="profileBtn"
              aria-label="Open profile menu"
            >
              ${PROFILE_ICON}
            </button>
            <div class="profile-menu" id="profileMenu"></div>
          </div>
        </nav>
      </div>
    </header>
  `;
}
