import { useRef, useState } from "react";
import { cn } from "../lib/utils";
import { AiOutlineHome, AiOutlineUser } from "react-icons/ai";
import { BiCodeAlt, BiBriefcase, BiMessageSquareDetail } from "react-icons/bi";
import { IoIosStats } from "react-icons/io";
import ThemeToggle from "./ThemeToggle";
import GlowBeam from "./GlowBeam";
import MoonMark from "./MoonMark";
import MoonmindNudge from "./MoonmindNudge";
import { useMoonmind } from "../context/MoonmindContext";
import {
  MOONMIND_ASK_ARIA_LABEL,
  MOONMIND_ASK_LABEL,
} from "../context/constants";
import { useScrollMoonPhase } from "../hooks/useScrollMoonPhase";
import { moonmindIntentProps } from "../lib/lazyChat";

const navItems = [
  { name: "Home", href: "#hero", icon: AiOutlineHome },
  { name: "About", href: "#about", icon: AiOutlineUser },
  { name: "Skills", href: "#skills", icon: BiCodeAlt },
  { name: "Stats", href: "#stats", icon: IoIosStats },
  { name: "Projects", href: "#projects", icon: BiBriefcase },
  { name: "Contact", href: "#contact", icon: BiMessageSquareDetail },
];

// Insert the Moonmind trigger in the middle of the icon row.
const MID = Math.ceil(navItems.length / 2);

const Navbar = () => {
  const [activeNav, setActiveNav] = useState("#hero");
  const { toggle: toggleMoonmind, isOpen: isMoonmindOpen } = useMoonmind();
  // The brand moon waxes from new (top of the page) to full (Contact).
  const phaseRef = useRef(null);
  const isScrolled = useScrollMoonPhase(phaseRef);

  // Desktop: icons at md, text labels from lg. Mobile: icons in the bottom bar.
  const renderLink = (item, variant) => {
    const Icon = item.icon;
    const isActive = activeNav === item.href;
    return (
      <a
        key={item.href}
        href={item.href}
        title={item.name}
        aria-label={item.name}
        aria-current={isActive ? "location" : undefined}
        onClick={() => setActiveNav(item.href)}
        className={cn(
          "nav-link relative inline-flex items-center justify-center rounded-md",
          "min-h-11 min-w-11",
          variant === "bar" ? "text-[1.3rem]" : "text-xl lg:text-sm lg:px-3 lg:font-medium",
          isActive
            ? "text-ink"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon aria-hidden="true" className={variant === "top" ? "lg:hidden" : ""} />
        {variant === "top" && <span className="hidden lg:inline">{item.name}</span>}
      </a>
    );
  };

  // The label is visible on the desktop pill (lg+); the bottom-nav button is
  // the mark alone. Both are named "Ask Moonmind, AI assistant".
  const renderMoonmind = (variant) => (
    <button
      onClick={toggleMoonmind}
      {...moonmindIntentProps}
      title={MOONMIND_ASK_LABEL}
      aria-label={MOONMIND_ASK_ARIA_LABEL}
      aria-expanded={isMoonmindOpen}
      data-moonmind-anchor={variant === "bar" ? "bar" : undefined}
      className={cn(
        "btn-glow inline-flex items-center justify-center gap-2 min-h-11 min-w-11 rounded-full",
        "text-primary",
        variant === "top" &&
          "lg:px-4 lg:text-sm lg:font-medium lg:text-foreground",
        // The glow's inner face carries the open/hover tint.
        isMoonmindOpen
          ? "[--glow-face:hsl(var(--accent))]"
          : "hover:[--glow-face:hsl(var(--accent))]",
      )}
    >
      <GlowBeam />
      <MoonMark size={variant === "bar" ? 22 : 20} className="text-primary" />
      {variant === "top" && (
        <span className="hidden lg:inline">{MOONMIND_ASK_LABEL}</span>
      )}
    </button>
  );

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
        {/* The bar's surface fades in on opacity once the page scrolls. Solid
            on phones; a light blur only on larger screens. */}
        <div
          aria-hidden="true"
          className={cn(
            "nav-surface absolute inset-0 border-b border-border bg-background/95 md:bg-background/80 md:backdrop-blur-md",
            "transition-opacity duration-(--motion-base) ease-moon-out",
            isScrolled ? "opacity-100" : "opacity-0",
          )}
        />
        <div className="container relative flex h-16 items-center justify-between gap-4">
          <a
            href="#hero"
            className="inline-flex min-h-11 items-center gap-2.5 rounded-md font-heading text-[1.0625rem] font-semibold tracking-tight"
          >
            <MoonMark phase={0} size={22} litRef={phaseRef} className="text-primary" />
            <span>Ayan's Portfolio</span>
          </a>

          {/* right side: desktop nav (Moonmind centered) + theme toggle */}
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex items-center gap-1 lg:gap-0.5">
              {navItems.slice(0, MID).map((item) => renderLink(item, "top"))}
              <span className="mx-1 lg:mx-2">{renderMoonmind("top")}</span>
              {navItems.slice(MID).map((item) => renderLink(item, "top"))}
            </div>

            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile: bottom bar docked to the edge (Moonmind centered). */}
      <nav
        aria-label="Sections"
        className={cn(
          "md:hidden fixed inset-x-0 bottom-0 z-50",
          "nav-bar border-t border-border bg-background/[0.97]",
          "pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        )}
      >
        <div className="mx-auto flex max-w-md items-center justify-between px-1.5 py-1.5">
          {navItems.slice(0, MID).map((item) => renderLink(item, "bar"))}
          {renderMoonmind("bar")}
          {/* Out of flow (fixed); here so keyboard users meet it right
              after the button. */}
          <MoonmindNudge anchor="bar" />
          {navItems.slice(MID).map((item) => renderLink(item, "bar"))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
