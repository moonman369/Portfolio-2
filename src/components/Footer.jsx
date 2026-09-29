import { ArrowUp } from "lucide-react";
import { HERO_SECTION_FNAME, HERO_SECTION_LNAME } from "../context/constants";

const Footer = () => {
  return (
    <footer className="pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-8 px-4 mt-12 relative bg-background border-t border-border">
      <div className="container mx-auto flex flex-wrap justify-between items-center gap-4">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {HERO_SECTION_FNAME}{" "}
          {HERO_SECTION_LNAME}. All rights reserved.
        </p>

        <a
          href="#hero"
          aria-label="Back to top"
          className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ArrowUp size={20} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
