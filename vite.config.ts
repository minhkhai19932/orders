import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_BACKEND_SITE_BASE_URL": JSON.stringify(
      "http://54.254.10.201:8000"
    ),
  },
});
