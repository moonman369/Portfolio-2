import { useCallback, useEffect, useRef, useState } from "react";
import { animate } from "animejs/animation";
import { waapi } from "animejs/waapi";
import { cn } from "../lib/utils";
import { DURATION, EASE } from "../lib/motion";
import { useInView } from "../hooks/useInView";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useReveal } from "../hooks/useReveal";
import SectionHeading from "./SectionHeading";
import {
  SKILLS_SECTION_PROP,
  SKILL_CATEGORY_LABELS,
} from "../context/constants";

const categories = Object.keys(SKILL_CATEGORY_LABELS);

const COUNT_MS = DURATION.slow * 2;

// "79.98" counts with two decimals, "76" with none — the finished number
// always reads exactly as the data does.
const placesOf = (level) => (String(level).split(".")[1] ?? "").length;
const formatLevel = (value, places) => `${value.toFixed(places)}%`;

// One skill: its bar fills and its number counts from 0 to the level the
// first time the card is seen, and again whenever it is hovered. With reduced
// motion it simply shows the level.
const SkillCard = ({ skill, scrollRootRef, active, reducedMotion }) => {
  const cardRef = useRef(null);
  const numberRef = useRef(null);
  const barRef = useRef(null);
  const runningRef = useRef(null);

  const level = Number(skill.level);
  const places = placesOf(skill.level);
  const animated = !reducedMotion;

  const play = useCallback(() => {
    const number = numberRef.current;
    const bar = barRef.current;
    if (!number || !bar || runningRef.current) return;

    const counter = { value: 0 };
    const count = animate(counter, {
      value: level,
      duration: COUNT_MS,
      ease: EASE.out,
      onUpdate: () => {
        number.textContent = formatLevel(counter.value, places);
      },
      onComplete: () => {
        number.textContent = formatLevel(level, places);
        runningRef.current = null;
      },
    });
    const fill = waapi.animate(bar, {
      transform: ["scaleX(0)", `scaleX(${level / 100})`],
      duration: COUNT_MS,
      ease: EASE.out,
    });
    runningRef.current = { count, fill };
  }, [level, places]);

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

  useEffect(
    () => () => {
      runningRef.current?.count.cancel();
      runningRef.current?.fill.cancel();
    },
    [],
  );

  return (
    <li
      ref={cardRef}
      onPointerEnter={animated ? play : undefined}
      className="card-ring flex flex-col rounded-lg border border-border bg-card/85 p-5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium leading-snug text-foreground">
          {skill.name}
        </h3>
        <span
          ref={numberRef}
          aria-hidden="true"
          className="shrink-0 min-w-[6.5ch] text-right font-mono text-sm tabular-nums text-primary"
        >
          {formatLevel(animated ? 0 : level, places)}
        </span>
        <span className="sr-only">{skill.level}%</span>
      </div>
      {/* Pinned to the bottom so bars line up across a row. */}
      <div className="mt-auto pt-4">
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            ref={barRef}
            className="h-full w-full origin-left rounded-full bg-primary"
            style={{ transform: `scaleX(${animated ? 0 : level / 100})` }}
          />
        </div>
      </div>
    </li>
  );
};

const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const reducedMotion = usePrefersReducedMotion();
  const { ref, pending } = useReveal();
  // The list counts up once it is actually on screen, not while the section
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
                  // Per tab, so switching tabs counts every card up again.
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
