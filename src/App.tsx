import { useEffect, useMemo, useState } from "react";
import "./styles.css";
import type { Card, CardDataset, CardType, DeckEntry } from "./types/card";
import type {
  AbilityRelation,
  PurposeCategory,
  PurposeIndexDataset,
  ReverseIndexDataset,
} from "./types/semantic";
import { CardDetail } from "./components/CardDetail";
import { clearDeckStorage, loadDeck, saveDeck } from "./lib/storage";

const COLORS = ["赤", "青", "緑", "黄", "紫", "無色"] as const;
const TYPES: Array<"すべて" | CardType> = ["すべて", "イジン", "ハイケイ", "マホウ", "マリョク"];
const ZONES = ["すべて", "手札", "山札", "墓地", "魔力ゾーン", "戦場"] as const;

const ABILITY_RELATION_MODES = [
  ["related", "関連すべて"],
  ["has", "持つ"],
  ["support", "得る／与える"],
  ["reference", "参照"],
  ["deny", "妨害"],
] as const;

type AbilityRelationMode = (typeof ABILITY_RELATION_MODES)[number][0];
type TraitRelationMode = "related" | "has" | "support" | "reference";
type MovementOwner = "any" | "self" | "opponent";

type MobileSection = "cards" | "deck";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function displayColor(card: Card) {
  return card.isColorless ? "無色" : card.colors.join("・");
}

function colorClass(card: Card) {
  if (card.isColorless) return "color-colorless";
  if (card.isMulticolor) return "color-multi";
  const map: Record<string, string> = {
    赤: "color-red",
    青: "color-blue",
    緑: "color-green",
    黄: "color-yellow",
    紫: "color-purple",
  };
  return map[card.colors[0]] ?? "";
}

function splitPurposeLabel(label: string) {
  const [group, leaf] = label.split("｜");
  return { group: leaf ? group : "", leaf: leaf ?? group };
}

function relationMatches(relation: AbilityRelation, mode: AbilityRelationMode) {
  if (mode === "related") return true;
  if (mode === "has") return relation === "has";
  if (mode === "support") return relation === "gains_self" || relation === "grants";
  if (mode === "reference") return relation === "references";
  return relation === "removes" || relation === "prevents";
}

