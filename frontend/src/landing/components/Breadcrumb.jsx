import { useNavigate } from 'react-router-dom';

// items: [{ label, path? }] — the last item has no path (current page).
export default function Breadcrumb({ items }) {
  const navigate = useNavigate();
  return (
    <nav className="landing-breadcrumb" aria-label="breadcrumb">
      {items.map((item, i) => (
        <span key={i} className="landing-breadcrumb-item">
          {i > 0 && <span className="material-symbols-outlined landing-breadcrumb-sep">chevron_left</span>}
          {item.path ? (
            <span className="landing-breadcrumb-link" onClick={() => navigate(item.path)}>{item.label}</span>
          ) : (
            <span className="landing-breadcrumb-current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
