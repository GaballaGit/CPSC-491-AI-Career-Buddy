# Frontend testing strategy

Run all frontend tests with `npm test`. This runs the existing Node tests first, then the React component suite in Vitest; CI uses the same command.

## Adding component tests

- Put component tests under `tests/` with a `.test.tsx` suffix. Vitest runs them in jsdom with React Testing Library and jest-dom matchers.
- Mock `lib/*` modules when a component would otherwise call APIs, auth, or other external services. Keep the mock at the module boundary and return realistic data.
- Assert user-visible behavior through accessible roles, labels, and text. Cover meaningful success, loading, empty, error, and signed-out states; include optional/missing data and long collections when relevant. Avoid snapshots and implementation details such as hook state or internal class structure unless the class is part of the component contract.
- Clean up rendered components after each test and reset mocks so tests stay independent.

For example, mock `../lib/jobs` in `tests/job-detail.test.tsx` to isolate `JobDetail` from Supabase and verify its rendered states.
