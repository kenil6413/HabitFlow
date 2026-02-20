export function habitIdOf(habit, parseMongoId) {
  return parseMongoId(habit?._id);
}

export function isHabitDoneOnDate(habit, date, isSameDay) {
  return (habit.completions || []).some((completion) =>
    isSameDay(completion.date, date)
  );
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function frequencyLabel(frequency) {
  if (!Array.isArray(frequency) || !frequency.length) return '';
  if (frequency.length === 7) return 'Every day';
  const names = [...frequency].sort((a, b) => a - b).map((d) => DAY_NAMES[d]);
  return `${names.join(', ')} (${frequency.length}x/week)`;
}

function frequencySummaryText(selected) {
  if (!selected.size) return 'No days selected — habit will show every day';
  if (selected.size === 7) return 'Every day — 7x per week';
  const names = [...selected].sort((a, b) => a - b).map((d) => DAY_NAMES[d]);
  return `${names.join(', ')} — ${selected.size}x per week`;
}

function renderDayPicker(selectedDays = []) {
  const selected = new Set(selectedDays);
  const days = DAY_NAMES.map(
    (name, i) => `
    <button type="button" class="day-btn${selected.has(i) ? ' selected' : ''}" data-day="${i}">${name}</button>
  `
  ).join('');

  return `
    <div class="freq-wrap" id="freqWrap">
      <div class="freq-label">FREQUENCY — Which days?</div>
      <div class="day-shortcuts">
        <button type="button" class="day-shortcut" data-preset="every">Every day</button>
        <button type="button" class="day-shortcut" data-preset="weekdays">Weekdays</button>
        <button type="button" class="day-shortcut" data-preset="weekends">Weekends</button>
        <button type="button" class="day-shortcut" data-preset="none">Clear</button>
      </div>
      <div class="day-picker" id="dayPicker">${days}</div>
      <div class="freq-summary" id="freqSummary">${frequencySummaryText(selected)}</div>
    </div>
  `;
}

function bindDayPicker(container) {
  const selected = new Set(
    [...container.querySelectorAll('.day-btn.selected')].map((b) =>
      Number(b.dataset.day)
    )
  );

  function update() {
    container.querySelector('#freqSummary').textContent =
      frequencySummaryText(selected);
  }

  container.querySelectorAll('.day-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = Number(btn.dataset.day);
      if (selected.has(d)) {
        selected.delete(d);
        btn.classList.remove('selected');
      } else {
        selected.add(d);
        btn.classList.add('selected');
      }
      update();
    });
  });

  container.querySelectorAll('.day-shortcut').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      selected.clear();
      if (preset === 'every')
        [0, 1, 2, 3, 4, 5, 6].forEach((d) => selected.add(d));
      if (preset === 'weekdays')
        [0, 1, 2, 3, 4].forEach((d) => selected.add(d));
      if (preset === 'weekends') [5, 6].forEach((d) => selected.add(d));
      container.querySelectorAll('.day-btn').forEach((b) => {
        b.classList.toggle('selected', selected.has(Number(b.dataset.day)));
      });
      update();
    });
  });

  return { getSelected: () => [...selected] };
}

export function renderHabits({
  habits,
  selectedDate,
  isSameDay,
  escapeHtml,
  habitIdResolver,
  canEditSelectedDate,
}) {
  function to12Hour(time) {
    if (!time || !time.includes(':')) return time;
    const [hourRaw, minute] = time.split(':');
    const hour = Number(hourRaw);
    if (Number.isNaN(hour)) return time;
    const period = hour >= 12 ? 'PM' : 'AM';
    const normalizedHour = hour % 12 || 12;
    return `${normalizedHour}:${minute} ${period}`;
  }

  function renderPlanMeta(habit, escapeHtmlValue) {
    const chips = [];
    if (habit.cueTime) {
      chips.push(
        `<span class="habit-chip">At ${escapeHtmlValue(to12Hour(habit.cueTime))}</span>`
      );
    }
    if (habit.cueLocation) {
      chips.push(
        `<span class="habit-chip">In ${escapeHtmlValue(habit.cueLocation)}</span>`
      );
    }
    if (habit.stackAfter) {
      chips.push(
        `<span class="habit-chip">After ${escapeHtmlValue(habit.stackAfter)}</span>`
      );
    }
    if (Array.isArray(habit.frequency) && habit.frequency.length) {
      chips.push(
        `<span class="habit-chip">📅 ${frequencyLabel(habit.frequency)}</span>`
      );
    }
    if (!chips.length) return '';
    return `<div class="habit-plan">${chips.join('')}</div>`;
  }

  function renderTinyVersion(habit, escapeHtmlValue) {
    if (!habit.tinyVersion) return '';
    return `<div class="habit-tiny">2-minute version: ${escapeHtmlValue(habit.tinyVersion)}</div>`;
  }

  const list = document.getElementById('habitsList');
  const canEdit = canEditSelectedDate();

  if (!habits.length) {
    list.innerHTML =
      '<div class="habit-item"><div class="hmain"><div class="hname">No habits yet. Add your first habit.</div></div></div>';
    return;
  }

  list.innerHTML = habits
    .map((habit) => {
      const doneForSelectedDate = isHabitDoneOnDate(
        habit,
        selectedDate,
        isSameDay
      );
      const description = habit.description
        ? `<p class="hdesc">${escapeHtml(habit.description)}</p>`
        : '';
      const planMeta = renderPlanMeta(habit, escapeHtml);
      const tinyVersion = renderTinyVersion(habit, escapeHtml);
      const actionLabel = doneForSelectedDate
        ? '↺ Undo'
        : canEdit
          ? '✓ Complete'
          : 'View Only';
      const actionClass = doneForSelectedDate ? 'btn-done' : 'btn-complete';

      return `
        <div class="habit-item${doneForSelectedDate ? ' done' : ''}" data-habit-id="${habitIdResolver(habit)}">
          <div class="hstrip">
            <button class="sBtn sEdit" data-action="edit" title="Edit">✏️</button>
            <button class="sBtn sDel" data-action="delete" title="Delete">🗑</button>
          </div>
          <div class="hmain">
            <div class="htop">
              <span class="hname">${escapeHtml(habit.name)}</span>
              <button class="btn ${actionClass} btn-sm" data-action="complete" ${canEdit ? '' : 'disabled'}>
                ${actionLabel}
              </button>
            </div>
            ${description}
            ${planMeta}
            ${tinyVersion}
            <div class="streak-pill">🔥 ${habit.currentStreak || 0} day streak</div>
          </div>
        </div>
      `;
    })
    .join('');
}

