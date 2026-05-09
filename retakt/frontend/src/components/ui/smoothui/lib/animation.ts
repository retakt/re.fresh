// Animation constants for smooth UI components

export const DURATION_INSTANT = {
  duration: 0,
};

export const SPRING_DEFAULT = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const SPRING_SMOOTH = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
};

export const SPRING_BOUNCY = {
  type: "spring" as const,
  stiffness: 400,
  damping: 20,
};
