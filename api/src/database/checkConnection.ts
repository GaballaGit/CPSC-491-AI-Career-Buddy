/** CLI entry point: npm run db:check */
import { checkDatabaseConnection } from "./health.js";

const result = await checkDatabaseConnection();
console.log(
  result.connected ? `OK  ${result.message}` : `FAIL  ${result.message}`,
);
process.exit(result.connected ? 0 : 1);
