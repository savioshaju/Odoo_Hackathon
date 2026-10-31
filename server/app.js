import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createApp } from './src/app.js';
import { db } from './src/db.js';

dotenv.config();

export * from './src/app.js';

// If executed directly (e.g., node app.js or nodemon app.js)
const isMainModule = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('app.js')
);

if (isMainModule) {
  const app = createApp({ db });
  app.use(cors());
  const port = process.env.PORT || 4000;
  app.listen(port, (err) => {
    if (err) {
      console.log('err :>> ', err);
    } else {
      console.log('Server running at port', port);
    }
  });
}
