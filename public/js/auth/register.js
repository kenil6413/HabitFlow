import { authAPI } from '../api.js';
import { storage, redirect } from '../utils.js';
import { setAlert, clearAlert, setButtonState } from './shared.js';

if (storage.isLoggedIn()) {
  redirect('home.html');
}

const registerForm = document.getElementById('registerForm');
const alertContainer = document.getElementById('alertContainer');

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const submitBtn = registerForm.querySelector('button[type="submit"]');

  clearAlert(alertContainer);

  if (password !== confirmPassword) {
    setAlert(alertContainer, 'error', 'Passwords do not match!');
    return;
  }

  try {
    setButtonState(submitBtn, { disabled: true, text: 'Creating account...' });

    const data = await authAPI.register(username, password);

    storage.setUser({
      userId: data.userId,
      username: data.username,
      shareCode: data.shareCode,
    });

    alertContainer.innerHTML = `
      <div class="alert alert-success">
        <strong>Account created successfully!</strong><br>
        Your share code: <strong>${data.shareCode}</strong><br>
        Share this code with friends to connect!<br>
        Redirecting to dashboard...
      </div>
    `;

    setTimeout(() => {
      redirect('home.html');
    }, 3000);
  } catch (error) {
    setAlert(alertContainer, 'error', error.message || 'Registration failed');
    setButtonState(submitBtn, { disabled: false, text: 'Create Account' });
  }
});
