import { friendsAPI } from './api.js';
import { initAuthenticatedPage } from './page-bootstrap.js';
import { startOfDay, isSameDay } from './client-helpers.js';
import {
  renderFriendsCards,
  renderFriendHabits,
  renderNoHabits,
  summarizeHabitsToday,
} from './friends/render.js';
import { createFriendsUI } from './friends/ui.js';

const user = initAuthenticatedPage({ activeNav: 'friends' });

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
  addFriendSubmitBtn: document.querySelector(
    '#addFriendForm button[type="submit"]'
  ),
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

const state = {
  allFriends: [],
  modalHabits: [],
  modalHabitFilter: 'all',
  activeModalFriend: null,
};

elements.myShareCode.textContent = user.shareCode || 'HABIT-XXXXX';

function toId(value) {
  return String(value ?? '');
}

function setFriendCounts(count) {
  const parsedCount = Number(count);
  const normalizedCount = Number.isFinite(parsedCount) ? parsedCount : 0;
  elements.friendCount.textContent = normalizedCount;
  elements.heroFriendCount.textContent = normalizedCount;
}

function setFriendsLoading(isLoading) {
  elements.loadingState.classList.toggle('hidden', !isLoading);
  if (isLoading) {
    elements.emptyState.classList.add('hidden');
    elements.friendsGrid.innerHTML = '';
  }
}

