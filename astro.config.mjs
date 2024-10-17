import { defineConfig } from 'astro/config';
import node from "@astrojs/node";

import react from "@astrojs/react";

import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  output: "hybrid",
  adapter: node({
    mode: "standalone"
  }),
  integrations: [react(), solidJs()]
});