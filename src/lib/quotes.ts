export type Quote = {
  id: string;
  text: string;
  author: string;
};

export const DEFAULT_QUOTES: Quote[] = [
  { id: "1", text: "Music is the shorthand of emotion.", author: "Leo Tolstoy" },
  { id: "2", text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche" },
  { id: "3", text: "One good thing about music, when it hits you, you feel no pain.", author: "Bob Marley" },
  { id: "4", text: "Music gives a soul to the universe, wings to the mind, flight to the imagination.", author: "Plato" },
  { id: "5", text: "Where words fail, music speaks.", author: "Hans Christian Andersen" },
  { id: "6", text: "Music is the wine that fills the cup of silence.", author: "Robert Fripp" },
  { id: "7", text: "To stop the flow of music would be like the stopping of time itself.", author: "Aaron Copland" },
  { id: "8", text: "Music can change the world because it can change people.", author: "Bono" },
  { id: "9", text: "The music is not in the notes, but in the silence between.", author: "Wolfgang Amadeus Mozart" },
  { id: "10", text: "Music is the universal language of mankind.", author: "Henry Wadsworth Longfellow" },
  { id: "11", text: "After silence, that which comes nearest to expressing the inexpressible is music.", author: "Aldous Huxley" },
  { id: "12", text: "Music is moonlight in the gloomy night of life.", author: "Jean Paul" },
  { id: "13", text: "A painter paints pictures on canvas. But musicians paint their pictures on silence.", author: "Leopold Stokowski" },
  { id: "14", text: "Music is the movement of sound to reach the soul for the education of its virtue.", author: "Plato" },
  { id: "15", text: "The only truth is music.", author: "Jack Kerouac" },
  { id: "16", text: "Music is a moral law. It gives soul to the universe.", author: "Plato" },
  { id: "17", text: "Music produces a kind of pleasure which human nature cannot do without.", author: "Confucius" },
  { id: "18", text: "Life seems to go on without effort when I am filled with music.", author: "George Eliot" },
  { id: "19", text: "Music is the strongest form of magic.", author: "Marilyn Manson" },
  { id: "20", text: "I would rather write 10,000 notes than a single letter of the alphabet.", author: "Ludwig van Beethoven" },
];

// Rotates every 90 minutes, consistent for all users at same time
export function getCurrentQuote(quotes: Quote[] = DEFAULT_QUOTES): Quote {
  const index = Math.floor(Date.now() / (1000 * 60 * 90)) % quotes.length;
  return quotes[index];
}

// Color palettes for the quote card - theme aware via CSS vars
export const QUOTE_CARD_PALETTES = [
  { bg: "from-pink-500/10 to-pink-500/5", border: "border-pink-200/40 dark:border-pink-800/30", accent: "text-pink-500" },
  { bg: "from-cyan-500/10 to-cyan-500/5", border: "border-cyan-200/40 dark:border-cyan-800/30", accent: "text-cyan-500" },
  { bg: "from-violet-500/10 to-violet-500/5", border: "border-violet-200/40 dark:border-violet-800/30", accent: "text-violet-500" },
  { bg: "from-amber-500/10 to-amber-500/5", border: "border-amber-200/40 dark:border-amber-800/30", accent: "text-amber-500" },
  { bg: "from-emerald-500/10 to-emerald-500/5", border: "border-emerald-200/40 dark:border-emerald-800/30", accent: "text-emerald-500" },
  { bg: "from-rose-500/10 to-rose-500/5", border: "border-rose-200/40 dark:border-rose-800/30", accent: "text-rose-500" },
  { bg: "from-indigo-500/10 to-indigo-500/5", border: "border-indigo-200/40 dark:border-indigo-800/30", accent: "text-indigo-500" },
];

export function getQuotePalette(quoteId: string) {
  const index = quoteId.charCodeAt(0) % QUOTE_CARD_PALETTES.length;
  return QUOTE_CARD_PALETTES[index];
}