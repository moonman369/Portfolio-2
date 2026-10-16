import { spring } from "animejs/easings/spring";
import { splitText } from "animejs/text";
import { stagger } from "animejs/utils";
import { waapi } from "animejs/waapi";
import { DURATION, EASE, STAGGER } from "./motion";

// ---- The About section's motion (its own lazy chunk; AboutSection.jsx) ----
//
// Each part plays once, when it is a quarter in view, all from one
// IntersectionObserver that disconnects when everything has played:
//
//   heading     the hairline draws from the left while "01 / About" fades
//               in; "About Me" rises word by word (60ms apart)
//   h3          the same word-by-word rise
//   paragraphs  (they keep the section's fade-up) then each key phrase's
//               soft marker band sweeps in from the left, 300ms apart
//   rows        each icon draws itself and springs up from 60%, rows 120ms
//               apart (their numbers fade in with the row's own fade-up)
//
// Hover (mouse or pen) or tap (touch) on a row: its icon redraws while its
// title and then its description type themselves in, character by
// character (each character fades in where it already is, so nothing
// reflows); a row ignores new hovers until that has finished, and the text
// is plain text again afterwards.
//
// Nothing is hidden before this module has loaded, and only parts still off
// screen get a hidden "before" state; a part already in view stays as it is.
// After playing, every animation is cancelled and every inline style removed
// (the final state is the plain CSS), and the word split is reverted to
// plain text. Phones: shorter staggers, effects on tap only. Not loaded at
// all with reduced motion. Transform, opacity and stroke draw only.
//
// The icons draw on WAAPI (`stroke-dashoffset` over a pathLength of 1), not
// on anime.js's createDrawable: that rewrites every path's dash attributes
// from JavaScript on every frame, and with ~20 paths across three icons the
// frames ran 45-80ms at 4x CPU. Same look, no script per frame. The dash
// runs from just past its end, so round line caps never show as dots.

const media = (query) =>
  typeof window.matchMedia === "function" && window.matchMedia(query).matches;

// Typing: an element's text as plain inline character spans (aria-hidden),
// next to one visually hidden copy that screen readers read instead; put
// back as the original text afterwards. Inline spans keep the text's own
// shaping and line breaks, so nothing moves. Lighter than splitText for
// this: ~18ms against ~100ms at 4x CPU for a row's ~110 characters.
const splitChars = (el) => {
  const text = el.textContent;
  const copy = document.createElement("span");
  copy.className = "sr-only";
  copy.textContent = text;
  const typed = document.createElement("span");
  typed.setAttribute("aria-hidden", "true");
  for (const char of text) {
    const span = document.createElement("span");
    span.className = "about-char";
    span.textContent = char;
    typed.append(span);
  }
  el.replaceChildren(copy, typed);
  return { chars: [...typed.children], revert: () => el.replaceChildren(text) };
};

const inView = (el) => {
  const { top, bottom } = el.getBoundingClientRect();
  return top < window.innerHeight && bottom > 0;
};

const SHAPES = "path, rect, circle, ellipse, line, polyline, polygon";
// Typing: a quick title, then the description a little faster per
// character; each character fades in over a few frames.
const TYPE_TITLE_STEP = 28;
const TYPE_TEXT_STEP = 7;
const TYPE_FADE = 90;
const DRAW_FROM = 1.05; // a dash of 1 in a gap of 2, pushed just off the path

