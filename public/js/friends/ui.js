import { escapeHtml } from '../client-helpers.js';

export function createFriendsUI({
  alertContainer,
  modalEl,
  modalLoadingEl,
  modalHabitsListEl,
  spotlightStatsEl,
}) {
  function showAlert(message, type) {
    alertContainer.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
    setTimeout(() => {
      alertContainer.innerHTML = '';
    }, 3000);
  }

  function openModal() {
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  function showModalLoading() {
    modalLoadingEl.classList.remove('hidden');
    spotlightStatsEl.classList.add('hidden');
    modalHabitsListEl.innerHTML = '';
  }

  function hideModalLoading() {
    modalLoadingEl.classList.add('hidden');
  }

  function setModalError(message, onClose) {
    hideModalLoading();
    spotlightStatsEl.classList.add('hidden');
    modalHabitsListEl.innerHTML = `
      <div class="alert alert-error">${escapeHtml(message)}</div>
      <button type="button" class="btn btn-secondary mt-2" id="modalCloseOnError">Close</button>
    `;
    document.getElementById('modalCloseOnError')?.addEventListener('click', onClose);
  }

  return {
    showAlert,
    openModal,
    closeModal,
    showModalLoading,
    hideModalLoading,
    setModalError,
  };
}
