// Fixture child for tests/translate-shutdown.test.ts: runs one translatePending call, reports the
// result over the spawn IPC channel, and acknowledges SIGTERM before finishing.
import { translatePending } from "@aihot/backend/editorial/translate";
import { shutdownSignal } from "@aihot/backend/jobs/queue";
import { closeDb } from "@aihot/backend/db";
process.on("SIGTERM", () => { shutdownSignal.abort(); process.send({ stopped: true }); });
try { process.send({ result: await translatePending({ limit: 1 }) }); }
finally { await closeDb(); process.disconnect(); }
