/**
 * The school's own crest (مدرسة بي ثيؤريموس), distinct from ChurchLogo (the
 * church's crest) — used where the UI speaks AS the school specifically,
 * e.g. the landing navbar brand mark, which leads with the school's name.
 *
 * Unlike church-logo.png (a transparent PNG, matted directly onto whatever
 * sits behind it), school-logo.png's own circular badge is baked onto a
 * plain light-gray/white square with no alpha — placed on the dark navbar
 * as-is, that background reads as a visible box around the crest. The
 * source art is already a centered circle nearly filling its canvas, so
 * object-fit:cover + a circular clip crops the square's corners away
 * instead of showing them.
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
        objectFit: 'cover',
        borderRadius: '50%',
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}
