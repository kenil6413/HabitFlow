import { habitsAPI } from './api.js';
import { storage, redirect, requireAuth } from './utils.js';
import { initProfileDropdown } from './profile-menu.js';
import { escapeHtml, toDateKey } from './client-helpers.js';
import { initPomodoro } from './home/pomodoro.js';
import { initCalendar } from './home/calendar.js';
import { initQuotes } from './home/quotes.js';
import { initWallpaperSwitcher } from './home/wallpaper.js';

requireAuth();

const user = storage.getUser();
if (!user) {
  redirect('index.html');
  throw new Error('User session missing');
}

initProfileDropdown();

const elements = {
  todayHabitList: document.getElementById('todayHabitList'),
  todayProgress: document.getElementById('todayProgress'),
  calendarGrid: document.getElementById('calendarGrid'),
  calendarMonthYear: document.getElementById('calendarMonthYear'),
  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  focusModeBtn: document.getElementById('focusModeBtn'),
  breakModeBtn: document.getElementById('breakModeBtn'),
  pomodoroRing: document.getElementById('pomodoroRing'),
  pomodoroTime: document.getElementById('pomodoroTime'),
  pomodoroStartBtn: document.getElementById('pomodoroStartBtn'),
  pomodoroResetBtn: document.getElementById('pomodoroResetBtn'),
  durationDecreaseBtn: document.getElementById('durationDecreaseBtn'),
  durationIncreaseBtn: document.getElementById('durationIncreaseBtn'),
  durationValue: document.getElementById('durationValue'),
  quoteStrip: document.getElementById('quoteStrip'),
  quoteText: document.getElementById('quoteText'),
  quoteAuthor: document.getElementById('quoteAuthor'),
  wallpaperNextBtn: document.getElementById('wallpaperNextBtn'),
};

const state = {
  completedByDate: new Map(),
  totalHabits: 0,
};

const todayKey = () => toDateKey(new Date());

function computeCompletedMap(habits) {
  state.completedByDate.clear();

  habits.forEach((habit) => {
    (habit.completions || []).forEach((completion) => {
      const key = toDateKey(completion.date);

      if (!state.completedByDate.has(key)) {
        state.completedByDate.set(key, new Set());
      }

      state.completedByDate.get(key).add(String(habit._id));
    });
  });
}

function getDayStatus(dateObj, today) {
  if (state.totalHabits === 0) return null;
  if (dateObj.getTime() > today.getTime()) return null;

  const key = toDateKey(dateObj);
  const doneCount = (state.completedByDate.get(key) || new Set()).size;

  if (doneCount === 0) return 'none';
  if (doneCount === state.totalHabits) return 'full';
  return 'partial';
}

const calendar = initCalendar({
  gridEl: elements.calendarGrid,
  monthYearEl: elements.calendarMonthYear,
  prevBtn: elements.prevMonthBtn,
  nextBtn: elements.nextMonthBtn,
  getDayStatus,
});

function renderTodayHabits(habits) {
  const completedToday = state.completedByDate.get(todayKey()) || new Set();

  if (!habits.length) {
    elements.todayHabitList.innerHTML =
      '<li class="today-empty">No habits yet. Add your first habit from Dashboard.</li>';
    elements.todayProgress.textContent = '0 of 0 habits completed';
    return;
  }

  let doneCount = 0;

  elements.todayHabitList.innerHTML = habits
    .map((habit) => {
      const habitId = String(habit._id);
      const isDone = completedToday.has(habitId);
      if (isDone) doneCount += 1;

      return `
        <li class="today-habit ${isDone ? 'done' : ''}" data-habit-id="${habitId}">
          <label class="today-habit-label">
            <input type="checkbox" ${isDone ? 'checked' : ''} />
            <span class="habit-text">${escapeHtml(habit.name)}</span>
          </label>
        </li>
      `;
    })
    .join('');

  elements.todayProgress.textContent = `${doneCount} of ${habits.length} habits completed`;
}

async function setHabitDoneState(habitId, shouldBeDone, checkboxEl) {
  checkboxEl.disabled = true;

  try {
    if (shouldBeDone) {
      await habitsAPI.complete(habitId);
    } else {
      await habitsAPI.undoToday(habitId);
    }

    const parent = checkboxEl.closest('.today-habit');
    if (parent && shouldBeDone) {
      parent.classList.add('done');
    } else if (parent) {
      parent.classList.remove('done');
    }

    const key = todayKey();
    if (!state.completedByDate.has(key)) {
      state.completedByDate.set(key, new Set());
    }

    if (shouldBeDone) {
      state.completedByDate.get(key).add(habitId);
    } else {
      state.completedByDate.get(key).delete(habitId);
    }

    const done = state.completedByDate.get(key).size;
    elements.todayProgress.textContent = `${done} of ${state.totalHabits} habits completed`;
    calendar.render();
  } catch {
    checkboxEl.checked = !shouldBeDone;
    checkboxEl.disabled = false;
    return;
  }

  checkboxEl.disabled = false;
}

function bindHabitCheckEvents() {
  elements.todayHabitList.addEventListener('change', (event) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
      return;
    }

    if (target.disabled) {
      return;
    }

    const habitItem = target.closest('.today-habit');
    if (!habitItem) {
      return;
    }

    const { habitId } = habitItem.dataset;
    if (!habitId) {
      return;
    }

    setHabitDoneState(habitId, target.checked, target);
  });
}

async function loadHomeData() {
  try {
    const result = await habitsAPI.getUserHabits(user.userId);
    const habits = result.habits || [];

    state.totalHabits = habits.length;
    computeCompletedMap(habits);
    renderTodayHabits(habits);
    calendar.render();
  } catch {
    elements.todayHabitList.innerHTML =
      '<li class="today-empty">Unable to load habits. Open Dashboard to refresh.</li>';
    elements.todayProgress.textContent = 'Could not load progress';
    state.totalHabits = 0;
    state.completedByDate.clear();
    calendar.render();
  }
}

initPomodoro({
  focusModeBtn: elements.focusModeBtn,
  breakModeBtn: elements.breakModeBtn,
  ringEl: elements.pomodoroRing,
  timeEl: elements.pomodoroTime,
  startBtn: elements.pomodoroStartBtn,
  resetBtn: elements.pomodoroResetBtn,
  decreaseBtn: elements.durationDecreaseBtn,
  increaseBtn: elements.durationIncreaseBtn,
  durationEl: elements.durationValue,
});

initQuotes({
  stripEl: elements.quoteStrip,
  textEl: elements.quoteText,
  authorEl: elements.quoteAuthor,
});
initWallpaperSwitcher(elements.wallpaperNextBtn);

bindHabitCheckEvents();
loadHomeData();
