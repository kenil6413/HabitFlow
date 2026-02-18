import { habitsAPI, journalAPI } from './api.js';
import { requireAuth, storage, redirect } from './utils.js';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const state = {
  user: null,
  userId: '',
  habits: [],
  editMode: false,
  selectedDate: startOfDay(new Date()),
  photos: [],
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date) {
  const d = startOfDay(date);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseUserId(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw.$oid) return raw.$oid;
  return String(raw);
}

function habitIdOf(habit) {
  return parseUserId(habit?._id);
}

function isSameDay(dateA, dateB) {
  return toDateKey(dateA) === toDateKey(dateB);
}

function getAllCompletionsMap() {
  const map = new Map();

  state.habits.forEach((habit) => {
    (habit.completions || []).forEach((completion) => {
      const key = toDateKey(completion.date);
      map.set(key, (map.get(key) || 0) + 1);
    });
  });

  return map;
}

function getCompletionsCountForDate(map, date) {
  return map.get(toDateKey(date)) || 0;
}

function isHabitDoneToday(habit) {
  return (habit.completions || []).some((completion) =>
    isSameDay(completion.date, new Date())
  );
}

function isHabitDoneOnDate(habit, date) {
  return (habit.completions || []).some((completion) =>
    isSameDay(completion.date, date)
  );
}

function bindProfileMenu() {
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  const logoutLink = document.getElementById('logoutLink');

  profileBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    profileMenu.classList.toggle('active');
  });

  document.addEventListener('click', (event) => {
    if (!profileBtn.contains(event.target) && !profileMenu.contains(event.target)) {
      profileMenu.classList.remove('active');
    }
  });

  logoutLink.addEventListener('click', (event) => {
    event.preventDefault();
    storage.clearUser();
    redirect('index.html');
  });
}

function renderStats() {
  const habits = state.habits;
  const totalHabits = habits.length;
  const doneToday = habits.filter(isHabitDoneToday).length;

  let bestHabit = null;
  habits.forEach((habit) => {
    if (!bestHabit || (habit.currentStreak || 0) > (bestHabit.currentStreak || 0)) {
      bestHabit = habit;
    }
  });

  const now = new Date();
  const last30Start = startOfDay(new Date(now));
  last30Start.setDate(last30Start.getDate() - 29);

  let completionsLast30 = 0;
  const monthDaysLogged = new Set();

  habits.forEach((habit) => {
    (habit.completions || []).forEach((completion) => {
      const completionDate = startOfDay(completion.date);
      if (completionDate >= last30Start && completionDate <= startOfDay(now)) {
        completionsLast30 += 1;
      }
      if (
        completionDate.getMonth() === now.getMonth() &&
        completionDate.getFullYear() === now.getFullYear()
      ) {
        monthDaysLogged.add(toDateKey(completionDate));
      }
    });
  });

  const completionRate = totalHabits
    ? Math.round((completionsLast30 / (totalHabits * 30)) * 100)
    : 0;

  document.getElementById('statActiveHabits').textContent = String(totalHabits);
  document.getElementById('statActiveSub').textContent = `${doneToday} done today`;

  document.getElementById('statBestStreak').textContent = String(
    bestHabit?.currentStreak || 0
  );
  document.getElementById('statBestSub').textContent = bestHabit
    ? bestHabit.name
    : 'No streak yet';

  document.getElementById('statCompletionRate').textContent = `${completionRate}%`;
  document.getElementById('statCompletionSub').textContent = 'Last 30 days';

  document.getElementById('statDaysLogged').textContent = String(monthDaysLogged.size);
  document.getElementById('statDaysSub').textContent = 'This month';
}

function getProgressClass(percent) {
  if (percent >= 70) return 'fill green';
  if (percent <= 35) return 'fill amber';
  return 'fill';
}

function renderStreakProgress() {
  const container = document.getElementById('streakProgressList');
  const habits = [...state.habits]
    .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))
    .slice(0, 4);

  if (!habits.length) {
    container.innerHTML =
      '<div style="font-size:13px;color:var(--muted)">Add habits to see streak progress.</div>';
    return;
  }

  const now = startOfDay(new Date());
  const start = new Date(now);
  start.setDate(start.getDate() - 29);

  container.innerHTML = habits
    .map((habit) => {
      const completedIn30 = (habit.completions || []).filter((completion) => {
        const date = startOfDay(completion.date);
        return date >= start && date <= now;
      }).length;

      const percent = Math.min(100, Math.round((completedIn30 / 30) * 100));
      const fillClass = getProgressClass(percent);

      return `
        <div class="pbar-item">
          <div class="pbar-top">
            <span class="pbar-name">${escapeHtml(habit.name)}</span>
            <span class="pbar-val">${completedIn30} / 30 days</span>
          </div>
          <div class="track"><div class="${fillClass}" style="width:${percent}%"></div></div>
        </div>
      `;
    })
    .join('');
}

