import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sentry } from "@/lib/monitoring.ts";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Auto-reload on "Invalid hook call" — this is almost always a stale cache issue
    // where old and new React chunks are mixed. Reloading gets fresh chunks.
    if (error.message?.includes("Invalid hook call") || error.message?.includes("Hooks can only be called")) {
      console.warn("[ErrorBoundary] Stale cache detected — reloading...");
      const reload = () => globalThis.location.reload();
      if ("caches" in globalThis) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        }).then(reload, reload);
      } else {
        reload();
      }
      return;
    }

    Sentry.captureException(error, {
      extra: {
        componentStack: info.componentStack,
      },
    });

    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center px-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Something went wrong</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lightweight wrapper for per-page use
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
