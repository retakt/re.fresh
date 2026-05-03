import {
  ThemeProvider as NextThemeProvider,
  useTheme as useNextTheme,
  type ThemeProviderProps,
} from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme"
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  return {
    theme: resolvedTheme ?? theme ?? "light",
    setTheme,
    toggleTheme: () =>
      setTheme(resolvedTheme === "dark" ? "light" : "dark"),
  };
}