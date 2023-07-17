import { Sequelize } from 'sequelize';
import { createClient } from 'redis';

export const databaseClient = () => new Sequelize(process.env.DATABASE_URL || 'postgres://postgres@localhost/synvert_development');

export const redisClient = () => createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
