import { configDotenv } from 'dotenv';
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

configDotenv({ path: '.env.local' });

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema/index.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});