export const startAboutMotion = (section) => {
  const phone = media("(max-width: 639px)");
  const WORD_STEP = phone ? STAGGER * 0.6 : STAGGER;
  const ROW_STEP = phone ? 80 : 120;
  const LINE_STEP = phone ? 220 : 300;

  const running = new Set();
  const track = (animation) => {
    running.add(animation);
    return animation;
  };
  // Restores for parts that were held but have not played yet.
  const pending = new Map();
  const groups = new Map();

  const setStyle = (el, styles) => Object.assign(el.style, styles);
  const clearStyle = (els, keys) =>
    els.forEach((el) => {
      keys.forEach((key) => (el.style[key] = ""));
      if (!el.getAttribute("style")) el.removeAttribute("style");
    });
  // Stop an animation without anime.js's own cancel(), which first commits
  // every final value inline: one style recalculation per animation (~280ms
  // at 4x CPU for a row's ~110 typed characters). The final state here is
  // always the plain CSS, so cancelling the native animations is enough.
  const stop = (animation) => {
    if (animation.animations) animation.animations.forEach((native) => native.cancel());
    else animation.cancel?.();
    running.delete(animation);
  };
  // Once a set of animations has played: stop them, then tidy up, in the
  // same task, so nothing flashes in between.
  const finish = (animations, after) =>
    Promise.all(animations).then(() => {
      animations.forEach(stop);
      after?.();
    });

  // ---- Headings: words rise ----
  const holdWords = (title) => {
    const split = splitText(title, { words: true });
    split.words.forEach((word) =>
      setStyle(word, { opacity: "0", transform: "translateY(0.4em)" }),
    );
    return split;
  };
  const riseWords = (split) =>
    track(
      waapi.animate(split.words, {
        opacity: [0, 1],
        transform: ["translateY(0.4em)", "translateY(0em)"],
        duration: DURATION.slow,
        delay: stagger(WORD_STEP, { start: DURATION.fast }),
        ease: EASE.expo,
      }),
    );

  const header = section.querySelector("header");
  if (header && !inView(header)) {
    const [eyebrow, line] = header.firstElementChild.children;
    const split = holdWords(header.querySelector("h2"));
    setStyle(line, { transform: "scaleX(0)", transformOrigin: "left center" });
    setStyle(eyebrow, { opacity: "0" });
    const restore = () => {
      clearStyle([line], ["transform", "transformOrigin"]);
      clearStyle([eyebrow], ["opacity"]);
      split.revert();
    };
    pending.set(header, restore);
    groups.set(header, () => {
      const animations = [
        track(
          waapi.animate(line, {
            transform: ["scaleX(0)", "scaleX(1)"],
            duration: DURATION.slow,
            ease: EASE.out,
          }),
        ),
        track(waapi.animate(eyebrow, { opacity: [0, 1], duration: DURATION.base, ease: EASE.out })),
        riseWords(split),
      ];
      finish(animations, () => {
        pending.delete(header);
        restore();
      });
    });
  }

  const subtitle = section.querySelector("h3");
  if (subtitle && !inView(subtitle)) {
    const split = holdWords(subtitle);
    const restore = () => split.revert();
    pending.set(subtitle, restore);
    groups.set(subtitle, () =>
      finish([riseWords(split)], () => {
        pending.delete(subtitle);
        restore();
      }),
    );
  }

  // ---- Paragraphs: the key phrases' marker bands sweep in ----
  section.querySelectorAll("p:has(.about-hl)").forEach((paragraph) => {
    const lines = [...paragraph.querySelectorAll(".about-hl-mark")];
    if (!lines.length || inView(paragraph)) return;
    lines.forEach((line) => setStyle(line, { transform: "scaleX(0)" }));
    const restore = () => clearStyle(lines, ["transform"]);
    pending.set(paragraph, restore);
    groups.set(paragraph, () =>
      finish(
        [
          track(
            waapi.animate(lines, {
              transform: ["scaleX(0)", "scaleX(1)"],
              duration: DURATION.slow,
              // After the paragraph's own fade-up.
              delay: stagger(LINE_STEP, { start: DURATION.slow * 0.75 }),
              ease: EASE.out,
            }),
          ),
        ],
        () => {
          pending.delete(paragraph);
          restore();
        },
      ),
    );
  });

  // ---- Rows: icons draw themselves; hover or tap redraws and types ----
  const listeners = [];
  const timers = [];
  const typingNow = new Set();
  section.querySelectorAll("ol > li").forEach((row) => {
    const icon = row.querySelector("svg");
    const title = row.querySelector(".about-row-title");
    const text = row.querySelector("p");
    if (!icon || !title || !text) return;
    const shapes = [...icon.querySelectorAll(SHAPES)];
    let busy = false;
    const hold = !inView(row);
    // Ready to draw: every line one unit long, dashed; then undrawn or not.
    const dashed = (offset) =>
      shapes.forEach((shape) => {
        shape.setAttribute("pathLength", "1");
        setStyle(shape, { strokeDasharray: "1 2", strokeDashoffset: `${offset}` });
      });
    // A drawn icon is a plain icon again: nothing left behind.
    const plain = () =>
      shapes.forEach((shape) => {
        shape.removeAttribute("pathLength");
        clearStyle([shape], ["strokeDasharray", "strokeDashoffset"]);
      });

    const drawIcon = (delay = 0) => {
      dashed(DRAW_FROM);
      return track(
        waapi.animate(shapes, {
          strokeDashoffset: [DRAW_FROM, 0],
          duration: DURATION.slow * 1.2,
          delay,
          ease: EASE.inOut,
        }),
      );
    };

    if (hold) {
      dashed(DRAW_FROM);
      setStyle(icon, { transform: "scale(0.6)", transformOrigin: "center" });
      const restore = () => {
        plain();
        clearStyle([icon], ["transform", "transformOrigin"]);
      };
      pending.set(row, restore);
      groups.set(row, (index) => {
        busy = true;
        const delay = index * ROW_STEP;
        finish(
          [
            drawIcon(delay),
            track(
              waapi.animate(icon, {
                transform: ["scale(0.6)", "scale(1)"],
                delay,
                ease: spring({ bounce: 0.35, duration: 550 }),
              }),
            ),
          ],
          () => {
            pending.delete(row);
            plain();
            clearStyle([icon], ["transform", "transformOrigin"]);
            busy = false;
          },
        );
      });
    }

    // The title, then the description, type themselves in. Split into
    // characters only for the length of it (splitChars keeps one readable
    // copy for screen readers), then put back as plain text. Each character
    // fades in on one CSS keyframe (`.about-typing`, index.css) with its
    // delay from anime.js's stagger: ~110 WAAPI animations through anime.js
    // cost one style recalculation per character as each finished
    // (~130-280ms at 4x CPU per hover); a CSS animation per character has
    // no such cost and no script per frame.
    const typeIn = () => {
      const titleSplit = splitChars(title);
      const textSplit = splitChars(text);
      const titleTime = titleSplit.chars.length * TYPE_TITLE_STEP;
      let last = 0;
      const schedule = (chars, delayOf) =>
        chars.forEach((char, index) => {
          const delay = delayOf(char, index, chars);
          last = Math.max(last, delay);
          char.style.animationDelay = `${delay}ms`;
        });
      schedule(titleSplit.chars, stagger(TYPE_TITLE_STEP));
      schedule(textSplit.chars, stagger(TYPE_TEXT_STEP, { start: titleTime * 0.5 }));
      row.classList.add("about-typing");
      return {
        splits: [titleSplit, textSplit],
        done: new Promise((resolve) => timers.push(setTimeout(resolve, last + TYPE_FADE + 30))),
      };
    };

    const flourish = () => {
      if (busy) return;
      busy = true;
      const typing = typeIn();
      typingNow.add(typing);
      finish([typing.done, drawIcon()], () => {
        typingNow.delete(typing);
        row.classList.remove("about-typing");
        typing.splits.forEach((split) => split.revert());
        plain();
        busy = false;
      });
    };
    // Mouse or pen: hover (no hover on phones). Touch: the tap itself.
    const onEnter = (event) => {
      if (event.pointerType !== "touch" && !phone) flourish();
    };
    const onDown = (event) => {
      if (event.pointerType === "touch") flourish();
    };
    row.addEventListener("pointerenter", onEnter);
    row.addEventListener("pointerdown", onDown, { passive: true });
    listeners.push(() => {
      row.removeEventListener("pointerenter", onEnter);
      row.removeEventListener("pointerdown", onDown);
    });
  });

  // ---- One observer for the section ----
  const observer =
    groups.size && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            entries
              .filter((entry) => entry.isIntersecting)
              .forEach((entry, index) => {
                observer.unobserve(entry.target);
                const play = groups.get(entry.target);
                groups.delete(entry.target);
                // Parts arriving together start one task apart (the rows'
                // 120ms stagger), so no single task sets them all up.
                if (!index) play?.(0);
                else timers.push(setTimeout(() => play?.(0), index * ROW_STEP));
              });
            if (!groups.size) observer.disconnect();
          },
          { threshold: 0.25 },
        )
      : null;
  groups.forEach((_, el) => observer?.observe(el));

  return () => {
    timers.forEach(clearTimeout);
    typingNow.forEach((typing) => typing.splits.forEach((split) => split.revert()));
    section.querySelectorAll(".about-typing").forEach((row) => row.classList.remove("about-typing"));
    observer?.disconnect();
    listeners.forEach((remove) => remove());
    running.forEach(stop);
    pending.forEach((restore) => restore());
    pending.clear();
  };
};
