import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from './src/models/Template.js';
import User from './src/models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const templates = [
  {
    name: 'SaaS Welcome Email',
    channel: 'email',
    description: 'A professional welcome email for new user signups.',
    subject: 'Welcome to NotifyHub, {{first_name}}! 🚀',
    variables: ['first_name'],
    body: `Hi {{first_name}},

Welcome to NotifyHub! We're thrilled to have you on board.

NotifyHub is designed to help you send reliable emails, SMS, and push notifications at scale without the headache. To get started, we recommend exploring our API Documentation and setting up your first integration.

If you have any questions or need help configuring your account, our support team is just a reply away.

Best regards,
The NotifyHub Team
https://notifyhub.app`
  },
  {
    name: 'Payment Receipt / Invoice',
    channel: 'email',
    description: 'Standard billing receipt with transaction details.',
    subject: 'Invoice #{{invoice_id}} from {{company_name}}',
    variables: ['first_name', 'invoice_id', 'amount', 'date', 'company_name'],
    body: `Hello {{first_name}},

This is a confirmation that we've successfully processed your recent payment.

Invoice Details:
----------------------------------
Invoice Number: {{invoice_id}}
Amount Paid: $\{{amount}}
Date: {{date}}
----------------------------------

You can view and download your full PDF receipt anytime from your billing dashboard.

Thank you for your continued business!

Warm regards,
{{company_name}} Billing Dept.`
  },
  {
    name: 'Password Reset Request',
    channel: 'email',
    description: 'Security email for account recovery.',
    subject: 'Action Required: Password Reset for your Account',
    variables: ['first_name', 'expiry_time', 'reset_link'],
    body: `Hi {{first_name}},

We received a request to reset the password for the account associated with this email address.

Please use the secure link below to choose a new password. For your security, this link will expire in {{expiry_time}} minutes.

{{reset_link}}

If you did not request a password reset, please ignore this email. Your account remains secure.

Stay secure,
The Security Team`
  },
  {
    name: 'Scheduled Maintenance Notice',
    channel: 'email',
    description: 'Infrastructure update notification for customers.',
    subject: 'Scheduled Maintenance: {{service_name}}',
    variables: ['customer_name', 'service_name', 'maintenance_date', 'maintenance_time', 'duration_hours'],
    body: `Dear {{customer_name}},

We are writing to inform you of a scheduled maintenance window for {{service_name}}.

When: {{maintenance_date}} at {{maintenance_time}}
Duration: Approximately {{duration_hours}} hours

During this time, you may experience brief interruptions in service as we upgrade our infrastructure to improve database performance and reliability.

We apologize for any inconvenience this may cause and appreciate your patience as we make these improvements.

Best,
The Infrastructure Team`
  }
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne();
    if (!user) {
      console.error('❌ No user found in database. Create a user first.');
      process.exit(1);
    }

    // Delete existing old basic templates if any
    await Template.deleteMany({});
    console.log('🗑️  Cleared existing templates');

    // Add user ID to templates
    const templatesWithUser = templates.map(t => ({ ...t, user: user._id }));

    // Insert new ones
    await Template.insertMany(templatesWithUser);
    console.log('🎉 Successfully seeded 4 realistic email templates!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();
