import { Sequelize } from 'sequelize';
import { createClient } from 'redis';

const DATABASE_CLIENT = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres@localhost/synvert_development');
const REDIS_CLIENT = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

export const databaseClient = () => DATABASE_CLIENT;

export const redisClient = () => REDIS_CLIENT;
