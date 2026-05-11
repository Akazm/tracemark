import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    build: {
      sourcemap: isProduction ? "hidden" : true,
      rollupOptions: {
        input: {
          // 'main' is your primary entry point
          main: resolve(__dirname, "index.html"),
          // Add your extra pages here
          privacy: resolve(__dirname, "privacy-policy.html"),
        },
      },
    },
    base: "./",
  };
});
