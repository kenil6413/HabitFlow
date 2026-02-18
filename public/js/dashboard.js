import { habitsAPI, journalAPI } from './api.js';
import { requireAuth, storage, redirect } from './utils.js';
import { initProfileDropdown } from './profile-menu.js';
import {
  escapeHtml,
  startOfDay,
  toDateKey,
  isSameDay,
  parseMongoId,
} from './client-helpers.js';
import { renderStats } from './dashboard/stats.js';
import {
  renderStreakProgress,
  renderWeekRow,
  renderHeatmap,
} from './dashboard/heatmap.js';
import {
  habitIdOf,
  renderHabits,
  refreshHabits,
  bindHabitEvents,
} from './dashboard/habits.js';
import { bindMoodPicker, createJournalController } from './dashboard/journal.js';
import { applyStoredWallpaper } from './wallpaper.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const state = {
  user: null,
  userId: '',
  habits: [],
  editMode: false,
  selectedDate: startOfDay(new Date()),
  photos: [],
};

function habitIdResolver(habit) {
  return habitIdOf(habit, parseMongoId);
}

function renderHabitsList() {
  renderHabits({
    habits: state.habits,
    selectedDate: state.selectedDate,
    isSameDay,
    escapeHtml,
    habitIdResolver,
  });
}

function renderAll() {
  renderStats({
    habits: state.habits,
    startOfDay,
    toDateKey,
    isSameDay,
  });

  renderStreakProgress({
    habits: state.habits,
    startOfDay,
    escapeHtml,
  });

  renderWeekRow({
    habits: state.habits,
    dayNames: DAY_NAMES,
    startOfDay,
    isSameDay,
    toDateKey,
  });

  renderHabitsList();

  renderHeatmap({
    habits: state.habits,
    toDateKey,
  });
}

async function refreshHabitsAndRender() {
  state.habits = await refreshHabits({
    habitsAPI,
    userId: state.userId,
    habitIdResolver,
  });

  renderAll();
}

const journal = createJournalController({
  state,
  journalAPI,
  toDateKey,
  startOfDay,
  isSameDay,
  renderHabits: renderHabitsList,
});

async function init() {
  requireAuth();
  applyStoredWallpaper();

  state.user = storage.getUser();
  state.userId = parseMongoId(state.user?.userId);

  if (!state.userId) {
    storage.clearUser();
    redirect('index.html');
    return;
  }

  initProfileDropdown();

  bindHabitEvents({
    state,
    habitsAPI,
    refresh: refreshHabitsAndRender,
    isSameDay,
    habitIdResolver,
  });

  bindMoodPicker();
  journal.bindJournalEvents();

  try {
    await refreshHabitsAndRender();
    await journal.loadJournalEntry();
  } catch (error) {
    console.error('Dashboard load error:', error);
    alert('Unable to load dashboard data. Please refresh.');
  }
}

init();
