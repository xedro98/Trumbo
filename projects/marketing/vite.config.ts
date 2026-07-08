import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
	root: path.resolve(__dirname, "src/web"),
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src/web/src"),
		},
		dedupe: ["react", "react-dom"],
	},
	base: "/",
	server: {
		port: 5174,
		proxy: {
			"/api": {
				target: "http://localhost:8787",
				changeOrigin: true,
			},
		},
	},
	build: {
		outDir: path.resolve(__dirname, "dist/web"),
		emptyOutDir: true,
	},
});
