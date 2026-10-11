import { useNavigate } from 'react-router-dom';
import InfoPageShell from '../../landing/components/InfoPageShell';
import Reveal from '../../landing/components/Reveal';
import AboutImageCollage from '../../landing/components/AboutImageCollage';
import { SERVICE_DAYS } from '../../constants/schoolContact';
import useSeo from '../../seo/useSeo';
import { SITE_NAME } from '../../seo/keywords';

const ABOUT_IMAGES = [{ src: '/Avva Markos Church.jpg', alt: 'كنيسة القديس مارمرقس الرسول', slot: 'primary' }];

const TIMELINE = [
  {
    when: '2011 – 2012', title: 'البداية',
    text: 'مع رسامة أول دفعة من آباء الكنيسة في نوفمبر 2011، بدأت خدمة الألحان والشموسية في النمو، وفي عام 2012 بدأت خدمة الألحان في الكنيسة من خلال فصول لتعليم الألحان واللغة القبطية.',
  },
  {
    when: 'سبتمبر 2015', title: 'تأسيس المدرسة',
    text: 'مع نمو الخدمة، ظهرت فكرة تأسيس مدرسة متكاملة للشمامسة تشمل الأولاد والبنات، وتم تأسيس أول شكل للمدرسة في سبتمبر 2015 تحت اسم «مدرسة مارمرقس للألحان والتسبحة»، تحت رعاية القس يوحنا زاخر.',
  },
  {
    when: '2020', title: 'مرحلة التطوير والتوسع',
    text: 'استمرت المدرسة في التطور والنمو حتى عام 2020، حيث بدأت مرحلة جديدة تحت رعاية القس صموئيل. ومع نجاح المدرسة وتزايد أعداد الملتحقين بها، تم إعداد مناهج خاصة ومتطورة، ووضع برنامج للمتابعة، وتأسيس خوارس تناسب مختلف الأعمار. وفي إطار هذا التطور، تغير اسم المدرسة إلى «مدرسة بي ثيؤريموس للألحان والتسبحة».',
  },
  {
    when: '2026', title: 'نحو خدمة أوسع',
    text: 'تواصل المدرسة رحلتها في التعليم والخدمة تحت رعاية القس إيلاريون جرجس، مع التوسع في خدمة المراحل الأكبر سنًا، وتأسيس «معهد تين ثينو للألحان» لخدمة طلاب المرحلة الجامعية والكبار. وهكذا تستمر المسيرة بهدف نقل تراث الكنيسة القبطي إلى الأجيال الجديدة، وتنمية محبة الألحان والتسبحة في قلوب أبنائها.',
  },
];

const VALUES = [
  { icon: 'auto_stories', title: 'الأمانة في حفظ التراث', text: 'الاهتمام بألحان الكنيسة وتسبحتها ولغتها القبطية.' },
  { icon: 'school', title: 'التعلّم المستمر', text: 'تطوير المناهج وأساليب التعليم بما يناسب احتياجات الدارسين.' },
  { icon: 'diversity_3', title: 'خدمة جميع الأعمار', text: 'إتاحة الفرصة للأولاد والبنات والشباب والكبار للتعلم والنمو.' },
  { icon: 'task_alt', title: 'الالتزام والمتابعة', text: 'الاهتمام بتقدم الدارسين ومساعدتهم على الاستمرار.' },
  { icon: 'volunteer_activism', title: 'روح الخدمة', text: 'العمل معًا من أجل بناء جيل يحب ألحان كنيسته ويعتز بتراثها.' },
];

const OFFERS = [
  'تعليم الألحان والتسبحة القبطية.',
  'تعليم اللغة القبطية.',
  'مناهج تعليمية متدرجة بحسب المرحلة العمرية.',
  'متابعة مستوى الدارسين وتقدمهم.',
  'تأسيس خوارس لمختلف الأعمار.',
  'معهد تين ثينو للألحان، لخدمة المرحلة الجامعية والكبار.',
];

