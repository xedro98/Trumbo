import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { KumoProviders } from "./components/kumo-providers";
import "./index.css";

const root = document.getElementById("root");
if (!root) {
	throw new Error("Missing #root element");
}

createRoot(root).render(
	<StrictMode>
		<KumoProviders>
			<App />
		</KumoProviders>
	</StrictMode>,
);
