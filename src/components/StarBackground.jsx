import React, { useEffect, useState } from "react";

// Real stars follow the blackbody sequence you see in astrophotos:
// hot blue/blue-white, white, warm yellow-white, orange, and cool red —
// with a violet accent. Color dominates; pure white shows up occasionally.
const STAR_COLORS = [
  "155, 176, 255", // hot blue (O/B type)
  "180, 200, 255", // blue-white (A type)
  "224, 233, 255", // pale blue
  "255, 255, 255", // white (occasional)
  "255, 244, 232", // warm white (G type)
  "255, 214, 165", // orange (K type)
  "255, 160, 120", // deep orange
  "255, 122, 122", // red (M type)
  "204, 153, 255", // violet
  "176, 148, 255", // deep violet
];

const randomAccent = () =>
  STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];

const StarBackground = () => {
  const [stars, setStars] = useState([]);
  const [meteors, setMeteors] = useState([]);

  const generateStars = () => {
    const starsCount = Math.floor(
      (window.innerWidth * window.innerHeight) / 8500,
    );

    const newStars = [];

    for (let i = 0; i < starsCount; i++) {
      newStars.push({
        id: i,
        size: Math.random() * 3 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: Math.random() * 0.4 + 0.6,
        animationDuration: Math.random() * 4 + 2,
        color: randomAccent(),
      });
    }

    setStars(newStars);
  };

  const generateMeteors = () => {
    const meteorsCount = 8;
    const newMeteors = [];

    for (let i = 0; i < meteorsCount; i++) {
      newMeteors.push({
        id: i,
        size: Math.random() * 2 + 1,
        // Spread across the whole viewport, not just the top strip.
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 15,
        animationDuration: Math.random() * 3 + 3,
        color: randomAccent(),
      });
    }

    setMeteors(newMeteors);
  };

  useEffect(() => {
    generateStars();
    generateMeteors();

    const handleResize = () => {
      generateStars();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star animate-pulse-subtle"
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.y}%`,
            left: `${star.x}%`,
            opacity: star.opacity,
            animationDuration: `${star.animationDuration}s`,
            // Colored core with a brighter matching glow.
            backgroundColor: `rgb(${star.color})`,
            boxShadow: `0 0 ${star.size * 3}px ${star.size}px rgba(${star.color}, 0.85)`,
          }}
        />
      ))}

      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="meteor animate-meteor"
          style={{
            width: `${meteor.size * 35}px`,
            height: `${meteor.size}px`,
            top: `${meteor.y}%`,
            left: `${meteor.x}%`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.animationDuration}s`,
            // Hidden until the animation starts, so meteors don't sit frozen
            // as flat horizontal bars during their initial delay. The keyframes
            // begin at opacity: 1, so each one appears only as it streaks.
            opacity: 0,
            // Bright colored head fading through white into a transparent tail.
            background: `linear-gradient(to right, rgb(${meteor.color}), rgba(255, 255, 255, 0.7), transparent)`,
            boxShadow: `0 0 14px 2px rgba(${meteor.color}, 0.65)`,
          }}
        />
      ))}
    </div>
  );
};

export default StarBackground;
