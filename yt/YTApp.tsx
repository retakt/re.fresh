import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import YTPage from "./YTPage";

export default function YTApp() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="yt-theme"
      disableTransitionOnChange
    >
      <YTPage />
      <Toaster richColors position="top-center" />
    </ThemeProvider>
  );
}
