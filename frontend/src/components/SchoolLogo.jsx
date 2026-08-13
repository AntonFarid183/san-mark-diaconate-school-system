/**
 * The school's own crest (مدرسة بي ثيؤريموس), distinct from ChurchLogo (the
 * church's crest) — used where the UI speaks AS the school specifically,
 * e.g. the landing navbar brand mark, which leads with the school's name.
 */
export default function SchoolLogo({ size = 36, className }) {
  return (
    <img
      src="/school logo.png"
      alt="شعار مدرسة بي ثيؤريموس للألحان والتسبحة"
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
