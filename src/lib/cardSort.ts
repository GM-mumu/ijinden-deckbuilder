import type { Card, CardType } from "../types/card";

export type SortDirection = "none" | "asc" | "desc";
export type SortKey = "color" | "type" | "level" | "magicCost";
export type SortDirections = Record<SortKey, SortDirection>;

export const DEFAULT_SORT_DIRECTIONS: SortDirections = {
  color: "none",
  type: "none",
  level: "none",
  magicCost: "none",
};

const SORT_PRIORITY: SortKey[] = ["color", "type", "level", "magicCost"];
const COLOR_ORDER = ["赤", "青", "緑", "黄", "紫", "多色", "無色"] as const;
const TYPE_ORDER: CardType[] = ["イジン", "ハイケイ", "マホウ", "マリョク"];

function colorRank(card: Card) {
  if (card.isColorless) return COLOR_ORDER.indexOf("無色");
  if (card.isMulticolor) return COLOR_ORDER.indexOf("多色");
  const rank = COLOR_ORDER.indexOf(card.colors[0] as (typeof COLOR_ORDER)[number]);
  return rank >= 0 ? rank : COLOR_ORDER.length;
}

function typeRank(card: Card) {
  const rank = TYPE_ORDER.indexOf(card.type);
  return rank >= 0 ? rank : TYPE_ORDER.length;
}

function compareNumberNullable(a: number | null, b: number | null, direction: Exclude<SortDirection, "none">) {
  // 値なしは昇順・降順どちらでも常に最後へ送る。
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return direction === "asc" ? a - b : b - a;
}

function compareCardByKey(
  a: Card,
  b: Card,
  key: SortKey,
  direction: Exclude<SortDirection, "none">,
) {
  if (key === "color") {
    const diff = colorRank(a) - colorRank(b);
    return direction === "asc" ? diff : -diff;
  }

  if (key === "type") {
    const diff = typeRank(a) - typeRank(b);
    return direction === "asc" ? diff : -diff;
  }

  if (key === "level") {
    return compareNumberNullable(a.level, b.level, direction);
  }

  return compareNumberNullable(a.magicCost, b.magicCost, direction);
}

export function sortCards(cards: Card[], directions: SortDirections) {
  const activeKeys = SORT_PRIORITY.filter((key) => directions[key] !== "none");
  if (activeKeys.length === 0) return cards;

  return cards
    .map((card, originalIndex) => ({ card, originalIndex }))
    .sort((a, b) => {
      for (const key of activeKeys) {
        const direction = directions[key];
        if (direction === "none") continue;
        const result = compareCardByKey(a.card, b.card, key, direction);
        if (result !== 0) return result;
      }
      // 全キー同値なら元のカードDB順を維持する。
      return a.originalIndex - b.originalIndex;
    })
    .map(({ card }) => card);
}
