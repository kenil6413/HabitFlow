export function habitIdOf(habit, parseMongoId) {
  return parseMongoId(habit?._id);
}

export function isHabitDoneOnDate(habit, date, isSameDay) {
  return (habit.completions || []).some((completion) =>
    isSameDay(completion.date, date)
  );
}

export function renderHabits({
  habits,
  selectedDate,
  isSameDay,
  escapeHtml,
  habitIdResolver,
}) {
  const list = document.getElementById('habitsList');
  const selectedIsToday = isSameDay(selectedDate, new Date());

  if (!habits.length) {
    list.innerHTML =
      '<div class="habit-item"><div class="hmain"><div class="hname">No habits yet. Add your first habit.</div></div></div>';
    return;
  }

  list.innerHTML = habits
    .map((habit) => {
      const doneForSelectedDate = isHabitDoneOnDate(habit, selectedDate, isSameDay);
      const description = habit.description
        ? `<p class="hdesc">${escapeHtml(habit.description)}</p>`
        : '';
      const actionLabel = doneForSelectedDate
        ? '↺ Undo'
        : selectedIsToday
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
              <button class="btn ${actionClass} btn-sm" data-action="complete" ${
                selectedIsToday ? '' : 'disabled'
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
}) {
  const editToggle = document.getElementById('editToggle');
  const habitsList = document.getElementById('habitsList');
  const addForm = document.getElementById('addForm');
  const nameInput = document.getElementById('hNameIn');
  const descInput = document.getElementById('hDescIn');

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
    const habit = state.habits.find((entry) => habitIdResolver(entry) === habitId);

    if (!habit) return;

    try {
      if (action === 'complete') {
        if (!isSameDay(state.selectedDate, new Date())) {
          alert('You can only mark completion for today.');
          return;
        }
        const doneForToday = isHabitDoneOnDate(habit, new Date(), isSameDay);
        if (doneForToday) {
          await habitsAPI.undoToday(habitId);
        } else {
          await habitsAPI.complete(habitId);
        }
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

      await refresh();
    } catch (error) {
      alert(error.message || 'Action failed');
    }
  });
}
