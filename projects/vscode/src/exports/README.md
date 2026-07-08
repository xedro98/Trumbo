# Trumbo API

The Trumbo extension exposes an API that can be used by other extensions. To use this API in your extension:

1. Copy `src/extension-api/trumbo.d.ts` to your extension's source directory.
2. Include `trumbo.d.ts` in your extension's compilation.
3. Get access to the API with the following code:

    ```ts
    const trumboExtension = vscode.extensions.getExtension<TrumboAPI>("trumbo.trumbo")

    if (!trumboExtension?.isActive) {
    	throw new Error("Trumbo extension is not activated")
    }

    const trumbo = trumboExtension.exports

    if (trumbo) {
    	// Now you can use the API

    	// Start a new task with an initial message
    	await trumbo.startNewTask("Hello, Trumbo! Let's make a new project...")

    	// Start a new task with an initial message and images
    	await trumbo.startNewTask("Use this design language", ["data:image/webp;base64,..."])

    	// Send a message to the current task
    	await trumbo.sendMessage("Can you fix the @problems?")

    	// Simulate pressing the primary button in the chat interface (e.g. 'Save' or 'Proceed While Running')
    	await trumbo.pressPrimaryButton()

    	// Simulate pressing the secondary button in the chat interface (e.g. 'Reject')
    	await trumbo.pressSecondaryButton()
    } else {
    	console.error("Trumbo API is not available")
    }
    ```

    **Note:** To ensure that the `trumbo.trumbo` extension is activated before your extension, add it to the `extensionDependencies` in your `package.json`:

    ```json
    "extensionDependencies": [
        "trumbo.trumbo"
    ]
    ```

For detailed information on the available methods and their usage, refer to the `trumbo.d.ts` file.
