# Component API Patterns

## What Makes a Good Component API?

A component API is the **interface contract** between the design system team and consuming developers. A well-designed API is:
- **Predictable** — follows consistent patterns across all components
- **Composable** — components can be nested and combined
- **Constrained** — prevents misuse through intentional limitations
- **Documented** — every prop, slot, and variant is described

---

## Core API Patterns

### 1. Props-Based Components (Flat API)

The simplest pattern. A single component accepts configuration via properties.

```jsx
<Button variant="primary" size="md" disabled>
  Submit
</Button>
```

**When to use:** Simple, self-contained components (Button, Badge, Avatar, Chip).

**Pros:** Easy to learn, easy to document, easy to lint.
**Cons:** Prop explosion — as features grow, so does the prop count.

### 2. Compound Components (Compositional API)

A parent component provides context; children slot into specific roles.

```jsx
<Select>
  <Select.Trigger>Choose a color</Select.Trigger>
  <Select.Content>
    <Select.Item value="red">Red</Select.Item>
    <Select.Item value="blue">Blue</Select.Item>
  </Select.Content>
</Select>
```

**When to use:** Complex components with multiple interactive parts (Select, Dialog, Tabs, Accordion, Menu).

**Pros:** Maximum flexibility, clean separation of concerns.
**Cons:** Higher learning curve, requires understanding parent-child context.

**Real-world examples:**
- Radix UI primitives (headless compound components)
- Reach UI
- Adobe React Aria

### 3. Render Props / Slot Pattern

The component exposes a function or slot that lets consumers control rendering.

```jsx
<Combobox>
  {({ open, selected }) => (
    <Combobox.Input displayValue={(item) => item.name} />
    <Combobox.Options>
      {items.map(item => <Combobox.Option value={item} />)}
    </Combobox.Options>
  )}
</Combobox>
```

**When to use:** When consumers need full control over rendering while the component manages state and accessibility.

### 4. Headless Components (Logic-Only)

Components that provide behavior, state management, and accessibility — but **zero styling**.

```jsx
// Headless hook pattern
const { isOpen, toggle, triggerProps, contentProps } = useAccordion();
```

**Key players:**
- **Radix UI** — headless primitives with optional styling
- **Headless UI** (by Tailwind Labs) — React/Vue headless components
- **React Aria** (by Adobe) — accessibility hooks
- **Ark UI** — framework-agnostic headless components

---

## Variant Systems

### The Variant Pattern
Components expose a `variant` prop that maps to predefined visual styles:

```
Button variants: primary | secondary | outline | ghost | destructive | link
Badge variants: default | success | warning | error | info
```

**Best Practice (from Stitches / CVA):**
- Define variants as a finite enum, not arbitrary strings
- Each variant maps to a complete set of token overrides
- Use `compoundVariants` for combinations (e.g., `variant="primary" + size="sm"`)

### Class Variance Authority (CVA)
A popular pattern for type-safe variant definitions:

```js
const button = cva("base-button", {
  variants: {
    intent: { primary: "bg-action-primary", secondary: "bg-surface" },
    size: { sm: "h-8 px-3", md: "h-10 px-4", lg: "h-12 px-6" }
  },
  defaultVariants: { intent: "primary", size: "md" }
});
```

---

## Accessibility Requirements

Every component API must address:

| Concern | Implementation |
|---|---|
| **Keyboard navigation** | Arrow keys, Enter, Escape, Tab order |
| **ARIA attributes** | `role`, `aria-label`, `aria-expanded`, `aria-selected` |
| **Focus management** | Focus trapping in modals, focus restoration on close |
| **Screen reader** | Announce state changes, provide labels for icons |
| **Reduced motion** | Respect `prefers-reduced-motion` media query |

**Standard:** WCAG 2.2 AA compliance is the minimum. AAA for government/enterprise.

---

## Common API Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| Boolean prop explosion (`isLoading`, `isDisabled`, `isActive`, `isOpen`...) | 2^n possible states, many invalid combinations | Use a `state` enum: `"idle" \| "loading" \| "error"` |
| `className` prop on every sub-element | Breaks encapsulation, consumers override internals | Expose only semantic `variant` and `size` props |
| `children` as the only customization | Forces string-only content | Support compound children or render props |
| Inconsistent prop names across components | `onPress` vs `onClick` vs `onActivate` | Standardize: always `onClick` (or your convention) |

---

## Key References

- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [React Aria by Adobe](https://react-spectrum.adobe.com/react-aria/)
- [Headless UI](https://headlessui.com/)
- [CVA — Class Variance Authority](https://cva.style/docs)
- [Component API Design in Design Systems — Brad Frost](https://bradfrost.com/blog/)
