/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#DB0011",
          hover: "#B8000E",
          soft: "#FDECEE",
        },
        canvas: "#FFFFFF",
        subtle: "#F7F8FA",
        muted: "#EFF1F5",
        border: {
          DEFAULT: "#E4E7EC",
          strong: "#CED2DA",
        },
        ink: {
          primary: "#1A1F2C",
          secondary: "#5B6473",
          tertiary: "#8A93A1",
        },
        success: "#067647",
        warning: "#B54708",
        info: "#175CD3",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(16,24,40,0.06)",
        md: "0 4px 12px rgba(16,24,40,0.08)",
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
