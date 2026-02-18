import { startOfDay } from '../client-helpers.js';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function initCalendar({
  gridEl,
  monthYearEl,
  prevBtn,
  nextBtn,
  getDayStatus,
}) {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  const today = startOfDay(new Date());

  function render() {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    monthYearEl.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    gridEl.innerHTML = '';

    for (let i = 0; i < startingDayOfWeek; i += 1) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day empty';
      gridEl.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.textContent = day;

      const cellDate = startOfDay(new Date(currentYear, currentMonth, day));

      if (
        cellDate.getTime() === today.getTime() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear()
      ) {
        cell.classList.add('today');
      }

      const status = getDayStatus(cellDate, today);
      if (status) {
        cell.classList.add('has-dot', `dot-${status}`);
      }

      gridEl.appendChild(cell);
    }
  }

  prevBtn.addEventListener('click', () => {
    currentMonth -= 1;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear -= 1;
    }
    render();
  });

  nextBtn.addEventListener('click', () => {
    currentMonth += 1;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear += 1;
    }
    render();
  });

  render();

  return {
    render,
  };
}
