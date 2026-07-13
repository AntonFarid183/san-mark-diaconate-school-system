import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="landing-hero" id="hero">
      {/* Swappable background — replace this <img> with a <video> later, no other changes needed */}
      <div className="landing-hero-media">
        <img src="/san-mark-wide.png" alt="" />
      </div>
      <div className="landing-hero-overlay" />

      <div className="landing-hero-content">
        <span className="landing-hero-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>church</span>
          كنيسة قبطية أرثوذكسية
        </span>

        <h1 className="landing-hero-title">
          مدرسة بي ثيؤريموس <span>للألحان والتسبحة</span>
        </h1>

        <p className="landing-hero-subtitle">
          نص فرعي تعريفي بالمدرسة ورسالتها الروحية والتعليمية — يُستبدل بمحتوى نهائي لاحقاً.
        </p>

        <div className="landing-hero-actions">
          <button className="btn-primary" onClick={() => navigate('/self-register')}>
            تسجيل عضو جديد
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>
            تسجيل الدخول
          </button>
        </div>

        {/* Reserved for a future Bible verse / spiritual quote — layout only, no content yet */}
        <div className="landing-hero-verse">
          (مساحة محجوزة لآية كتابية أو كلمة روحية)
        </div>
      </div>

      <span className="landing-hero-scroll-cue material-symbols-outlined">keyboard_arrow_down</span>
    </section>
  );
}
