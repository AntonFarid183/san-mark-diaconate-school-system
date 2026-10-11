import { useCallback, useEffect, useRef, useState } from 'react';
import { GALLERY_PHOTOS, photoUrl, thumbUrl } from '../data/galleryPhotos';

const AUTOPLAY_MS = 5500;
const SWIPE_PX = 50;

const toArabicDigits = (n) => Number(n).toLocaleString('ar-EG');

/**
 * Large photo slideshow: one big photo at a time that changes by itself with a slow crossfade,
 * with arrows, swipe, keyboard, a thumbnail strip and a full-screen view.
 *
 * Only the current photo and its neighbours are in the DOM at once, so 37 full-size photos never
 * load together; the next one is already fetched when it fades in.
 */
export default function GalleryCarousel() {
  const photos = GALLERY_PHOTOS;
  const count = photos.length;

  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stripRef = useRef(null);
  const touchStartX = useRef(null);

  const wrap = useCallback((i) => (i + count) % count, [count]);
  const go = useCallback((i) => setIndex(wrap(i)), [wrap]);
  const next = useCallback(() => setIndex(i => wrap(i + 1)), [wrap]);
  const prev = useCallback(() => setIndex(i => wrap(i - 1)), [wrap]);

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotion = () => setReducedMotion(!!query?.matches);
    onMotion();
    query?.addEventListener?.('change', onMotion);
    const onVisibility = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      query?.removeEventListener?.('change', onMotion);
    };
  }, []);

  // Autoplay. Restarts on every change of photo, so a manual click gives the full time again.
  const playing = !hovering && !lightbox && !tabHidden && !reducedMotion;
  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [playing, index, next]);

  // Keep the active thumbnail in view — scrolls only the strip, never the page.
  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.children[index];
    if (!strip || !active) return;
    const target = active.offsetLeft - (strip.clientWidth - active.clientWidth) / 2;
    strip.scrollTo({ left: target, behavior: 'smooth' });
  }, [index]);

  // Keyboard: arrows (RTL — left goes forward), Esc closes the full-screen view.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') next();
      if (e.key === 'ArrowRight') prev();
    };
    // Only react while the gallery is on screen (focused inside) or the full-screen view is open.
    const handler = (e) => {
      if (lightbox || e.target.closest?.('.landing-carousel')) onKey(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, next, prev]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [lightbox]);

  const onPointerDown = (e) => { touchStartX.current = e.clientX; };
  const onPointerUp = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    // RTL: dragging to the right reveals the next photo, like turning a page of an Arabic book.
    if (dx > 0) next(); else prev();
  };

  const visible = [wrap(index - 1), index, wrap(index + 1)];
  const current = photos[index];

  return (
    <div
      className="landing-carousel"
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="معرض الصور لمدرسة الشمامسة"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="landing-carousel-stage"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { touchStartX.current = null; }}
      >
        {/* Soft blurred copy of the photo fills any empty space, so nothing is cropped or boxed */}
        <div className="landing-carousel-backdrop" style={{ backgroundImage: `url(${photoUrl(current)})` }} />

        {visible.map(i => {
          const photo = photos[i];
          const active = i === index;
          return (
            <img
              key={photo.id}
              className={`landing-carousel-slide${active ? ' landing-carousel-slide-active' : ''}`}
              src={photoUrl(photo)}
              alt={`صورة ${toArabicDigits(i + 1)} من معرض مدرسة الشمامسة`}
              width={photo.w}
              height={photo.h}
              loading="eager"
              decoding="async"
              draggable={false}
              aria-hidden={!active}
            />
          );
        })}

        <div className="landing-carousel-vignette" />

        <button type="button" className="landing-carousel-arrow landing-carousel-arrow-prev" onClick={prev} aria-label="الصورة السابقة">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
        <button type="button" className="landing-carousel-arrow landing-carousel-arrow-next" onClick={next} aria-label="الصورة التالية">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <button type="button" className="landing-carousel-expand" onClick={() => setLightbox(true)} aria-label="عرض الصورة بحجم كامل">
          <span className="material-symbols-outlined">fullscreen</span>
        </button>

        <span className="landing-carousel-counter">{toArabicDigits(index + 1)} / {toArabicDigits(count)}</span>

        {/* Time until the next photo; hidden while paused */}
        <div className="landing-carousel-progress" aria-hidden="true">
          <span
            key={`${index}-${playing}`}
            className={playing ? 'landing-carousel-progress-run' : ''}
            style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
          />
        </div>
      </div>

      <div className="landing-carousel-strip" ref={stripRef} role="tablist" aria-label="الصور المصغرة">
        {photos.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`الصورة ${toArabicDigits(i + 1)}`}
            className={`landing-carousel-thumb${i === index ? ' landing-carousel-thumb-active' : ''}`}
            onClick={() => go(i)}
          >
            <img src={thumbUrl(photo)} alt="" loading="lazy" draggable={false} />
          </button>
        ))}
      </div>

      {lightbox && (
        <div className="landing-lightbox" role="dialog" aria-modal="true" aria-label="عرض الصورة" onClick={() => setLightbox(false)}>
          <img src={photoUrl(current)} alt={`صورة ${toArabicDigits(index + 1)} من معرض مدرسة الشمامسة`} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="landing-lightbox-close" onClick={() => setLightbox(false)} aria-label="إغلاق">
            <span className="material-symbols-outlined">close</span>
          </button>
          <button type="button" className="landing-carousel-arrow landing-carousel-arrow-prev" onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="الصورة السابقة">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
          <button type="button" className="landing-carousel-arrow landing-carousel-arrow-next" onClick={(e) => { e.stopPropagation(); next(); }} aria-label="الصورة التالية">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="landing-carousel-counter">{toArabicDigits(index + 1)} / {toArabicDigits(count)}</span>
        </div>
      )}
    </div>
  );
}
