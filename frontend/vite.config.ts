import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 8080,
    // Change to 'all' or true
    allowedHosts: ["examora-alb-945905355.us-east-1.elb.amazonaws.com", ".amazonaws.com"],
  },
  preview: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
    allowedHosts: true, // Allow all hosts for preview
  },
  plugins: [react(), componentTagger()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
});