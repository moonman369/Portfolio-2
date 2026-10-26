import { useCallback, useEffect, useRef, useState } from "react";
import { stagger } from "animejs/utils";
import { waapi } from "animejs/waapi";
import { cn } from "../lib/utils";
import { EASE } from "../lib/motion";
import { useInView } from "../hooks/useInView";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useReveal } from "../hooks/useReveal";
import SectionHeading from "./SectionHeading";
import {
  SKILLS_SECTION_PROP,
  SKILL_CATEGORY_LABELS,
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
} from "../context/constants";

const categories = Object.keys(SKILL_CATEGORY_LABELS);

// Each filled bar takes BAR_MS, the next starting BAR_GAP_MS later: a Master
// card is done in 4 × 70 + 350 = 630ms.
const BAR_MS = 350;
const BAR_GAP_MS = 70;

// An unknown level shows as the lowest step; development says which skill.
const warned = new Set();
const stepOf = (skill) => {
  const index = SKILL_LEVELS.indexOf(skill.level);
  if (index >= 0) return index + 1;
  if (import.meta.env.DEV && !warned.has(skill.name)) {
    warned.add(skill.name);
    console.warn(
      `Skill "${skill.name}" has an unknown level "${skill.level}"; showing it as ${SKILL_LEVELS[0]}.`,
    );
  }
  return 1;
};

// One skill: its filled bars grow in from the left, one after another, the
// first time the card is seen, and again whenever it is hovered. With reduced
// motion it simply shows them.
const SkillCard = ({ skill, scrollRootRef, active, reducedMotion }) => {
  const cardRef = useRef(null);
  const barsRef = useRef(null);
  const runningRef = useRef(null);

  const step = stepOf(skill);
  const label = SKILL_LEVEL_LABELS[SKILL_LEVELS[step - 1]];
  const animated = !reducedMotion;

  const play = useCallback(() => {
    const bars = barsRef.current;
    if (!bars || runningRef.current) return;

    runningRef.current = waapi.animate(bars.querySelectorAll("[data-fill]"), {
      transform: ["scaleX(0)", "scaleX(1)"],
      duration: BAR_MS,
      delay: stagger(BAR_GAP_MS),
      ease: EASE.out,
      onComplete: () => {
        runningRef.current = null;
      },
    });
  }, []);

  // First sighting: inside the list's visible area, once the list itself is
  // on screen.
  useEffect(() => {
    const card = cardRef.current;
    const root = scrollRootRef.current;
    if (!animated || !active || !card || !root) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        play();
      },
      { root, threshold: 0.6 },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, [animated, active, scrollRootRef, play]);

  useEffect(() => () => runningRef.current?.cancel(), []);

  return (
    <li
      ref={cardRef}
      onPointerEnter={animated ? play : undefined}
      className="surface card-ring flex flex-col rounded-lg border border-border bg-card/85 p-5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="min-w-0 font-medium leading-snug text-foreground">
          {skill.name}
        </h3>
        <span
          aria-hidden="true"
          className="shrink-0 whitespace-nowrap font-mono text-sm text-ink"
        >
          {label}
        </span>
      </div>
      {/* Pinned to the bottom so bars line up across a row. */}
      <div className="mt-auto pt-3.5">
        <div
          ref={barsRef}
          role="img"
          aria-label={`${label}, level ${step} of ${SKILL_LEVELS.length}`}
          className="flex gap-1.5"
        >
          {SKILL_LEVELS.map((level, i) => (
            <div
              key={level}
              aria-hidden="true"
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
              {i < step && (
                // Each bar keeps its own stage colour (--level-1 to
                // --level-5), the same on every card.
                <div
                  data-fill
                  className="h-full w-full origin-left rounded-full"
                  style={{
                    backgroundColor: `hsl(var(--level-${i + 1}))`,
                    transform: animated ? "scaleX(0)" : undefined,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </li>
  );
};

const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const reducedMotion = usePrefersReducedMotion();
  const { ref, pending } = useReveal();
  // The bars fill once the list is actually on screen, not while the section
  // is still far below.
  const [listRef, listInView] = useInView({ threshold: 0.2 });

  const filteredSkills = SKILLS_SECTION_PROP.filter(
    (skill) => activeCategory === "all" || skill.category === activeCategory,
  );

  return (
    <section
      id="skills"
      ref={ref}
      data-reveal-pending={pending || undefined}
      className="section-pad relative text-left"
    >
      <div className="container max-w-6xl">
        <SectionHeading index="02" label="Skills">
          My Skills
        </SectionHeading>

        <div
          data-reveal
          role="group"
          aria-label="Filter skills by category"
          className="flex flex-wrap gap-2 mb-6"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                aria-pressed={isActive}
                className={cn(
                  "min-h-11 px-4 rounded-full font-mono text-xs uppercase tracking-[0.12em]",
                  "ring-1 ring-inset",
                  isActive
                    ? "bg-primary text-primary-foreground ring-primary"
                    : "ring-border text-muted-foreground hover:text-foreground hover:ring-input",
                )}
              >
                {SKILL_CATEGORY_LABELS[category]}
              </button>
            );
          })}
        </div>

        {/* Its own scroll area (no scrollbar), so the full list never makes
            the page long; see .skills-scroll. */}
        <div data-reveal>
          <div
            ref={listRef}
            role="region"
            aria-label="Skills"
            tabIndex={0}
            className="skills-scroll max-h-[28rem] md:max-h-[31rem] overflow-y-auto rounded-lg -mx-1 px-1 pt-5 pb-12"
          >
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {filteredSkills.map((skill) => (
                <SkillCard
                  // Per tab, so switching tabs fills every card again.
                  key={`${activeCategory}:${skill.name}`}
                  skill={skill}
                  scrollRootRef={listRef}
                  active={listInView}
                  reducedMotion={reducedMotion}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