function renderWeekRow() {
  const row = document.getElementById('weekRow');
  const map = getAllCompletionsMap();
  const today = startOfDay(new Date());

  const monday = new Date(today);
  const mondayOffset = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - mondayOffset);

  row.innerHTML = DAY_NAMES.map((label, idx) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + idx);

    const hasAny = getCompletionsCountForDate(map, date) > 0;
    const todayClass = isSameDay(date, today) ? ' today' : '';
    const doneClass = hasAny ? ' done' : '';
    const marker = hasAny ? '✓' : '';

    return `
      <div class="wday">
        <div class="wlbl">${label.toUpperCase()}</div>
        <div class="wdot${doneClass}${todayClass}">${marker}</div>
      </div>
    `;
  }).join('');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderHabits() {
  const list = document.getElementById('habitsList');
  const selectedIsToday = isSameDay(state.selectedDate, new Date());

  if (!state.habits.length) {
    list.innerHTML =
      '<div class="habit-item"><div class="hmain"><div class="hname">No habits yet. Add your first habit.</div></div></div>';
    return;
  }

  list.innerHTML = state.habits
    .map((habit) => {
      const doneForSelectedDate = isHabitDoneOnDate(habit, state.selectedDate);
      const description = habit.description
        ? `<p class="hdesc">${escapeHtml(habit.description)}</p>`
        : '';
      const canComplete = selectedIsToday && !doneForSelectedDate;
      const actionLabel = doneForSelectedDate
        ? '✓ Done'
        : selectedIsToday
          ? '✓ Complete'
          : 'View Only';
      const actionClass = doneForSelectedDate ? 'btn-done' : 'btn-complete';

      return `
        <div class="habit-item${doneForSelectedDate ? ' done' : ''}" data-habit-id="${habitIdOf(habit)}">
          <div class="hstrip">
            <button class="sBtn sEdit" data-action="edit" title="Edit">✏️</button>
            <button class="sBtn sDel" data-action="delete" title="Delete">🗑</button>
          </div>
          <div class="hmain">
            <div class="htop">
              <span class="hname">${escapeHtml(habit.name)}</span>
              <button class="btn ${actionClass} btn-sm" data-action="complete" ${
                canComplete ? '' : 'disabled'
              }>
                ${actionLabel}
              </button>
            </div>
            ${description}
            <div class="streak-pill">🔥 ${habit.currentStreak || 0} day streak</div>
          </div>
        </div>
      `;
    })
    .join('');
}

function levelFromCount(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function makeCell(level, width, height, radius) {
  const cell = document.createElement('div');
  cell.className = 'hcell';
  cell.setAttribute('data-l', String(level));
  if (width) cell.style.width = width;
  if (height) cell.style.height = height;
  if (radius) cell.style.borderRadius = radius;
  return cell;
}

function renderHeatmap() {
  const wrap = document.getElementById('hmWrap');
  const label = document.getElementById('hmRangeLabel');
  const summary = document.getElementById('hmSummary');
  const completionMap = getAllCompletionsMap();

  wrap.innerHTML = '';
  wrap.className = '';
  wrap.style.overflowX = '';
  wrap.style.marginBottom = '16px';

  let activeDays = 0;
  let completionsInRange = 0;

  const addTotals = (date) => {
    const count = getCompletionsCountForDate(completionMap, date);
    if (count > 0) {
      activeDays += 1;
      completionsInRange += count;
    }
    return count;
  };

  const year = new Date().getFullYear();
  label.textContent = `Year ${year}`;
  wrap.style.overflowX = 'hidden';

  const yearWrap = document.createElement('div');
  yearWrap.className = 'year-wrap';

  const dayAxis = document.createElement('div');
  dayAxis.className = 'year-axis-day';
  ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].forEach((day) => {
    const item = document.createElement('span');
    item.textContent = day;
    dayAxis.appendChild(item);
  });
  yearWrap.appendChild(dayAxis);

  const yearMain = document.createElement('div');
  yearMain.className = 'year-main';

  const monthRow = document.createElement('div');
  monthRow.className = 'year-month-row';

  const yearGrid = document.createElement('div');
  yearGrid.className = 'year-grid';

  const start = new Date(year, 0, 1);
  const startDow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startDow);

  const end = new Date(year, 11, 31);
  const totalDays = Math.ceil((end - start) / 86400000) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  yearGrid.style.gridTemplateColumns = `repeat(${totalWeeks}, minmax(0, 1fr))`;
  monthRow.style.gridTemplateColumns = `repeat(${totalWeeks}, minmax(0, 1fr))`;

  let lastMonth = -1;

  for (let w = 0; w < totalWeeks; w += 1) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + w * 7);

    const monthLabel = document.createElement('span');
    if (weekStart.getFullYear() === year && weekStart.getMonth() !== lastMonth) {
      monthLabel.textContent = weekStart.toLocaleDateString('en-US', {
        month: 'short',
      });
      lastMonth = weekStart.getMonth();
    } else {
      monthLabel.textContent = '';
    }
    monthRow.appendChild(monthLabel);

    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);

      const inYear = date.getFullYear() === year;
      const level = inYear ? levelFromCount(addTotals(date)) : 0;
      const cell = makeCell(level, null, null, '3px');
      if (!inYear) cell.style.opacity = '0.08';
      yearGrid.appendChild(cell);
    }
  }

  yearMain.appendChild(monthRow);
  yearMain.appendChild(yearGrid);
  yearWrap.appendChild(yearMain);
  wrap.appendChild(yearWrap);

  summary.textContent = `${completionsInRange} completions across ${activeDays} active days`;
}

