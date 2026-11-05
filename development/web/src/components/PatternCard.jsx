// Feature card from the Mannin Suvai design: "forest" (diagonal lines) for emphasis, "sand" (grid) for the rest.
export default function PatternCard({ icon: Icon, value, title, description, tone = 'forest', compact, onClick, selected }) {
  const className = `pcard pcard--${tone}${compact ? ' pcard--compact' : ''}`;
  const content = (
    <>
      <div className="pcard-top">
        {Icon && <Icon className="pcard-icon" aria-hidden />}
        <span className={`pcard-num${String(value).length > 3 ? ' pcard-num--long' : ''}`}>{value}</span>
      </div>
      <div className="pcard-body">
        <h3 className="pcard-title">{title}</h3>
        {description && <p className="pcard-desc">{description}</p>}
      </div>
    </>
  );

  return onClick ? (
    <button type="button" className={className} onClick={onClick} aria-pressed={selected}>
      {content}
    </button>
  ) : (
    <article className={className}>{content}</article>
  );
}
