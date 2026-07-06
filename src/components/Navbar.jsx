import { useEffect, useState } from "react";
import { cn } from "../lib/utils";
import { AiOutlineHome, AiOutlineUser } from "react-icons/ai";
import {
  BiCodeAlt,
  BiBriefcase,
  BiMessageSquareDetail,
  BiBrain,
} from "react-icons/bi";
import { IoIosStats } from "react-icons/io";
import ThemeToggle from "./ThemeToggle";
import { useMoonmind } from "../context/MoonmindContext";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNav, setActiveNav] = useState("#hero");
  const { toggle: toggleMoonmind, isOpen: isMoonmindOpen } = useMoonmind();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const renderLink = (item, pad) => {
    const Icon = item.icon;
    const isActive = activeNav === item.href;
    return (
      <a
        key={item.href}
        href={item.href}
        title={item.name}
        aria-label={item.name}
        onClick={() => setActiveNav(item.href)}
        className={cn(
          pad,
          "rounded-full text-xl transition-colors duration-300",
          isActive
            ? "text-primary bg-primary/10"
            : "text-foreground/70 hover:text-primary hover:bg-primary/10",
        )}
      >
        <Icon />
      </a>
    );
  };

  const renderMoonmind = (pad) => (
    <button
      onClick={toggleMoonmind}
      title="Moonmind AI"
      aria-label="Moonmind AI"
      className={cn(
        pad,
        "rounded-full text-xl bg-gradient-primary text-primary-foreground transition-shadow duration-300",
        isMoonmindOpen
          ? "shadow-[0_0_16px_hsl(var(--primary)/0.7)]"
          : "animate-moonmind-glow",
      )}
    >
      <BiBrain />
    </button>
  );

  return (
    <>
      <nav
        className={cn(
          "fixed w-full z-40 transition-all duration-300",
          isScrolled
            ? "py-2 bg-background/30 backdrop-blur-md shadow-xs"
            : "py-3",
        )}
      >
        <div className="container flex items-center justify-between">
          <a href="#hero" className="text-[16px] font-bold flex items-center">
            <span className="relative z-10 text-gradient">
              Ayan's Portfolio
            </span>
          </a>

          {/* right side: desktop nav icons (Moonmind centered) + theme toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              {navItems.slice(0, MID).map((item) => renderLink(item, "p-2.5"))}
              {renderMoonmind("p-2.5")}
              {navItems.slice(MID).map((item) => renderLink(item, "p-2.5"))}
            </div>

            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Mobile bottom floating glass nav (Moonmind centered) */}
      <div
        className={cn(
          "md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1",
          "px-3 py-2 rounded-full bg-background/40 backdrop-blur-lg",
          "border border-border/60 shadow-lg",
        )}
      >
        {navItems.slice(0, MID).map((item) => renderLink(item, "p-2"))}
        {renderMoonmind("p-2")}
        {navItems.slice(MID).map((item) => renderLink(item, "p-2"))}
      </div>
    </>
  );
};

export default Navbar;
