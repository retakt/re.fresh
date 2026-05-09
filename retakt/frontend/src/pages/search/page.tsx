import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCommandPalette } from "@/components/providers/command-palette";

export default function SearchPage() {
  const navigate = useNavigate();
  const { open } = useCommandPalette();

  useEffect(() => {
    // Automatically open command palette when this page is visited
    open();
    // Redirect to home page so URL doesn't stay on /search
    navigate("/", { replace: true });
  }, [open, navigate]);

  // This component doesn't render anything since we redirect
  return null;
}
