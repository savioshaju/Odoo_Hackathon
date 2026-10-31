import { config } from './config.js';
import { db } from './db.js';
import { createApp } from './app.js';

const app = createApp({ db });
const server = app.listen(config.port, () => {
  console.log(`LoopLedger server on http://localhost:${config.port}  (database: ${db.name})`);
});

async function shutdown() {
  server.close();
  await db.end();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
