import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

// Types out each word, pauses, erases it, then moves to the next — looping.
const Typewriter = ({
  words,
  loop = true,
  typingSpeed = 62,
  typingJitter = 55,
  deletingSpeed = 30,
  deletingJitter = 22,
  pauseAfterType = 1500,
  pauseAfterDelete = 450,
  className,
}) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("typing"); // "typing" | "deleting"
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return undefined;

    const current = words[index % words.length];
    let timeout;

    if (phase === "typing") {
      if (text.length < current.length) {
        // Small random variance gives a natural, smoother cadence.
        const delay = typingSpeed + Math.random() * typingJitter;
        timeout = setTimeout(
          () => setText(current.slice(0, text.length + 1)),
          delay,
        );
      } else if (!loop && index >= words.length - 1) {
        // Finished the last word of a single round — stop here.
        setDone(true);
        return undefined;
      } else {
        timeout = setTimeout(() => setPhase("deleting"), pauseAfterType);
      }
    } else if (text.length > 0) {
      const delay = deletingSpeed + Math.random() * deletingJitter;
      timeout = setTimeout(
        () => setText(current.slice(0, text.length - 1)),
        delay,
      );
    } else {
      timeout = setTimeout(() => {
        setIndex((prev) => (prev + 1) % words.length);
        setPhase("typing");
      }, pauseAfterDelete);
    }

    return () => clearTimeout(timeout);
  }, [
    text,
    phase,
    index,
    done,
    loop,
    words,
    typingSpeed,
    typingJitter,
    deletingSpeed,
    deletingJitter,
    pauseAfterType,
    pauseAfterDelete,
  ]);

  return (
    <span className="inline-flex items-baseline">
      <span className={className}>{text}</span>
      {!done && (
        <span
          aria-hidden="true"
          className="ml-0.5 font-normal text-primary animate-blink"
        >
          |
        </span>
      )}
    </span>
  );
};

export default Typewriter;
