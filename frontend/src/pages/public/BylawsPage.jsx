import { useNavigate } from 'react-router-dom';
import InfoPageShell from '../../landing/components/InfoPageShell';
import useSeo from '../../seo/useSeo';
import { SITE_NAME } from '../../seo/keywords';

// The school's bylaws text has not been supplied yet. When it is, replace the notice below with
// the articles (same card layout as the ordination page's "البنود").
export default function BylawsPage() {
  const navigate = useNavigate();
  useSeo({
    title: `لائحة المدرسة — ${SITE_NAME}`,
    description: 'لائحة وقواعد مدرسة بي ثيؤريموس للألحان والتسبحة.',
  });

  return (
    <InfoPageShell
      eyebrow="اللوائح"
      icon="gavel"
      title="لائحة المدرسة"
      subtitle="قواعد وأنظمة الدراسة والانضباط بمدرسة بي ثيؤريموس للألحان والتسبحة."
      crumb="لائحة المدرسة"
    >
      <div className="glass-card info-empty">
        <span className="material-symbols-outlined">hourglass_top</span>
        <h2>اللائحة قيد الإعداد</h2>
        <p>سيتم نشر لائحة المدرسة هنا قريبًا. وفي الوقت الحالي يمكنك الاطلاع على لائحة رسامة الشمامسة.</p>
        <div className="info-join-actions">
          <button className="btn-primary" onClick={() => navigate('/ordination')}>لائحة الرسامة</button>
          <button className="btn-secondary" onClick={() => navigate('/contact')}>تواصل معنا</button>
        </div>
      </div>
    </InfoPageShell>
  );
}
