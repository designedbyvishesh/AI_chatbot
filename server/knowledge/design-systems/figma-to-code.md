# Figma-to-Code: Design-Dev Handoff

## The Handoff Problem

The #1 source of friction between design and engineering teams is **translation loss** — the gap between what Figma shows and what code produces. Design systems solve this by making handoff systematic, not ad-hoc.

---

## Figma Variables → Design Tokens

### Figma Variables (Introduced 2023)

Figma Variables are the **native token system** inside Figma. They map directly to design tokens:

| Figma Concept | Design Token Equivalent |
|---|---|
| Variable Collection | Token category (colors, spacing) |
| Variable Mode | Theme (light, dark, brand-A) |
| Variable Alias | Semantic token referencing a primitive |
| Variable Value | Raw design value |

### The Workflow

```
1. Designer creates Figma Variables
   └─ color/primary = #2196F3
   └─ color/surface = #FFFFFF (light mode) / #121212 (dark mode)

2. Export variables as tokens
   └─ Use Tokens Studio plugin or Figma REST API
   └─ Output: tokens.json (W3C DTCG format)

3. Build pipeline transforms tokens
   └─ Style Dictionary / Token Transformer
   └─ Output: CSS custom properties, iOS constants, Android resources

4. Code consumes tokens
   └─ background: var(--color-surface);
```

### Tokens Studio for Figma

The most popular Figma plugin for token management:
- Creates and manages design tokens inside Figma
- Supports the W3C DTCG format
- Syncs tokens to GitHub/GitLab (bidirectional)
- Supports token aliasing (semantic → primitive)
- Handles multi-brand and multi-theme via token sets

---

## Component Inspection & Specs

### What Developers Need from a Figma Component

| Information | Where to Find It | How to Encode It |
|---|---|---|
| **Spacing** (padding, gap, margin) | Auto Layout properties | Map to spacing tokens |
| **Colors** | Fill, stroke, text color | Map to color tokens |
| **Typography** | Font family, size, weight, line-height | Map to typography tokens |
| **Border radius** | Corner radius | Map to radius tokens |
| **Elevation** | Drop shadow | Map to shadow tokens |
| **States** | Variants (hover, active, disabled) | Component variants or interactive components |
| **Breakpoints** | Constraints or section frames | Responsive tokens or media queries |

### Figma Auto Layout → CSS Flexbox

The mapping is nearly 1:1:

| Figma Auto Layout | CSS Flexbox |
|---|---|
| Direction: Horizontal | `flex-direction: row` |
| Direction: Vertical | `flex-direction: column` |
| Gap: 8 | `gap: 8px` (or `var(--spacing-2)`) |
| Padding: 16 | `padding: 16px` (or `var(--spacing-4)`) |
| Alignment: Center | `align-items: center` |
| Fill container | `flex: 1` or `width: 100%` |
| Hug contents | `width: fit-content` |

---

## Handoff Tools & Methods

### 1. Figma Dev Mode (Native)

Figma's built-in developer handoff:
- Shows CSS/Swift/Android code snippets per element
- Displays component props and variants
- Shows spacing between elements (red lines)
- Links to token variables when defined

**Limitation:** Generated code is per-element, not component-level. It won't give you a full `Button.jsx` — it gives you the CSS for one button instance.

### 2. Storybook as the Source of Truth

Many teams use Storybook as the **developer-facing documentation**:

```
Designer creates in Figma → Developer builds in code → Storybook documents the living component
```

- Interactive playground for every variant/state
- Auto-generated prop tables from TypeScript types
- Visual regression testing (Chromatic)
- Accessibility audit integration

### 3. Design-to-Code Tools

| Tool | Approach |
|---|---|
| **Anima** | Generates React/Vue/HTML from Figma designs |
| **Locofy** | AI-assisted Figma-to-code with component detection |
| **Builder.io** | Visual editor with Figma import and code export |
| **Overlay** | Generates React components from Figma with design system tokens |

**Reality check:** No tool generates production-ready, design-system-compliant code. They are starting points, not endpoints.

---

## Common Handoff Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Designers use hardcoded values, not variables | Developers can't map to tokens | Enforce Figma Variables for all design work |
| No variant coverage | Developer guesses hover/disabled states | Design all states as Figma variants |
| "Pixel-perfect" expectation | Ignores responsive behavior | Design with Auto Layout + breakpoints |
| Separate design and token repos | Tokens drift out of sync | Use Tokens Studio with GitHub sync |
| No component documentation | Developer rebuilds from visual inspection | Maintain Storybook alongside Figma |

---

## Key References

- [Figma Variables Documentation](https://help.figma.com/hc/en-us/articles/15339657135383)
- [Figma Dev Mode](https://www.figma.com/dev-mode/)
- [Tokens Studio for Figma](https://tokens.studio/)
- [Storybook Documentation](https://storybook.js.org/)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
