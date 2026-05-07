"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ScrollSpyContextValue {
  activeSection: string | null;
  setActiveSection: (id: string | null) => void;
  registerSection: (id: string, element: HTMLElement) => void;
  unregisterSection: (id: string) => void;
  scrollToSection: (id: string) => void;
  offset?: number;
}

const ScrollSpyContext = React.createContext<ScrollSpyContextValue | undefined>(
  undefined
);

function useScrollSpy() {
  const context = React.useContext(ScrollSpyContext);
  if (!context) {
    throw new Error("useScrollSpy must be used within ScrollSpy");
  }
  return context;
}

interface ScrollSpyProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export function ScrollSpy({ children, offset = 100, className }: ScrollSpyProps) {
  const [activeSection, setActiveSection] = React.useState<string | null>(null);
  const sectionsRef = React.useRef<Map<string, HTMLElement>>(new Map());

  const registerSection = React.useCallback((id: string, element: HTMLElement) => {
    sectionsRef.current.set(id, element);
  }, []);

  const unregisterSection = React.useCallback((id: string) => {
    sectionsRef.current.delete(id);
  }, []);

  const scrollToSection = React.useCallback((id: string) => {
    const element = sectionsRef.current.get(id);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, [offset]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section-id");
            if (id) {
              setActiveSection(id);
            }
          }
        });
      },
      {
        rootMargin: `-${offset}px 0px -50% 0px`,
        threshold: 0,
      }
    );

    sectionsRef.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [offset]);

  return (
    <ScrollSpyContext.Provider
      value={{
        activeSection,
        setActiveSection,
        registerSection,
        unregisterSection,
        scrollToSection,
        offset,
      }}
    >
      <div className={cn("flex gap-8", className)}>{children}</div>
    </ScrollSpyContext.Provider>
  );
}

interface ScrollSpyNavProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollSpyNav({ children, className }: ScrollSpyNavProps) {
  return (
    <nav className={cn("relative", className)}>
      {children}
    </nav>
  );
}

interface ScrollSpyLinkProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollSpyLink({ value, children, className }: ScrollSpyLinkProps) {
  const { activeSection, scrollToSection } = useScrollSpy();
  const isActive = activeSection === value;

  return (
    <button
      onClick={() => scrollToSection(value)}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "relative block w-full text-left text-sm transition-colors",
        isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

interface ScrollSpyViewportProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollSpyViewport({ children, className }: ScrollSpyViewportProps) {
  return <div className={cn("flex-1", className)}>{children}</div>;
}

interface ScrollSpySectionProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollSpySection({
  value,
  children,
  className,
}: ScrollSpySectionProps) {
  const { registerSection, unregisterSection } = useScrollSpy();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      registerSection(value, ref.current);
    }
    return () => {
      unregisterSection(value);
    };
  }, [value, registerSection, unregisterSection]);

  return (
    <div ref={ref} data-section-id={value} className={className}>
      {children}
    </div>
  );
}

// Animated Timeline-style variant with traveling dot
interface ScrollSpyTimelineNavProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollSpyTimelineNav({ children, className }: ScrollSpyTimelineNavProps) {
  const { activeSection } = useScrollSpy();
  const navRef = React.useRef<HTMLDivElement>(null);
  const [dotPosition, setDotPosition] = React.useState(0);

  React.useEffect(() => {
    if (!navRef.current || !activeSection) return;

    const activeButton = navRef.current.querySelector(
      `[data-section-value="${activeSection}"]`
    ) as HTMLElement;

    if (activeButton) {
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      const position = buttonRect.top - navRect.top + buttonRect.height / 2;
      setDotPosition(position);
    }
  }, [activeSection]);

  return (
    <nav ref={navRef} className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[0.6875rem] top-2 bottom-2 w-px bg-primary/40" />
      
      {/* Animated dot */}
      <motion.div
        className="absolute left-[0.6875rem] size-2.5 rounded-full border-2 -translate-x-1/2 z-10"
        style={{
          borderColor: "#11D8C2",
          backgroundColor: "var(--background)",
        }}
        animate={{ y: dotPosition }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />

      <div className="pl-6 space-y-2">{children}</div>
    </nav>
  );
}

interface ScrollSpyTimelineLinkProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollSpyTimelineLink({
  value,
  children,
  className,
}: ScrollSpyTimelineLinkProps) {
  const { activeSection, scrollToSection } = useScrollSpy();
  const isActive = activeSection === value;

  return (
    <button
      data-section-value={value}
      onClick={() => scrollToSection(value)}
      className={cn(
        "relative block w-full text-left text-sm transition-colors py-1",
        isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}
