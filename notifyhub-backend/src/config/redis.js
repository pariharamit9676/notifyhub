import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

export const createRedisConnection = () => {
  const conn = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    family: 0 // Auto-detect IPv4/IPv6 (Required for IPv6 networks like Jio NAT64)
  });

  conn.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err.message);
  });

  return conn;
};

// Default connection for general use
const redisConnection = createRedisConnection();

redisConnection.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});

export default redisConnection;
