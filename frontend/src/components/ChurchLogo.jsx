/**
 * The church's official crest, used wherever the UI speaks AS the church
 * (navbar, sidebar header, auth screens).
 *
 * Not a drop-in for every `church` icon: the crest carries fine gold filigree
 * and two lines of Arabic, so below ~28px it turns to mush. Generic church
 * iconography ("أب الاعتراف", the registration step marker) keeps the material
 * symbol — that's decoration, not identity.
 *
 * The source file is a JPG on cream, so it gets a white tile to sit on; without
 * one it reads as a bright rectangle punched into the dark sidebar.
 */
export default function ChurchLogo({ size = 36, tile = true, className }) {
  const pad = Math.max(2, Math.round(size * 0.06));
  return (
    <img
      src="/church logo.jpg"
      alt="شعار كنيسة مارمرقس الرسول — النزهة ٢"
      className={className}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        flexShrink: 0,
        borderRadius: tile ? 'var(--radius-sm)' : 0,
        background: tile ? '#fff' : 'transparent',
        padding: tile ? pad : 0,
        boxShadow: tile ? '0 1px 4px var(--shadow-tint)' : 'none',
      }}
    />
  );
}
