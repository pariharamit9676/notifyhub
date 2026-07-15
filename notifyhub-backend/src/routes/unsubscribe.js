import express from 'express';
import Unsubscribe from '../models/Unsubscribe.js';

const router = express.Router();

// GET /api/unsubscribe?email=user@example.com
router.get('/', async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).send('Email is required');
        }

        // Add to Unsubscribe collection if not already there
        await Unsubscribe.findOneAndUpdate(
            { email: email.toLowerCase() },
            { email: email.toLowerCase() },
            { upsert: true, new: true }
        );

        res.send(`
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f9fafb; margin: 0; }
                        .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                        h1 { color: #111827; }
                        p { color: #4b5563; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Unsubscribed Successfully</h1>
                        <p>You will no longer receive marketing emails at <strong>${email}</strong>.</p>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).send('An error occurred. Please try again.');
    }
});

export default router;
