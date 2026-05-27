import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(225, 20%, 7%)",
        foreground: "hsl(0, 0%, 92%)",
        mint: {
          400: "hsl(160, 75%, 60%)",
          500: "hsl(160, 75%, 48%)",
        }
      },
      fontFamily: {
        space: ["var(--font-space-grotesk)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      }
    },
  },
  plugins: [],
};
export default config;
