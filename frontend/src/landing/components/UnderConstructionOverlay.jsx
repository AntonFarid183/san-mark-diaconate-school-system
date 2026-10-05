import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SchoolLogo from '../../components/SchoolLogo';

/**
 * Temporary cover for the landing page while its real content is being filled
 * in. The page underneath stays rendered (blurred) so removing the overlay is
 * a one-line change in LandingPage. Students can still sign in from here.
 */
export default function UnderConstructionOverlay() {
  const navigate = useNavigate();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  return (
    <div className="under-construction-overlay" role="dialog" aria-modal="true" aria-labelledby="uc-title">
      <div className="under-construction-card">
        <SchoolLogo size={88} />
        <h2 id="uc-title">الموقع قيد التجهيز</h2>
        <p>نعمل حاليًا على استكمال محتوى الصفحة الرئيسية، وسيكون متاحًا قريبًا إن شاء الله.</p>
        <p className="under-construction-note">الطلاب يمكنهم تسجيل الدخول بشكل طبيعي.</p>
        <button className="btn-primary" onClick={() => navigate('/login')}>
          تسجيل الدخول
        </button>
      </div>
    </div>
  );
}
