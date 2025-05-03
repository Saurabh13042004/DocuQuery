import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  server: {
    host: '0.0.0.0',  // Listens on all interfaces
    port: 3000,        // Replace with your port number if different
  },
  plugins: [react() ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
