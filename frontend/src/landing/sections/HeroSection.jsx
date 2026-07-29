import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomVerse } from '../data/bibleVerses';
import Typewriter from '../components/Typewriter';

export default function HeroSection() {
  const navigate = useNavigate();
  const [verse] = useState(getRandomVerse);

  return (
    <section className="landing-hero" id="hero">
      {/* Swappable background — swaps image via --landing-hero-image per theme
          (see Landing.css); replace with a <video> later, no other changes needed */}
      <div className="landing-hero-media">
        <div className="landing-hero-media-img" />
      </div>
      <div className="landing-hero-overlay" />

      <div className="landing-hero-content">
        <span className="landing-hero-eyebrow">
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>church</span>
          كنيسة العذراء القديسة مريم والقديس مارمرقس - النزهة 2
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

        {/* A different verse each page load — see landing/data/bibleVerses.js */}
        <div className="landing-hero-verse">
          <span className="material-symbols-outlined landing-hero-verse-icon">format_quote</span>
          <p className="landing-hero-verse-text">
            <Typewriter text={verse.text} />
          </p>
          <span className="landing-hero-verse-ref">{verse.reference}</span>
        </div>
      </div>

      <span className="landing-hero-scroll-cue material-symbols-outlined">keyboard_arrow_down</span>
    </section>
  );
}
