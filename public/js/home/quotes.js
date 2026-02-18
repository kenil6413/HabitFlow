const DEFAULT_QUOTES = [
  {
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
  },
  {
    text: 'Every action you take is a vote for the type of person you wish to become.',
    author: 'James Clear',
  },
  {
    text: 'Habits are the compound interest of self-improvement.',
    author: 'James Clear',
  },
  {
    text: 'Be the designer of your world and not merely the consumer of it.',
    author: 'James Clear',
  },
  {
    text: 'You should be far more concerned with your current trajectory than with your current results.',
    author: 'James Clear',
  },
  {
    text: 'Success is the product of daily habits, not once-in-a-lifetime transformations.',
    author: 'James Clear',
  },
  {
    text: 'The most practical way to change who you are is to change what you do.',
    author: 'James Clear',
  },
  {
    text: 'Make it obvious. Make it attractive. Make it easy. Make it satisfying.',
    author: 'James Clear',
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
