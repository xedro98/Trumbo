```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Trembo API

The Trembo extension exposes an API that other extensions can call. To use it from your extension:

1. Copy `src/extension-api/trembo.d.ts` into your extension's source directory.
2. Include `trembo.d.ts` in your extension's compilation.
3. Access the API with the following code:

    ```ts
    const tremboExtension = vscode.extensions.getExtension<TremboAPI>("trembo-bot.trembo")

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

    **Note:** To ensure the `trembo-bot.trembo` extension is activated before your extension, add it to `extensionDependencies` in your `package.json`:

    ```json
    "extensionDependencies": [
        "trembo-bot.trembo"
    ]
    ```

For the full list of available methods and how to use them, refer to the `trembo.d.ts` file.
