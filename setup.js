const fs = require('fs');
const path = require('path');

const basePath = 'd:/webchat/notifyhub-backend';

const directories = [
  'src/config',
  'src/models',
  'src/services',
  'src/queues',
  'src/middleware',
  'src/routes',
  'src/utils'
];

const files = [
  '.env',
  'package.json',
  'docker-compose.yml',
  'src/app.js',
  'src/config/database.js',
  'src/config/redis.js',
  'src/config/providers.js',
  'src/config/constants.js',
  'src/models/User.js',
  'src/models/Template.js',
  'src/models/Notification.js',
  'src/models/RateLimit.js',
  'src/services/authService.js',
  'src/services/templateService.js',
  'src/services/notificationService.js',
  'src/services/rateLimitService.js',
  'src/services/emailService.js',
  'src/services/smsService.js',
  'src/services/pushService.js',
  'src/services/analyticsService.js',
  'src/queues/notificationQueue.js',
  'src/queues/worker.js',
  'src/middleware/auth.js',
  'src/middleware/rateLimiter.js',
  'src/routes/auth.js',
  'src/routes/notifications.js',
  'src/routes/templates.js',
  'src/routes/analytics.js',
  'src/routes/settings.js',
  'src/routes/webhooks.js',
  'src/utils/logger.js',
  'src/utils/validators.js',
  'src/utils/helpers.js'
];

directories.forEach(dir => {
  fs.mkdirSync(path.join(basePath, dir), { recursive: true });
});

files.forEach(file => {
  if (!fs.existsSync(path.join(basePath, file))) {
      fs.writeFileSync(path.join(basePath, file), '');
  }
});

fs.writeFileSync(path.join(basePath, 'package.json'), JSON.stringify({
  name: "notifyhub-backend",
  version: "1.0.0",
  description: "Backend for NotifyHub",
  main: "src/app.js",
  type: "module",
  scripts: {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js"
  },
  dependencies: {
    "express": "^4.19.2",
    "mongoose": "^8.4.3",
    "dotenv": "^16.4.5",
    "cors": "^2.8.5"
  },
  devDependencies: {
    "nodemon": "^3.1.4"
  }
}, null, 2));

console.log('Done!');
