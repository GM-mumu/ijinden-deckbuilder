import type { DeckEntry } from "../types/card";

const STORAGE_KEY = "ijinden-deckbuilder:v0.1:deck";

export function loadDeck(): DeckEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is DeckEntry =>
        typeof item?.cardId === "string" &&
        Number.isInteger(item?.count) &&
        item.count > 0,
    );
  } catch {
    return [];
  }
}

export function saveDeck(deck: DeckEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

export function clearDeckStorage() {
  localStorage.removeItem(STORAGE_KEY);
}
