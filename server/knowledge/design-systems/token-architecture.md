# Design Token Architecture

## What Are Design Tokens?

Design tokens are the **atomic building blocks** of a design system's visual language. They store design decisions — colors, spacing, typography, elevation, motion — as platform-agnostic key-value pairs that can be consumed by any technology (CSS, iOS, Android, Flutter).

> **Key Insight:** Tokens are not just variables. They encode *design intent* through a layered abstraction system.

---

## The Three-Layer Token Model

Modern design systems use a **3-tier token hierarchy**. This is the industry standard adopted by Salesforce Lightning, Adobe Spectrum, IBM Carbon, and Material Design 3.

### 1. Primitive Tokens (Global / Reference)
Raw design values with no semantic meaning. Think of these as the full color palette.

```
color-blue-500: #2196F3
color-gray-100: #F5F5F5
spacing-4: 4px
spacing-8: 8px
font-size-14: 14px
```

**Rule:** Never reference primitives directly in components. They are the foundation layer only.

### 2. Semantic Tokens (Alias / Intent)
Map primitives to *purpose*. This is where design decisions live.

```
color-action-primary → color-blue-500
color-surface-default → color-gray-100
color-text-primary → color-gray-900
color-text-on-action → color-white
spacing-component-gap → spacing-8
```

**Why this matters:**
- Changing `color-action-primary` from blue to purple updates **every CTA button** system-wide
- Dark mode = just remap semantic tokens to different primitives
- Multi-brand = swap the semantic layer per brand

### 3. Component Tokens (Scoped)
Specific to a single component. They reference semantic tokens.

```
button-primary-background → color-action-primary
button-primary-text → color-text-on-action
button-border-radius → radius-md
card-surface → color-surface-elevated
```

**When to use component tokens:**
- When a component needs a value that deviates from the semantic layer
- When you need per-component theming (e.g., a "destructive" button variant)

---

## Token Formats & Standards

### W3C Design Tokens Community Group (DTCG)
The emerging standard for interoperable token files. Uses `.tokens.json` format:

```json
{
  "color": {
    "action": {
      "primary": {
        "$value": "{color.blue.500}",
        "$type": "color",
        "$description": "Primary interactive color for CTAs"
      }
    }
  }
}
```

### Style Dictionary (by Amazon)
The most widely used build tool for transforming tokens into platform-specific outputs:
- CSS custom properties
- iOS Swift constants
- Android XML resources
- Flutter Dart classes

---

## Common Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Using hex values directly in components | No single source of truth; changes require find-and-replace | Always reference tokens |
| Naming tokens by appearance (`color-red`) | Breaks when brand changes; "red" might become "orange" | Use semantic names (`color-error`) |
| Too many token levels (5+) | Cognitive overhead; developers can't trace values | Stick to 3 levels max |
| No documentation on token purpose | Developers guess which token to use | Add `$description` to every token |

---

## Key References

- [W3C Design Tokens Format Module](https://design-tokens.github.io/community-group/format/)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
- [Material Design 3: Design Tokens](https://m3.material.io/foundations/design-tokens)
- [Salesforce Lightning Design System Tokens](https://www.lightningdesignsystem.com/design-tokens/)
- [Nathan Curtis: Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)
