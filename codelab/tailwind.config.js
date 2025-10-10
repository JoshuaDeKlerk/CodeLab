/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        surface: "#1E293B",
        accent: "#4DA3FF",
        success: "#49D18E",
        warn: "#FFC857",
        text: "#FEFEFE",
        subtext: "#E2E8F0",
      },
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
        jet: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.25)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
}
