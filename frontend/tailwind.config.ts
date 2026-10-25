import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#000E24",
          surface: "#0B1E36",
          border: "rgba(59, 130, 246, 0.15)",
          accent: "#3B82F6",
        },
        security: {
          success: "#10B981",
          danger: "#EF4444",
          warning: "#F59E0B",
          info: "#06B6D4",
        },
      },
    },
  },
  plugins: []
};
export default config;
