// Fixture for tests/error-logging.test.ts (pg-boss driver keeps values out of worker error logs).
import { PgBoss } from 'pg-boss';
import { logError } from '@aihot/backend/lib/log-error';
const boss = new PgBoss({connectionString:process.env.DATABASE_URL});
await boss.start();
try {
  await boss.getDb().executeSql('SELECT $1::integer', ["synthetic-private-person@example.test"]);
} catch (error) {
  console.log(JSON.stringify(logError(error)));
} finally {await boss.stop({graceful:false});}
