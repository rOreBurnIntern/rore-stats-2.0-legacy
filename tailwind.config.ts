import daisyui from "daisyui";
import type { Config } from "tailwindcss";

const config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
        mono: ["Courier New", "monospace"],
      },
    },
  },
  daisyui: {
    themes: [
      {
        rore: {
          primary: "#ff9b45",
          secondary: "#f59e0b",
          accent: "#f97316",
          neutral: "#1a0f09",
          "base-100": "#120904",
          "base-200": "#1a0f09",
          "base-300": "#2b190f",
          "base-content": "#f5e7d7",
          info: "#38bdf8",
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
  },
  plugins: [daisyui],
} satisfies Config & {
  daisyui: {
    themes: Array<Record<string, Record<string, string>>>;
  };
};

export default config;
