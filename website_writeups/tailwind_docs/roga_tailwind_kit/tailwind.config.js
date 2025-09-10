/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal:   "#00BFA6", // Primary
        coral:  "#FF6F61", // CTA / badges
        violet: "#7B61FF", // Highlights
        coal:   "#2E2E2E", // Text
        fog:    "#F5F5F5", // Surfaces
        white:  "#FFFFFF",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 8px 20px rgba(0,0,0,0.06)",
        focus: "0 0 0 3px rgba(123,97,255,0.35)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"],
        serif: ["var(--font-merriweather)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
