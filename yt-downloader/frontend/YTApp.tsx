import "./styles.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import YTPage from "./YTPage";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";

export default function YTApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<YTPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
