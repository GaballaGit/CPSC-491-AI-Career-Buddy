This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file.

This project uses
[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load [Geist](https://vercel.com/font), a new font
family for Vercel.

## Checks and shared code

Run `npm test`, `npm run lint`, and `npm run build` before committing.
`tests/careerProfileForm.test.mjs` uses Node's built-in test runner and TypeScript
stripping (Node 22.6+; CI uses Node 24), without another test dependency. These
are pure form tests, not browser or live-backend tests.

Shared profile form state, options, and validation live in
`lib/careerProfileForm.ts`. Resume response contracts and client operations live
in `lib/resume.ts`. Route files own their UI state and rendering.

For the actual Cloudflare deployment and backend configuration, see
[deployment.md](../../docs/deployment.md) and
[architecture.md](../../docs/architecture.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.
