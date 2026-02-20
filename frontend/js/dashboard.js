import { habitsAPI, journalAPI } from './api.js';
import { storage, redirect } from './utils.js';
import { initAuthenticatedPage } from './page-bootstrap.js';
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
import {
  bindMoodPicker,
  createJournalController,
} from './dashboard/journal.js';

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
    canEditSelectedDate,
  });
}

function canEditSelectedDate() {
  return isSameDay(state.selectedDate, new Date());
}

async function toggleCompletionForSelectedDate(habitId, doneForSelectedDate) {
  const selectedDate = startOfDay(state.selectedDate);
  const today = startOfDay(new Date());

  if (selectedDate.getTime() > today.getTime()) {
    throw new Error('Cannot change completion for future dates.');
  }

  if (isSameDay(selectedDate, today)) {
    if (doneForSelectedDate) {
      await habitsAPI.undoToday(habitId);
    } else {
      await habitsAPI.complete(habitId);
    }
    return;
  }

  await habitsAPI.setCompletionByDate(
    habitId,
    toDateKey(selectedDate),
    !doneForSelectedDate
  );
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

function scrollToLoggingSectionIfRequested() {
  if (window.location.hash !== '#loggingSection') return;
  const section = document.getElementById('loggingSection');
  if (!section) return;
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function init() {
  state.user = initAuthenticatedPage({ activeNav: 'dashboard' });
  state.userId = parseMongoId(state.user?.userId);

  if (!state.userId) {
    storage.clearUser();
    redirect('index.html');
    return;
  }

  bindHabitEvents({
    state,
    habitsAPI,
    refresh: refreshHabitsAndRender,
    isSameDay,
    habitIdResolver,
    canEditSelectedDate,
    onToggleCompletion: toggleCompletionForSelectedDate,
  });

  bindMoodPicker();
  journal.bindJournalEvents();

  try {
    await refreshHabitsAndRender();
    await journal.loadJournalEntry();
    scrollToLoggingSectionIfRequested();
  } catch (error) {
    console.error('Dashboard load error:', error);
    alert('Unable to load dashboard data. Please refresh.');
  }
}

init();
