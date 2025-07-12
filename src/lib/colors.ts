// Centralized color configuration for the entire application
export const colors = {
  // Brand Colors
  brand: {
    primary: "#ff3131", // Main brand color (black)
    secondary: "#c63500", // Accent color (green)
    accent: "#621028", // Purple accent
  },
  // Semantic Colors
  semantic: {
    success: "#3dab25",
    warning: "#ecb018",
    error: "#db4444",
    info: "#4856da",
  },
  // Neutral Colors
  neutral: {
    white: "#ffffff",
    black: "#1f1f1f",
    gray: {
      50: "#f9f9f9",
      100: "#f7f7f7",
      200: "#e9e9e9",
      300: "#d1d5db",
      400: "#a0a0a0",
      500: "#696c70",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },
  // Surface Colors
  surface: {
    primary: "#f7f7f7",
    secondary: "rgba(255, 255, 255, 0.1)",
    tertiary: "rgba(255, 255, 255, 0.2)",
  },
  // Text Colors
  text: {
    primary: "#1f1f1f",
    secondary: "#696c70",
    tertiary: "#a0a0a0",
    inverse: "#ffffff",
  },
  // Border Colors
  border: {
    primary: "#e9e9e9",
    secondary: "rgba(0, 0, 0, 0.15)",
  },
  // Chart Colors (for admin dashboard)
  chart: {
    primary: "#d24c3f",
    secondary: "#2b9e63",
    tertiary: "#19737c",
    quaternary: "#f3b243",
    quinary: "#f3a127",
  },
} as const;

// Type for color keys
export type ColorKey = keyof typeof colors;
export type BrandColorKey = keyof typeof colors.brand;
export type SemanticColorKey = keyof typeof colors.semantic;

// Utility function to get color values
export const getColor = (path: string): string => {
  const keys = path.split(".");
  let value: unknown = colors;
  for (const key of keys) {
    if (typeof value === "object" && value !== null && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      console.warn(`Color not found: ${path}`);
      return "#000000";
    }
  }
  return typeof value === "string" ? value : "#000000";
};

// CSS Custom Properties generator
export const generateCSSVariables = () => {
  const cssVars: Record<string, string> = {};
  // Brand colors
  Object.entries(colors.brand).forEach(([key, value]) => {
    cssVars[`--brand-${key}`] = value;
  });
  // Semantic colors
  Object.entries(colors.semantic).forEach(([key, value]) => {
    cssVars[`--semantic-${key}`] = value;
  });
  // Neutral colors
  Object.entries(colors.neutral).forEach(([key, value]) => {
    if (typeof value === "string") {
      cssVars[`--neutral-${key}`] = value;
    } else {
      Object.entries(value).forEach(([shade, shadeValue]) => {
        cssVars[`--neutral-${key}-${shade}`] = shadeValue;
      });
    }
  });
  // Surface colors
  Object.entries(colors.surface).forEach(([key, value]) => {
    cssVars[`--surface-${key}`] = value;
  });
  // Text colors
  Object.entries(colors.text).forEach(([key, value]) => {
    cssVars[`--text-${key}`] = value;
  });
  // Border colors
  Object.entries(colors.border).forEach(([key, value]) => {
    cssVars[`--border-${key}`] = value;
  });
  return cssVars;
};
