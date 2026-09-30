import { useLayoutEffect, useRef } from "react";
import { cn } from "../lib/utils";
import { createMoonSphere } from "../lib/moonSphere";
import { getMoonTexture } from "../lib/moonTextureSource";
import { getScrollPhase, subscribeScrollPhase } from "../lib/scrollPhase";

// The site's mark: a tiny lit moon, shaded like the hero moon (the same
// renderer, lib/moonSphere.js), with a thin accent rim so even a new moon
// reads. Shared by the navbar, the hero button, the footer and Moonmind so
// the bot visibly belongs to the site.
//
// `phase` runs 0 (new) → 1 (full), waxing. `followScroll` ties it to the
// page's scroll progress instead (the navbar mark: new at the top, full at
// Contact). It is drawn once per phase change, at the device's pixel ratio;
// no animation loop. Decorative: always aria-hidden.

// Brighter night side than the hero's, so the dark part keeps a shape at
// this size.
const MARK_EARTHSHINE = 0.14;
const MAX_DPR = 3;

const MoonMark = ({ phase = 0.62, size = 20, followScroll = false, className }) => {
  const canvasRef = useRef(null);
  const sphereRef = useRef(null);
  const phaseRef = useRef(phase);

  // Build the sphere for this size (and pixel ratio).
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = canvas.height = Math.max(8, Math.round(size * dpr));
    const sphere = createMoonSphere(canvas, { earthshine: MARK_EARTHSHINE });
    sphereRef.current = sphere;
    // Waxing phase (0..1) → position in the lunar cycle (0..0.5).
    sphere.setPhase((followScroll ? getScrollPhase() : phaseRef.current) / 2);
    sphere.drawNow();

    let alive = true;
    getMoonTexture()
      .then((texture) => {
        if (alive) sphere.setTexture(texture.data, texture.w, texture.h);
      })
      .catch(() => {
        /* keep the plain sphere */
      });
    const unsubscribe = followScroll
      ? subscribeScrollPhase((progress) => sphere.setPhase(progress / 2))
      : null;

    return () => {
      alive = false;
      unsubscribe?.();
      sphere.destroy();
      sphereRef.current = null;
    };
  }, [size, followScroll]);

  // A new `phase` prop redraws once.
  useLayoutEffect(() => {
    phaseRef.current = phase;
    if (!followScroll) sphereRef.current?.setPhase(phase / 2);
  }, [phase, followScroll]);

  return (
    <span
      aria-hidden="true"
      className={cn("moon-mark relative inline-block shrink-0 rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <canvas ref={canvasRef} className="block h-full w-full rounded-full" />
    </span>
  );
};

export default MoonMark;
