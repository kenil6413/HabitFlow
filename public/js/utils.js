// Local Storage helpers
const storage = {
  setUser: (userData) => {
    localStorage.setItem('habitflow_user', JSON.stringify(userData));
  },

  getUser: () => {
    const user = localStorage.getItem('habitflow_user');
    return user ? JSON.parse(user) : null;
  },

  clearUser: () => {
    localStorage.removeItem('habitflow_user');
  },

  isLoggedIn: () => {
    return storage.getUser() !== null;
  },
};

// Show alert message
function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;

  const container = document.querySelector('.container');
  container.insertBefore(alertDiv, container.firstChild);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

// Show loading spinner
function showLoading(element) {
  element.innerHTML = '<div class="spinner"></div>';
}

// Format date
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Redirect to page
function redirect(page) {
  window.location.href = page;
}

// Protect page (redirect to login if not logged in)
function requireAuth() {
  if (!storage.isLoggedIn()) {
    redirect('index.html');
  }
}

// Export for use in other files
export { storage, showAlert, showLoading, formatDate, redirect, requireAuth };
