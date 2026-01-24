import HeroSection from "../components/HeroSection";
import Navbar from "../components/Navbar";
import StarBackground from "../components/StarBackground";
import ThemeToggle from "../components/ThemeToggle";
import LightModeBackground from "../components/LightModeBackground";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";

export const Home = () => {
  // const [isDarkMode, setIsDarkMode] = useState(false);

  // useEffect(() => {
  //   const storedTheme = localStorage.getItem("theme");
  //   if (storedTheme === "dark") {
  //     setIsDarkMode(true);
  //     document.documentElement.classList.add("dark");
  //   } else {
  //     setIsDarkMode(false);
  //     document.documentElement.classList.remove("dark");
  //   }

  //   const handleThemeChange = () => {
  //     const storedTheme = localStorage.getItem("theme");
  //     if (storedTheme === "dark") {
  //       setIsDarkMode(true);
  //     } else {
  //       setIsDarkMode(false);
  //     }
  //   };

  //   window.addEventListener("storage", handleThemeChange);

  //   return () => {
  //     window.removeEventListener("storage", handleThemeChange);
  //   };
  // }, []);

  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">
      {/* Theme Toggle */}
      <ThemeToggle />

      {/* Background Effects */}
      {isDarkMode ? <StarBackground /> : <LightModeBackground />}

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />
      </main>

      {/* Footer */}
    </div>
  );
};
