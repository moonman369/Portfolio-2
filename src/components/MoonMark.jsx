import { cn } from "../lib/utils";
import { moonPhasePath } from "../lib/moonPhase";

// The site's mark: a thin-line moon whose lit side follows `phase`
// (0 new → 1 full). Shared by the navbar, the hero button and Moonmind so the
// bot visibly belongs to the site. `litRef` lets a caller drive the phase
// imperatively without re-rendering. Decorative: always aria-hidden.
const MoonMark = ({ phase = 0.62, size = 20, litRef, className }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    aria-hidden="true"
    focusable="false"
    className={cn("shrink-0", className)}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.5"
      vectorEffect="non-scaling-stroke"
    />
    <path ref={litRef} d={moonPhasePath(phase)} fill="currentColor" />
  </svg>
);

export default MoonMark;
