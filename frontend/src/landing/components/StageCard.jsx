export default function StageCard({ stageName, curriculumCount, onBrowse }) {
  const hasItems = curriculumCount > 0;
  return (
    <div className="glass-card card-hover landing-stage-card" onClick={onBrowse}>
      <div className="landing-stage-card-glow" aria-hidden="true" />

      <div className="landing-stage-card-icon-wrap">
        <span className="material-symbols-outlined landing-stage-card-icon">auto_stories</span>
      </div>

      <h3 className="landing-stage-card-name">{stageName}</h3>

      <span className={`landing-stage-card-badge ${hasItems ? '' : 'landing-stage-card-badge-empty'}`}>
        <span className="material-symbols-outlined">{hasItems ? 'menu_book' : 'hourglass_empty'}</span>
        {hasItems ? `${curriculumCount} منهج متاح` : 'لا توجد مناهج بعد'}
      </span>

      <button className="btn-primary landing-stage-card-btn" onClick={e => { e.stopPropagation(); onBrowse(); }}>
        استعراض المكتبة
        <span className="material-symbols-outlined">arrow_back</span>
      </button>
    </div>
  );
}
