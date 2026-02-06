// theme.ts
import { vars } from "nativewind";

// ============================================================================
// FONT CONFIGURATION
// ============================================================================
// Each theme can define its own font families. Fonts are loaded in _layout.tsx
// using expo-font and referenced via CSS variables in tailwind.config.js.
//
// Font families:
// - heading: Used for h1-h4 headings
// - body: Used for body text, labels, captions
// - mono: Used for code snippets
// ============================================================================

export interface ThemeFonts {
  heading: {
    family: string;
    weights: Record<string, string>; // weight name -> font file key
  };
  body: {
    family: string;
    weights: Record<string, string>;
  };
  mono: {
    family: string;
    weights: Record<string, string>;
  };
}

// Default theme fonts: Inter for clean, modern typography
export const themeFonts: ThemeFonts = {
  heading: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
  },
  body: {
    family: 'Inter',
    weights: {
      normal: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semibold: 'Inter_600SemiBold',
    },
  },
  mono: {
    family: 'JetBrainsMono',
    weights: {
      normal: 'JetBrainsMono_400Regular',
      medium: 'JetBrainsMono_500Medium',
    },
  },
};


// Helper to convert oklch to RGB space-separated values for Tailwind
// Note: These are approximate RGB conversions from the oklch values
export const lightTheme = vars({
  "--radius": "10", // 0.625rem = 10px

  // Core semantic colors
  "--background": "255 255 255", // oklch(1 0 0)
  "--foreground": "23 23 23", // oklch(0.145 0 0)

  "--card": "255 255 255", // oklch(1 0 0)
  "--card-foreground": "23 23 23", // oklch(0.145 0 0)

  "--popover": "255 255 255", // oklch(1 0 0)
  "--popover-foreground": "23 23 23", // oklch(0.145 0 0)

  "--primary": "24 24 27", // oklch(0.205 0 0)
  "--primary-foreground": "250 250 250", // oklch(0.985 0 0)

  "--secondary": "244 244 245", // oklch(0.97 0 0)
  "--secondary-foreground": "24 24 27", // oklch(0.205 0 0)

  "--muted": "244 244 245", // oklch(0.97 0 0)
  "--muted-foreground": "113 113 122", // oklch(0.556 0 0)

  "--accent": "244 244 245", // oklch(0.97 0 0)
  "--accent-foreground": "24 24 27", // oklch(0.205 0 0)

  "--destructive": "220 38 38", // oklch(0.577 0.245 27.325)

  "--border": "228 228 231", // oklch(0.922 0 0)
  "--input": "228 228 231", // oklch(0.922 0 0)
  "--ring": "161 161 170", // oklch(0.708 0 0)

  // Chart colors
  "--chart-1": "231 111 81", // oklch(0.646 0.222 41.116)
  "--chart-2": "42 157 143", // oklch(0.6 0.118 184.704)
  "--chart-3": "38 70 83", // oklch(0.398 0.07 227.392)
  "--chart-4": "233 196 106", // oklch(0.828 0.189 84.429)
  "--chart-5": "244 162 97", // oklch(0.769 0.188 70.08)

  // Sidebar colors
  "--sidebar": "250 250 250", // oklch(0.985 0 0)
  "--sidebar-foreground": "23 23 23", // oklch(0.145 0 0)
  "--sidebar-primary": "24 24 27", // oklch(0.205 0 0)
  "--sidebar-primary-foreground": "250 250 250", // oklch(0.985 0 0)
  "--sidebar-accent": "244 244 245", // oklch(0.97 0 0)
  "--sidebar-accent-foreground": "24 24 27", // oklch(0.205 0 0)
  "--sidebar-border": "228 228 231", // oklch(0.922 0 0)
  "--sidebar-ring": "161 161 170", // oklch(0.708 0 0)
});

export const darkTheme = vars({
  "--radius": "10", // 0.625rem = 10px

  // Core semantic colors
  "--background": "23 23 23", // oklch(0.145 0 0)
  "--foreground": "250 250 250", // oklch(0.985 0 0)

  "--card": "30 30 30", // oklch(0.205 0 0)
  "--card-foreground": "250 250 250", // oklch(0.985 0 0)

  "--popover": "45 45 45", // oklch(0.269 0 0)
  "--popover-foreground": "250 250 250", // oklch(0.985 0 0)

  "--primary": "228 228 231", // oklch(0.922 0 0)
  "--primary-foreground": "24 24 27", // oklch(0.205 0 0)

  "--secondary": "45 45 45", // oklch(0.269 0 0)
  "--secondary-foreground": "250 250 250", // oklch(0.985 0 0)

  "--muted": "45 45 45", // oklch(0.269 0 0)
  "--muted-foreground": "161 161 170", // oklch(0.708 0 0)

  "--accent": "64 64 64", // oklch(0.371 0 0)
  "--accent-foreground": "250 250 250", // oklch(0.985 0 0)

  "--destructive": "239 68 68", // oklch(0.704 0.191 22.216)

  "--border": "38 38 38", // oklch(1 0 0 / 10%) approximated
  "--input": "45 45 45", // oklch(1 0 0 / 15%) approximated
  "--ring": "113 113 122", // oklch(0.556 0 0)

  // Chart colors
  "--chart-1": "99 102 241", // oklch(0.488 0.243 264.376)
  "--chart-2": "34 197 94", // oklch(0.696 0.17 162.48)
  "--chart-3": "244 162 97", // oklch(0.769 0.188 70.08)
  "--chart-4": "168 85 247", // oklch(0.627 0.265 303.9)
  "--chart-5": "239 68 68", // oklch(0.645 0.246 16.439)

  // Sidebar colors
  "--sidebar": "30 30 30", // oklch(0.205 0 0)
  "--sidebar-foreground": "250 250 250", // oklch(0.985 0 0)
  "--sidebar-primary": "99 102 241", // oklch(0.488 0.243 264.376)
  "--sidebar-primary-foreground": "250 250 250", // oklch(0.985 0 0)
  "--sidebar-accent": "45 45 45", // oklch(0.269 0 0)
  "--sidebar-accent-foreground": "250 250 250", // oklch(0.985 0 0)
  "--sidebar-border": "38 38 38", // oklch(1 0 0 / 10%)
  "--sidebar-ring": "82 82 82", // oklch(0.439 0 0)
});
