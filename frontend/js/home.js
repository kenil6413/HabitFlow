import { habitsAPI } from './api.js';
import { initAuthenticatedPage } from './page-bootstrap.js';
import { escapeHtml, toDateKey } from './client-helpers.js';
import { initPomodoro } from './home/pomodoro.js';
import { initCalendar } from './home/calendar.js';
import { initQuotes } from './home/quotes.js';
import { initWallpaperSwitcher } from './home/wallpaper.js';

const user = initAuthenticatedPage({ activeNav: 'home' });

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
  neverMissCard: document.getElementById('neverMissCard'),
  neverMissHabit: document.getElementById('neverMissHabit'),
  neverMissText: document.getElementById('neverMissText'),
};

const state = {
  completedByDate: new Map(),
  totalHabits: 0,
  habits: [],
  neverMissHabitId: null,
  recoveryTimeoutId: null,
};

const todayKey = () => toDateKey(new Date());

// Returns 0=Mon ... 6=Sun to match the frequency array convention
function getDayIndexFromDate(dateObj) {
  const jsDay = dateObj.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0 ... Sun=6
}

function getHabitsForDate(habits, dateObj) {
  const dayIdx = getDayIndexFromDate(dateObj);
  return habits.filter((habit) => {
    // No frequency set means habit is expected every day
    if (!Array.isArray(habit.frequency) || habit.frequency.length === 0)
      return true;

    // Accept both numeric and legacy string day values (e.g. "0"..."6")
    return habit.frequency.some((value) => Number(value) === dayIdx);
  });
}

// Filter habits scheduled for today based on frequency
function getHabitsForToday(habits) {
  return getHabitsForDate(habits, new Date());
}

function getCompletedSetForDate(dateKey) {
  return state.completedByDate.get(dateKey) || new Set();
}

function getCompletedCountForHabits(habits, completedSet) {
  return habits.reduce((count, habit) => {
    return completedSet.has(String(habit._id)) ? count + 1 : count;
  }, 0);
}

function updateTodayProgress(todayHabits) {
  const completedToday = getCompletedSetForDate(todayKey());
  const doneCount = getCompletedCountForHabits(todayHabits, completedToday);

  if (doneCount === todayHabits.length && todayHabits.length > 0) {
    elements.todayProgress.textContent = `🎉 All ${todayHabits.length} habits done — great work today!`;
    return;
  }

  elements.todayProgress.textContent = `${doneCount} of ${todayHabits.length} habits completed`;
}

function setNeverMissVisible(visible) {
  elements.neverMissCard.classList.toggle('is-visible', visible);
  elements.neverMissCard.setAttribute(
    'aria-hidden',
    visible ? 'false' : 'true'
  );
}

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
  if (dateObj.getTime() > today.getTime()) return null;

  const scheduledHabits = getHabitsForDate(state.habits, dateObj);
  if (!scheduledHabits.length) return null;

  const key = toDateKey(dateObj);
  const completedSet = getCompletedSetForDate(key);
  const doneCount = getCompletedCountForHabits(scheduledHabits, completedSet);

  if (doneCount === 0) return 'none';
  if (doneCount === scheduledHabits.length) return 'full';
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
  const todayHabits = getHabitsForToday(habits);
  const completedToday = getCompletedSetForDate(todayKey());

  // No habits scheduled for today
  if (!todayHabits.length) {
    const hasAnyHabits = habits.length > 0;
    elements.todayHabitList.innerHTML = `
      <li class="today-empty">
        ${
          hasAnyHabits
            ? '🎉 No habits scheduled for today — enjoy your rest day!'
            : 'No habits yet. Add your first habit from Dashboard.'
        }
      </li>
    `;
    elements.todayProgress.textContent = hasAnyHabits
      ? 'Rest day — nothing scheduled today'
      : '0 of 0 habits completed';
    return;
  }

  elements.todayHabitList.innerHTML = todayHabits
    .map((habit) => {
      const habitId = String(habit._id);
      const isDone = completedToday.has(habitId);

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

  updateTodayProgress(todayHabits);
}

function renderNeverMissTwice(habits) {
  if (state.recoveryTimeoutId) {
    clearTimeout(state.recoveryTimeoutId);
    state.recoveryTimeoutId = null;
  }

  const todayDone = state.completedByDate.get(todayKey()) || new Set();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDone =
    state.completedByDate.get(toDateKey(yesterday)) || new Set();

  const rescueHabits = habits
    .filter((habit) => {
      const habitId = String(habit._id);
      return yesterdayDone.has(habitId) && !todayDone.has(habitId);
    })
    .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0));

  if (!rescueHabits.length) {
    state.neverMissHabitId = null;
    elements.neverMissCard.classList.remove('never-miss-card-success');
    setNeverMissVisible(false);
    return;
  }

  const habit = rescueHabits[0];
  state.neverMissHabitId = String(habit._id);
  elements.neverMissCard.classList.remove('never-miss-card-success');
  elements.neverMissHabit.textContent = habit.name;

  if (habit.tinyVersion) {
    elements.neverMissText.textContent = `Try the 2-minute version now: ${habit.tinyVersion}.`;
  } else {
    elements.neverMissText.textContent =
      'Start with a tiny action now so this habit gets back on track today.';
  }

  setNeverMissVisible(true);
}

function showNeverMissRecoveryMessage() {
  setNeverMissVisible(true);
  elements.neverMissCard.classList.add('never-miss-card-success');
  elements.neverMissHabit.textContent = 'Great recovery.';
  elements.neverMissText.textContent = "You didn't miss twice today.";
  state.neverMissHabitId = null;

  state.recoveryTimeoutId = window.setTimeout(() => {
    setNeverMissVisible(false);
    elements.neverMissCard.classList.remove('never-miss-card-success');
    state.recoveryTimeoutId = null;
  }, 1700);
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

    if (shouldBeDone && state.neverMissHabitId === habitId) {
      showNeverMissRecoveryMessage();
    } else {
      renderNeverMissTwice(state.habits);
    }

    updateTodayProgress(getHabitsForToday(state.habits));

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

    if (!(target instanceof HTMLInputElement) || target.type !== 'checkbox')
      return;
    if (target.disabled) return;

    const habitItem = target.closest('.today-habit');
    if (!habitItem) return;

    const { habitId } = habitItem.dataset;
    if (!habitId) return;

    setHabitDoneState(habitId, target.checked, target);
  });
}

async function loadHomeData() {
  try {
    const result = await habitsAPI.getUserHabits(user.userId);
    const habits = result.habits || [];

    state.habits = habits;
    state.totalHabits = habits.length;
    computeCompletedMap(habits);
    renderTodayHabits(habits);
    renderNeverMissTwice(habits);
    calendar.render();
  } catch {
    elements.todayHabitList.innerHTML =
      '<li class="today-empty">Unable to load habits. Open Dashboard to refresh.</li>';
    elements.todayProgress.textContent = 'Could not load progress';
    state.habits = [];
    setNeverMissVisible(false);
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
