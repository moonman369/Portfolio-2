import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { MoonmindProvider } from "./context/MoonmindContext.jsx";
import { applyMotionTokens } from "./lib/motion.js";

// CSS transitions read the same durations and curves as the JS animations.
applyMotionTokens();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <MoonmindProvider>
          <App />
        </MoonmindProvider>
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
);
