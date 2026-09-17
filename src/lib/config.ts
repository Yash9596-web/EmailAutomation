import { z } from 'zod';

const ConfigSchema = z.object({
  env: z.enum(['development', 'production', 'test']),
  port: z.number().int().positive(),
  databaseUrl: z.string().min(1),
  jwtSecret: z.string().min(32, 'JWT_SECRET must be at least 32 characters in production'),
  encryptionKey: z.string().optional(),
  appUrl: z.string().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

function validateEnv(): Config {
  const env = (process.env.NODE_ENV || 'development') as string;
  const isProduction = env === 'production';
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  // CRITICAL: At runtime in production, refuse to start with placeholder secrets.
  // During build phase, Next.js sets NODE_ENV=production but secrets aren't needed yet.
  if (isProduction && !isBuildPhase) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('placeholder')) {
      throw new Error('FATAL: JWT_SECRET must be set to a strong secret in production. Do NOT use placeholder values.');
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('FATAL: DATABASE_URL must be configured in production.');
    }
  }

  const raw = {
    env,
    port: parseInt(process.env.PORT || '3000', 10),
    databaseUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/email_automation_dev',
    jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-min-32-chars-long',
    encryptionKey: process.env.ENCRYPTION_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };

  return ConfigSchema.parse(raw);
}

export const config = validateEnv();
