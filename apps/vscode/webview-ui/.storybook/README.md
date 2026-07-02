```text
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
```

# Storybook Documentation

## What is Storybook?

Storybook is a frontend workshop for building UI components and pages in isolation. It lets you:

- **Develop components independently** of the main application
- **Exercise different states and props** without spinning up the whole extension
- **Document component APIs** with live, interactive examples
- **Catch UI regressions** through visual review
- **Share components** with teammates and stakeholders

Inside Trembo's webview, Storybook is how we develop and verify the React components that make up the chat surface, settings panels, and the rest of the UI — all decoupled from the live VS Code extension host.

## Getting Started

### Starting Storybook

Launch the Storybook dev server with:

```bash
bun run storybook
```

Storybook comes up on `http://localhost:6006`, where you can browse every story and interact with the components directly.

### Project Structure

```
webview-ui/.storybook/
├── main.ts          # Main configuration
├── preview.ts       # Global decorators and parameters
├── themes.ts        # VSCode theme definitions
└── README.md        # This documentation
```

## Configuration Overview

### Main Configuration (`main.ts`)

- **Stories location**: auto-discovers `*.stories.*` files under `../src/`
- **Framework**: `@storybook/react-vite` for the React + Vite pipeline
- **Environment variables**: sets development flags (`IS_DEV`, `IS_TEST`, `TEMP_PROFILE`)
- **TypeScript**: enables type checking and automatic prop documentation

### Preview Configuration (`preview.ts`)

- **Viewport**: an "Editor Sidebar" viewport (700x800px) that mirrors VS Code's sidebar
- **Themes**: a toolbar switcher between VS Code Dark and Light themes
- **Global decorator**: `StorybookWebview` provides a VS Code-like rendering environment
- **Documentation**: dark theme styling to match VS Code

### Theme System (`themes.ts`)

Mocks the VS Code CSS variables for both dark and light themes so components render correctly outside the real extension host.

## Creating Stories

### Basic Story Structure

Add a `*.stories.tsx` file next to your component:

```typescript
import type { Meta, StoryObj } from "@storybook/react-vite"
import { MyComponent } from "./MyComponent"

const meta: Meta<typeof MyComponent> = {
  title: "Components/MyComponent",
  component: MyComponent,
  parameters: {
    docs: {
      description: {
        component: "Description of what this component does"
      }
    }
  }
}

export default meta
type Story = StoryObj<typeof MyComponent>

export const Default: Story = {
  args: {
    prop1: "value1",
    prop2: true
  }
}

export const WithDifferentState: Story = {
  args: {
    prop1: "different value",
    prop2: false
  }
}
```

### Advanced Story Patterns

For components that depend on context or shared state, use decorators:

```typescript
import { ExtensionStateContext } from "@/context/ExtensionStateContext"

const createMockState = (overrides = {}) => ({
  // Mock state properties
  tremboMessages: [],
  taskHistory: [],
  ...overrides
})

export const WithMockState: Story = {
  decorators: [
    (Story) => {
      const mockState = createMockState({
        tremboMessages: mockMessages
      })
      return (
        <ExtensionStateContext.Provider value={mockState}>
          <Story />
        </ExtensionStateContext.Provider>
      )
    }
  ]
}
```

### Story Organization

- **Title**: use hierarchical names like `"Views/Chat"` or `"Components/Button"`
- **Parameters**: add descriptions and documentation
- **Args**: define default props for the interactive controls
- **Multiple stories**: cover different states, props, and use cases

## Writing UI Tests

### Interactive Testing with `play` Functions

Storybook supports automated interaction tests via the `play` function:

```typescript
import { expect, userEvent, within } from "storybook/test"

export const InteractiveTest: Story = {
  args: {
    // Component props
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Find elements
    const button = canvas.getByText("Click me")
    const input = canvas.getByPlaceholderText("Enter text")

    // Perform interactions
    await userEvent.type(input, "Hello world")
    await userEvent.click(button)

    // Assert results
    await expect(canvas.getByText("Hello world")).toBeInTheDocument()
  }
}
```

### Testing Patterns

1. **User interactions**: click buttons, type into inputs, navigate
2. **State changes**: verify the component updates after interactions
3. **Accessibility**: test keyboard navigation and screen reader support
4. **Error states**: cover error handling and edge cases

### Example from App.stories.tsx

The `WelcomeScreen` story shows a full interaction test:

```typescript
export const WelcomeScreen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Test initial state
    const getStartedButton = canvas.getByText("Get Started for Free")
    const byokButton = canvas.getByText("Use your own API key")
    await expect(getStartedButton).toBeInTheDocument()
    await expect(byokButton).toBeInTheDocument()

    // Test interaction
    await userEvent.click(byokButton)

    // Test state change
    await expect(getStartedButton).toBeInTheDocument()
    await expect(byokButton).not.toBeInTheDocument()
  }
}
```

## Best Practices

### Story Development

1. **Start simple**: get a basic story rendering first, then layer in complexity
2. **Cover edge cases**: include error, loading, and empty states
3. **Use realistic data**: mock plausible data so tests reflect real usage
4. **Document behavior**: add descriptions explaining what the component does

### Testing Guidelines

1. **Test user flows**: focus on how people actually interact with the component
2. **Verify accessibility**: ensure keyboard and screen reader paths work
3. **Test responsive behavior**: switch between viewport sizes
4. **Mock external dependencies**: stub API calls and file operations

### Performance Tips

1. **Lazy-load stories**: use dynamic imports for large story files
2. **Keep mock data lean**: minimal but realistic
3. **Reuse decorators**: factor shared decorators into common helpers
4. **Clean up**: dispose of resources during story teardown

## VS Code Integration

### Theme Switching

Use the toolbar theme switcher to validate components under both VS Code Dark and Light themes.

### Viewport Testing

The default "Editor Sidebar" viewport (700x800px) matches VS Code's sidebar dimensions, so what you see in Storybook lines up with how components render inside the real extension.

### Extension Context

The `StorybookWebview` decorator supplies a VS Code-like environment with the right CSS variables and context providers, so stories behave close to how they do in the extension.

## Troubleshooting

### Common Issues

1. **Missing CSS variables**: make sure the `StorybookWebview` decorator is applied
2. **Context errors**: wrap stories in the appropriate context providers
3. **Import errors**: confirm every dependency is available in the Storybook environment
4. **Theme issues**: verify theme CSS variables are being applied

### Debugging Tips

1. **Use browser DevTools**: inspect elements and check the console for errors
2. **Check story args**: confirm props are reaching the component
3. **Test in isolation**: build a minimal story to narrow down the issue
4. **Review configuration**: check `main.ts` and `preview.ts` for misconfigurations

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Testing with Storybook](https://storybook.js.org/docs/writing-tests)
- [React Storybook Guide](https://storybook.js.org/docs/get-started/react-vite)
