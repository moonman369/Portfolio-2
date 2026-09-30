import { cn } from "../lib/utils";

// Editorial section header: a mono eyebrow ("02 / Skills") on a hairline,
// then the heading, then an optional intro. Each line takes part in the
// section's scroll entrance.
const SectionHeading = ({ index, label, children, intro, className }) => (
  <header className={cn("mb-12 md:mb-16", className)}>
    <div data-reveal className="flex items-center gap-4">
      <p className="eyebrow text-ink shrink-0">
        {index} / {label}
      </p>
      <span aria-hidden="true" className="h-px flex-1 bg-border" />
    </div>
    <h2
      data-reveal
      className="mt-6 font-heading text-h2 font-semibold text-foreground"
    >
      {children}
    </h2>
    {intro && (
      <p
        data-reveal
        className="mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground"
      >
        {intro}
      </p>
    )}
  </header>
);

export default SectionHeading;
