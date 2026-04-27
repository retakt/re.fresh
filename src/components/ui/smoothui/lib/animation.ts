// Animation constants for SmoothUI components
export const SPRING_DEFAULT = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

export const SPRING_FAST = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
  mass: 0.6,
};

export const SPRING_SLOW = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
  mass: 1,
};