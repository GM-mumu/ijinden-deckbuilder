import type { Card } from "../types/card";

interface Props {
  card: Card | null;
  onClose: () => void;
  onAdd: (card: Card) => void;
}

export function CardDetail({ card, onClose, onAdd }: Props) {
  if (!card) return null;

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="eyebrow">
              第{card.setNo}弾 / {card.sourceNo} / {card.rarity ?? "-"}
            </div>
            <h2>{card.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">×</button>
        </div>

        <div className="detail-grid">
          <div><span>種別</span><strong>{card.type}</strong></div>
          <div><span>色</span><strong>{card.isColorless ? "無色" : card.colors.join("・")}</strong></div>
          <div><span>レベル</span><strong>{card.level ?? "-"}</strong></div>
          <div><span>パワー</span><strong>{card.power ?? "-"}</strong></div>
          {card.type === "マホウ" && (
            <div><span>魔力コスト</span><strong>{card.magicCost ?? 0}</strong></div>
          )}
        </div>

        {card.traits.length > 0 && (
          <div className="section">
            <h3>特性</h3>
            <div className="chips">
              {card.traits.map((trait) => <span className="chip" key={trait}>{trait}</span>)}
            </div>
          </div>
        )}

        {card.ruleText && (
          <div className="section">
            <h3>ルールテキスト</h3>
            {card.ruleTextBlocks.map((block, index) => (
              <p className="rule-block" key={index}>{block}</p>
            ))}
          </div>
        )}

        {card.legacy.present && (
          <div className="section">
            <h3>遺業能力</h3>
            {card.legacy.keyword && <div className="legacy-keyword">{card.legacy.keyword}</div>}
            {card.legacy.text && card.legacy.text !== card.legacy.keyword && <p>{card.legacy.text}</p>}
            {card.legacy.reminderText && <p className="muted">（{card.legacy.reminderText}）</p>}
            {card.legacy.triggerNote && <p className="muted">{card.legacy.triggerNote}</p>}
          </div>
        )}

        <div className="detail-footer">
          <div className="muted">
            {card.deckRule.unlimitedCopies ? "デッキ投入枚数：無制限" : "同名合計4枚まで"}
          </div>
          <button className="primary-button" onClick={() => onAdd(card)}>＋ デッキへ追加</button>
        </div>
      </div>
    </div>
  );
}
