```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# API Options Component Architecture

This directory holds the API Options component tree for the Trembo extension. The split is deliberate: shared UI lives in `common/`, every provider gets its own file under `providers/`, and cross-cutting helpers sit in `utils/`. The result is a settings surface that's easier to reason about, easier to extend, and far less tangled than a single mega-component.

## Directory Structure

```
settings/
├── ApiOptions.tsx               # Main component that renders provider-specific components
├── common/                      # Reusable UI components
│   ├── ApiKeyField.tsx         # API key input with standard styling
│   ├── BaseUrlField.tsx        # Base URL input with standard styling
│   ├── ErrorMessage.tsx        # Standard error message display
│   ├── ModelInfoView.tsx       # Model information display
│   └── ModelSelector.tsx       # Model selection dropdown
├── providers/                   # Provider-specific components
│   ├── TremboProvider.tsx       # Trembo configuration
│   ├── AnthropicProvider.tsx   # Anthropic-specific configuration
│   ├── BedrockProvider.tsx     # AWS Bedrock configuration
│   ├── GenericProviderSettings.tsx # Shared generic provider configuration
│   ├── MistralProvider.tsx     # Mistral configuration
│   ├── OllamaProvider.tsx      # Ollama configuration
│   ├── OpenAICompatibleProvider.tsx  # OpenAI compatible API configuration
│   ├── OpenRouterProvider.tsx  # OpenRouter configuration
│   └── ...
└── utils/                       # Utility functions
    ├── pricingUtils.ts         # Pricing formatting utilities
    └── providerUtils.ts        # API configuration normalization

```

## Architecture

### Component Hierarchy

```
ApiOptions
└── [ProviderComponent] (based on selected provider)
    ├── ApiKeyField (if needed)
    ├── BaseUrlField (if needed)
    ├── ModelSelector (if showing model options)
    └── ModelInfoView (if showing model options)
```

### Data Flow

1. `ApiOptions` reads the current API configuration from extension state.
2. When a provider is selected, it renders that provider's component.
3. Each provider component receives `apiConfiguration` and `handleInputChange` and manages its own fields.
4. Edits flow back to the extension through the `handleInputChange` callback.

## Adding a New Provider

To add a new provider:

1. Create a new file in the `providers` directory, e.g. `MyNewProvider.tsx`
2. Implement the provider component using this template:

```tsx
import { ApiConfiguration, myNewProviderModels } from "@shared/api"
import { ApiKeyField } from "../common/ApiKeyField"
import { BaseUrlField } from "../common/BaseUrlField"
import { ModelSelector } from "../common/ModelSelector"
import { ModelInfoView } from "../common/ModelInfoView"
import { normalizeApiConfiguration } from "../utils/providerUtils"

/**
 * Props for the MyNewProvider component
 */
interface MyNewProviderProps {
  apiConfiguration: ApiConfiguration
  handleInputChange: (field: keyof ApiConfiguration) => (event: any) => void
  showModelOptions: boolean
  isPopup?: boolean
}

/**
 * The MyNewProvider configuration component
 */
export const MyNewProvider = ({
  apiConfiguration,
  handleInputChange,
  showModelOptions,
  isPopup,
}: MyNewProviderProps) => {
  // Get the normalized configuration
  const { selectedModelId, selectedModelInfo } = normalizeApiConfiguration(apiConfiguration)

  return (
    <div>
      {/* Add provider-specific fields */}
      <ApiKeyField
        value={apiConfiguration?.myNewProviderApiKey || ""}
        onChange={handleInputChange("myNewProviderApiKey")}
        providerName="My New Provider"
        signupUrl="https://mynewprovider.com/signup"
      />

      {/* Optional: Base URL field if the provider supports custom endpoints */}
      <BaseUrlField
        value={apiConfiguration?.myNewProviderBaseUrl}
        onChange={handleInputChange("myNewProviderBaseUrl")}
        defaultPlaceholder="https://api.mynewprovider.com"
      />

      {showModelOptions && (
        <>
          <ModelSelector
            models={myNewProviderModels}
            selectedModelId={selectedModelId}
            onChange={handleInputChange("apiModelId")}
            label="Model"
          />

          <ModelInfoView
            selectedModelId={selectedModelId}
            modelInfo={selectedModelInfo}
            isPopup={isPopup}
          />
        </>
      )}
    </div>
  )
}
```

3. Import and add the new provider component to `ApiOptions.tsx`:

```tsx
import { MyNewProvider } from "./providers/MyNewProvider"

// ...

{apiConfiguration && selectedProvider === "mynewprovider" && (
  <MyNewProvider
    apiConfiguration={apiConfiguration}
    handleInputChange={handleInputChange}
    showModelOptions={showModelOptions}
    isPopup={isPopup}
  />
)}
```

4. Add the provider to the dropdown options:

```tsx
<VSCodeOption value="mynewprovider">My New Provider</VSCodeOption>
```

## Best Practices

1. **Reuse common components**: lean on `common/` for consistent UI and behavior
2. **Keep provider logic local**: provider-specific code stays inside its provider component
3. **Stay typed**: make sure all props and state are properly typed
4. **Handle edge cases gracefully**: account for missing or partial configurations
5. **Document quirks**: call out any provider-specific behaviors or requirements

## Testing

Each provider component should be tested in isolation to confirm it renders correctly and handles user input the way it should.
