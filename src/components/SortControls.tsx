import type { SortDirection, SortDirections, SortKey } from "../lib/cardSort";

const SORT_ROWS: Array<{ key: SortKey; label: string }> = [
  { key: "color", label: "色" },
  { key: "type", label: "カード種類" },
  { key: "level", label: "レベル" },
  { key: "magicCost", label: "魔力コスト" },
];

const DIRECTION_OPTIONS: Array<{ value: SortDirection; label: string }> = [
  { value: "none", label: "なし" },
  { value: "asc", label: "↑ 昇順" },
  { value: "desc", label: "↓ 降順" },
];

export function SortControls({
  directions,
  onChange,
  onClear,
}: {
  directions: SortDirections;
  onChange: (key: SortKey, direction: SortDirection) => void;
  onClear: () => void;
}) {
  return (
    <section className="sort-panel" aria-label="カードの並び順">
      <div className="sort-panel-head">
        <div>
          <strong>並び順</strong>
          <small>優先順位：色 → カード種類 → レベル → 魔力コスト</small>
        </div>
        <button type="button" className="link-button" onClick={onClear}>並び順を解除</button>
      </div>

      <div className="sort-rows">
        {SORT_ROWS.map(({ key, label }) => (
          <div className="sort-row" key={key}>
            <span className="sort-label">{label}</span>
            <div className="sort-direction-buttons">
              {DIRECTION_OPTIONS.map(({ value, label: optionLabel }) => (
                <button
                  type="button"
                  className={directions[key] === value ? "selected" : ""}
                  onClick={() => onChange(key, value)}
                  key={value}
                >
                  {optionLabel}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sort-help">
        色の昇順は「赤 → 青 → 緑 → 黄 → 紫 → 多色 → 無色」。カード種類の昇順は「イジン → ハイケイ → マホウ → マリョク」。値のないレベル・魔力コストは常に最後に表示します。
      </div>
    </section>
  );
}
