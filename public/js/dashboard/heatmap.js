function getProgressClass(percent) {
  if (percent >= 70) return 'fill green';
  if (percent <= 35) return 'fill amber';
  return 'fill';
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

function getAllCompletionsMap(habits, toDateKey) {
  const map = new Map();
  habits.forEach((habit) => {
    (habit.completions || []).forEach((completion) => {
      const key = toDateKey(completion.date);
      map.set(key, (map.get(key) || 0) + 1);
    });
  });
  return map;
}

function getCompletionsCountForDate(map, date, toDateKey) {
  return map.get(toDateKey(date)) || 0;
}

export function renderStreakProgress({ habits, startOfDay, escapeHtml }) {
  const container = document.getElementById('streakProgressList');
  const topHabits = [...habits]
    .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))
    .slice(0, 4);

  if (!topHabits.length) {
    container.innerHTML =
      '<div style="font-size:13px;color:var(--muted)">Add habits to see streak progress.</div>';
    return;
  }

  const now = startOfDay(new Date());
  const start = new Date(now);
  start.setDate(start.getDate() - 29);

  container.innerHTML = topHabits
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

export function renderWeekRow({ habits, dayNames, startOfDay, isSameDay, toDateKey }) {
  const row = document.getElementById('weekRow');
  const completionMap = getAllCompletionsMap(habits, toDateKey);
  const today = startOfDay(new Date());

  const monday = new Date(today);
  const mondayOffset = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - mondayOffset);

  row.innerHTML = dayNames
    .map((label, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);

      const hasAny = getCompletionsCountForDate(completionMap, date, toDateKey) > 0;
      const todayClass = isSameDay(date, today) ? ' today' : '';
      const doneClass = hasAny ? ' done' : '';
      const marker = hasAny ? '✓' : '';

      return `
        <div class="wday">
          <div class="wlbl">${label.toUpperCase()}</div>
          <div class="wdot${doneClass}${todayClass}">${marker}</div>
        </div>
      `;
    })
    .join('');
}

let _year = new Date().getFullYear();
let _habits = [];
let _toDateKey = null;

function drawGrid(year) {
  const wrap = document.getElementById('hmWrap');
  const summary = document.getElementById('hmSummary');
  const completionMap = getAllCompletionsMap(_habits, _toDateKey);

  // Update label buttons
  document.getElementById('hmYearLabel').textContent = `Year ${year}`;
  document.getElementById('hmNextYear').disabled = year >= new Date().getFullYear();

  wrap.innerHTML = '';
  wrap.style.overflowX = 'hidden';
  wrap.style.marginBottom = '16px';

  let activeDays = 0;
  let completionsInRange = 0;

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
      monthLabel.textContent = weekStart.toLocaleDateString('en-US', { month: 'short' });
      lastMonth = weekStart.getMonth();
    } else {
      monthLabel.textContent = '';
    }
    monthRow.appendChild(monthLabel);

    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);

      const inYear = date.getFullYear() === year;
      const count = inYear
        ? (() => {
            const c = getCompletionsCountForDate(completionMap, date, _toDateKey);
            if (c > 0) { activeDays += 1; completionsInRange += c; }
            return c;
          })()
        : 0;
      const level = inYear ? levelFromCount(count) : 0;
      const cell = makeCell(level, null, null, '3px');
      if (inYear) {
        const dl = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        cell.title = count === 1 ? `${dl}: 1 habit` : `${dl}: ${count} habits`;
      }
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

export function renderHeatmap({ habits, toDateKey }) {
  _habits = habits;
  _toDateKey = toDateKey;
  _year = new Date().getFullYear();

  // Build nav buttons once into hmRangeLabel
  const label = document.getElementById('hmRangeLabel');
  label.innerHTML = `
    <button id="hmPrevYear" class="hm-nav-btn">&#8249;</button>
    <span id="hmYearLabel" style="font-size:14px;font-weight:700;color:var(--accent);font-family:'Lora',Georgia,serif;min-width:80px;text-align:center;">Year ${_year}</span>
    <button id="hmNextYear" class="hm-nav-btn" disabled>&#8250;</button>
  `;
  label.style.display = 'flex';
  label.style.alignItems = 'center';
  label.style.gap = '6px';

  document.getElementById('hmPrevYear').addEventListener('click', () => {
    _year -= 1;
    drawGrid(_year);
  });

  document.getElementById('hmNextYear').addEventListener('click', () => {
    if (_year >= new Date().getFullYear()) return;
    _year += 1;
    drawGrid(_year);
  });

  drawGrid(_year);
}