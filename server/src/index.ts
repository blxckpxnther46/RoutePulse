import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const port = process.env.PORT || 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`[RoutePulse Server] Optimization engine and API running on http://localhost:${port}`);
  console.log(`[RoutePulse Server] Health check available at http://localhost:${port}/api/health`);
});
