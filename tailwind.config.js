/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins-Regular"],
      },
      colors: {
        primary: "#6366F1", // Indigo 500
        "primary-dark": "#818CF8", // Indigo 400
        "primary-hover": "#4F46E5", // Indigo 600
        "primary-hover-dark": "#A5B4FC", // Indigo 300
        success: "#10B981", // Emerald 500
        "success-dark": "#34D399", // Emerald 400
        danger: "#F43F5E", // Rose 500
        "danger-dark": "#FB7185", // Rose 400
        warning: "#F59E0B", // Amber 500
        "warning-dark": "#FBBF24", // Amber 400
        background: "#F8FAFC", // Slate 50
        "background-dark": "#0F172A", // Slate 900
        surface: "#FFFFFF",
        "surface-dark": "#1E293B", // Slate 800
        border: "#E2E8F0", // Slate 200
        "border-dark": "#334155", // Slate 700
        "text-primary": "#334155", // Slate 700
        "text-primary-dark": "#F1F5F9", // Slate 100
        "text-secondary": "#64748B", // Slate 500
        "text-secondary-dark": "#94A3B8", // Slate 400
        "text-muted": "#94A3B8", // Slate 400
      },
    },
  },
  plugins: [],
};
