export function renderStats({ habits, startOfDay, toDateKey, isSameDay }) {
  const totalHabits = habits.length;
  const doneToday = habits.filter((habit) =>
    (habit.completions || []).some((completion) =>
      isSameDay(completion.date, new Date())
    )
  ).length;

  let bestHabit = null;
  habits.forEach((habit) => {
    if (
      !bestHabit ||
      (habit.currentStreak || 0) > (bestHabit.currentStreak || 0)
    ) {
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
  document.getElementById('statActiveSub').textContent =
    `${doneToday} done today`;

  document.getElementById('statBestStreak').textContent = String(
    bestHabit?.currentStreak || 0
  );
  document.getElementById('statBestSub').textContent = bestHabit
    ? bestHabit.name
    : 'No streak yet';

  document.getElementById('statCompletionRate').textContent =
    `${completionRate}%`;
  document.getElementById('statCompletionSub').textContent = 'Last 30 days';

  document.getElementById('statDaysLogged').textContent = String(
    monthDaysLogged.size
  );
  document.getElementById('statDaysSub').textContent = 'This month';
}
