// Generic {icon, title, description} card — reused by About today and by
// Features later, so it lives in components/ rather than being scoped to
// one section. Mirrors the existing stat-card visual pattern used
// throughout the authenticated app (icon on top, centered, muted text).
export default function HighlightCard({ icon, title, description }) {
  return (
    <div className="glass-card card-hover" style={{ padding: '1.5rem', textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '34px', color: 'var(--accent-gold)', marginBottom: '0.75rem', display: 'block' }}>
        {icon}
      </span>
      <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{description}</p>
    </div>
  );
}
