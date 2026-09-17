import { cn } from "./utils";

// Shared styling for the compact icon actions in the MoonMind headers
// (floating panel and the full-page view), so both stay in step.
export const headerActionClass = cn(
  "p-1.5 rounded-lg text-muted-foreground transition-colors",
  "hover:bg-muted/60 hover:text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
  "disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
);
