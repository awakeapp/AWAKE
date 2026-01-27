# Workflow Rules

These rules govern the development of the Awake application.

## 1. Design & Aesthetics
- **Premium Feel**: Use HSL colors, smooth gradients, and glassmorphism.
- **Interactivity**: Every button and card should have hover and active states.
- **Consistency**: Use standardized padding, radius (e.g., 1.5rem for cards), and shadows.
- **Media**: Generate custom assets for a "vibrant and alive" feel.

## 2. Development Standards
- **Component Hierarchy**: Atoms -> Molecules -> Organisms -> Templates -> Pages.
- **Context-First State**: Use specialized Contexts (Finance, Task, Health) for global state.
- **Absolute Paths**: Always use absolute paths for imports and tool calls (where applicable).
- **SEO**: Ensure every page has descriptive titles and semantic HTML.

## 3. Communication
- **Clarity**: Explain what a change does and why.
- **Verification**: Provide a walkthrough for every major feature or fix.
- **Planning**: Always start complex work with an implementation plan.

## 4. Automation (Turbo)
- // turbo: Marker for safe-to-auto-run terminal commands.
- // turbo-all: Marker for safe-to-auto-run all command steps in a workflow.
