import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

async function start() {
  try {
    const connected = await connectDatabase();
    console.log(`PowerCycle database ${connected ? 'connected' : 'not configured'}`);
  } catch (error) {
    console.error('PowerCycle database connection failed:', error instanceof Error ? error.message : 'unknown error');
  }
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`PowerCycle API listening on port ${env.PORT}`);
  });
}

void start();
