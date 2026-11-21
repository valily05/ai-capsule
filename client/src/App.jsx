
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

import "./App.css";

function App() {
  useEffect(() => {
    const root = document.documentElement;

    function updateGlow(event) {
      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);
      root.classList.add("has-cursor-glow");
    }

    function followPointer(event) {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      updateGlow(event);
    }

    function followMouse(event) {
      if (event.sourceCapabilities?.firesTouchEvents) return;
      updateGlow(event);
    }

    function hideGlow() {
      root.classList.remove("has-cursor-glow");
    }

    window.addEventListener("pointermove", followPointer, { passive: true });
    window.addEventListener("mousemove", followMouse, { passive: true });
    window.addEventListener("blur", hideGlow);
    document.addEventListener("mouseleave", hideGlow);

    return () => {
      window.removeEventListener("pointermove", followPointer);
      window.removeEventListener("mousemove", followMouse);
      window.removeEventListener("blur", hideGlow);
      document.removeEventListener("mouseleave", hideGlow);
      root.classList.remove("has-cursor-glow");
      root.style.removeProperty("--cursor-x");
      root.style.removeProperty("--cursor-y");
    };
  }, []);

  return (
    <BrowserRouter>
      <>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <span className="site-cursor-glow" aria-hidden="true" />
      </>
    </BrowserRouter>
  );
}

export default App;
