import { colors, getColor } from "@/lib/colors";

export const useColors = () => {
  return {
    colors,
    getColor,
    // Utility functions
    getBrandColor: (key: keyof typeof colors.brand) => colors.brand[key],
    getSemanticColor: (key: keyof typeof colors.semantic) =>
      colors.semantic[key],
    getTextColor: (key: keyof typeof colors.text) => colors.text[key],
    getSurfaceColor: (key: keyof typeof colors.surface) => colors.surface[key],
  };
};
