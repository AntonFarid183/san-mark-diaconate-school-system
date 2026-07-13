/**
 * Reusable spiritual-leader portrait.
 *
 * Architecture is ready for shape/frame/decoration variants, but none are
 * enabled unless explicitly passed in — today's placeholder data uses only
 * the defaults (rounded rectangle, no frame, no cross, no watermark).
 *
 * Props:
 *   src, alt        — the photo
 *   shape           — 'rounded' (default) | 'circle'
 *   framed          — false (default) — adds a gold border + soft glow
 *   crossIcon       — optional node rendered as a small overlay (e.g. a cross icon)
 *   watermarkSrc    — optional faint background image (e.g. church logo)
 */
export default function LeaderImage({ src, alt, shape = 'rounded', framed = false, crossIcon = null, watermarkSrc = null }) {
  const classNames = [
    'landing-leader-portrait',
    shape === 'circle' ? 'landing-leader-portrait-circle' : '',
    framed ? 'landing-leader-portrait-framed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {watermarkSrc && <img className="landing-leader-portrait-watermark" src={watermarkSrc} alt="" aria-hidden="true" />}
      <img src={src} alt={alt || ''} loading="lazy" style={{ position: 'relative', zIndex: 1 }} />
      {crossIcon && <span className="landing-leader-portrait-cross">{crossIcon}</span>}
    </div>
  );
}
