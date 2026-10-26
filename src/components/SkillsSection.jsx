import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { stagger } from "animejs/utils";
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
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_FILTER_LABEL,
  SKILL_LEVEL_FILTER_GROUP_LABEL,
  SKILL_SORT_LABEL,
  SKILL_SORT_OPTIONS,
  SKILL_RESULT_SUMMARY,
  SKILL_GROUP_HEADING,
  SKILL_EMPTY_TEXT,
  SKILL_RESET_LABEL,
  SKILL_FILTERS_ACTIVE,
} from "../context/constants";

const categories = Object.keys(SKILL_CATEGORY_LABELS);
const sortOptions = Object.keys(SKILL_SORT_OPTIONS);
const DEFAULT_SORT = sortOptions[0];

// "Showing {shown} of {total} skills" → "Showing 6 of 36 skills".
const format = (template, values) =>
  template.replace(/\{(\w+)\}/g, (_, key) => values[key]);

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
//
// `seenRef` holds the cards (by `id`) that have already filled and stayed in
// view. A card that only moves, for example into a level group when the sort
// changes, mounts again with its bars full instead of filling twice.
const SkillCard = ({
  id,
  skill,
  seenRef,
  scrollRootRef,
  active,
  reducedMotion,
  headingAs = "h3",
}) => {
  const cardRef = useRef(null);
  const barsRef = useRef(null);
  const runningRef = useRef(null);

  const step = stepOf(skill);
  const label = SKILL_LEVEL_LABELS[SKILL_LEVELS[step - 1]];
  const animated = !reducedMotion;
  const Heading = headingAs;

  // Not seen yet: hold the bars empty (before paint) until the first fill.
  useLayoutEffect(() => {
    if (!animated || seenRef.current.has(id)) return undefined;
    const fills = [...barsRef.current.querySelectorAll("[data-fill]")];
    fills.forEach((fill) => (fill.style.transform = "scaleX(0)"));
    return () => fills.forEach((fill) => fill.style.removeProperty("transform"));
  }, [animated, id, seenRef]);

  const play = useCallback(() => {
    const bars = barsRef.current;
    if (!bars || runningRef.current) return;
    seenRef.current.add(id);

    runningRef.current = waapi.animate(bars.querySelectorAll("[data-fill]"), {
      transform: ["scaleX(0)", "scaleX(1)"],
      duration: BAR_MS,
      delay: stagger(BAR_GAP_MS),
      ease: EASE.out,
      onComplete: () => {
        runningRef.current = null;
      },
    });
  }, [id, seenRef]);

  // First sighting: inside the list's visible area, once the list itself is
  // on screen.
  useEffect(() => {
    const card = cardRef.current;
    const root = scrollRootRef.current;
    if (!animated || !active || !card || !root) return undefined;
    if (seenRef.current.has(id)) return undefined;

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
  }, [animated, active, scrollRootRef, seenRef, id, play]);

  useEffect(() => () => runningRef.current?.cancel(), []);

  return (
    <li
      ref={cardRef}
      onPointerEnter={animated ? play : undefined}
      className="surface card-ring flex flex-col rounded-lg border border-border bg-card/85 p-5"
    >
      <div className="flex items-baseline justify-between gap-4">
        <Heading className="min-w-0 font-medium leading-snug text-foreground">
          {skill.name}
        </Heading>
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
                  style={{ backgroundColor: `hsl(var(--level-${i + 1}))` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </li>
  );
};

// Default keeps the config order; the others are stable sorts (on a copy),
// so ties keep it too.
const sortSkills = (skills, sort) => {
  if (sort === "level-desc") return [...skills].sort((a, b) => stepOf(b) - stepOf(a));
  if (sort === "level-asc") return [...skills].sort((a, b) => stepOf(a) - stepOf(b));
  if (sort === "name") {
    return [...skills].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }
  return skills;
};

// The level's own colour, as on the card bars: the key.
const Swatch = ({ step }) => (
  <span
    aria-hidden="true"
    className="h-1.5 w-4 shrink-0 rounded-full"
    style={{ backgroundColor: `hsl(var(--level-${step}))` }}
  />
);

const resetButtonClass =
  "min-h-11 px-2 text-sm font-medium text-ink underline-offset-4 hover:underline";

const gridClass = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4";

const SkillsSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  // Selected level keys, in ladder order; none selected shows every level.
  // In memory only: a reload starts from the defaults.
  const [levels, setLevels] = useState([]);
  const [sort, setSort] = useState(DEFAULT_SORT);
  // Phones only: the sort folds behind one button.
  const [sortOpen, setSortOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const { ref, pending } = useReveal();
  // The bars fill once the list is actually on screen, not while the section
  // is still far below.
  const [listRef, listInView] = useInView({ threshold: 0.2 });
  const contentRef = useRef(null);
  const statusRef = useRef(null);
  const seenRef = useRef(new Set());
  const sortRowId = useId();
  const sortId = useId();

  const filteredSkills = SKILLS_SECTION_PROP.filter(
    (skill) => activeCategory === "all" || skill.category === activeCategory,
  );
  // Chip counts follow the category only, never the other level chips.
  const counts = SKILL_LEVELS.map(
    (_, i) => filteredSkills.filter((skill) => stepOf(skill) === i + 1).length,
  );
  const shownSkills = sortSkills(
    levels.length
      ? filteredSkills.filter((skill) =>
          levels.includes(SKILL_LEVELS[stepOf(skill) - 1]),
        )
      : filteredSkills,
    sort,
  );
  const grouped = sort === "level-desc" || sort === "level-asc";
  const groups = grouped
    ? SKILL_LEVELS.map((level, i) => ({
        level,
        step: i + 1,
        skills: shownSkills.filter((skill) => stepOf(skill) === i + 1),
      }))
        .filter((group) => group.skills.length)
        .sort((a, b) => (sort === "level-desc" ? b.step - a.step : a.step - b.step))
    : null;
  const sortActive = sort !== DEFAULT_SORT;
  const activeCount = levels.length + (sortActive ? 1 : 0);
  // Per tab, so switching tabs fills every card again.
  const idOf = (skill) => `${activeCategory}:${skill.name}`;
  const shownKey = shownSkills.map(idOf).join("|");

  // Forget cards that left the list, so they fill again when they return.
  useEffect(() => {
    const shown = new Set(shownKey.split("|"));
    for (const id of seenRef.current) {
      if (!shown.has(id)) seenRef.current.delete(id);
    }
  }, [shownKey]);

  // Any change of category, level or sort starts the list from the top.
  // Level and sort changes also fade the list in; a category change refills
  // the bars instead, as before.
  const filterKey = `${levels.join()}|${sort}`;
  const lastRef = useRef({ category: activeCategory, filterKey });
  useLayoutEffect(() => {
    const last = lastRef.current;
    if (last.category === activeCategory && last.filterKey === filterKey) return;
    const filtersChanged = last.filterKey !== filterKey;
    lastRef.current = { category: activeCategory, filterKey };
    if (listRef.current) listRef.current.scrollTop = 0;
    if (filtersChanged && !reducedMotion && contentRef.current) {
      waapi.animate(contentRef.current, {
        opacity: [0, 1],
        duration: DURATION.fast,
        ease: EASE.out,
      });
    }
  }, [activeCategory, filterKey, reducedMotion, listRef]);

  const toggleLevel = (level) =>
    setLevels((current) =>
      current.includes(level)
        ? current.filter((l) => l !== level)
        : SKILL_LEVELS.filter((l) => l === level || current.includes(l)),
    );

  // Clears levels and sort, keeps the category. Focus moves to the result
  // line, so it is not lost with the button.
  const reset = () => {
    setLevels([]);
    setSort(DEFAULT_SORT);
    statusRef.current?.focus();
  };

  const renderCards = (skills, headingAs) =>
    skills.map((skill) => (
      <SkillCard
        key={idOf(skill)}
        id={idOf(skill)}
        skill={skill}
        seenRef={seenRef}
        scrollRootRef={listRef}
        active={listInView}
        reducedMotion={reducedMotion}
        headingAs={headingAs}
      />
    ));

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

        {/* Phones: one row that scrolls sideways (.chip-scroller). */}
        <div
          data-reveal
          role="group"
          aria-label="Filter skills by category"
          className="chip-scroller flex flex-wrap gap-2"
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

        {/* The level chips, then the result line with the sort and Reset.
            Phones: the level chips scroll sideways like the categories, and
            the sort opens below the result line from a "Sort" button. DOM
            order is the Tab order: chips, sort, Reset. */}
        <div
          data-reveal
          className="mt-3 mb-1 grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-3"
        >
          <div
            role="group"
            aria-label={SKILL_LEVEL_FILTER_GROUP_LABEL}
            className="chip-scroller col-span-3 row-start-1 flex flex-wrap items-center gap-2"
          >
            <span
              aria-hidden="true"
              className="max-sm:hidden mr-1 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
            >
              {SKILL_LEVEL_FILTER_LABEL}
            </span>
            {SKILL_LEVELS.map((level, i) => {
              const selected = levels.includes(level);
              const count = counts[i];
              return (
                <button
                  key={level}
                  type="button"
                  aria-pressed={selected}
                  // A selected chip stays clickable at 0, so it can be
                  // turned off.
                  disabled={!count && !selected}
                  onClick={() => toggleLevel(level)}
                  style={{ "--chip": `var(--level-${i + 1})` }}
                  className="level-chip inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm text-foreground ring-1 ring-inset ring-border enabled:hover:ring-input disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Swatch step={i + 1} />
                  {SKILL_LEVEL_LABELS[level]}
                  <span className="min-w-[2ch] text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Phones only. */}
          <button
            type="button"
            aria-expanded={sortOpen}
            aria-controls={sortRowId}
            onClick={() => setSortOpen((open) => !open)}
            className="col-start-2 row-start-2 sm:hidden inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-foreground ring-1 ring-inset ring-border hover:ring-input"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {SKILL_SORT_LABEL}
            {sortActive && (
              <>
                <span
                  aria-hidden="true"
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 font-mono text-xs text-primary-foreground"
                >
                  1
                </span>
                <span className="sr-only">
                  , {format(SKILL_FILTERS_ACTIVE, { count: 1 })}
                </span>
              </>
            )}
          </button>

          <div
            id={sortRowId}
            className={cn(
              "col-span-3 row-start-3 sm:col-span-1 sm:col-start-2 sm:row-start-2 flex items-center gap-3",
              !sortOpen && "max-sm:hidden",
            )}
          >
            <label
              htmlFor={sortId}
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
            >
              {SKILL_SORT_LABEL}
            </label>
            {/* Our own arrow: browsers pin the native one to the edge and
                ignore padding, so it gets a fixed gap on its right here. */}
            <span className="relative inline-flex min-w-0">
              <select
                id={sortId}
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="min-h-11 min-w-0 appearance-none rounded-md bg-card pl-3 pr-10 text-base text-foreground ring-1 ring-inset ring-input"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {SKILL_SORT_OPTIONS[option]}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
            </span>
          </div>

          {/* Keeps its space while hidden, so nothing next to it moves. */}
          <button
            type="button"
            onClick={reset}
            className={cn(
              "col-start-3 row-start-2",
              resetButtonClass,
              !activeCount && "invisible",
            )}
          >
            {SKILL_RESET_LABEL}
          </button>

          {/* At least one row high whatever it says (two short lines on the
              narrowest phones fit too), so a change never moves the list. */}
          <p
            ref={statusRef}
            role="status"
            tabIndex={-1}
            className="col-start-1 row-start-2 flex min-h-11 items-center text-sm text-muted-foreground"
          >
            {format(SKILL_RESULT_SUMMARY, {
              shown: shownSkills.length,
              total: SKILLS_SECTION_PROP.length,
            })}
          </p>
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
            <div ref={contentRef}>
              {shownSkills.length === 0 ? (
                <div className="flex flex-col items-center gap-1 py-8 text-center">
                  <p className="text-muted-foreground">{SKILL_EMPTY_TEXT}</p>
                  <button type="button" onClick={reset} className={resetButtonClass}>
                    {SKILL_RESET_LABEL}
                  </button>
                </div>
              ) : groups ? (
                // Grouped by level: a heading and a list per level, the cards'
                // names one heading level below.
                <div className="flex flex-col gap-6">
                  {groups.map((group) => (
                    <div key={group.level}>
                      <h3 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        <Swatch step={group.step} />
                        {format(SKILL_GROUP_HEADING, {
                          level: SKILL_LEVEL_LABELS[group.level],
                          count: group.skills.length,
                        })}
                      </h3>
                      <ul className={gridClass}>{renderCards(group.skills, "h4")}</ul>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className={gridClass}>{renderCards(shownSkills)}</ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
