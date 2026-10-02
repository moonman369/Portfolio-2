import { useId } from "react";
import { cn } from "../lib/utils";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

// The chat's one loader: the site's moon mark (outline ring, as in the
// navbar and the chat header) filling through its phases as a run moves on.
// The lit part is a disc with a shadow disc of the same size over it; the
// shadow slides off sideways (`transform: translateX`) as `phase` goes from
// 0 (new) to 1 (full). No path morphing, no filter. The whole mark pulses
// gently (opacity) while `pulse` is set. Reduced motion: a static half moon,
// no pulse. Decorative.
const R = 8.5;

const MoonLoader = ({ phase = 0.25, size = 18, pulse = false, className }) => {
  const reducedMotion = usePrefersReducedMotion();
  const mask = `mm-loader-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const shown = reducedMotion ? 0.5 : Math.min(1, Math.max(0, phase));

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("mm-loader shrink-0", pulse && !reducedMotion && "mm-loader-pulse", className)}
    >
      <defs>
        <mask id={mask}>
          <rect width="24" height="24" fill="#fff" />
          <circle
            cx="12"
            cy="12"
            r={R + 0.5}
            fill="#000"
            className="mm-loader-shadow"
            style={{ transform: `translateX(${shown * 2 * (R + 0.5)}px)` }}
          />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r={R} fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r={R} fill="currentColor" mask={`url(#${mask})`} />
    </svg>
  );
};

export default MoonLoader;
