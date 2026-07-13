import AnimatedNumber from './AnimatedNumber';

/**
 * One statistic tile: icon → animated number → title → description.
 *
 * `stat` shape:
 *   { icon, value, suffix?, title, description,
 *     animate = true, staticValue?,           // see AnimatedNumber note
 *     accentColor?, trend?, onClick? }        // reserved for later, unused today
 *
 * `start` — passed down from the section's Reveal via onReveal, so the
 * counter begins the moment the card enters the viewport and never again.
 */
export default function StatisticCard({ stat, start }) {
  const color = stat.accentColor || 'var(--accent-gold)';

  return (
    <div className="glass-card card-hover landing-stat-card">
      <span className="material-symbols-outlined landing-stat-icon" style={{ color }}>
        {stat.icon}
      </span>

      <div className="landing-stat-number" style={{ color }}>
        {stat.animate === false ? (
          stat.staticValue
        ) : (
          <AnimatedNumber value={stat.value} suffix={stat.suffix} start={start} />
        )}
      </div>

      <h3 className="landing-stat-title">{stat.title}</h3>
      <p className="landing-stat-description">{stat.description}</p>
    </div>
  );
}
