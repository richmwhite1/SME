import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apothecary Terminal Palette
        "forest-obsidian": "#0A0F0D",
        "muted-moss": "#141C18",
        "translucent-emerald": "rgba(16, 185, 129, 0.1)",
        "bone-white": "#F1F5F9",
        "heart-green": "#10B981", // For products
        "third-eye-indigo": "#6366F1", // For discussions
        "muted-amber": "#D97706", // For pending states
        // Legacy colors for backward compatibility
        "sme-gold": "#B8860B",
        "deep-slate": "#0F172A",
        "earth-green": "#4A5D4E",
        "sand-beige": "#F5F1E8",
        "soft-clay": "#D7C0AE",
        "deep-stone": "#1C1C1E",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        mono: ["var(--font-geist-mono)", "Geist Mono", "JetBrains Mono", "monospace"],
      },
      // Enhanced line heights for readability
      lineHeight: {
        'relaxed-reading': '1.75',
        'comfortable': '1.65',
        'discussion': '1.7',
      },
      // Enhanced font sizes with better hierarchy
      fontSize: {
        'xs-readable': ['0.8125rem', { lineHeight: '1.5' }],
        'sm-readable': ['0.9375rem', { lineHeight: '1.6' }],
        'base-readable': ['1rem', { lineHeight: '1.7' }],
        'lg-readable': ['1.125rem', { lineHeight: '1.75' }],
      },
    },
  },
  plugins: [],
};
export default config;



