import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import YTApp from "./YTApp";

const root = document.getElementById("yt-root");
if (!root) throw new Error("Missing #yt-root");

createRoot(root).render(
  <StrictMode>
    <YTApp />
  </StrictMode>
);
