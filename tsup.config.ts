import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entryPoints: ["src/index.ts"],
  format: ["cjs", "esm"],
  splitting: false,
  dts: true,
  clean: true,
  sourcemap: false,
  minify: !watch,
  target: "node18",
}));