import { app } from "./app.js";
import { seedDatabase } from "./database/migrations.js";

const port = process.env.PORT ?? 8000;

await seedDatabase();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
