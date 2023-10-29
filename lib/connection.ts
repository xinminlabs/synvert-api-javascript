import { createClient } from 'redis';

export const redisClient = () => {
  return createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
}
