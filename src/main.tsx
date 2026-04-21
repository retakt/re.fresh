import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const root = document.getElementById("root")!;

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Mark theme as loaded so CSS transitions kick in AFTER first paint
// This prevents the transition animation on initial load
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    document.documentElement.classList.add("theme-loaded");
  });
});