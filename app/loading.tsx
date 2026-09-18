/**
 * Shown while a route streams in. A slim gold bar along the top edge instead of
 * a spinner in an empty page: the old page stays put underneath on client
 * navigations, and a cold load gets a quiet signal rather than a blank screen.
 */
export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden">
      <span className="block h-full w-1/3 animate-[loading-bar_1.1s_ease-in-out_infinite] bg-gold-gradient" />
    </div>
  );
}
