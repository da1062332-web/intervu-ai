const Redis = require('ioredis');

const redis = new Redis('redis://localhost:6379');
redis.flushall().then(() => {
  console.log('Redis cache flushed successfully');
  process.exit(0);
}).catch(err => {
  console.error('Failed to flush Redis cache', err);
  process.exit(1);
});
