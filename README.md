# NotifyHub 🚀

A scalable, multi-channel notification infrastructure platform designed to manage and deliver messages across Email, SMS, and Push Notifications. 

Built with a focus on reliability and high throughput, NotifyHub uses a queue-based architecture to handle bulk notifications without overwhelming third-party providers.

## ✨ Features

- **Multi-Channel Delivery:** Send notifications via Email (SendGrid/MailBluster), SMS (Twilio), and Push Notifications (Firebase).
- **Template Management:** Create, edit, and manage HTML/Text templates with dynamic variables (e.g., `{{name}}`).
- **Queue System:** BullMQ & Redis integration for reliable background job processing and retries.
- **Circuit Breaker Pattern:** Built-in failover mechanisms for API limits and downtimes.
- **Real-Time Analytics:** Track "Sent," "Queued," "Delivered," and "Failed" metrics.
- **Dynamic Settings:** Manage API Keys and User Profiles directly from the dashboard.

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- TypeScript
- Tailwind CSS
- Recharts (for Analytics)

**Backend:**
- Node.js & Express.js
- MongoDB (Mongoose)
- Redis & BullMQ (Message Queues)
- Socket.IO (Real-time events)
- JSON Web Tokens (JWT Auth)

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB instance (Local or Atlas)
- Redis instance (Local or Upstash)

### 1. Backend Setup
```bash
cd notifyhub-backend
npm install
```
Create a `.env` file in `notifyhub-backend` based on the required keys:
```env
PORT=5001
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
EMAIL_FROM=your_sender_email
```
Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd notifyhub
npm install
```
Create a `.env` file in `notifyhub`:
```env
VITE_API_URL=http://localhost:5001/api
```
Start the frontend:
```bash
npm run dev
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
