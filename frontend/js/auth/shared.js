import { escapeHtml } from '../client-helpers.js';

export function setAlert(container, type, message) {
  container.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
}

export function clearAlert(container) {
  container.innerHTML = '';
}

export function setButtonState(button, { disabled, text }) {
  button.disabled = disabled;
  button.textContent = text;
}
