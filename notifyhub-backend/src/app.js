import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initSocket } from './config/socket.js';

// Load environment variables FIRST
dotenv.config();

// Connect to Database
import connectDB from './config/database.js';

// Routes
import authRoutes from './routes/auth.js';
import notificationRoutes from './routes/notifications.js';
import templateRoutes from './routes/templates.js';
import logRoutes from './routes/logs.js';
import webhookRoutes from './routes/webhooks.js';
import queueRoutes from './routes/queueApi.js';
import unsubscribeRoutes from './routes/unsubscribe.js';
import settingsRoutes from './routes/settings.js';

// Initialize background workers
import './queues/worker.js';
import './queues/pushWorker.js';

connectDB();

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO
initSocket(httpServer);

app.use(cors());
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();
    }
}));

// Apply global rate limiting to all requests
import { apiLimiter } from './middleware/rateLimiter.js';
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/unsubscribe', unsubscribeRoutes);
app.use('/api/settings', settingsRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'NotifyHub backend is running' });
});

// Basic Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`WebSocket server is active`);
});

export default app;
