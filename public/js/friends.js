import { friendsAPI } from './api.js';
import { storage, requireAuth, redirect } from './utils.js';
import { initProfileDropdown } from './profile-menu.js';
import { startOfDay, isSameDay } from './client-helpers.js';
import {
  renderFriendsCards,
  renderFriendHabits,
  renderNoHabits,
  summarizeHabitsToday,
} from './friends/render.js';
import { createFriendsUI } from './friends/ui.js';
import { applyStoredWallpaper } from './wallpaper.js';

requireAuth();
applyStoredWallpaper();
initProfileDropdown();

const user = storage.getUser();
if (!user) {
  redirect('index.html');
  throw new Error('User session missing');
}

const elements = {
  friendsGrid: document.getElementById('friendsGrid'),
  loadingState: document.getElementById('loadingState'),
  emptyState: document.getElementById('emptyState'),
  alertContainer: document.getElementById('alertContainer'),
  friendCount: document.getElementById('friendCount'),
  heroFriendCount: document.getElementById('heroFriendCount'),
  friendHabitsModal: document.getElementById('friendHabitsModal'),
  modalLoadingState: document.getElementById('modalLoadingState'),
  modalHabitsList: document.getElementById('modalHabitsList'),
  spotlightStats: document.getElementById('spotlightStats'),
  myShareCode: document.getElementById('myShareCode'),
  copyCodeBtn: document.getElementById('copyCodeBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  addFriendForm: document.getElementById('addFriendForm'),
  friendShareCode: document.getElementById('friendShareCode'),
  addFriendSubmitBtn: document.querySelector('#addFriendForm button[type="submit"]'),
  closeModalBtn: document.getElementById('closeModalBtn'),
  modalAvatar: document.getElementById('modalAvatar'),
  modalFriendName: document.getElementById('modalFriendName'),
  modalFriendCode: document.getElementById('modalFriendCode'),
  statTotal: document.getElementById('statTotal'),
  statCompletedToday: document.getElementById('statCompletedToday'),
  friendSearch: document.getElementById('friendSearch'),
  habitSortSelect: document.getElementById('habitSortSelect'),
  habitFilterButtons: document.querySelectorAll('[data-habit-filter]'),
};

const ui = createFriendsUI({
  alertContainer: elements.alertContainer,
  modalEl: elements.friendHabitsModal,
  modalLoadingEl: elements.modalLoadingState,
  modalHabitsListEl: elements.modalHabitsList,
  spotlightStatsEl: elements.spotlightStats,
});

elements.myShareCode.textContent = user.shareCode;
let allFriends = [];
let modalHabits = [];
let modalHabitFilter = 'all';

function isCompletedToday(habit) {
  const today = startOfDay(new Date());
  return habit.completions?.some((completion) => isSameDay(completion.date, today));
}

function getFilteredModalHabits() {
  if (modalHabitFilter !== 'completed') {
    return modalHabits;
  }
  return modalHabits.filter((habit) => isCompletedToday(habit));
}

function renderModalHabitsList() {
  const visibleHabits = getFilteredModalHabits();
  if (!visibleHabits.length) {
    const message =
      modalHabitFilter === 'completed'
        ? 'No habits completed today yet.'
        : 'No habits to show.';
    elements.modalHabitsList.innerHTML = `
      <div class="no-habits">
        <div class="no-habits-icon">🗂️</div>
        <p>${message}</p>
      </div>
    `;
    return;
  }

  elements.modalHabitsList.innerHTML = renderFriendHabits(
    visibleHabits,
    elements.habitSortSelect.value
  );
}

function setHabitFilter(filterKey) {
  modalHabitFilter = filterKey;
  elements.habitFilterButtons.forEach((button) => {
    const active = button.dataset.habitFilter === filterKey;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  renderModalHabitsList();
}

function bindEvents() {
  elements.copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard
      .writeText(user.shareCode)
      .then(() => {
        ui.showAlert('Share code copied to clipboard!', 'success');
      })
      .catch(() => {
        ui.showAlert('Failed to copy code', 'error');
      });
  });

  elements.refreshBtn.addEventListener('click', loadFriends);
  elements.friendSearch.addEventListener('input', () => {
    applyFriendFilter();
  });
  elements.habitSortSelect.addEventListener('change', () => {
    if (!modalHabits.length) return;
    renderModalHabitsList();
  });
  elements.habitFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setHabitFilter(button.dataset.habitFilter || 'all');
    });
  });

  elements.addFriendForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await addFriend();
  });

  elements.closeModalBtn.addEventListener('click', ui.closeModal);

  elements.friendHabitsModal.addEventListener('click', (event) => {
    if (event.target === elements.friendHabitsModal) {
      ui.closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && elements.friendHabitsModal.classList.contains('active')) {
      ui.closeModal();
    }
  });
}

