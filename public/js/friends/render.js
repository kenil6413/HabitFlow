import { escapeHtml, startOfDay, isSameDay } from '../client-helpers.js';
import { formatDate } from '../utils.js';

function isCompletionOnDate(completion, date) {
  return isSameDay(completion.date, date);
}

export function renderFriendsCards(friends) {
  return friends
    .map((friend) => {
      const initial = friend.username.charAt(0).toUpperCase();
      const friendId = String(friend.userId || friend._id || '');

      return `
        <div class="friend-card">
          <div class="friend-header">
            <div class="friend-avatar">${initial}</div>
            <div class="friend-info">
              <h3>${escapeHtml(friend.username)}</h3>
              <div class="friend-code">${escapeHtml(friend.shareCode)}</div>
            </div>
          </div>

          <div class="friend-stats">
            <div class="stat-item">
              <span class="stat-label">Friends since</span>
              <span class="stat-value">${formatDate(friend.createdAt)}</span>
            </div>
          </div>

          <div class="friend-actions">
            <button
              type="button"
              class="btn btn-primary btn-sm btn-view-habits"
              data-friend-id="${escapeHtml(friendId)}"
              data-friend-name="${escapeHtml(friend.username)}"
              data-friend-code="${escapeHtml(friend.shareCode)}"
            >
              👁️ View Habits
            </button>
            <button
              type="button"
              class="btn btn-danger btn-sm btn-remove-friend"
              data-friend-id="${escapeHtml(friendId)}"
              data-friend-name="${escapeHtml(friend.username)}"
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

export function summarizeHabitsToday(habits) {
  const today = startOfDay(new Date());

  return habits.filter((habit) => {
    if (!habit.completions?.length) return false;
    return habit.completions.some((completion) =>
      isCompletionOnDate(completion, today)
    );
  }).length;
}

function sortHabits(habits, sortBy) {
  const cloned = [...habits];

  if (sortBy === 'name') {
    return cloned.sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, {
        sensitivity: 'base',
      })
    );
  }

  if (sortBy === 'recent') {
    return cloned.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }

  return cloned.sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));
}

export function renderFriendHabits(habits, sortBy = 'streak') {
  const today = startOfDay(new Date());
  const sortedHabits = sortHabits(habits, sortBy);

  return sortedHabits
    .map((habit) => {
      const completedToday = habit.completions?.some((completion) =>
        isCompletionOnDate(completion, today)
      );
      const totalCompletions = Array.isArray(habit.completions)
        ? habit.completions.length
        : 0;
      const consistency = Math.min(100, Math.round((totalCompletions / 30) * 100));

      return `
        <div class="habit-item ${completedToday ? 'completed-today' : ''}">
          <h4>${escapeHtml(habit.name)}</h4>
          ${habit.description ? `<p>${escapeHtml(habit.description)}</p>` : ''}
          <div class="habit-streak">
            <span>🔥</span>
            <span>${habit.currentStreak || 0}</span>
            <span class="streak-text">day streak</span>
          </div>
          ${
            completedToday
              ? '<span class="completed-badge">✓ Completed today</span>'
              : ''
          }
          <div class="habit-completion-row">
            <span class="habit-completion-label">${totalCompletions} total completions</span>
            <span class="habit-completion-value">${consistency}% consistency</span>
          </div>
          <div class="habit-meter">
            <span class="habit-meter-fill" style="width:${consistency}%"></span>
          </div>
          <div class="habit-meta">
            Created ${formatDate(habit.createdAt)}
          </div>
        </div>
      `;
    })
    .join('');
}

export function renderNoHabits(friendName) {
  return `
    <div class="no-habits">
      <div class="no-habits-icon">🎯</div>
      <p>${escapeHtml(friendName)} hasn't created any habits yet.</p>
    </div>
  `;
}