export async function refreshHabits({ habitsAPI, userId, habitIdResolver }) {
  const response = await habitsAPI.getUserHabits(userId);
  return (response.habits || []).map((habit) => ({
    ...habit,
    _id: habitIdResolver(habit),
  }));
}

export function bindHabitEvents({
  state,
  habitsAPI,
  refresh,
  isSameDay,
  habitIdResolver,
  canEditSelectedDate,
  onToggleCompletion,
}) {
  const editToggle = document.getElementById('editToggle');
  const habitsList = document.getElementById('habitsList');
  const addForm = document.getElementById('addForm');
  const nameInput = document.getElementById('hNameIn');
  const descInput = document.getElementById('hDescIn');
  const cueTimeInput = document.getElementById('hCueTimeIn');
  const cueLocationInput = document.getElementById('hCueLocationIn');
  const stackAfterInput = document.getElementById('hStackAfterIn');
  const tinyVersionInput = document.getElementById('hTinyVersionIn');

  // Inject day picker into add form after tinyVersionInput
  const freqContainer = document.createElement('div');
  freqContainer.innerHTML = renderDayPicker();
  tinyVersionInput.parentNode.insertBefore(
    freqContainer,
    tinyVersionInput.nextSibling
  );
  let dayPickerCtrl = bindDayPicker(freqContainer);

  function resetAddForm() {
    nameInput.value = '';
    descInput.value = '';
    cueTimeInput.value = '';
    cueLocationInput.value = '';
    stackAfterInput.value = '';
    tinyVersionInput.value = '';
    freqContainer.innerHTML = renderDayPicker();
    dayPickerCtrl = bindDayPicker(freqContainer);
  }

  editToggle.addEventListener('click', () => {
    state.editMode = !state.editMode;
    habitsList.classList.toggle('edit-on', state.editMode);
    editToggle.classList.toggle('on', state.editMode);
    editToggle.innerHTML = `<div class="edot"></div> ${state.editMode ? 'Done' : 'Edit'}`;
  });

  document.getElementById('openAddBtn').addEventListener('click', () => {
    addForm.classList.toggle('open');
    nameInput.focus();
  });

  document.getElementById('cancelAdd').addEventListener('click', () => {
    addForm.classList.remove('open');
    resetAddForm();
  });

  document.getElementById('saveHabit').addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const plan = {
      cueTime: cueTimeInput.value,
      cueLocation: cueLocationInput.value.trim(),
      stackAfter: stackAfterInput.value.trim(),
      tinyVersion: tinyVersionInput.value.trim(),
      frequency: dayPickerCtrl.getSelected(),
    };

    if (!name) return;

    try {
      await habitsAPI.create(state.userId, name, description, plan);
      resetAddForm();
      addForm.classList.remove('open');
      await refresh();
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
    const habit = state.habits.find(
      (entry) => habitIdResolver(entry) === habitId
    );

    if (!habit) return;

    try {
      if (action === 'complete') {
        if (!canEditSelectedDate()) {
          alert('You can only complete habits for today.');
          return;
        }
        const doneForSelectedDate = isHabitDoneOnDate(
          habit,
          state.selectedDate,
          isSameDay
        );
        await onToggleCompletion(habitId, doneForSelectedDate);
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
        await habitsAPI.update(
          habitId,
          name.trim(),
          (description || '').trim()
        );
      }

      await refresh();
    } catch (error) {
      alert(error.message || 'Action failed');
    }
  });
}
