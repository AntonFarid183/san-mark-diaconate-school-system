import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../apiClient';
import LandingNavbar from '../landing/sections/LandingNavbar';
import CurriculumHero from '../landing/sections/CurriculumHero';
import Breadcrumb from '../landing/components/Breadcrumb';
import StageCard from '../landing/components/StageCard';
import CurriculumCard from '../landing/components/CurriculumCard';
import CurriculumViewerModal from '../landing/components/CurriculumViewerModal';
import ScrollToTopButton from '../landing/components/ScrollToTopButton';
import Reveal from '../landing/components/Reveal';
import '../landing/Landing.css';

const SUBJECTS = {
  rites: { value: 1, label: 'الطقس' },
  hymns: { value: 2, label: 'الألحان' },
  coptic: { value: 3, label: 'القبطي' },
};

export default function CurriculumBrowserPage() {
  const { subject, stageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const subjectMeta = SUBJECTS[subject];

  const [stages, setStages] = useState([]);
  const [items, setItems] = useState([]);
  const [stageName, setStageName] = useState(location.state?.stageName || '');
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    setStageName(location.state?.stageName || '');
  }, [stageId, location.state]);

  useEffect(() => {
    if (!subjectMeta) return;
    setLoading(true);
    if (!stageId) {
      apiClient.get('/curriculum/public/stages', { params: { subject: subjectMeta.value } })
        .then(r => setStages(r.data))
        .catch(() => setStages([]))
        .finally(() => setLoading(false));
    } else {
      apiClient.get('/curriculum/public', { params: { subject: subjectMeta.value, stageId } })
        .then(r => {
          setItems(r.data);
          if (!stageName && r.data[0]?.stageName) setStageName(r.data[0].stageName);
        })
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }
  }, [subject, stageId]);

  if (!subjectMeta) {
    return (
      <div className="landing-page">
        <LandingNavbar />
        <div style={{ padding: '10rem 1.5rem 4rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>المادة غير موجودة.</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'الرئيسية', path: '/' },
    { label: 'المناهج', path: `/curriculum/${subject}` },
    { label: subjectMeta.label, path: stageId ? `/curriculum/${subject}` : undefined },
  ];
  if (stageId) breadcrumbItems.push({ label: stageName || '...' });

  return (
    <div className="landing-page">
      <LandingNavbar />

      <div className="landing-curriculum-browser landing-library-bg">
        <CurriculumHero
          title={`مكتبة مناهج ${subjectMeta.label}`}
          subtitle="استعرض جميع المناهج التعليمية حسب المادة والمرحلة الدراسية، وافتحها مباشرة داخل الموقع."
        />

        <div className="landing-section" style={{ paddingTop: 0 }}>
          <Breadcrumb items={breadcrumbItems} />

          {loading ? (
            <div className="landing-library-loading">
              <span className="landing-library-loading-spinner" />
              <p>جاري تحميل المكتبة...</p>
            </div>
          ) : !stageId ? (
            stages.length === 0 ? (
              <div className="glass-card landing-library-empty">
                <span className="material-symbols-outlined">school</span>
                <p>لا توجد مراحل دراسية متاحة حالياً.</p>
              </div>
            ) : (
              <div className="landing-grid-cards">
                {stages.map((s, i) => (
                  <Reveal key={s.stageId} delay={i * 70}>
                    <StageCard
                      stageName={s.stageName}
                      curriculumCount={s.curriculumCount}
                      onBrowse={() => navigate(`/curriculum/${subject}/${s.stageId}`, { state: { stageName: s.stageName } })}
                    />
                  </Reveal>
                ))}
              </div>
            )
          ) : items.length === 0 ? (
            <div className="glass-card landing-library-empty">
              <span className="material-symbols-outlined">menu_book</span>
              <p>لا توجد مناهج منشورة لهذه المرحلة حالياً.</p>
            </div>
          ) : (
            <div className="landing-grid-cards">
              {items.map((item, i) => (
                <Reveal key={item.id} delay={i * 70}>
                  <CurriculumCard item={item} onOpen={setViewing} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewing && <CurriculumViewerModal item={viewing} onClose={() => setViewing(null)} />}

      <ScrollToTopButton />
    </div>
  );
}