function renderAll() {
  renderStats();
  renderStreakProgress();
  renderWeekRow();
  renderHabits();
  renderHeatmap();
}

async function refreshHabits() {
  const response = await habitsAPI.getUserHabits(state.userId);
  state.habits = (response.habits || []).map((habit) => ({
    ...habit,
    _id: habitIdOf(habit),
  }));
  renderAll();
}

function bindHabitEvents() {
  const editToggle = document.getElementById('editToggle');
  const habitsList = document.getElementById('habitsList');

  editToggle.addEventListener('click', () => {
    state.editMode = !state.editMode;
    habitsList.classList.toggle('edit-on', state.editMode);
    editToggle.classList.toggle('on', state.editMode);
    editToggle.innerHTML = `<div class="edot"></div> ${state.editMode ? 'Done' : 'Edit'}`;
  });

  const addForm = document.getElementById('addForm');
  const nameInput = document.getElementById('hNameIn');
  const descInput = document.getElementById('hDescIn');

  document.getElementById('openAddBtn').addEventListener('click', () => {
    addForm.classList.toggle('open');
    nameInput.focus();
  });

  document.getElementById('cancelAdd').addEventListener('click', () => {
    addForm.classList.remove('open');
  });

  document.getElementById('saveHabit').addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const description = descInput.value.trim();

    if (!name) return;

    try {
      await habitsAPI.create(state.userId, name, description);
      nameInput.value = '';
      descInput.value = '';
      addForm.classList.remove('open');
      await refreshHabits();
    } catch (error) {
      alert(error.message || 'Unable to create habit');
    }
  });

  habitsList.addEventListener('click', async (event) => {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;

    const item = event.target.closest('[data-habit-id]');
    if (!item) return;

    const habitId = item.getAttribute('data-habit-id');
    const action = actionBtn.getAttribute('data-action');
    const habit = state.habits.find((entry) => habitIdOf(entry) === habitId);

    if (!habit) return;

    try {
      if (action === 'complete') {
        if (!isSameDay(state.selectedDate, new Date())) {
          alert('You can only mark completion for today.');
          return;
        }
        await habitsAPI.complete(habitId);
      }

      if (action === 'delete') {
        const shouldDelete = window.confirm('Delete this habit?');
        if (!shouldDelete) return;
        await habitsAPI.delete(habitId);
      }

      if (action === 'edit') {
        const name = window.prompt('Habit name', habit.name || '');
        if (!name) return;
        const description = window.prompt(
          'Description (optional)',
          habit.description || ''
        );
        await habitsAPI.update(habitId, name.trim(), (description || '').trim());
      }

      await refreshHabits();
    } catch (error) {
      alert(error.message || 'Action failed');
    }
  });
}

function bindMoodPicker() {
  document.querySelectorAll('.moodbtn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.moodbtn').forEach((entry) => {
        entry.classList.remove('on');
      });
      button.classList.add('on');
    });
  });
}

function renderPhotos() {
  const grid = document.getElementById('pgrid');
  const empty = document.getElementById('dropDef');

  if (!state.photos.length) {
    grid.style.display = 'none';
    empty.style.display = 'flex';
    empty.style.flexDirection = 'column';
    empty.style.alignItems = 'center';
    return;
  }

  empty.style.display = 'none';
  grid.style.display = 'grid';
  grid.innerHTML = state.photos
    .map(
      (src, index) => `
      <div class="pwrap">
        <img src="${src}" alt="journal" />
        <button type="button" class="premove" data-remove-photo="${index}">✕</button>
      </div>
    `
    )
    .join('');
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result || '');
    reader.onerror = () => reject(new Error('Unable to read image'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to process image'));
    };

    image.src = objectUrl;
  });
}

