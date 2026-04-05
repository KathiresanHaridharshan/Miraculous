export const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Your goals don't care about your excuses.", author: "Unknown" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
];

export function getDailyQuote() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
