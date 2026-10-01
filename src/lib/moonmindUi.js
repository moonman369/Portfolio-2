import { cn } from "./utils";

// Shared styling for the compact icon actions in the MoonMind headers
// (floating panel and the full-page view), so both stay in step.
// 44px targets; the global focus ring applies.
export const headerActionClass = cn(
  "icon-btn text-muted-foreground",
  "hover:text-foreground",
  "disabled:opacity-40 disabled:hover:text-muted-foreground disabled:after:hidden",
);
