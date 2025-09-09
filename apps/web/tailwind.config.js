// apps/web/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal:   "#00BFA6",
        coral:  "#FF6F61",
        violet: "#7B61FF",
        coal:   "#2E2E2E",
        fog:    "#F5F5F5",
        white:  "#FFFFFF",
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 8px 20px rgba(0,0,0,0.06)",
        focus: "0 0 0 3px rgba(123,97,255,0.35)",
      },
      fontFamily: {
        display: ["var(--font-poppins)"],
        body:    ["var(--font-inter)"],
        accent:  ["var(--font-merriweather)"],
      },
    },
  },
  plugins: [],
};