function PurposeCategoryControl({
  category,
  selected,
  onToggle,
}: {
  category: PurposeCategory;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, typeof category.leaves>();
    category.leaves.forEach((leaf) => {
      const { group } = splitPurposeLabel(leaf.label);
      const key = group || category.label;
      const values = map.get(key) ?? [];
      values.push(leaf);
      map.set(key, values);
    });
    return [...map.entries()];
  }, [category]);

  const count = category.leaves.filter((leaf) => selected.includes(leaf.id)).length;

  return (
    <details className="filter-accordion" open={count > 0}>
      <summary>
        <span>{category.label}</span>
        {count > 0 && <b>{count}</b>}
      </summary>
      <div className="accordion-body purpose-groups">
        {groups.map(([group, leaves]) => (
          <div className="purpose-group" key={group}>
            <h4>{group}</h4>
            <div className="filter-buttons vertical">
              {leaves.map((leaf) => {
                const label = splitPurposeLabel(leaf.label).leaf;
                const checked = selected.includes(leaf.id);
                return (
                  <button
                    type="button"
                    className={`semantic-option ${checked ? "selected" : ""}`}
                    onClick={() => onToggle(leaf.id)}
                    key={leaf.id}
                  >
                    <span>{label}</span>
                    <small>{leaf.count}</small>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

export default function App() {
  const [dataset, setDataset] = useState<CardDataset | null>(null);
  const [reverseIndex, setReverseIndex] = useState<ReverseIndexDataset | null>(null);
  const [purposeIndex, setPurposeIndex] = useState<PurposeIndexDataset | null>(null);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [type, setType] = useState<"すべて" | CardType>("すべて");
  const [color, setColor] = useState<string>("すべて");
  const [maxLevel, setMaxLevel] = useState<string>("すべて");

  const [selectedPurpose, setSelectedPurpose] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [selectedLegacy, setSelectedLegacy] = useState<string[]>([]);
  const [abilityRelationMode, setAbilityRelationMode] = useState<AbilityRelationMode>("related");
  const [traitRelationMode, setTraitRelationMode] = useState<TraitRelationMode>("related");
  const [moveFrom, setMoveFrom] = useState<string>("すべて");
  const [moveTo, setMoveTo] = useState<string>("すべて");
  const [moveOwner, setMoveOwner] = useState<MovementOwner>("any");

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Card | null>(null);
  const [deck, setDeck] = useState<DeckEntry[]>(() => loadDeck());
  const [notice, setNotice] = useState("");
  const [mobileSection, setMobileSection] = useState<MobileSection>("cards");

  const compact = useMediaQuery("(max-width: 1180px)");
  const mobile = useMediaQuery("(max-width: 760px)");

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/cards.json`).then((res) => {
        if (!res.ok) throw new Error(`cards.json の読み込みに失敗しました (${res.status})`);
        return res.json();
      }),
      fetch(`${import.meta.env.BASE_URL}data/reverse-index.json`).then((res) => {
        if (!res.ok) throw new Error(`reverse-index.json の読み込みに失敗しました (${res.status})`);
        return res.json();
      }),
      fetch(`${import.meta.env.BASE_URL}data/purpose-index.json`).then((res) => {
        if (!res.ok) throw new Error(`purpose-index.json の読み込みに失敗しました (${res.status})`);
        return res.json();
      }),
    ])
      .then(([cardsData, reverseData, purposeData]) => {
        setDataset(cardsData as CardDataset);
        setReverseIndex(reverseData as ReverseIndexDataset);
        setPurposeIndex(purposeData as PurposeIndexDataset);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => saveDeck(deck), [deck]);
  useEffect(() => {
    if (!compact) setFilterDrawerOpen(false);
  }, [compact]);

  const cards = dataset?.cards ?? [];
  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  const traitFacets = useMemo(() => {
    if (!reverseIndex) return [] as Array<[string, number]>;
    const counts = new Map<string, Set<string>>();
    Object.entries(reverseIndex.cards).forEach(([cardId, data]) => {
      data.traits.forEach(({ trait }) => {
        if (!counts.has(trait)) counts.set(trait, new Set());
        counts.get(trait)!.add(cardId);
      });
    });
    return [...counts.entries()]
      .map(([key, ids]) => [key, ids.size] as [string, number])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"));
  }, [reverseIndex]);

  const abilityFacets = useMemo(() => {
    if (!reverseIndex) return [] as Array<[string, number]>;
    return reverseIndex.abilityDictionary
      .map((entry) => {
        const ids = new Set<string>();
        Object.entries(reverseIndex.cards).forEach(([cardId, data]) => {
          if (data.abilities.some((a) => a.keyword === entry.keyword)) ids.add(cardId);
        });
        return [entry.keyword, ids.size] as [string, number];
      })
      .filter(([, count]) => count > 0);
  }, [reverseIndex]);

  const legacyFacets = useMemo(() => {
    const counts = new Map<string, number>();
    cards.forEach((card) => {
      if (card.legacy.keyword) counts.set(card.legacy.keyword, (counts.get(card.legacy.keyword) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"));
  }, [cards]);

  const purposeCategoryByLeaf = useMemo(() => {
    const map = new Map<string, string>();
    purposeIndex?.categories.forEach((category) =>
      category.leaves.forEach((leaf) => map.set(leaf.id, category.id)),
    );
    return map;
  }, [purposeIndex]);

  const purposeLabelById = useMemo(() => {
    const map = new Map<string, string>();
    purposeIndex?.categories.forEach((category) =>
      category.leaves.forEach((leaf) => map.set(leaf.id, splitPurposeLabel(leaf.label).leaf)),
    );
    return map;
  }, [purposeIndex]);

  const purposeIdsByCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    selectedPurpose.forEach((id) => {
      const category = purposeCategoryByLeaf.get(id);
      if (!category) return;
      map.set(category, [...(map.get(category) ?? []), id]);
    });
    return map;
  }, [selectedPurpose, purposeCategoryByLeaf]);

  const reverseConditionCount =
    selectedPurpose.length +
    selectedTraits.length +
    selectedAbilities.length +
    selectedLegacy.length +
    (moveFrom !== "すべて" || moveTo !== "すべて" ? 1 : 0);

  function toggleValue(value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function clearSemanticFilters() {
    setSelectedPurpose([]);
    setSelectedTraits([]);
    setSelectedAbilities([]);
    setSelectedLegacy([]);
    setMoveFrom("すべて");
    setMoveTo("すべて");
    setMoveOwner("any");
  }

  function clearAllFilters() {
    setQuery("");
    setType("すべて");
    setColor("すべて");
    setMaxLevel("すべて");
    clearSemanticFilters();
  }

  const filtered = useMemo(() => {
    if (!reverseIndex || !purposeIndex) return [];
    const q = query.trim().toLowerCase();

    return cards.filter((card) => {
      if (type !== "すべて" && card.type !== type) return false;
      if (color !== "すべて") {
        if (color === "無色") {
          if (!card.isColorless) return false;
        } else if (!card.colors.includes(color)) return false;
      }
      if (maxLevel !== "すべて" && (card.level ?? 999) > Number(maxLevel)) return false;

      const semantic = reverseIndex.cards[card.id];
      const purposeTags = new Set(purposeIndex.cardTags[card.id] ?? []);

      for (const ids of purposeIdsByCategory.values()) {
        if (!ids.some((id) => purposeTags.has(id))) return false;
      }

      if (selectedAbilities.length > 0) {
        const ok = selectedAbilities.some((keyword) =>
          semantic?.abilities.some(
            (entry) => entry.keyword === keyword && relationMatches(entry.relation, abilityRelationMode),
          ),
        );
        if (!ok) return false;
      }

      if (selectedTraits.length > 0) {
        const ok = selectedTraits.some((trait) =>
          semantic?.traits.some((entry) => {
            if (entry.trait !== trait) return false;
            if (traitRelationMode === "related") return true;
            if (traitRelationMode === "has") return entry.relation === "has";
            if (traitRelationMode === "support") return entry.relation === "grants";
            return entry.relation === "references";
          }),
        );
        if (!ok) return false;
      }

      if (selectedLegacy.length > 0 && !selectedLegacy.includes(card.legacy.keyword ?? "")) return false;

      if (moveFrom !== "すべて" || moveTo !== "すべて") {
        const ok = semantic?.movements.some((movement) => {
          if (movement.relation !== "effect") return false;
          if (moveFrom !== "すべて" && movement.from !== moveFrom) return false;
          if (moveTo !== "すべて" && movement.to !== moveTo) return false;
          if (moveOwner === "self" && movement.ownerScope !== "self" && movement.ownerScope !== "unspecified") return false;
          if (moveOwner === "opponent" && movement.ownerScope !== "opponent" && movement.ownerScope !== "unspecified") return false;
          return true;
        });
        if (!ok) return false;
      }

      if (!q) return true;
      const haystack = [
        card.name,
        card.ruleTextSearch,
        card.traits.join(" "),
        card.legacy.keyword ?? "",
        card.legacy.text ?? "",
        displayColor(card),
        card.type,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [
    cards,
    reverseIndex,
    purposeIndex,
    query,
    type,
    color,
    maxLevel,
    purposeIdsByCategory,
    selectedAbilities,
    selectedTraits,
    selectedLegacy,
    abilityRelationMode,
    traitRelationMode,
    moveFrom,
    moveTo,
    moveOwner,
  ]);

  const deckCards = useMemo(
    () =>
      deck
        .map((entry) => {
          const card = cardMap.get(entry.cardId);
          return card ? { card, count: entry.count } : null;
        })
        .filter((x): x is { card: Card; count: number } => x !== null),
    [deck, cardMap],
  );

  const deckSize = deckCards.reduce((sum, item) => sum + item.count, 0);
  const deckKinds = deckCards.length;

  function copiesByName(nameKey: string) {
    return deckCards
      .filter(({ card }) => card.deckRule.copyGroupKey === nameKey)
      .reduce((sum, item) => sum + item.count, 0);
  }

  function addCard(card: Card) {
    const currentNameCount = copiesByName(card.deckRule.copyGroupKey);
    const limit = card.deckRule.copyLimit;
    if (!card.deckRule.unlimitedCopies && limit != null && currentNameCount >= limit) {
      setNotice(`「${card.name}」は同名合計${limit}枚までです。`);
      window.setTimeout(() => setNotice(""), 2200);
      return;
    }
    setDeck((current) => {
      const found = current.find((entry) => entry.cardId === card.id);
      return found
        ? current.map((entry) => entry.cardId === card.id ? { ...entry, count: entry.count + 1 } : entry)
        : [...current, { cardId: card.id, count: 1 }];
    });
  }

  function removeCard(cardId: string) {
    setDeck((current) =>
      current
        .map((entry) => entry.cardId === cardId ? { ...entry, count: entry.count - 1 } : entry)
        .filter((entry) => entry.count > 0),
    );
  }

  function clearDeck() {
    if (!window.confirm("デッキを空にしますか？")) return;
    setDeck([]);
    clearDeckStorage();
  }

  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; clear: () => void }> = [];
    if (type !== "すべて") chips.push({ id: "type", label: type, clear: () => setType("すべて") });
    if (color !== "すべて") chips.push({ id: "color", label: color, clear: () => setColor("すべて") });
    if (maxLevel !== "すべて") chips.push({ id: "level", label: `Lv${maxLevel}以下`, clear: () => setMaxLevel("すべて") });
    selectedPurpose.forEach((id) => chips.push({ id: `p-${id}`, label: purposeLabelById.get(id) ?? id, clear: () => toggleValue(id, setSelectedPurpose) }));
    selectedAbilities.forEach((keyword) => chips.push({ id: `a-${keyword}`, label: `${keyword}・${ABILITY_RELATION_MODES.find(([id]) => id === abilityRelationMode)?.[1] ?? "関連"}`, clear: () => toggleValue(keyword, setSelectedAbilities) }));
    selectedTraits.forEach((trait) => chips.push({ id: `t-${trait}`, label: `特性:${trait}`, clear: () => toggleValue(trait, setSelectedTraits) }));
    selectedLegacy.forEach((legacy) => chips.push({ id: `l-${legacy}`, label: `遺業:${legacy}`, clear: () => toggleValue(legacy, setSelectedLegacy) }));
    if (moveFrom !== "すべて" || moveTo !== "すべて") chips.push({ id: "move", label: `${moveFrom} → ${moveTo}`, clear: () => { setMoveFrom("すべて"); setMoveTo("すべて"); setMoveOwner("any"); } });
    return chips;
  }, [type, color, maxLevel, selectedPurpose, purposeLabelById, selectedAbilities, abilityRelationMode, selectedTraits, selectedLegacy, moveFrom, moveTo]);

  const filterPanel = (
    <aside className="filter-panel">
      <div className="filter-panel-head">
        <div>
          <div className="eyebrow">FILTERS</div>
          <h2>検索条件</h2>
        </div>
        {compact && <button className="icon-button" onClick={() => setFilterDrawerOpen(false)}>×</button>}
      </div>

      <section className="basic-filter-block">
        <label>カード種類<select value={type} onChange={(e) => setType(e.target.value as typeof type)}>{TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>色<select value={color} onChange={(e) => setColor(e.target.value)}><option>すべて</option>{COLORS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>最大レベル<select value={maxLevel} onChange={(e) => setMaxLevel(e.target.value)}><option value="すべて">すべて</option>{[0,1,2,3,4,5,6,7,8,9,10,17].map((n) => <option key={n} value={n}>Lv {n} 以下</option>)}</select></label>
      </section>

      <section className="semantic-section">
        <div className="semantic-title"><strong>やりたいこと</strong><small>目的 → 効果</small></div>
        {purposeIndex?.categories.map((category) => (
          <PurposeCategoryControl
            key={category.id}
            category={category}
            selected={selectedPurpose}
            onToggle={(id) => toggleValue(id, setSelectedPurpose)}
          />
        ))}
      </section>

      <details className="filter-accordion">
        <summary><span>能力・特性</span><b>{selectedAbilities.length + selectedTraits.length || ""}</b></summary>
        <div className="accordion-body">
          <h4>能力の関係</h4>
          <div className="mode-row">
            {ABILITY_RELATION_MODES.map(([id, label]) => <button type="button" className={abilityRelationMode === id ? "selected" : ""} onClick={() => setAbilityRelationMode(id)} key={id}>{label}</button>)}
          </div>
          <h4>能力名</h4>
          <div className="facet-options">
            {abilityFacets.map(([keyword, count]) => <button type="button" className={`facet-pill ${selectedAbilities.includes(keyword) ? "selected" : ""}`} onClick={() => toggleValue(keyword, setSelectedAbilities)} key={keyword}><span>{keyword}</span><small>{count}</small></button>)}
          </div>

          <h4 className="subsection-title">特性の関係</h4>
          <div className="mode-row">
            {([['related','関連すべて'],['has','持つ'],['support','与える'],['reference','参照']] as const).map(([id,label]) => <button type="button" className={traitRelationMode === id ? "selected" : ""} onClick={() => setTraitRelationMode(id)} key={id}>{label}</button>)}
          </div>
          <h4>特性</h4>
          <div className="facet-options">
            {traitFacets.map(([trait, count]) => <button type="button" className={`facet-pill ${selectedTraits.includes(trait) ? "selected" : ""}`} onClick={() => toggleValue(trait, setSelectedTraits)} key={trait}><span>{trait}</span><small>{count}</small></button>)}
          </div>
        </div>
      </details>

      <details className="filter-accordion">
        <summary><span>場所の移動</span>{(moveFrom !== "すべて" || moveTo !== "すべて") && <b>1</b>}</summary>
        <div className="accordion-body">
          <div className="movement-grid">
            <label>移動元<select value={moveFrom} onChange={(e) => setMoveFrom(e.target.value)}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select></label>
            <span className="movement-arrow">→</span>
            <label>移動先<select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select></label>
          </div>
          <h4>対象</h4>
          <div className="mode-row">
            {([['any','どちらでも'],['self','自分'],['opponent','相手']] as const).map(([id,label]) => <button type="button" className={moveOwner === id ? "selected" : ""} onClick={() => setMoveOwner(id)} key={id}>{label}</button>)}
          </div>
          <h4>よく使う移動</h4>
          <div className="shortcut-grid">
            {[["墓地","手札","墓地→手札"],["墓地","戦場","墓地→戦場"],["戦場","手札","戦場→手札"],["山札","墓地","山札→墓地"],["戦場","魔力ゾーン","戦場→魔力"],["山札","戦場","山札→戦場"]].map(([from,to,label]) => <button type="button" onClick={() => { setMoveFrom(from); setMoveTo(to); }} key={label}>{label}</button>)}
          </div>
        </div>
      </details>

      <details className="filter-accordion">
        <summary><span>遺業能力</span>{selectedLegacy.length > 0 && <b>{selectedLegacy.length}</b>}</summary>
        <div className="accordion-body facet-options">
          {legacyFacets.map(([keyword,count]) => <button type="button" className={`facet-pill ${selectedLegacy.includes(keyword) ? "selected" : ""}`} onClick={() => toggleValue(keyword, setSelectedLegacy)} key={keyword}><span>{keyword}</span><small>{count}</small></button>)}
        </div>
      </details>

      <div className="filter-footer">
        <button className="ghost-button wide" type="button" onClick={clearAllFilters}>条件をすべて解除</button>
        {compact && <button className="primary-button wide" type="button" onClick={() => setFilterDrawerOpen(false)}>検索結果を見る（{filtered.length}）</button>}
      </div>
    </aside>
  );

  const deckPanel = (
    <aside className={`deck-panel ${mobile ? "mobile-deck" : ""}`}>
      <div className="deck-head">
        <div><div className="eyebrow">MY DECK</div><h2>{deckKinds} 種類 / {deckSize} 枚</h2></div>
        <button className="ghost-button" onClick={clearDeck} disabled={deck.length === 0}>クリア</button>
      </div>
      {deckCards.length === 0 ? <div className="empty-deck">カード一覧から「＋」を押すと、ここに追加されます。</div> : <div className="deck-list">{deckCards.map(({ card, count }) => <div className="deck-row" key={card.id}><button className="deck-card-name" onClick={() => setSelected(card)}><span>{card.name}</span><small>第{card.setNo}弾 / {card.sourceNo}</small></button><div className="deck-stepper"><button onClick={() => removeCard(card.id)}>－</button><strong>{count}</strong><button onClick={() => addCard(card)}>＋</button></div></div>)}</div>}
    </aside>
  );

  if (error) return <main className="error-screen"><div><h1>読み込みエラー</h1><p>{error}</p></div></main>;
  if (!dataset || !reverseIndex || !purposeIndex) return <main className="loading-screen">カードデータと意味辞書を読み込み中……</main>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div><div className="eyebrow">IJINDEN DECK BUILDER v0.3</div><h1>イジンデン デッキビルダー</h1></div>
        <div className="top-stats"><span>全 <strong>{dataset.recordCount}</strong> 種類</span><span>表示 <strong>{filtered.length}</strong></span><span>デッキ <strong>{deckSize}</strong> 枚</span></div>
      </header>

      <div className={`workspace ${compact ? "compact" : "desktop"} ${mobile ? "mobile" : ""}`}>
        {!compact && filterPanel}

        {(!mobile || mobileSection === "cards") && (
          <main className="catalog-panel">
            <div className="catalog-toolbar">
              <input className="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="カード名・能力・特性を検索" />
              {compact && <button className={`filter-open-button ${reverseConditionCount > 0 ? "active" : ""}`} type="button" onClick={() => setFilterDrawerOpen(true)}>☰ 条件 {reverseConditionCount > 0 && <b>{reverseConditionCount}</b>}</button>}
            </div>

            {activeChips.length > 0 && <div className="active-filter-strip"><span>現在の条件</span><div className="active-chips">{activeChips.map((chip) => <button type="button" key={chip.id} onClick={chip.clear}>{chip.label}<b>×</b></button>)}</div><button className="link-button" type="button" onClick={clearAllFilters}>すべて解除</button></div>}

            <div className="result-summary">表示中 <strong>{filtered.length}</strong> 種類 <span>/ 全 {dataset.recordCount} 種類</span></div>

            <section className="card-list">
              {filtered.map((card) => {
                const sameNameCount = copiesByName(card.deckRule.copyGroupKey);
                return <article className={`card-row ${colorClass(card)}`} key={card.id}>
                  <button className="card-main" onClick={() => setSelected(card)}>
                    <div className="card-title-line"><span className="card-name">{card.name}</span><span className="badge">{card.type}</span><span className="badge">{displayColor(card)}</span></div>
                    <div className="card-meta">第{card.setNo}弾 / {card.sourceNo}<span>Lv {card.level ?? "-"}</span>{card.power != null && <span>Power {card.power}</span>}{card.type === "マホウ" && <span>魔力Cost {card.magicCost ?? 0}</span>}</div>
                    {card.ruleTextSearch && <div className="card-text-preview">{card.ruleTextSearch}</div>}
                  </button>
                  <div className="card-actions"><div className="copies">{card.deckRule.unlimitedCopies ? "∞" : `${sameNameCount}/4`}</div><button className="add-button" onClick={() => addCard(card)}>＋</button></div>
                </article>;
              })}
              {filtered.length === 0 && <div className="no-results">条件に合うカードがありません。<button type="button" className="link-button" onClick={clearAllFilters}>条件を解除</button></div>}
            </section>
          </main>
        )}

        {!mobile && deckPanel}
        {mobile && mobileSection === "deck" && deckPanel}
      </div>

      {compact && filterDrawerOpen && <div className="drawer-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setFilterDrawerOpen(false); }}><div className="filter-drawer">{filterPanel}</div></div>}

      {mobile && <nav className="mobile-bottom-nav"><button className={mobileSection === "cards" ? "active" : ""} onClick={() => setMobileSection("cards")}><span>⌕</span>カード検索</button><button className={mobileSection === "deck" ? "active" : ""} onClick={() => setMobileSection("deck")}><span>▣</span>デッキ <b>{deckSize}</b></button></nav>}

      {notice && <div className="toast">{notice}</div>}
      <CardDetail card={selected} onClose={() => setSelected(null)} onAdd={addCard} />
    </div>
  );
}
