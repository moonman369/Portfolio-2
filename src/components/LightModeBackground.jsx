import { useEffect, useState } from "react";
import { whenAmbient } from "../lib/motion";
import { subscribeIdle } from "../lib/idleFreeze";
import lunar1600Avif from "../assets/lunar/lunar-1600.avif";
import lunar1600Webp from "../assets/lunar/lunar-1600.webp";
import lunar900Avif from "../assets/lunar/lunar-900.avif";
import lunar900Webp from "../assets/lunar/lunar-900.webp";

// Light mode: a bright, sunlit lunar day.
//
// One pre-rendered surface texture (NASA SVS CGI Moon Kit relief + albedo,
// see DESIGN.md), 1600px landscape for desktop and a 900px portrait crop for
// phones, each under 120 KB. The paper colour shows until it arrives; it is
// only requested once ambient motion switches on (after the page has
// loaded), then fades in. On desktop it drifts very slowly, a "sunlight"
// gradient swings across it, and it parallaxes a little with scroll — all
// transform/opacity on the compositor (see .lunar in index.css). Phones and
// reduced motion get the still image. Text sits on paper scrims, so the
// surface reads mostly around the edges and between sections.
const LightModeBackground = () => {
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => whenAmbient(() => setRequested(true)), []);
  // Starts the idle tracker, so the drift freezes after 30s without input
  // (CSS, via <html data-idle>).
  useEffect(() => subscribeIdle(() => {}), []);

  return (
    <div
      aria-hidden="true"
      data-loaded={loaded || undefined}
      className="lunar fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {requested && (
        <div className="lunar-parallax absolute inset-0">
          <div className="lunar-drift absolute -inset-[6%]">
            <picture>
              <source
                media="(max-width: 767px)"
                type="image/avif"
                srcSet={lunar900Avif}
              />
              <source
                media="(max-width: 767px)"
                type="image/webp"
                srcSet={lunar900Webp}
              />
              <source type="image/avif" srcSet={lunar1600Avif} />
              <source type="image/webp" srcSet={lunar1600Webp} />
              <img
                src={lunar1600Webp}
                alt=""
                decoding="async"
                onLoad={() => setLoaded(true)}
                className="lunar-img"
              />
            </picture>
          </div>
        </div>
      )}
      <div className="lunar-sun" />
      <div className="lunar-wash" />
    </div>
  );
};

export default LightModeBackground;
