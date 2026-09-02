# Scaling Design Systems

## The Scaling Challenge

A design system that works for 1 team and 5 components **will break** at 10 teams and 200 components — unless you plan for scale from the start.

Scaling challenges:
- **Governance** — who decides what goes into the system?
- **Versioning** — how do teams adopt updates without breaking their apps?
- **Contribution** — how do product teams contribute components back?
- **Consistency** — how do you prevent drift across dozens of consumers?

---

## Architecture Patterns

### 1. Monorepo (Single Repository)

All design system packages live in one repository:

```
design-system/
├── packages/
│   ├── tokens/          # @acme/tokens
│   ├── core/            # @acme/core (Button, Card, Input...)
│   ├── icons/           # @acme/icons
│   ├── charts/          # @acme/charts
│   └── utils/           # @acme/utils
├── docs/                # Storybook + documentation site
├── lerna.json           # or turborepo.json / nx.json
└── package.json
```

**Tools:** Turborepo, Nx, Lerna, pnpm workspaces.

**Pros:**
- Atomic commits across packages (update tokens + components together)
- Shared tooling (linting, testing, building)
- Easy cross-package refactoring

**Cons:**
- CI/CD complexity grows with repo size
- Everyone's changes are in one place (merge conflicts)

**Used by:** MUI, Chakra UI, Adobe Spectrum, Ant Design.

### 2. Multi-Repo (Separate Repositories)

Each package gets its own repository:

```
github.com/acme/tokens     →  @acme/tokens
github.com/acme/core       →  @acme/core
github.com/acme/icons      →  @acme/icons
```

**Pros:** Independent release cycles, clear ownership boundaries.
**Cons:** Cross-package changes require coordinated PRs, version conflicts.

### Recommendation

**Start with a monorepo.** Split into multi-repo only when team size and release cadence demand it. Most design systems under 500 components work well in a monorepo.

---

## Versioning Strategy

### Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH
  │     │     └── Bug fixes, no API changes
  │     └──────── New features, backward compatible
  └────────────── Breaking changes
```

**Design system specifics:**

| Change Type | SemVer | Example |
|---|---|---|
| New component added | MINOR | Added `<Tooltip>` component |
| New prop on existing component | MINOR | Added `size="xs"` to `<Button>` |
| Token value changed | PATCH | `--color-action-primary: #2196F3 → #1976D2` |
| Token renamed | MAJOR | `--color-primary → --color-action-primary` |
| Prop renamed | MAJOR | `isOpen → open` |
| Component removed | MAJOR | Removed `<DeprecatedModal>` |
| Default variant changed | MAJOR | Button default `variant` changed from `secondary` to `primary` |

### Deprecation Process

Never remove without warning. The standard process:

```
v3.2.0 — Component works normally
v3.3.0 — Console warning: "<OldModal> is deprecated, use <Dialog> instead"
v3.4.0 — Documentation marks it as "deprecated"
v4.0.0 — Component removed (MAJOR version)
```

**Rule of thumb:** Give consumers at least 2 minor versions of deprecation warnings before removing in a major.

---

## Contribution Models

### 1. Centralized (Core Team Owns Everything)

A dedicated design system team builds and maintains all components.

**Pros:** High quality, consistent API, clear ownership.
**Cons:** Bottleneck — product teams wait for the DS team.

### 2. Federated (Shared Ownership)

Product teams contribute components; the DS team reviews and standardizes.

```
Product Team A builds <DataTable>
  → Submits PR to design system repo
  → DS team reviews for API consistency, accessibility, token usage
  → Merged and published
```

**Pros:** Faster throughput, broader ownership.
**Cons:** Requires clear contribution guidelines and review standards.

### 3. Hybrid (Most Common)

- **Core components** (Button, Input, Modal) — owned by DS team
- **Domain components** (DataTable, Chart, Map) — contributed by product teams with DS team review

---

## Documentation at Scale

### Component Documentation Checklist

Every component in the system should have:

- [ ] **Description** — what it is and when to use it
- [ ] **Props/API table** — every prop with type, default, and description
- [ ] **Variants gallery** — visual preview of all variants
- [ ] **States** — default, hover, active, focus, disabled, error, loading
- [ ] **Do/Don't examples** — correct vs incorrect usage
- [ ] **Accessibility notes** — keyboard, screen reader, ARIA
- [ ] **Design tokens used** — which tokens the component references
- [ ] **Figma link** — link to the Figma component
- [ ] **Changelog** — version history of changes

### Tools for Documentation

| Tool | Strength |
|---|---|
| **Storybook** | Interactive component playground + auto docs |
| **Docusaurus** | Long-form documentation site |
| **zeroheight** | Design system documentation (Figma integration) |
| **Supernova** | Design-to-docs automation |

---

## Common Scaling Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| No versioning | Teams can't pin to stable versions | Use SemVer from day 1 |
| Breaking changes without migration guide | Teams refuse to update | Write codemods or migration scripts |
| No contribution guidelines | Product teams build one-off components | Define clear contribution process |
| Documentation lives separately from code | Docs drift out of sync | Co-locate docs with components (Storybook) |
| Testing only visually | Regressions ship silently | Add unit tests, visual regression tests, accessibility tests |

---

## Key References

- [Turborepo Documentation](https://turbo.build/repo)
- [SemVer Specification](https://semver.org/)
- [Brad Frost: Managing Design Systems](https://atomicdesign.bradfrost.com/chapter-5/)
- [Nathan Curtis: Releasing Design Systems](https://medium.com/eightshapes-llc/releasing-design-systems-57fca91a23f6)
- [Storybook: Component-Driven Development](https://storybook.js.org/)
