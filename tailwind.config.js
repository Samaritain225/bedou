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
        primary: "#4F46E5",
        "primary-dark": "#6366F1",
        "primary-hover": "#4338CA",
        "primary-hover-dark": "#818CF8",
        success: "#10B981",
        "success-dark": "#34D399",
        danger: "#DC2626",
        "danger-dark": "#EF4444",
        warning: "#F59E0B",
        "warning-dark": "#FBBF24",
        background: "#FFFFFF",
        "background-dark": "#111827",
        surface: "#F9FAFB",
        "surface-dark": "#1F2937",
        border: "#E5E7EB",
        "border-dark": "#374151",
        "text-primary": "#111827",
        "text-primary-dark": "#F3F4F6",
        "text-secondary": "#4B5563",
        "text-secondary-dark": "#9CA3AF",
        "text-muted": "#6B7280",
      },
    },
  },
  plugins: [],
};
