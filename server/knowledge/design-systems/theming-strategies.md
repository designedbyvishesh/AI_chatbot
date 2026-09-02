# Theming Strategies in Design Systems

## Why Theming Matters

Theming allows a design system to support **multiple visual identities** from a single component library. Common use cases:
- **Dark mode / Light mode** — the most common theming scenario
- **Multi-brand** — one codebase serving Coca-Cola, Fanta, and Sprite
- **White-labeling** — SaaS products that customers rebrand
- **Accessibility themes** — high-contrast, reduced motion, large text

---

## Approach 1: CSS Custom Properties (Recommended for Web)

The simplest and most performant approach. Define tokens as CSS variables and swap them at the root.

```css
/* Light theme (default) */
:root {
  --color-surface: #ffffff;
  --color-text-primary: #1a1a1a;
  --color-action-primary: #2196F3;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.08);
}

/* Dark theme */
[data-theme="dark"] {
  --color-surface: #121212;
  --color-text-primary: #e3e3e3;
  --color-action-primary: #64B5F6;
  --shadow-card: 0 2px 8px rgba(0,0,0,0.4);
}
```

**How to switch:** Toggle a `data-theme` attribute on `<html>` or `<body>`.

**Pros:**
- Zero JavaScript runtime cost — CSS handles everything
- No flash of unstyled content (FOUC) if set before render
- Works with any framework or vanilla HTML

**Cons:**
- No type safety (just strings)
- Can't compute derived values (e.g., `darken(color, 10%)`)

### Dark Mode: Not Just Inverting Colors

Material Design 3's dark theme guidelines:

| Surface | Light | Dark | Note |
|---|---|---|---|
| Background | `#FFFFFF` | `#121212` | Not pure black — reduces eye strain |
| Surface 1 (card) | `#F5F5F5` | `#1E1E1E` | Elevated surfaces are *lighter* in dark mode |
| Surface 2 (modal) | `#EEEEEE` | `#2C2C2C` | Each elevation level adds 1-2% white overlay |
| Primary text | `#1A1A1A` | `#E3E3E3` | Minimum 4.5:1 contrast ratio (WCAG AA) |
| Secondary text | `#666666` | `#A0A0A0` | Minimum 3:1 for large text |

**Key Rule:** In dark mode, elevation is expressed through **surface lightness**, not shadows. Higher elevation = lighter surface.

---

## Approach 2: Theme Provider (React Context)

For React-based systems, a ThemeProvider passes theme tokens through context:

```jsx
const lightTheme = {
  colors: { surface: '#fff', textPrimary: '#1a1a1a' },
  spacing: { sm: 4, md: 8, lg: 16 }
};

<ThemeProvider theme={darkTheme}>
  <App />
</ThemeProvider>
```

**Used by:** Styled Components, Emotion, Chakra UI, MUI.

**Pros:** Type-safe, JavaScript-computed values, dynamic switching.
**Cons:** Runtime cost, provider nesting, server-rendering complexity.

---

## Approach 3: Design Token Build Pipeline

Define tokens in a source format (JSON/YAML), then compile to platform-specific outputs:

```
tokens.json → Style Dictionary → {
  CSS:      --color-action-primary: #2196F3;
  iOS:      UIColor.actionPrimary
  Android:  @color/action_primary
  Flutter:  AppColors.actionPrimary
}
```

**Best for:** Multi-platform design systems (web + iOS + Android).

---

## Multi-Brand Theming

The most complex theming scenario. One component library, multiple brand identities.

### Strategy: Theme Layering

```
Base tokens (shared)     →  spacing, typography, radius
  ↓
Brand tokens (per-brand) →  colors, logos, brand-specific overrides
  ↓
Component tokens         →  reference brand tokens
```

**Example:**
```css
/* Brand A */
[data-brand="coca-cola"] {
  --color-brand-primary: #F40009;
  --color-brand-secondary: #000000;
}

/* Brand B */
[data-brand="fanta"] {
  --color-brand-primary: #FF8300;
  --color-brand-secondary: #003DA5;
}
```

**All components reference `--color-brand-primary`** — zero component code changes between brands.

---

## Common Theming Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Hardcoding colors in components | Theme switching requires touching every component | Use semantic tokens exclusively |
| Using `opacity` for dark mode text | Different backgrounds produce different contrast ratios | Use explicit dark-mode text colors |
| Pure black (`#000000`) backgrounds | Causes eye strain and "halation" effect on OLED screens | Use `#121212` or `#0A0A0A` |
| Forgetting shadows in dark mode | Light-theme shadows become invisible on dark backgrounds | Use higher-opacity shadows or surface tint |
| Theme token naming by appearance | `--dark-bg` breaks in a "dark theme dark-bg" context | Use semantic names: `--surface-default` |

---

## Key References

- [Material Design 3: Dark Theme](https://m3.material.io/styles/color/dynamic/choosing-a-source)
- [Apple HIG: Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [Figma Variables for Theming](https://help.figma.com/hc/en-us/articles/15339657135383)
- [WCAG 2.2 Contrast Requirements](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [APCA Contrast Algorithm](https://www.myndex.com/APCA/)
