import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { ToastProvider } from "./toast.tsx";
import { ContextMenuProvider } from "./context-menu.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { PlayerProvider } from "@/lib/player.tsx";
import { AuthProvider } from "./auth.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <PlayerProvider>
              <ToastProvider>
                <ContextMenuProvider>
                  {children}
                </ContextMenuProvider>
              </ToastProvider>
            </PlayerProvider>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
