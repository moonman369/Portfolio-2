import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";

// The full-page chat pulls in react-markdown; fetch it only on /moonmind.
const MoonmindPage = lazy(() => import("./pages/MoonmindPage"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route
          path="/moonmind"
          element={
            <Suspense fallback={<div className="h-[100dvh] bg-background" />}>
              <MoonmindPage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
