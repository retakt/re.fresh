import { ThemeProvider } from "next-themes";
import { ToastProvider } from "../src/components/providers/toast";
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
      <ToastProvider>
        <YTPage />
      </ToastProvider>
    </ThemeProvider>
  );
}
