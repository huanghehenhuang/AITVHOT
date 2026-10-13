// Fixture child for tests/analyze-kill.test.ts: runs one article's processing and reports the
// outcome over the spawn IPC channel. The article id arrives via TEST_ARTICLE_ID.
import { processArticle } from "@aihot/backend/jobs/content";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { closeDb } from "@aihot/backend/db";
try {
  process.send({ result: await processArticle(process.env.TEST_ARTICLE_ID) });
} catch (error) {
  process.send({ error: { name: error.constructor.name, message: error.message } });
} finally {
  await stopBoss();
  await closeDb();
  process.disconnect();
}
