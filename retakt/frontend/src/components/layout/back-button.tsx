import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type BackButtonProps = {
  className?: string;
  fallbackTo?: string;
  showLabel?: boolean;
};

export function BackButton({
  className = "",
  fallbackTo = "/",
  showLabel = true,
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo, { replace: true });
  };

  if (location.pathname === "/") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft size={15} />
      {showLabel ? <span className="hidden sm:inline">Back</span> : null}
    </button>
  );
}
