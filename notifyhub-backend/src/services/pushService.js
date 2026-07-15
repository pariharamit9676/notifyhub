import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

let isFirebaseInitialized = false;
let hasFirebaseConfig = false;

const initFirebase = () => {
    if (isFirebaseInitialized) return;
    isFirebaseInitialized = true;
    
    hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL;

    if (hasFirebaseConfig) {
        try {
            initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
                })
            });
            console.log('🔥 Firebase Admin initialized successfully.');
        } catch (error) {
            console.error('❌ Failed to initialize Firebase Admin:', error);
        }
    } else {
        console.log('⚠️  Firebase Admin credentials not found in .env. Running Push Notifications in SIMULATION MODE.');
    }
};

/**
 * Send a Push Notification
 * @param {string} token - FCM Device Token (Recipient)
 * @param {string} title - Notification Title
 * @param {string} body - Notification Body
 * @param {string} logId - Optional database NotificationLog ID for webhook tracking
 */
export const sendPushNotification = async ({ token, title, body, logId }) => {
    try {
        initFirebase();
        
        // Simulation Mode (for local testing without credentials)
        if (!hasFirebaseConfig) {
            console.log(`\n[SIMULATION] 📱 Sending Push Notification to token: ${token}`);
            console.log(`[SIMULATION] 🔔 Title: ${title}`);
            console.log(`[SIMULATION] 📄 Body: ${body}\n`);
            
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const mockMessageId = `sim_push_${Date.now()}`;
            console.log(`✅ [SIMULATION] Push Notification delivered: ${mockMessageId}`);
            return { success: true, messageId: mockMessageId };
        }

        // Production Mode (Actual FCM send)
        const message = {
            notification: {
                title,
                body
            },
            token: token,
            data: {
                logId: logId ? logId.toString() : ''
            }
        };

        const response = await getMessaging().send(message);
        console.log(`✅ Push Notification delivered via FCM: ${response}`);
        
        return { success: true, messageId: response };
    } catch (error) {
        console.error('❌ Error sending Push Notification:', error.message);
        throw new Error(`Failed to send push notification: ${error.message}`);
    }
};

export default { sendPushNotification };