async function optimizeImage(file) {
  const image = await loadImageFromFile(file);
  const maxDimension = 1280;
  const longestSide = Math.max(image.width, image.height);
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.78);
}

function estimateBase64Bytes(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const base64 = dataUrl.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

function updateJournalHeader() {
  const formattedDate = state.selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const habitDateLabel = document.getElementById('habitDateLabel');
  const isToday = isSameDay(state.selectedDate, new Date());
  const datePicker = document.getElementById('jDatePicker');

  document.getElementById('jDate').textContent = state.selectedDate.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }
  );

  habitDateLabel.textContent = isToday
    ? 'Showing habits for Today'
    : `Showing habits for ${formattedDate}`;
  datePicker.value = toDateKey(state.selectedDate);
}

async function loadJournalEntry() {
  updateJournalHeader();

  const dateKey = toDateKey(state.selectedDate);
  const response = await journalAPI.getEntry(state.userId, dateKey);
  const entry = response.entry;

  document.getElementById('jEntryText').value = entry?.content || '';
  state.photos = Array.isArray(entry?.images) ? [...entry.images] : [];
  renderPhotos();
  renderHabits();
}

function bindJournalEvents() {
  document.getElementById('jPrev').addEventListener('click', async () => {
    state.selectedDate.setDate(state.selectedDate.getDate() - 1);
    state.selectedDate = startOfDay(state.selectedDate);
    await loadJournalEntry();
  });

  document.getElementById('jNext').addEventListener('click', async () => {
    state.selectedDate.setDate(state.selectedDate.getDate() + 1);
    state.selectedDate = startOfDay(state.selectedDate);
    await loadJournalEntry();
  });

  document.getElementById('jToday').addEventListener('click', async () => {
    state.selectedDate = startOfDay(new Date());
    await loadJournalEntry();
  });

  document.getElementById('jDatePicker').addEventListener('change', async (event) => {
    if (!event.target.value) return;
    state.selectedDate = startOfDay(new Date(event.target.value));
    await loadJournalEntry();
  });

  document.getElementById('jSave').addEventListener('click', async () => {
    try {
      await journalAPI.createOrUpdate(
        state.userId,
        toDateKey(state.selectedDate),
        document.getElementById('jEntryText').value,
        state.photos
      );
      document.querySelector('.jpnum').textContent = 'Saved';
      setTimeout(() => {
        document.querySelector('.jpnum').textContent = "✦ today's entry";
      }, 1200);
    } catch (error) {
      alert(error.message || 'Unable to save journal entry');
    }
  });

  document.getElementById('photoIn').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
    let totalBytes = state.photos.reduce(
      (sum, photo) => sum + estimateBase64Bytes(photo),
      0
    );

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const optimized = await optimizeImage(file);
        const imageBytes = estimateBase64Bytes(optimized);

        if (totalBytes + imageBytes > MAX_TOTAL_BYTES) {
          alert('Image set is too large. Please add fewer/smaller photos.');
          break;
        }

        state.photos.push(optimized);
        totalBytes += imageBytes;
      } catch {
        const fallback = await readFileAsDataURL(file);
        const imageBytes = estimateBase64Bytes(fallback);

        if (totalBytes + imageBytes > MAX_TOTAL_BYTES) {
          alert('Image set is too large. Please add fewer/smaller photos.');
          break;
        }

        state.photos.push(fallback);
        totalBytes += imageBytes;
      }
    }

    renderPhotos();
    event.target.value = '';
  });

  document.getElementById('pgrid').addEventListener('click', (event) => {
    const removeBtn = event.target.closest('[data-remove-photo]');
    if (!removeBtn) return;

    const idx = Number(removeBtn.getAttribute('data-remove-photo'));
    if (Number.isNaN(idx)) return;

    state.photos.splice(idx, 1);
    renderPhotos();
  });
}

async function init() {
  requireAuth();

  state.user = storage.getUser();
  state.userId = parseUserId(state.user?.userId);

  if (!state.userId) {
    storage.clearUser();
    redirect('index.html');
    return;
  }

  bindProfileMenu();
  bindHabitEvents();
  bindMoodPicker();
  bindJournalEvents();

  try {
    await refreshHabits();
    await loadJournalEntry();
  } catch (error) {
    console.error('Dashboard load error:', error);
    alert('Unable to load dashboard data. Please refresh.');
  }
}

init();
