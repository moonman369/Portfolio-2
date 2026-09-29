import { Download } from "lucide-react";
import { animate } from "animejs/animation";
import { createDrawable } from "animejs/svg";
import { stagger } from "animejs/utils";
import { waapi } from "animejs/waapi";
import {
  HERO_SECTION_DESCRIPTION,
  HERO_SECTION_FNAME,
  HERO_SECTION_GREETING,
  HERO_SECTION_LNAME,
  HERO_SECTION_ROLES,
  RESUME_URL,
} from "../context/constants";
import { useMoonmind } from "../context/MoonmindContext";
import { useAnimeScope } from "../hooks/useAnimeScope";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { moonmindIntentProps } from "../lib/lazyChat";
import { DURATION, EASE, STAGGER, rise } from "../lib/motion";
import HeroMoon from "./HeroMoon";
import MoonMark from "./MoonMark";
import SocialLinks from "./SocialLinks";

const FULL_NAME = `${HERO_SECTION_FNAME} ${HERO_SECTION_LNAME}`;

// The typewriter used to cycle through these; they now sit under the name as
// one quiet line, minus the name itself.
const ROLES = HERO_SECTION_ROLES.filter(
  (role, index, all) => role !== FULL_NAME && all.indexOf(role) === index,
);

// Load choreography: the moon draws itself while the name rises line by line
// out of its masks, then everything else settles in. Runs once, in the frame
// after the first paint; until then CSS holds the animated parts hidden
// (`data-entrance="pending"`). With reduced motion there is no pending state
// and no animation: the hero renders complete.
const playEntrance = (root) => {
  const q = (selector) => root.querySelectorAll(selector);

  // Strokes need the JS engine (dash offsets); createDrawable(…, 0, 0) hides
  // them synchronously. Everything else is WAAPI, which holds its own start
  // state through its delay (fill: both) — so nothing here reads style.
  animate(createDrawable(q("[data-draw]"), 0, 0), {
    draw: ["0 0", "0 1"],
    duration: DURATION.slow * 1.5,
    ease: EASE.inOut,
    delay: stagger(STAGGER * 0.75),
  });

  waapi.animate(q("[data-shade], [data-satellite]"), {
    opacity: [0, 1],
    duration: DURATION.slow,
    delay: DURATION.slow * 1.5,
    ease: EASE.out,
  });

  // The name rises line by line out of its masks.
  waapi.animate(q("[data-hero-word]"), {
    transform: ["translateY(130%)", "translateY(0%)"],
    duration: DURATION.slow * 1.5,
    delay: stagger(STAGGER * 1.5, { start: DURATION.fast }),
    ease: EASE.expo,
  });

  // Blocks go through the shared entrance, overlapping the name.
  rise(q("[data-hero-rise]"), { delay: DURATION.base / 2 });

  // Every start state is now held by an animation, so the CSS hold can go.
  root.removeAttribute("data-entrance");

  return () => root.setAttribute("data-entrance", "pending");
};

const HeroSection = () => {
  const { open: openMoonmind } = useMoonmind();

  const reducedMotion = usePrefersReducedMotion();
  const root = useAnimeScope(
    (scope, { reducedMotion: reduced }) => {
      if (reduced || !scope.root) return undefined;
      return playEntrance(scope.root);
    },
    { afterPaint: true },
  );

  return (
    <section
      id="hero"
      ref={root}
      data-entrance={reducedMotion ? undefined : "pending"}
      className="relative min-h-svh flex items-center overflow-x-clip pt-[calc(6.75rem+env(safe-area-inset-top))] lg:pt-[calc(5.5rem+env(safe-area-inset-top))] pb-28 md:pb-20"
    >
      <div className="container w-full grid grid-cols-1 lg:grid-cols-12 lg:items-center gap-y-10 lg:gap-x-8">
        {/* The moon: top-right beside the name on phones and tablets, its own
            column on wide screens. */}
        <div className="pointer-events-none absolute -right-[3.75rem] top-[calc(4.25rem+env(safe-area-inset-top))] w-[15rem] sm:-right-8 sm:w-[20rem] md:right-0 md:w-[24rem] lg:static lg:order-2 lg:col-span-5 lg:w-full lg:max-w-[34rem] lg:justify-self-end">
          <HeroMoon className="w-full h-auto" />
        </div>

        <div className="relative z-10 lg:order-1 lg:col-span-7 text-left">
          <h1 className="font-heading">
            <span
              data-hero-rise
              className="eyebrow block text-muted-foreground mb-5 md:mb-7"
            >
              {HERO_SECTION_GREETING}
            </span>{" "}
            <span
              data-hero-name
              className="block text-display font-semibold text-foreground"
            >
              {/* One mask per line; the padding gives descenders room
                  below the mask without moving anything. The split lives in
                  the markup rather than splitText: the name is already two
                  words, and splitting at runtime cost ~200ms at load on a
                  slow phone (see DESIGN.md). */}
              {[HERO_SECTION_FNAME, HERO_SECTION_LNAME].map((word, index) => (
                <span key={word}>
                  {index > 0 && " "}
                  <span className="block overflow-clip pb-[0.2em] -mb-[0.2em]">
                    <span data-hero-word className="block">
                      {word}
                    </span>
                  </span>
                </span>
              ))}
            </span>
          </h1>

          <p
            data-hero-rise
            className="mt-6 md:mt-8 font-mono text-[0.8125rem] md:text-sm text-primary flex flex-wrap gap-x-2 md:gap-x-3 gap-y-1"
          >
            {ROLES.map((role, index) => (
              <span key={role} className="inline-flex items-center gap-2 md:gap-3">
                {role}
                {index < ROLES.length - 1 && (
                  <span aria-hidden="true" className="text-muted-foreground">
                    /
                  </span>
                )}
              </span>
            ))}
          </p>

          {/* Readable from the first paint: it is the largest text in view
              (the LCP element), so it is not part of the entrance. */}
          <p className="mt-6 max-w-[62ch] text-base md:text-lg leading-relaxed text-muted-foreground text-pretty"
          >
            {HERO_SECTION_DESCRIPTION}
          </p>

          <div data-hero-rise className="mt-9 flex flex-wrap gap-3">
            <a
              href={RESUME_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Download size={18} aria-hidden="true" /> Download Résumé
            </a>

            <button
              onClick={openMoonmind}
              {...moonmindIntentProps}
              className="btn-ghost"
            >
              <MoonMark size={18} /> Moonmind AI
            </button>
          </div>

          <div data-hero-rise className="mt-8">
            <SocialLinks />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
