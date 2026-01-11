
import { WordPair } from './types';

export const FALLBACK_WORDS: WordPair[] = [
  { secretWord: 'Apfel', hintWord: 'Vitamin', category: 'Essen' },
  { secretWord: 'Spiegel', hintWord: 'Reflexion', category: 'Alltag' },
  { secretWord: 'Kaffee', hintWord: 'Wach', category: 'Getränke' },
  { secretWord: 'Laptop', hintWord: 'Strom', category: 'Technik' },
  { secretWord: 'Fahrrad', hintWord: 'Kette', category: 'Transport' },
  { secretWord: 'Pizza', hintWord: 'Italien', category: 'Essen' },
  { secretWord: 'Sonne', hintWord: 'Energie', category: 'Natur' },
  { secretWord: 'Katze', hintWord: 'Schnurren', category: 'Tiere' },
  { secretWord: 'Uhr', hintWord: 'Pünktlichkeit', category: 'Alltag' },
  { secretWord: 'Geld', hintWord: 'Macht', category: 'Gesellschaft' }
];

export const WORD_CATEGORIES = [
  "Zufall",
  "Alltag",
  "Essen & Trinken",
  "Berufe",
  "Sport",
  "Technik",
  "Natur",
  "Filme & Serien",
  "Reisen"
];

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
