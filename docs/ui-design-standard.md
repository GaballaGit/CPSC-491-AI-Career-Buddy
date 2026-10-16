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

Status tokens (C40CS-64) cover feedback states:

- `accent-soft` - skill and tag pills (`bg-accent-soft text-accent`), selected states
- `success`, `success-soft`, `success-line` - saved/matched messages and matched skills
- `warning-soft`, `warning-line` - prompts and notices
- `danger`, `danger-soft`, `danger-line` - errors, error boxes and missing skills

Do not introduce unrelated page-specific color systems when an existing token satisfies the need. Raw Tailwind palette colors (`zinc`, `black`, `white`, `red`, `indigo`, ...) are not used; map them to a token instead.

## Look and feel

Every page should look like the landing page (`app/page.tsx`):

- Font: Geist (`--font-geist-sans`, applied to `body` in `globals.css`). Do not set other font families.
- Light only. Do not add `dark:` variants; the tokens have no dark-mode values, so mixing them with `dark:` classes produces black panels inside the light shell.
- Off-white `background` page, white `card` panels with a `border-line` border and large rounded corners (`rounded-2xl`), no drop shadows.
- Buttons are rounded pills (`rounded-full`).
- Eyebrow labels: `text-xs font-bold uppercase tracking-[0.14em] text-accent`.
- App page titles use the `PageHeader` size (`text-3xl font-semibold tracking-tight`); the oversized hero heading is for the landing page only.
- Inputs: `border-line`, `bg-card`, `focus:border-accent`.

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
- maintain usable focus states (`focus:border-accent`)
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