export default function AboutPage() {
  const navigate = useNavigate();
  useSeo({
    title: `من نحن — ${SITE_NAME}`,
    description: 'تعرّف على مدرسة بي ثيؤريموس للألحان والتسبحة بكنيسة القديس مارمرقس الرسول بالنزهة: تاريخنا، رؤيتنا، رسالتنا، قيمنا، المراحل الدراسية ومواعيد الخدمة.',
  });

  return (
    <InfoPageShell
      eyebrow="من نحن"
      icon="church"
      title="مدرسة بي ثيؤريموس للألحان والتسبحة"
      subtitle="معًا نتعلّم ألحان كنيستنا، ونحفظ تراثها، وننمو في محبتها."
    >
      {/* Overview + photo */}
      <section className="info-section info-intro">
        <Reveal className="info-intro-text">
          <h2 className="info-heading">نبذة عن المدرسة</h2>
          <p>
            مدرسة بي ثيؤريموس للألحان والتسبحة هي خدمة كنسية تهدف إلى تعليم الألحان والتسبحة القبطية واللغة القبطية،
            وتنمية المواهب الكنسية لدى الأولاد والبنات، من مرحلة رياض الأطفال وحتى المرحلة الجامعية، بالإضافة إلى خدمة
            الكبار من خلال معهد متخصص للألحان.
          </p>
          <p>
            بدأت الخدمة بفكرة بسيطة، وهي تحفيظ الألحان وتعليم اللغة القبطية، ومع مرور السنوات تطورت الخدمة ونمت حتى
            أصبحت مدرسة متكاملة تضم مراحل دراسية متنوعة، ومناهج تعليمية متطورة، وخوارس تناسب مختلف الأعمار.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <AboutImageCollage images={ABOUT_IMAGES} />
        </Reveal>
      </section>

      {/* Timeline */}
      <section className="info-section">
        <h2 className="info-heading info-heading-center">رحلتنا وتاريخنا</h2>
        <ol className="info-timeline">
          {TIMELINE.map((step, i) => (
            <li key={step.when} className="info-timeline-item">
              <Reveal delay={i * 70}>
                <span className="info-timeline-dot" aria-hidden="true" />
                <span className="info-timeline-when">{step.when}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Vision + mission */}
      <section className="info-section info-duo">
        <Reveal>
          <div className="glass-card info-pillar">
            <span className="material-symbols-outlined">visibility</span>
            <h2>رؤيتنا</h2>
            <p>
              أن نكون خدمة كنسية تسهم في الحفاظ على تراث الكنيسة القبطي، وتساعد الأجيال الجديدة على تعلّم الألحان
              والتسبحة واللغة القبطية، والاستمرار في ممارستها ومحبتها.
            </p>
          </div>
        </Reveal>
        <Reveal delay={90}>
          <div className="glass-card info-pillar">
            <span className="material-symbols-outlined">flag</span>
            <h2>رسالتنا</h2>
            <p>
              تقديم تعليم كنسي منظم للألحان والتسبحة واللغة القبطية، من خلال مناهج مناسبة لمختلف الأعمار، ومتابعة مستمرة
              لمستوى الدارسين، وتكوين خوارس تساعدهم على ممارسة ما يتعلمونه داخل الحياة الكنسية.
            </p>
            <p>
              كما نحرص على إتاحة فرص التعلم للأولاد والبنات في مختلف المراحل العمرية، مع الاهتمام بامتداد الخدمة إلى
              الشباب والجامعيين والكبار.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Values */}
      <section className="info-section">
        <h2 className="info-heading info-heading-center">قيمنا</h2>
        <div className="info-values">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 60}>
              <div className="glass-card card-hover info-value">
                <span className="material-symbols-outlined">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* What we offer */}
      <section className="info-section">
        <h2 className="info-heading info-heading-center">ماذا نقدم؟</h2>
        <p className="info-lead">تضم المدرسة مجموعة من المراحل والخدمات التعليمية التي تناسب مختلف الأعمار:</p>
        <ul className="info-checklist">
          {OFFERS.map(o => (
            <li key={o}>
              <span className="material-symbols-outlined">check_circle</span>
              {o}
            </li>
          ))}
        </ul>
      </section>

      {/* Schedule */}
      <section className="info-section">
        <h2 className="info-heading info-heading-center">المراحل الدراسية ومواعيد الخدمة</h2>
        <div className="info-schedule">
          {SERVICE_DAYS.map((d, i) => (
            <Reveal key={d.day} delay={i * 80}>
              <div className="glass-card info-day">
                <h3><span className="material-symbols-outlined">event</span>{d.day}</h3>
                <ul>
                  {d.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="info-section">
        <Reveal>
          <div className="info-feature">
            <h2 className="info-heading">ما الذي يميز مدرستنا؟</h2>
            <p>
              ما يميز مدرسة بي ثيؤريموس هو رحلتها التي بدأت بخدمة بسيطة لتعليم الألحان واللغة القبطية، ثم تطورت إلى
              مدرسة تضم مراحل عمرية متعددة، ومناهج خاصة، وبرنامج متابعة، وخوارس لمختلف الأعمار.
            </p>
            <p>
              ونؤمن بأن تعلّم ألحان الكنيسة ليس مجرد حفظ كلمات أو ألحان، بل هو وسيلة للحفاظ على تراث كنيستنا، ونقله إلى
              الأجيال الجديدة، ومساعدتهم على المشاركة في حياة الكنيسة وتسبحتها.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Join */}
      <section className="info-section">
        <Reveal>
          <div className="glass-card info-join">
            <h2>انضم إلينا</h2>
            <p>
              سواء كان طفلك يخطو خطواته الأولى في تعلّم الألحان، أو كان من أبنائنا في المراحل الابتدائية أو الإعدادية أو
              الثانوية، أو كنت طالبًا جامعيًا أو من الكبار الراغبين في تعلّم الألحان، فإن مدرسة بي ثيؤريموس للألحان
              والتسبحة ترحب بك في رحلتنا التعليمية والكنسية.
            </p>
            <div className="info-join-actions">
              <button className="btn-primary" onClick={() => navigate('/self-register')}>تسجيل عضو جديد</button>
              <button className="btn-secondary" onClick={() => navigate('/contact')}>تواصل معنا</button>
            </div>
            <em>معًا نحفظ ألحان كنيستنا، ونتعلّم لغتها، وننقل تراثها من جيل إلى جيل.</em>
          </div>
        </Reveal>
      </section>
    </InfoPageShell>
  );
}
