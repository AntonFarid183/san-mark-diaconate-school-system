import InfoPageShell from '../../landing/components/InfoPageShell';
import FeedbackSection from '../../landing/sections/FeedbackSection';
import useSeo from '../../seo/useSeo';
import { SITE_NAME } from '../../seo/keywords';

export default function FeedbackPage() {
  useSeo({
    title: `الاقتراحات والتعليقات — ${SITE_NAME}`,
    description: 'شاركنا رأيك أو اقتراحك حول مدرسة بي ثيؤريموس للألحان والتسبحة وخدماتها.',
  });

  return (
    <InfoPageShell
      eyebrow="رأيك يهمنا"
      icon="rate_review"
      title="الاقتراحات والتعليقات"
      subtitle="شاركنا رأيك أو اقتراحك حول المدرسة وخدماتها."
    >
      <FeedbackSection showHeading={false} />
    </InfoPageShell>
  );
}
