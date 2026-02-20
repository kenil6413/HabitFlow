import {
  readFileAsDataURL,
  optimizeImage,
  estimateBase64Bytes,
} from './image-utils.js';

export function bindMoodPicker() {
  document.querySelectorAll('.moodbtn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.moodbtn').forEach((entry) => {
        entry.classList.remove('on');
      });
      button.classList.add('on');
    });
  });
}

export function createJournalController({
  state,
  journalAPI,
  toDateKey,
  startOfDay,
  isSameDay,
  renderHabits,
}) {
  function formatLongDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatDateTime(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function setJournalMeta(entry) {
    const footer = document.querySelector('.jpnum');
    const sub = document.querySelector('.jsub');
    if (!footer || !sub) return;

    const selectedLabel = formatLongDate(state.selectedDate);
    if (!entry) {
      sub.textContent = 'No entry saved for this date';
      footer.textContent = `No entry for ${selectedLabel}`;
      return;
    }

    const createdText = formatDateTime(entry.createdAt);
    const updatedText = formatDateTime(entry.updatedAt);
    sub.textContent = 'Entry found for selected date';

    if (createdText && updatedText && createdText !== updatedText) {
      footer.textContent = `Created: ${createdText} • Updated: ${updatedText}`;
      return;
    }

    footer.textContent = `Saved: ${updatedText || createdText || selectedLabel}`;
  }

  function renderPhotos() {
    const grid = document.getElementById('pgrid');
    const empty = document.getElementById('dropDef');

    if (!state.photos.length) {
      grid.style.display = 'none';
      empty.style.display = 'flex';
      empty.style.flexDirection = 'column';
      empty.style.alignItems = 'center';
      return;
    }

    empty.style.display = 'none';
    grid.style.display = 'grid';
    grid.innerHTML = state.photos
      .map(
        (src, index) => `
        <div class="pwrap">
          <img src="${src}" alt="journal" />
          <button type="button" class="premove" data-remove-photo="${index}">✕</button>
        </div>
      `
      )
      .join('');
  }

  function updateJournalHeader() {
    const formattedDate = formatLongDate(state.selectedDate);

    const habitDateLabel = document.getElementById('habitDateLabel');
    const isToday = isSameDay(state.selectedDate, new Date());
    const datePicker = document.getElementById('jDatePicker');
    const writingLabel = document.querySelector('.jwlabel');

    document.getElementById('jDate').textContent = formattedDate;

    habitDateLabel.textContent = isToday
      ? 'Showing habits for Today'
      : `Showing habits for ${formattedDate}`;

    if (writingLabel) {
      writingLabel.textContent = isToday
        ? "✍️ Today's thoughts..."
        : `✍️ Thoughts for ${formattedDate}`;
    }

    datePicker.value = toDateKey(state.selectedDate);
  }

  async function loadJournalEntry() {
    updateJournalHeader();

    const dateKey = toDateKey(state.selectedDate);
    const response = await journalAPI.getEntry(state.userId, dateKey);
    const entry = response.entry;

    document.getElementById('jEntryText').value = entry?.content || '';
    state.photos = Array.isArray(entry?.images) ? [...entry.images] : [];
    renderPhotos();
    setJournalMeta(entry);
    renderHabits();
  }

  function bindJournalEvents() {
    const photoInput = document.getElementById('photoIn');
    const photoDropzone = document.getElementById('photoDropzone');

    if (photoDropzone && photoInput) {
      photoDropzone.addEventListener('click', (event) => {
        if (event.target.closest('[data-remove-photo]')) return;
        photoInput.click();
      });

      photoDropzone.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        photoInput.click();
      });
    }

    document.getElementById('jPrev').addEventListener('click', async () => {
      state.selectedDate.setDate(state.selectedDate.getDate() - 1);
      state.selectedDate = startOfDay(state.selectedDate);
      await loadJournalEntry();
    });

    document.getElementById('jNext').addEventListener('click', async () => {
      state.selectedDate.setDate(state.selectedDate.getDate() + 1);
      state.selectedDate = startOfDay(state.selectedDate);
      await loadJournalEntry();
    });

    document.getElementById('jToday').addEventListener('click', async () => {
      state.selectedDate = startOfDay(new Date());
      await loadJournalEntry();
    });

    document
      .getElementById('jDatePicker')
      .addEventListener('change', async (event) => {
        if (!event.target.value) return;
        state.selectedDate = startOfDay(new Date(event.target.value));
        await loadJournalEntry();
      });

    document.getElementById('jSave').addEventListener('click', async () => {
      try {
        await journalAPI.createOrUpdate(
          state.userId,
          toDateKey(state.selectedDate),
          document.getElementById('jEntryText').value,
          state.photos
        );
        document.querySelector('.jpnum').textContent = 'Saved just now';
        setTimeout(() => {
          loadJournalEntry().catch(() => {});
        }, 700);
      } catch (error) {
        alert(error.message || 'Unable to save journal entry');
      }
    });

    photoInput.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files || []);
      const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
      let totalBytes = state.photos.reduce(
        (sum, photo) => sum + estimateBase64Bytes(photo),
        0
      );

      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;

        try {
          const optimized = await optimizeImage(file);
          const imageBytes = estimateBase64Bytes(optimized);

          if (totalBytes + imageBytes > MAX_TOTAL_BYTES) {
            alert('Image set is too large. Please add fewer/smaller photos.');
            break;
          }

          state.photos.push(optimized);
          totalBytes += imageBytes;
        } catch {
          const fallback = await readFileAsDataURL(file);
          const imageBytes = estimateBase64Bytes(fallback);

          if (totalBytes + imageBytes > MAX_TOTAL_BYTES) {
            alert('Image set is too large. Please add fewer/smaller photos.');
            break;
          }

          state.photos.push(fallback);
          totalBytes += imageBytes;
        }
      }

      renderPhotos();
      event.target.value = '';
    });

    document.getElementById('pgrid').addEventListener('click', (event) => {
      const removeBtn = event.target.closest('[data-remove-photo]');
      if (!removeBtn) return;

      const idx = Number(removeBtn.getAttribute('data-remove-photo'));
      if (Number.isNaN(idx)) return;

      state.photos.splice(idx, 1);
      renderPhotos();
    });
  }

  return {
    loadJournalEntry,
    bindJournalEvents,
  };
}
