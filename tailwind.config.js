/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#0B1020",
          panel: "#111827",
          card: "#161F32",
          border: "#25304A",
          text: "#F8FAFC",
          muted: "#94A3B8",
          accent: "#6366F1",
          cyan: "#22D3EE",
          danger: "#EF4444",
          success: "#22C55E",
        },
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        studio: "0 24px 80px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
