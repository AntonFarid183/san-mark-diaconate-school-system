export default function CurriculumCard({ item, onOpen }) {
  const hasPdf = !!item.pdfUrl;
  return (
    <div className="glass-card card-hover landing-curriculum-card" onClick={() => hasPdf && onOpen(item)}>
      <div className="landing-curriculum-card-cover">
        <span className="material-symbols-outlined landing-curriculum-card-cover-icon">auto_stories</span>
        {hasPdf && (
          <span className="landing-curriculum-card-ribbon">
            <span className="material-symbols-outlined">picture_as_pdf</span>
            PDF
          </span>
        )}
      </div>

      <div className="landing-curriculum-card-body">
        <div className="landing-curriculum-card-title">{item.title}</div>
        <div className="landing-curriculum-card-year">{item.academicYear}</div>

        {item.description && (
          <p className="landing-curriculum-card-description">{item.description}</p>
        )}

        <button
          className="btn-primary landing-curriculum-card-btn"
          onClick={e => { e.stopPropagation(); hasPdf && onOpen(item); }}
          disabled={!hasPdf}
        >
          <span className="material-symbols-outlined">visibility</span>
          {hasPdf ? 'فتح المنهج' : 'لم يُرفع ملف بعد'}
        </button>
      </div>
    </div>
  );
}
