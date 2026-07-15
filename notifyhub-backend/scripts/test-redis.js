import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const client = new Redis(process.env.REDIS_URL);

client.on('error', (err) => {
    console.error('Redis connection failed:', err);
    process.exit(1);
});

client.on('connect', () => {
    console.log('Connected to Redis successfully');
    process.exit(0);
});
