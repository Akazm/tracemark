import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";
  return {
    build: {
      sourcemap: isProduction ? "hidden" : true,
    },
    base: "./",
  };
});
