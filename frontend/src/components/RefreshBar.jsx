/**
 * Thin progress bar shown while a list is being re-fetched, so the old results
 * stay on screen (no flash of "loading..." and no jump in scroll position)
 * until the new ones arrive. The slot is always reserved to avoid layout shift.
 */
export default function RefreshBar({ active }) {
  return <div className={`refresh-bar${active ? ' refresh-bar-active' : ''}`} aria-hidden="true" />;
}
