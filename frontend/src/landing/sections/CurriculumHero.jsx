// Small hero reused at the top of every Curriculum Browser page — same
// typography/spacing family as the main Landing Hero, just condensed.
export default function CurriculumHero({ title, subtitle }) {
  return (
    <div className="landing-curriculum-hero">
      <span className="landing-hero-eyebrow">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>menu_book</span>
        المناهج الدراسية
      </span>
      <h1 className="landing-curriculum-hero-title">{title}</h1>
      <p className="landing-curriculum-hero-subtitle">{subtitle}</p>
    </div>
  );
}
