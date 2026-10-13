// Fixture child for tests/analyze-shutdown.test.ts: runs one queue's content jobs and shuts down
// gracefully on SIGTERM, reporting readiness and shutdown over the spawn IPC channel. The queue
// name arrives via TEST_ANALYZE_QUEUE.
import { getBoss, stopBoss, shutdownSignal, QUEUES } from "@aihot/backend/jobs/queue";
import { registerContentJobs } from "@aihot/backend/jobs/content";
import { closeDb } from "@aihot/backend/db";
QUEUES.analyze = process.env.TEST_ANALYZE_QUEUE;
let stopping = false;
process.on("SIGTERM", async () => {
  if (stopping) return;
  stopping = true;
  shutdownSignal.abort();
  process.send({ stopping: true });
  await stopBoss();
  await closeDb();
  process.disconnect();
});
await registerContentJobs(await getBoss());
process.send({ ready: true });
