import type { NextConfig } from "next";

// Cache Components is off: every signed-in screen reads the session cookie, so nothing is prerendered.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
