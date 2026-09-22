import type { DeckEntry } from "../types/card";

const LEGACY_STORAGE_KEY = "ijinden-deckbuilder:v0.1:deck";
const LIBRARY_STORAGE_KEY = "ijinden-deckbuilder:v0.5:deck-library";

export interface SavedDeck {
  id: string;
  name: string;
  entries: DeckEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DeckLibraryState {
  activeDeckId: string;
  decks: SavedDeck[];
}

function isDeckEntry(item: unknown): item is DeckEntry {
  if (!item || typeof item !== "object") return false;
  const entry = item as DeckEntry;
  return (
    typeof entry.cardId === "string" &&
    Number.isInteger(entry.count) &&
    entry.count > 0
  );
}

function normalizeEntries(value: unknown): DeckEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isDeckEntry).map((entry) => ({ ...entry }));
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `deck-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createSavedDeck(name: string, entries: DeckEntry[] = []): SavedDeck {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    name: name.trim() || "新しいデッキ",
    entries: entries.map((entry) => ({ ...entry })),
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeSavedDeck(value: unknown): SavedDeck | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<SavedDeck>;
  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") return null;

  const now = new Date().toISOString();
  return {
    id: candidate.id,
    name: candidate.name.trim() || "名称未設定デッキ",
    entries: normalizeEntries(candidate.entries),
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : now,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
  };
}

function loadLegacyEntries(): DeckEntry[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    return normalizeEntries(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function loadDeckLibrary(): DeckLibraryState {
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DeckLibraryState>;
      const decks = Array.isArray(parsed.decks)
        ? parsed.decks.map(normalizeSavedDeck).filter((deck): deck is SavedDeck => deck !== null)
        : [];

      if (decks.length > 0) {
        const activeDeckId =
          typeof parsed.activeDeckId === "string" && decks.some((deck) => deck.id === parsed.activeDeckId)
            ? parsed.activeDeckId
            : decks[0].id;
        return { activeDeckId, decks };
      }
    }
  } catch {
    // 新形式の保存内容が壊れている場合は、旧形式からの復旧を試す。
  }

  const firstDeck = createSavedDeck("マイデッキ 1", loadLegacyEntries());
  const initial = { activeDeckId: firstDeck.id, decks: [firstDeck] };
  saveDeckLibrary(initial);
  return initial;
}

export function saveDeckLibrary(state: DeckLibraryState) {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(state));
}

// v0.4以前との互換用。既存コードや古いキャッシュから呼ばれても動作するよう残す。
export function loadDeck(): DeckEntry[] {
  return loadLegacyEntries();
}

export function saveDeck(deck: DeckEntry[]) {
  localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(deck));
}

export function clearDeckStorage() {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}
