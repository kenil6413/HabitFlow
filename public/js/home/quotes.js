const DEFAULT_QUOTES = [
  {
    text: 'Calm is not the absence of motion, but the presence of intention.',
    author: 'HabitFlow',
  },
  {
    text: 'Write one clear line, and the day starts to make sense.',
    author: 'HabitFlow',
  },
  {
    text: 'Small, steady pages become a meaningful life.',
    author: 'HabitFlow',
  },
  {
    text: 'The quiet routine is where progress learns your name.',
    author: 'HabitFlow',
  },
];

export function initQuotes({
  stripEl,
  textEl,
  authorEl,
  quotes = DEFAULT_QUOTES,
  intervalMs = 6500,
  animationDelayMs = 260,
}) {
  if (!quotes.length) return;

  let quoteIndex = 0;

  function showQuote() {
    const quote = quotes[quoteIndex];
    stripEl.classList.remove('quote-visible');

    setTimeout(() => {
      textEl.textContent = `"${quote.text}"`;
      authorEl.textContent = `- ${quote.author}`;
      stripEl.classList.add('quote-visible');
      quoteIndex = (quoteIndex + 1) % quotes.length;
    }, animationDelayMs);
  }

  showQuote();
  setInterval(showQuote, intervalMs);
}
