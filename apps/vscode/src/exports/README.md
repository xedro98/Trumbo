# Trembo API

The Trembo extension exposes an API that can be used by other extensions. To use this API in your extension:

1. Copy `src/extension-api/trembo.d.ts` to your extension's source directory.
2. Include `trembo.d.ts` in your extension's compilation.
3. Get access to the API with the following code:

    ```ts
    const tremboExtension = vscode.extensions.getExtension<TremboAPI>("saoudrizwan.claude-dev")

    if (!tremboExtension?.isActive) {
    	throw new Error("Trembo extension is not activated")
    }

    const trembo = tremboExtension.exports

    if (trembo) {
    	// Now you can use the API

    	// Start a new task with an initial message
    	await trembo.startNewTask("Hello, Trembo! Let's make a new project...")

    	// Start a new task with an initial message and images
    	await trembo.startNewTask("Use this design language", ["data:image/webp;base64,..."])

    	// Send a message to the current task
    	await trembo.sendMessage("Can you fix the @problems?")

    	// Simulate pressing the primary button in the chat interface (e.g. 'Save' or 'Proceed While Running')
    	await trembo.pressPrimaryButton()

    	// Simulate pressing the secondary button in the chat interface (e.g. 'Reject')
    	await trembo.pressSecondaryButton()
    } else {
    	console.error("Trembo API is not available")
    }
    ```

    **Note:** To ensure that the `saoudrizwan.claude-dev` extension is activated before your extension, add it to the `extensionDependencies` in your `package.json`:

    ```json
    "extensionDependencies": [
        "saoudrizwan.claude-dev"
    ]
    ```

For detailed information on the available methods and their usage, refer to the `trembo.d.ts` file.
