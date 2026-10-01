import { ArrowUp } from "lucide-react";
import { HERO_SECTION_FNAME, HERO_SECTION_LNAME } from "../context/constants";
import MoonMark from "./MoonMark";

const Footer = () => {
  return (
    <footer className="relative mt-12 border-t border-border bg-background pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8">
      <div className="container max-w-6xl flex flex-wrap items-center justify-between gap-4">
        <p className="inline-flex items-center gap-3 font-mono text-xs text-muted-foreground">
          <MoonMark phase={1} size={16} className="text-primary" />
          &copy; {new Date().getFullYear()} {HERO_SECTION_FNAME}{" "}
          {HERO_SECTION_LNAME}. All rights reserved.
        </p>

        <a
          href="#hero"
          aria-label="Back to top"
          className="icon-btn text-foreground ring-1 ring-inset ring-border hover:text-primary"
        >
          <ArrowUp size={20} aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
