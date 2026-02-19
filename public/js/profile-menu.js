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

function ensureDeleteModal() {
  const existing = document.getElementById('profileDeleteModal');
  if (existing) return existing;

  const modal = document.createElement('div');
  modal.id = 'profileDeleteModal';
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.innerHTML = `
    <div class="modal-content profile-delete-modal-content">
      <div class="modal-header">
        <h2>Delete Account</h2>
        <button type="button" class="close-modal" data-close-delete-modal aria-label="Close">&times;</button>
      </div>
      <div class="delete-modal-warning">
        ⚠️ This action is <strong>permanent</strong> and cannot be undone.
        All your habits, streaks, and journal entries will be deleted.
      </div>
      <div id="profileDeleteAlert"></div>
      <form id="profileDeleteForm">
        <div class="form-group">
          <label for="profileDeletePassword">Enter your password to confirm</label>
          <input type="password" id="profileDeletePassword" placeholder="Your current password" required />
        </div>
        <div class="delete-modal-actions">
          <button type="button" class="btn btn-secondary" data-close-delete-modal>Cancel</button>
          <button type="submit" class="btn btn-danger" id="confirmDeleteBtn">Delete My Account</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

function showPasswordMessage(message, type) {
  const alert = document.getElementById('profilePasswordAlert');
  if (!alert) return;
  alert.innerHTML = message
    ? `<div class="alert alert-${type}">${escapeHtml(message)}</div>`
    : '';
}

function showDeleteMessage(message, type) {
  const alert = document.getElementById('profileDeleteAlert');
  if (!alert) return;
  alert.innerHTML = message
    ? `<div class="alert alert-${type}">${escapeHtml(message)}</div>`
    : '';
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

  function renderMenu() {
    profileMenu.innerHTML = `
      <div class="profile-user-card">
        <div class="profile-user-greeting">Hi, ${escapeHtml(user.username)}</div>
        <div class="profile-user-subtitle">Keep your streak alive today.</div>
      </div>
      <button type="button" class="profile-menu-item" data-profile-action="change-password">
        Change Password
      </button>
      <button type="button" class="profile-menu-item profile-menu-item-danger" data-profile-action="delete-account">
        Delete Account
      </button>
      <button type="button" class="profile-menu-item profile-menu-item-danger" data-profile-action="logout">
        Logout
      </button>
    `;
  }

  renderMenu();

  // ── Password modal ──
  const passwordModal = ensurePasswordModal();
  const passwordForm = passwordModal.querySelector('#profilePasswordForm');
  const submitBtn = passwordModal.querySelector('button[type="submit"]');

  function closePasswordModal() {
    passwordModal.classList.remove('active');
    document.body.style.overflow = '';
    passwordForm?.reset();
    showPasswordMessage('', 'info');
  }

  function openPasswordModal() {
    passwordModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // ── Delete modal ──
  const deleteModal = ensureDeleteModal();
  const deleteForm = deleteModal.querySelector('#profileDeleteForm');
  const confirmDeleteBtn = deleteModal.querySelector('#confirmDeleteBtn');

  function closeDeleteModal() {
    deleteModal.classList.remove('active');
    document.body.style.overflow = '';
    deleteForm?.reset();
    showDeleteMessage('', 'info');
  }

  function openDeleteModal() {
    deleteModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // ── Profile button toggle ──
  profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
      profileMenu.classList.remove('active');
    }
  });

  // ── Menu actions ──
  profileMenu.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-profile-action]');
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
      return;
    }

    if (action === 'delete-account') {
      openDeleteModal();
    }
  });

  // ── Password modal events ──
  passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal || e.target.closest('[data-close-password-modal]')) {
      closePasswordModal();
    }
  });

  // ── Delete modal events ──
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal || e.target.closest('[data-close-delete-modal]')) {
      closeDeleteModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (passwordModal.classList.contains('active')) closePasswordModal();
      if (deleteModal.classList.contains('active')) closeDeleteModal();
    }
  });

  // ── Password form submit ──
  passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

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
      showPasswordMessage('New password must be different from current password.', 'error');
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';
      await authAPI.changePassword(user.userId, currentPassword, newPassword);
      showPasswordMessage('Password updated successfully.', 'success');
      setTimeout(() => closePasswordModal(), 1200);
    } catch (error) {
      showPasswordMessage(error.message || 'Unable to change password.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Update Password';
    }
  });

  // ── Delete form submit ──
  deleteForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('profileDeletePassword')?.value;
    if (!password) {
      showDeleteMessage('Please enter your password.', 'error');
      return;
    }

    try {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';
      await authAPI.deleteAccount(user.userId, password);
      storage.clearUser();
      redirect('index.html');
    } catch (error) {
      showDeleteMessage(error.message || 'Unable to delete account.', 'error');
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Delete My Account';
    }
  });
}