async function loadFriends() {
  elements.loadingState.classList.remove('hidden');
  elements.friendsGrid.innerHTML = '';
  elements.emptyState.classList.add('hidden');

  try {
    const data = await friendsAPI.getFriends(user.userId);

    elements.loadingState.classList.add('hidden');
    elements.friendCount.textContent = data.count;
    elements.heroFriendCount.textContent = data.count;
    allFriends = data.friends || [];

    if (!allFriends.length) {
      elements.emptyState.classList.remove('hidden');
      return;
    }

    applyFriendFilter();
  } catch (error) {
    elements.loadingState.classList.add('hidden');
    ui.showAlert(error.message || 'Unable to load friends', 'error');
  }
}

function bindFriendCardEvents() {
  elements.friendsGrid.querySelectorAll('.btn-view-habits').forEach((button) => {
    button.addEventListener('click', (event) => {
      const { friendId, friendName, friendCode } = event.currentTarget.dataset;
      viewFriendHabits(friendId, friendName, friendCode);
    });
  });

  elements.friendsGrid.querySelectorAll('.btn-remove-friend').forEach((button) => {
    button.addEventListener('click', (event) => {
      const { friendId, friendName } = event.currentTarget.dataset;
      removeFriend(friendId, friendName);
    });
  });
}

function applyFriendFilter() {
  const term = elements.friendSearch.value.trim().toLowerCase();
  const filteredFriends = !term
    ? allFriends
    : allFriends.filter((friend) => {
        const name = String(friend.username || '').toLowerCase();
        const code = String(friend.shareCode || '').toLowerCase();
        return name.includes(term) || code.includes(term);
      });

  elements.friendsGrid.innerHTML = renderFriendsCards(filteredFriends);
  bindFriendCardEvents();
}

async function addFriend() {
  const shareCode = elements.friendShareCode.value.trim().toUpperCase();

  try {
    elements.addFriendSubmitBtn.disabled = true;
    elements.addFriendSubmitBtn.textContent = 'Adding...';

    const data = await friendsAPI.add(user.userId, shareCode);

    ui.showAlert(`✅ ${data.friend.username} added as friend!`, 'success');
    elements.addFriendForm.reset();
    loadFriends();
  } catch (error) {
    ui.showAlert(error.message || 'Unable to add friend', 'error');
  } finally {
    elements.addFriendSubmitBtn.disabled = false;
    elements.addFriendSubmitBtn.textContent = 'Add Friend';
  }
}

async function viewFriendHabits(friendId, friendName, shareCode) {
  const fId = String(friendId || '');

  if (!fId) {
    ui.showAlert('Invalid friend', 'error');
    return;
  }

  elements.modalAvatar.textContent = friendName.charAt(0).toUpperCase();
  elements.modalFriendName.textContent = friendName;
  elements.modalFriendCode.textContent = shareCode;

  ui.openModal();
  ui.showModalLoading();

  try {
    const data = await friendsAPI.getFriendHabits(String(user.userId), fId);

    ui.hideModalLoading();
    elements.spotlightStats.classList.remove('hidden');

    const completedToday = summarizeHabitsToday(data.habits);
    elements.statTotal.textContent = `${data.habits.length} habits`;
    elements.statCompletedToday.textContent = `${completedToday} completed today`;

    if (!data.habits.length) {
      modalHabits = [];
      setHabitFilter('all');
      elements.modalHabitsList.innerHTML = renderNoHabits(friendName);
      return;
    }

    modalHabits = [...data.habits];
    setHabitFilter('all');
  } catch (error) {
    modalHabits = [];
    ui.setModalError(error.message || 'Unable to load habits', ui.closeModal);
  }
}

async function removeFriend(friendId, friendName) {
  if (!confirm(`Are you sure you want to remove ${friendName} from your friends?`)) {
    return;
  }

  try {
    await friendsAPI.remove(String(user.userId), String(friendId));
    ui.showAlert(`${friendName} removed from friends`, 'success');
    loadFriends();
  } catch (error) {
    ui.showAlert(error.message || 'Unable to remove friend', 'error');
  }
}

bindEvents();
loadFriends();
