/**
 * The church's official crest, used wherever the UI speaks AS the church
 * (landing navbar, app sidebar header, auth screens).
 *
 * Not a drop-in for every `church` icon: the crest carries fine gold filigree
 * and two lines of Arabic, so below ~28px it turns to mush. Generic church
 * iconography ("أب الاعتراف", the registration step marker) keeps the material
 * symbol — that's decoration, not identity.
 *
 * Uses the transparent PNG so the arch silhouette sits directly on whatever is
 * behind it; the crest is legible on both themes without a plate behind it.
 */
export default function ChurchLogo({ size = 36, className }) {
  return (
    <img
      src="/church logo.png"
      alt="شعار كنيسة مارمرقس الرسول — النزهة ٢"
      className={className}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}
