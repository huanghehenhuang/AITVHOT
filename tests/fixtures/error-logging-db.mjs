// Fixture for tests/error-logging.test.ts (database values must not enter the log).
import { buildApp } from "../../apps/api/src/app.ts";
import { sql, closeDb } from "@aihot/backend/db";
const marker = "synthetic-private-person@example.test";
const app = await buildApp();
for (const kind of ['unique', 'input']) {
  try {
    await sql.begin(async tx => {
      if (kind === 'input') return tx`SELECT ${marker}::integer`;
      await tx`INSERT INTO admin_users(email,display_name) VALUES (${marker},'Synthetic')`;
      await tx`INSERT INTO admin_users(email,display_name) VALUES (${marker},'Synthetic')`;
    });
  } catch (error) {
    app.log.error({err:error}, 'database-boundary');
    app.log.error({err:new Error('database operation failed', {cause:error})}, 'nested-database-boundary');
  }
}
await app.close(); await closeDb();
