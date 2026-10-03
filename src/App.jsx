import { createElement, lazy, Suspense } from "react";
import { loadedMoonmindPage, loadMoonmindPage } from "./lib/lazyChat";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";

// The full-page chat pulls in react-markdown; fetch it only on /moonmind.
const MoonmindPageLazy = lazy(loadMoonmindPage);

// Already loaded (warmed on intent): render it at once (always the same
// component, so nothing remounts). Otherwise lazily.
const MoonmindRoute = () => {
  const page = loadedMoonmindPage();
  if (page) return createElement(page);
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-background" />}>
      <MoonmindPageLazy />
    </Suspense>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/moonmind" element={<MoonmindRoute />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
