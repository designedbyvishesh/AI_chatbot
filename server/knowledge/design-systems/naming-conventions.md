# Naming Conventions in Design Systems

## Why Naming Is One of the Hardest Problems

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

In design systems, bad naming creates:
- **Ambiguity** — developers don't know which token/component to use
- **Inconsistency** — different teams invent their own names
- **Brittleness** — names that describe appearance break when design changes
- **Scaling problems** — naming that works for 10 tokens fails at 500

---

## Token Naming Conventions

### The Category-Type-Item (CTI) Pattern

The most widely adopted pattern, used by Salesforce Lightning and Style Dictionary:

```
{category}-{type}-{item}-{variant}-{state}

color-background-primary
color-text-secondary
spacing-inline-md
font-size-heading-lg
shadow-elevation-2
```

**Rules:**
- Start broad (category), end specific (variant/state)
- Use hyphens, not camelCase (CSS convention)
- Never skip levels — `color-primary` is ambiguous (primary what?)

### Semantic vs. Descriptive Names

| Type | Example | When to Use |
|---|---|---|
| **Descriptive** | `color-blue-500` | Primitive tokens only (the palette) |
| **Semantic** | `color-action-primary` | Semantic and component tokens (the decisions) |
| **Contextual** | `button-primary-bg` | Component-scoped tokens |

**Critical Rule:** Components should **never** reference descriptive tokens directly. Always go through the semantic layer.

```
✗ BAD:  button { background: var(--color-blue-500); }
✓ GOOD: button { background: var(--color-action-primary); }
```

### Numeric Scales

For graded values (color shades, spacing, font sizes):

```
color-gray-50    (lightest)
color-gray-100
color-gray-200
...
color-gray-900   (darkest)

spacing-0: 0px
spacing-1: 4px
spacing-2: 8px
spacing-3: 12px
spacing-4: 16px
spacing-6: 24px
spacing-8: 32px
```

**T-Shirt Sizing Alternative:**

```
spacing-xs: 4px
spacing-sm: 8px
spacing-md: 16px
spacing-lg: 24px
spacing-xl: 32px
spacing-2xl: 48px
```

**Tradeoff:** Numeric scales are more extensible (you can always add `spacing-5`). T-shirt sizes are more readable but harder to extend (`spacing-xxl`? `spacing-3xl`?).

---

## Component Naming Conventions

### BEM (Block Element Modifier)

```css
.card {}                    /* Block */
.card__header {}            /* Element */
.card__header--highlighted {} /* Modifier */
.card__body {}
.card__footer {}
```

**Pros:** Extremely predictable, flat specificity, widely understood.
**Cons:** Verbose class names, doesn't handle state well.

### Utility-First (Tailwind Pattern)

```html
<div class="flex items-center gap-4 p-6 bg-surface rounded-lg shadow-md">
```

**Pros:** Rapid prototyping, no naming decisions, small CSS bundles.
**Cons:** HTML readability degrades, breaks encapsulation for design system components.

### CSS Modules / Scoped Styles

```css
/* Button.module.css */
.root { }
.label { }
.icon { }
```

Component-scoped names that are auto-namespaced at build time. No naming collisions.

---

## File & Directory Naming

### Component Files
```
✓ Button.js / Button.tsx      (PascalCase — React convention)
✓ button.css / Button.css     (match component name)
✓ index.js                    (barrel export)

✗ btn.js                      (abbreviation)
✗ ButtonComponent.js           (redundant suffix)
```

### Token Files
```
✓ tokens/color.json
✓ tokens/spacing.json
✓ tokens/typography.json

✗ tokens/vars.json             (vague)
✗ tokens/styles.json           (too broad)
```

### Feature Directories
```
✓ features/chat-tutor/         (kebab-case)
✓ features/hierarchy-builder/
✓ components/Button/

✗ features/ChatTutor/          (PascalCase for directories is unusual)
✗ features/chat_tutor/         (underscores in directory names)
```

---

## Icon Naming

```
✓ icon-arrow-right
✓ icon-chevron-down
✓ icon-close
✓ icon-search

✗ icon-x                      (ambiguous)
✗ icon-right-arrow             (adjective before noun — inconsistent)
✗ close-icon                   (prefix should be category)
```

**Pattern:** `icon-{object}-{variant}`
- `icon-chevron-right`, `icon-chevron-down`, `icon-chevron-left`
- `icon-alert-circle`, `icon-alert-triangle`

---

## Key References

- [Nathan Curtis: Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)
- [Style Dictionary: CTI Pattern](https://amzn.github.io/style-dictionary/#/tokens?id=category-type-item)
- [BEM Methodology](https://en.bem.info/methodology/)
- [Figma Variables Naming Best Practices](https://help.figma.com/hc/en-us/articles/15339657135383)
- [Brad Frost: Atomic Design](https://atomicdesign.bradfrost.com/)
