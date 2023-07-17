import { Sequelize } from 'sequelize';
import { createClient } from 'redis';

export const databaseClient = () => {
  console.log(process.env.DATABASE_URL || 'postgres://postgres@localhost/synvert_development');
  return new Sequelize(process.env.DATABASE_URL || 'postgres://postgres@localhost/synvert_development');
}

export const redisClient = () => {
  console.log({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  return createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
}
