import { defineConfig } from "vite";
import { resolve } from "path";
import { readdirSync, copyFileSync, mkdirSync } from "fs";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [
    {
      name: "copy-json-files",
      buildStart() {
        const dest = resolve(__dirname, ".vite/build");
        mkdirSync(dest, { recursive: true });
        readdirSync(resolve(__dirname, "avia_core"))
          .filter(f => f.endsWith(".json"))
          .forEach(f => copyFileSync(
            resolve(__dirname, "avia_core", f),
            resolve(dest, f)
          ));
      }
    }
  ]
});
