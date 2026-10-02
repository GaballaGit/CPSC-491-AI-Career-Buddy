# Career Buddy UI Design Standard

This document defines the shared UI rules for Sprint 2 frontend work. It is based on the existing landing-page visual style and should be used by subsystem owners when updating pages.

## Design tokens

Shared colors are defined in `site/career-buddy-site/app/globals.css`:

- `background` - page background
- `foreground` - primary text and primary actions
- `muted` - secondary text
- `accent` - emphasized labels and interactive accents
- `line` - borders and dividers
- `card` - panel and card backgrounds

Tailwind theme mappings expose these tokens through classes such as:

- `bg-background`
- `bg-foreground`
- `bg-card`
- `text-foreground`
- `text-background`
- `text-muted`
- `text-accent`
- `border-line`

Do not introduce unrelated page-specific color systems when an existing token satisfies the need.

## Page layout

- Use a centered content container.
- Standard maximum width for primary application pages is `max-w-6xl`.
- Use approximately `px-6 py-12` for standard page spacing.
- Keep major sections visually separated with consistent vertical spacing.

## Headings

- Use `PageHeader` for standard application page titles where practical.
- Page headings should use `text-foreground`.
- Supporting descriptions should use `text-muted`.
- Eyebrow or section labels should use `text-accent`.

## Buttons

Use the shared `Button` component from `components/ui/Button.tsx`.

- Primary actions use `bg-foreground text-background`.
- Secondary actions use a bordered `bg-card` treatment.
- Keep button labels short and action-oriented.
- Do not duplicate button class strings when the shared component can be used.

## Cards and panels

Use the shared `Card` component from `components/ui/Card.tsx` where practical.

Standard cards use:

- `bg-card`
- `border-line`
- rounded corners
- consistent internal padding

Cards should group related information or actions and should not be used only for decoration.

## Form controls

Form controls should:

- use readable foreground text
- use `border-line` for borders
- use `bg-card` or `bg-background`
- include visible labels
- maintain usable focus states
- remain usable at mobile widths

## Loading, error, and empty states

Use concise, direct messages.

The shared `StateMessage` primitive is available for standalone states.

Examples:

- Loading: describe what is loading.
- Error: state what could not be loaded without exposing internal errors.
- Empty: explain what is missing and provide a useful next action when possible.

## Responsive behavior

- Navigation must remain usable at mobile widths.
- Avoid fixed widths that cause horizontal page overflow.
- Grids should collapse naturally using responsive Tailwind breakpoints.
- Controls and navigation items must remain readable and reachable on small screens.

## Shared primitives

Current shared primitives:

- `Button`
- `Card`
- `PageHeader`
- `StateMessage`

The shared application shell is implemented in `components/AppShell.tsx`.

Subsystem owners should prefer these components when touching pages during Sprint 2, but this ticket does not require redesigning every existing page.
