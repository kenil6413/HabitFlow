export function initPomodoro({
  focusModeBtn,
  breakModeBtn,
  ringEl,
  timeEl,
  startBtn,
  resetBtn,
  decreaseBtn,
  increaseBtn,
  durationEl,
}) {
  const MIN_FOCUS_MINUTES = 25;
  const MIN_BREAK_MINUTES = 5;
  const STEP_FOCUS_MINUTES = 25;
  const STEP_BREAK_MINUTES = 5;

  let focusMinutes = MIN_FOCUS_MINUTES;
  let breakMinutes = MIN_BREAK_MINUTES;
  let mode = 'focus';
  let remainingSeconds = focusMinutes * 60;
  let timerId = null;
  let modeTotalSeconds = focusMinutes * 60;

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function render() {
    timeEl.textContent = formatTime(remainingSeconds);

    const progress = Math.max(
      0,
      Math.min(1, (modeTotalSeconds - remainingSeconds) / modeTotalSeconds)
    );

    ringEl.style.setProperty('--progress-deg', `${Math.round(progress * 360)}deg`);
    durationEl.textContent = `${mode === 'focus' ? focusMinutes : breakMinutes} min`;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isFocus = mode === 'focus';

    focusModeBtn.classList.toggle('active', isFocus);
    breakModeBtn.classList.toggle('active', !isFocus);

    modeTotalSeconds = (isFocus ? focusMinutes : breakMinutes) * 60;
    remainingSeconds = modeTotalSeconds;

    clearInterval(timerId);
    timerId = null;
    startBtn.textContent = 'Start';

    render();
  }

  function toggleTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      startBtn.textContent = 'Start';
      return;
    }

    startBtn.textContent = 'Pause';
    timerId = setInterval(() => {
      remainingSeconds -= 1;

      if (remainingSeconds <= 0) {
        clearInterval(timerId);
        timerId = null;
        remainingSeconds = 0;
        startBtn.textContent = 'Start';
      }

      render();
    }, 1000);
  }

  focusModeBtn.addEventListener('click', () => setMode('focus'));
  breakModeBtn.addEventListener('click', () => setMode('break'));
  startBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', () => setMode(mode));

  increaseBtn.addEventListener('click', () => {
    if (mode === 'focus') {
      focusMinutes += STEP_FOCUS_MINUTES;
    } else {
      breakMinutes += STEP_BREAK_MINUTES;
    }

    setMode(mode);
  });

  decreaseBtn.addEventListener('click', () => {
    if (mode === 'focus') {
      focusMinutes = Math.max(MIN_FOCUS_MINUTES, focusMinutes - STEP_FOCUS_MINUTES);
    } else {
      breakMinutes = Math.max(MIN_BREAK_MINUTES, breakMinutes - STEP_BREAK_MINUTES);
    }

    setMode(mode);
  });

  render();
}
