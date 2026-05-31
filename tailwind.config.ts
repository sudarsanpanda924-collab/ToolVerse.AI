import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      borderRadius: {
        tool: "0.75rem",
      },
      boxShadow: {
        glow: "0 0 60px rgba(34, 211, 238, 0.22)",
      },
    },
  },
};

export default config;
