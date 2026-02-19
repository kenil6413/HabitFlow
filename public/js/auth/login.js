import { authAPI } from '../api.js';
import { storage, redirect } from '../utils.js';
import { setAlert, clearAlert, setButtonState } from './shared.js';

if (storage.isLoggedIn()) {
  redirect('dashboard.html');
}

const loginForm = document.getElementById('loginForm');
const alertContainer = document.getElementById('alertContainer');
const authCard = document.getElementById('authCard');

function shakeCard() {
  authCard.classList.remove('shake');
  // Force reflow so animation replays if already shaking
  void authCard.offsetWidth;
  authCard.classList.add('shake');
  authCard.addEventListener('animationend', () => {
    authCard.classList.remove('shake');
  }, { once: true });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');

  clearAlert(alertContainer);

  try {
    setButtonState(submitBtn, { disabled: true, text: 'Logging in...' });

    const data = await authAPI.login(username, password);

    storage.setUser({
      userId: data.userId,
      username: data.username,
      shareCode: data.shareCode,
    });

    setAlert(alertContainer, 'success', 'Login successful! Redirecting...');

    setTimeout(() => {
      redirect('home.html');
    }, 1000);
  } catch (error) {
    setAlert(alertContainer, 'error', error.message || 'Login failed');
    setButtonState(submitBtn, { disabled: false, text: 'Login' });
    shakeCard();
  }
});