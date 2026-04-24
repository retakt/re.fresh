export type Quote = {
  id: string;
  text: string;
  author: string;
};

/**
 * All quotes live here — no Supabase needed.
 * Add custom quotes directly to this array.
 * The admin "Quotes" page can still manage DB quotes for backwards compat,
 * but the home page now reads only from this file + localStorage custom quotes.
 */
export const ALL_QUOTES: Quote[] = [
  // ── Music & Art ──
  { id: "1",  text: "Music is the shorthand of emotion.", author: "Leo Tolstoy" },
  { id: "2",  text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
  { id: "3",  text: "One good thing about music, when it hits you, you feel no pain.", author: "Bob Marley" },
  { id: "4",  text: "Music gives a soul to the universe, wings to the mind, flight to the imagination.", author: "Plato" },
  { id: "5",  text: "Where words fail, music speaks.", author: "Hans Christian Andersen" },
  { id: "6",  text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { id: "7",  text: "To stop the flow of music would be like the stopping of time itself.", author: "Aaron Copland" },
  { id: "8",  text: "Music can change the world because it can change people.", author: "Bono" },
  { id: "9",  text: "The music is not in the notes, but in the silence between.", author: "Wolfgang Amadeus Mozart" },
  { id: "10", text: "Music is the universal language of mankind.", author: "Henry Wadsworth Longfellow" },
  { id: "11", text: "After silence, that which comes nearest to expressing the inexpressible is music.", author: "Aldous Huxley" },
  { id: "12", text: "Music is moonlight in the gloomy night of life.", author: "Jean Paul" },
  { id: "13", text: "A painter paints pictures on canvas. But musicians paint their pictures on silence.", author: "Leopold Stokowski" },
  { id: "14", text: "The only truth is music.", author: "Jack Kerouac" },
  { id: "15", text: "Music produces a kind of pleasure which human nature cannot do without.", author: "Confucius" },
  { id: "16", text: "Life seems to go on without effort when I am filled with music.", author: "George Eliot" },
  { id: "17", text: "Music is the strongest form of magic.", author: "Marilyn Manson" },
  { id: "18", text: "I would rather write 10,000 notes than a single letter of the alphabet.", author: "Ludwig van Beethoven" },
  { id: "19", text: "Music is the art of thinking with sounds.", author: "Jules Combarieu" },
  { id: "20", text: "Without music, life is a journey through a desert.", author: "Pat Conroy" },
  // ── Production & Craft ──
  { id: "21", text: "The creative process is a process of surrender, not control.", author: "Julia Cameron" },
  { id: "22", text: "An idea that is not dangerous is unworthy of being called an idea at all.", author: "Oscar Wilde" },
  { id: "23", text: "Every artist dips his brush in his own soul, and paints his own nature into his pictures.", author: "Henry Ward Beecher" },
  { id: "24", text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
  { id: "25", text: "The secret to creativity is knowing how to hide your sources.", author: "Albert Einstein" },
  { id: "26", text: "Art is not what you see, but what you make others see.", author: "Edgar Degas" },
  { id: "27", text: "To create one's own world takes courage.", author: "Georgia O'Keeffe" },
  { id: "28", text: "The role of the artist is to ask questions, not answer them.", author: "Anton Chekhov" },
  // ── Life & Philosophy ──
  { id: "29", text: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  { id: "30", text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { id: "31", text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { id: "32", text: "The present moment always will have been.", author: "Unknown" },
  { id: "33", text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { id: "34", text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { id: "35", text: "Everything you can imagine is real.", author: "Pablo Picasso" },
];

// Keep DEFAULT_QUOTES as alias for backwards compat with admin quotes page
export const DEFAULT_QUOTES = ALL_QUOTES;

/**
 * Fisher-Yates shuffle — truly random, unbiased.
 * Returns a new shuffled array, does not mutate the original.
 */
export function shuffleQuotes(quotes: Quote[]): Quote[] {
  const arr = [...quotes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Color palettes for the quote card
export const QUOTE_CARD_PALETTES = [
  { bg: "from-pink-500/10 to-pink-500/5",    border: "border-pink-200/40 dark:border-pink-800/30",    accent: "text-pink-500" },
  { bg: "from-cyan-500/10 to-cyan-500/5",    border: "border-cyan-200/40 dark:border-cyan-800/30",    accent: "text-cyan-500" },
  { bg: "from-violet-500/10 to-violet-500/5", border: "border-violet-200/40 dark:border-violet-800/30", accent: "text-violet-500" },
  { bg: "from-amber-500/10 to-amber-500/5",  border: "border-amber-200/40 dark:border-amber-800/30",  accent: "text-amber-500" },
  { bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-200/40 dark:border-emerald-800/30", accent: "text-emerald-500" },
  { bg: "from-rose-500/10 to-rose-500/5",    border: "border-rose-200/40 dark:border-rose-800/30",    accent: "text-rose-500" },
  { bg: "from-indigo-500/10 to-indigo-500/5", border: "border-indigo-200/40 dark:border-indigo-800/30", accent: "text-indigo-500" },
];

export function getQuotePalette(quoteId: string) {
  const index = quoteId.charCodeAt(0) % QUOTE_CARD_PALETTES.length;
  return QUOTE_CARD_PALETTES[index];
}
