// API Base URL
const API_BASE = '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const rawBody = await response.text();
  let data;
  try {
    data = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    throw new Error(
      `Unexpected server response (${response.status}). Please try again.`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth API
const authAPI = {
  register: (username, password) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  deleteAccount: (userId, password) =>
    apiCall(`/auth/user/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    }),

  changePassword: (userId, currentPassword, newPassword) =>
    apiCall(`/auth/user/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Habits API
const habitsAPI = {
  create: (userId, name, description, plan = {}) =>
    apiCall('/habits', {
      method: 'POST',
      body: JSON.stringify({ userId, name, description, ...plan }),
    }),

  getUserHabits: (userId) => apiCall(`/habits/user/${userId}`),

  getHabit: (habitId) => apiCall(`/habits/${habitId}`),

  update: (habitId, name, description, plan = {}) =>
    apiCall(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description, ...plan }),
    }),

  delete: (habitId) =>
    apiCall(`/habits/${habitId}`, {
      method: 'DELETE',
    }),

  complete: (habitId) =>
    apiCall(`/habits/${habitId}/complete`, {
      method: 'POST',
    }),

  undoToday: (habitId) =>
    apiCall(`/habits/${habitId}/complete/today`, {
      method: 'DELETE',
    }),

  setCompletionByDate: (habitId, date, completed) =>
    apiCall(`/habits/${habitId}/completion`, {
      method: 'PUT',
      body: JSON.stringify({ date, completed }),
    }),
};

// Friends API
const friendsAPI = {
  add: (userId, shareCode) =>
    apiCall('/friends/add', {
      method: 'POST',
      body: JSON.stringify({ userId, shareCode }),
    }),

  getFriends: (userId) => apiCall(`/friends/${userId}`),

  remove: (userId, friendId) =>
    apiCall(`/friends/${userId}/remove/${friendId}`, {
      method: 'DELETE',
    }),

  getFriendHabits: (userId, friendId) =>
    apiCall(`/friends/${userId}/habits/${friendId}`),

  pinFriend: (userId, friendId, pinned) =>
    apiCall(`/friends/${userId}/pin/${friendId}`, {
      method: 'PUT',
      body: JSON.stringify({ pinned }),
    }),
};

// Journal API
const journalAPI = {
  createOrUpdate: (userId, date, content, images) =>
    apiCall('/journal', {
      method: 'POST',
      body: JSON.stringify({ userId, date, content, images }),
    }),

  getEntry: (userId, date) =>
    apiCall(`/journal/user/${userId}/date/${date}`),

  getAllEntries: (userId) => apiCall(`/journal/user/${userId}`),

  delete: (entryId) =>
    apiCall(`/journal/${entryId}`, {
      method: 'DELETE',
    }),
};

// Assets API
const assetsAPI = {
  listWallpapers: () => apiCall('/assets/wallpapers'),
};

// Export for use in other files
export { authAPI, habitsAPI, friendsAPI, journalAPI, assetsAPI };
