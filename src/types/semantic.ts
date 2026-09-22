export type AbilityRelation =
  | "has"
  | "gains_self"
  | "grants"
  | "references"
  | "removes"
  | "prevents"
  | "mentions";

export interface ReverseAbilityEntry {
  keyword: string;
  relation: AbilityRelation;
}

export interface ReverseTraitEntry {
  trait: string;
  relation: "has" | "grants" | "references" | string;
}

export interface ReverseMovementEntry {
  from: string;
  to: string;
  alias: string;
  ownerScope: "self" | "opponent" | "both" | "unspecified" | string;
  targetType: string;
  relation: string;
  method: string;
  detail: string;
  matchText: string;
  confidence: string;
}

export interface ReverseCardIndex {
  abilities: ReverseAbilityEntry[];
  traits: ReverseTraitEntry[];
  movements: ReverseMovementEntry[];
  goals: string[];
}

export interface AbilityDictionaryEntry {
  keyword: string;
  category: string;
  description: string;
  basis: string;
  confidence: string;
  source: string;
}

export interface ReverseIndexDataset {
  schemaVersion: string;
  cardCount: number;
  zones: string[];
  abilityDictionary: AbilityDictionaryEntry[];
  legacyDictionary: Array<{ keyword: string }>;
  cards: Record<string, ReverseCardIndex>;
}

export interface PurposeLeaf {
  id: string;
  label: string;
  count: number;
  cardIds: string[];
}

export interface PurposeCategory {
  id: string;
  label: string;
  leaves: PurposeLeaf[];
}

export interface PurposeIndexDataset {
  schemaVersion: string;
  cardCount: number;
  categories: PurposeCategory[];
  cardTags: Record<string, string[]>;
}
