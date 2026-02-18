import { authAPI } from './api.js';
import { storage, redirect } from './utils.js';
import { escapeHtml } from './client-helpers.js';

function ensurePasswordModal() {
  const existing = document.getElementById('profilePasswordModal');
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.id = 'profilePasswordModal';
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-content profile-password-modal-content">
      <div class="modal-header">
        <h2>Change Password</h2>
        <button type="button" class="close-modal" data-close-password-modal aria-label="Close">&times;</button>
      </div>
      <div id="profilePasswordAlert"></div>
      <form id="profilePasswordForm">
        <div class="form-group">
          <label for="profileCurrentPassword">Current Password</label>
          <input type="password" id="profileCurrentPassword" required />
        </div>
        <div class="form-group">
          <label for="profileNewPassword">New Password</label>
          <input type="password" id="profileNewPassword" required />
        </div>
        <div class="form-group">
          <label for="profileConfirmPassword">Confirm New Password</label>
          <input type="password" id="profileConfirmPassword" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block">
          Update Password
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function showPasswordMessage(message, type) {
  const alert = document.getElementById('profilePasswordAlert');
  if (!alert) return;
  alert.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

export function initProfileDropdown({
  profileBtnId = 'profileBtn',
  profileMenuId = 'profileMenu',
} = {}) {
  const user = storage.getUser();
  if (!user) {
    redirect('index.html');
    return;
  }

  const profileBtn = document.getElementById(profileBtnId);
  const profileMenu = document.getElementById(profileMenuId);
  if (!profileBtn || !profileMenu) return;

  profileMenu.innerHTML = `
    <div class="profile-user-card">
      <div class="profile-user-greeting">Hi, ${escapeHtml(user.username)}</div>
      <div class="profile-user-subtitle">Keep your streak alive today.</div>
    </div>
    <button type="button" class="profile-menu-item" data-profile-action="change-password">
      Change Password
    </button>
    <button type="button" class="profile-menu-item profile-menu-item-danger" data-profile-action="logout">
      Logout
    </button>
  `;

  const passwordModal = ensurePasswordModal();
  const passwordForm = passwordModal.querySelector('#profilePasswordForm');
  const submitBtn = passwordModal.querySelector('button[type="submit"]');

  function closePasswordModal() {
    passwordModal.classList.remove('active');
    document.body.style.overflow = '';
    passwordForm?.reset();
    showPasswordMessage('', 'info');
    const alert = document.getElementById('profilePasswordAlert');
    if (alert) alert.innerHTML = '';
  }

  function openPasswordModal() {
    passwordModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  profileBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    profileMenu.classList.toggle('active');
  });

  document.addEventListener('click', (event) => {
    if (!profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
      profileMenu.classList.remove('active');
    }
  });

  profileMenu.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('[data-profile-action]');
    if (!actionBtn) return;

    const action = actionBtn.getAttribute('data-profile-action');
    profileMenu.classList.remove('active');

    if (action === 'logout') {
      storage.clearUser();
      redirect('index.html');
      return;
    }

    if (action === 'change-password') {
      openPasswordModal();
    }
  });

  passwordModal.addEventListener('click', (event) => {
    if (
      event.target === passwordModal ||
      event.target.closest('[data-close-password-modal]')
    ) {
      closePasswordModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && passwordModal.classList.contains('active')) {
      closePasswordModal();
    }
  });

  passwordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById('profileCurrentPassword')?.value;
    const newPassword = document.getElementById('profileNewPassword')?.value;
    const confirmPassword = document.getElementById('profileConfirmPassword')?.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showPasswordMessage('Please fill all fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showPasswordMessage('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showPasswordMessage('New password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword === currentPassword) {
      showPasswordMessage(
        'New password must be different from current password.',
        'error'
      );
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';

      await authAPI.changePassword(user.userId, currentPassword, newPassword);
      showPasswordMessage('Password updated successfully.', 'success');

      setTimeout(() => {
        closePasswordModal();
      }, 1200);
    } catch (error) {
      showPasswordMessage(error.message || 'Unable to change password.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Password';
    }
  });
}
