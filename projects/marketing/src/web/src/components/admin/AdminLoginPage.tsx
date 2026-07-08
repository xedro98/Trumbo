import { Button, Input } from "@cloudflare/kumo";
import { TreeStructure } from "@phosphor-icons/react";
import { useState } from "react";
import { adminLogin } from "@/lib/blog-api";

export function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setLoading(true);
		setError("");
		try {
			await adminLogin(email, password);
			onLogin();
		} catch {
			setError("Invalid email or password");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex h-dvh items-center justify-center bg-kumo-canvas p-6">
			<div className="w-full max-w-sm">
				<div className="mb-8 flex flex-col items-center gap-3">
					<div className="flex items-center gap-2">
						<TreeStructure size={24} className="text-kumo-brand" />
						<span className="font-semibold text-lg text-kumo-strong">Trumbo Admin</span>
					</div>
					<p className="text-sm text-kumo-subtle">
						Sign in to manage blog posts and categories
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<Input
						label="Email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="me@example.com"
						autoComplete="email"
						required
					/>

					<Input
						label="Password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						autoComplete="current-password"
						required
						error={error ? error : undefined}
					/>

					<Button type="submit" variant="primary" loading={loading} className="w-full">
						Sign in
					</Button>
				</form>

				<p className="mt-6 text-center text-xs text-kumo-inactive">
					<a href="/" className="hover:text-kumo-subtle transition-colors">
						← Back to trumbo.dev
					</a>
				</p>
			</div>
		</div>
	);
}