function setModalFilterButtons(activeFilter) {
  elements.habitFilterButtons.forEach((button) => {
    const isActive = button.dataset.habitFilter === activeFilter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function resetModalState() {
  state.activeModalFriend = null;
  state.modalHabits = [];
  state.modalHabitFilter = 'all';
  setModalFilterButtons('all');
}

function closeFriendHabitsModal() {
  resetModalState();
  ui.closeModal();
}

function isCompletedToday(habit) {
  const today = startOfDay(new Date());
  return habit.completions?.some((completion) =>
    isSameDay(completion.date, today)
  );
}

function getVisibleModalHabits() {
  if (state.modalHabitFilter !== 'completed') {
    return state.modalHabits;
  }
  return state.modalHabits.filter((habit) => isCompletedToday(habit));
}

function renderModalHabitsList() {
  const visibleHabits = getVisibleModalHabits();
  if (!visibleHabits.length) {
    const message =
      state.modalHabitFilter === 'completed'
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

function setModalHabitFilter(filterKey) {
  state.modalHabitFilter = filterKey;
  setModalFilterButtons(filterKey);
  renderModalHabitsList();
}

function applyModalHabitsData(data, { resetFilter = false } = {}) {
  const habits = Array.isArray(data?.habits) ? data.habits : [];

  ui.hideModalLoading();
  elements.spotlightStats.classList.remove('hidden');

  const completedToday = summarizeHabitsToday(habits);
  elements.statTotal.textContent = `${habits.length} habits`;
  elements.statCompletedToday.textContent = `${completedToday} completed today`;

  if (!habits.length) {
    state.modalHabits = [];
    state.modalHabitFilter = 'all';
    setModalFilterButtons('all');
    elements.modalHabitsList.innerHTML = renderNoHabits(
      state.activeModalFriend?.name || 'This friend'
    );
    return;
  }

  state.modalHabits = habits;
  if (resetFilter) {
    setModalHabitFilter('all');
    return;
  }

  renderModalHabitsList();
}

async function loadActiveFriendHabits({
  showLoading = false,
  resetFilter = false,
} = {}) {
  const friendId = state.activeModalFriend?.id;
  if (!friendId) return;

  if (showLoading) {
    ui.showModalLoading();
  }

  try {
    const data = await friendsAPI.getFriendHabits(
      toId(user.userId),
      toId(friendId)
    );
    applyModalHabitsData(data, { resetFilter });
  } catch (error) {
    state.modalHabits = [];
    ui.setModalError(
      error.message || 'Unable to load habits',
      closeFriendHabitsModal
    );
  }
}

async function viewFriendHabits(friendId, friendName, friendCode) {
  const normalizedId = toId(friendId);
  if (!normalizedId) {
    ui.showAlert('Invalid friend', 'error');
    return;
  }

  const safeName =
    typeof friendName === 'string' && friendName.trim()
      ? friendName.trim()
      : 'Friend';
  const safeCode = typeof friendCode === 'string' ? friendCode : '';

  elements.modalAvatar.textContent = safeName.charAt(0).toUpperCase();
  elements.modalFriendName.textContent = safeName;
  elements.modalFriendCode.textContent = safeCode;
  state.activeModalFriend = {
    id: normalizedId,
    name: safeName,
    shareCode: safeCode,
  };

  ui.openModal();
  await loadActiveFriendHabits({ showLoading: true, resetFilter: true });
}

async function togglePinFriend(friendId, friendName, isPinned) {
  try {
    await friendsAPI.pinFriend(toId(user.userId), toId(friendId), !isPinned);
    ui.showAlert(
      isPinned ? `${friendName} unpinned` : `${friendName} pinned to top!`,
      'success'
    );
    await loadFriends();
  } catch (error) {
    ui.showAlert(error.message || 'Unable to update pin', 'error');
  }
}

function getFilteredFriends(rawSearchTerm) {
  const searchTerm = String(rawSearchTerm || '')
    .trim()
    .toLowerCase();

  if (!searchTerm) {
    return state.allFriends;
  }

  return state.allFriends.filter((friend) => {
    const name = String(friend.username || '').toLowerCase();
    const code = String(friend.shareCode || '').toLowerCase();
    return name.includes(searchTerm) || code.includes(searchTerm);
  });
}

function renderFriendsGrid(friends) {
  elements.friendsGrid.innerHTML = renderFriendsCards(friends);
}

function applyFriendFilter() {
  renderFriendsGrid(getFilteredFriends(elements.friendSearch.value));
}

async function loadFriends() {
  setFriendsLoading(true);

  try {
    const data = await friendsAPI.getFriends(toId(user.userId));
    state.allFriends = Array.isArray(data.friends) ? data.friends : [];
    setFriendCounts(
      Number.isFinite(Number(data.count))
        ? Number(data.count)
        : state.allFriends.length
    );

    if (!state.allFriends.length) {
      elements.emptyState.classList.remove('hidden');
      elements.friendsGrid.innerHTML = '';
      return;
    }

    elements.emptyState.classList.add('hidden');
    applyFriendFilter();
  } catch (error) {
    state.allFriends = [];
    setFriendCounts(0);
    elements.emptyState.classList.add('hidden');
    ui.showAlert(error.message || 'Unable to load friends', 'error');
  } finally {
    setFriendsLoading(false);
  }
}

async function addFriend() {
  const shareCode = elements.friendShareCode.value.trim().toUpperCase();

  try {
    elements.addFriendSubmitBtn.disabled = true;
    elements.addFriendSubmitBtn.textContent = 'Adding...';

    const data = await friendsAPI.add(toId(user.userId), shareCode);
    ui.showAlert(`✅ ${data.friend.username} added as friend!`, 'success');
    elements.addFriendForm.reset();
    await loadFriends();
  } catch (error) {
    ui.showAlert(error.message || 'Unable to add friend', 'error');
  } finally {
    elements.addFriendSubmitBtn.disabled = false;
    elements.addFriendSubmitBtn.textContent = 'Add Friend';
  }
}

async function removeFriend(friendId, friendName) {
  if (
    !confirm(`Are you sure you want to remove ${friendName} from your friends?`)
  ) {
    return;
  }

  try {
    await friendsAPI.remove(toId(user.userId), toId(friendId));
    ui.showAlert(`${friendName} removed from friends`, 'success');
    await loadFriends();
  } catch (error) {
    ui.showAlert(error.message || 'Unable to remove friend', 'error');
  }
}

async function copyShareCode() {
  if (!navigator.clipboard) {
    ui.showAlert('Clipboard not supported in this browser', 'error');
    return;
  }

  const shareCode = user.shareCode || '';
  if (!shareCode) {
    ui.showAlert('Share code unavailable', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(shareCode);
    ui.showAlert('Share code copied to clipboard!', 'success');
  } catch {
    ui.showAlert('Failed to copy code', 'error');
  }
}

async function handleFriendsGridClick(event) {
  const button = event.target.closest('button');
  if (!button || !elements.friendsGrid.contains(button)) {
    return;
  }

  if (button.classList.contains('btn-view-habits')) {
    const { friendId, friendName, friendCode } = button.dataset;
    await viewFriendHabits(friendId, friendName, friendCode);
    return;
  }

  if (button.classList.contains('btn-remove-friend')) {
    const { friendId, friendName } = button.dataset;
    await removeFriend(friendId, friendName);
    return;
  }

  if (button.classList.contains('btn-pin-friend')) {
    const { friendId, friendName, pinned } = button.dataset;
    await togglePinFriend(friendId, friendName, pinned === 'true');
  }
}

function bindEvents() {
  elements.copyCodeBtn.addEventListener('click', copyShareCode);
  elements.refreshBtn.addEventListener('click', loadFriends);
  elements.friendSearch.addEventListener('input', applyFriendFilter);
  elements.friendsGrid.addEventListener('click', handleFriendsGridClick);

  elements.habitSortSelect.addEventListener('change', () => {
    if (!state.modalHabits.length) return;
    renderModalHabitsList();
  });

  elements.habitFilterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setModalHabitFilter(button.dataset.habitFilter || 'all');
    });
  });

  elements.addFriendForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await addFriend();
  });

  elements.closeModalBtn.addEventListener('click', closeFriendHabitsModal);
  elements.friendHabitsModal.addEventListener('click', (event) => {
    if (event.target === elements.friendHabitsModal) {
      closeFriendHabitsModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      elements.friendHabitsModal.classList.contains('active')
    ) {
      closeFriendHabitsModal();
    }
  });
}

bindEvents();
loadFriends();
