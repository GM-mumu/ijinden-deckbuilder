export type CardType = "イジン" | "ハイケイ" | "マホウ" | "マリョク";

export interface LegacyAbility {
  present: boolean;
  keyword: string | null;
  text: string | null;
  triggerNote: string | null;
  reminderText: string | null;
}

export interface DeckRule {
  copyLimit: number | null;
  unlimitedCopies: boolean;
  copyGroupKey: string;
}

export interface Card {
  id: string;
  setNo: number;
  sourceNo: string | number;
  name: string;
  nameKey: string;
  rarity: string | null;
  type: CardType;
  colors: string[];
  isColorless: boolean;
  isMulticolor: boolean;
  level: number | null;
  power: number | null;
  traits: string[];
  ruleText: string | null;
  ruleTextBlocks: string[];
  ruleTextSearch: string;
  legacy: LegacyAbility;
  magicCost: number | null;
  illustrator: string | null;
  product: string | null;
  deckRule: DeckRule;
}

export interface CardDataset {
  schemaVersion: string;
  dataset: string;
  recordCount: number;
  cards: Card[];
}

export interface DeckEntry {
  cardId: string;
  count: number;
}
