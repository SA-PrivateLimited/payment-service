# Payment Service - Multi-App Payment Gateway

A reusable Razorpay payment server that supports multiple applications with app-specific configurations.

## 🎯 Current Status

**✅ Configured for MediFind** - Ready to use immediately  
**✅ Multi-app ready** - Other apps can be added later

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# Firebase (for payment-service)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# OneSignal (for MediFind notifications)
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key

# Server
PORT=3001
```

### 3. Start Server

```bash
npm start
```

## 📋 Features

- ✅ **Payment Order Creation** - Create Razorpay orders
- ✅ **Payment Verification** - Verify payment signatures
- ✅ **QR Code Generation** - Generate UPI QR codes
- ✅ **Webhook Handling** - Handle Razorpay webhooks
- ✅ **Multi-App Support** - Configure different apps
- ✅ **Notifications** - Send notifications (OneSignal, custom endpoints)
- ✅ **Firebase Integration** - Update orders/consultations
- ✅ **Test Mode** - Handle test payments gracefully

## 🏗️ Architecture

```
payment-service/
├── server.js                 # Main server
├── config/
│   ├── apps.example.js      # Example configurations
│   └── apps.js              # Your app configs (MediFind configured)
├── src/
│   ├── app-config/          # App configuration manager
│   ├── notifications/       # Notification service
│   └── order-update/        # Order update service
└── ...
```

## 📖 Documentation

- **[MEDIFIND_SETUP.md](./MEDIFIND_SETUP.md)** - MediFind-specific setup guide
- **[MULTI_APP_SETUP.md](./MULTI_APP_SETUP.md)** - Multi-app configuration guide
- **[README_MULTI_APP.md](./README_MULTI_APP.md)** - Complete multi-app documentation

## 🔧 MediFind Integration

MediFind is configured as the default app. No app ID needed!

### Create Order

```javascript
POST /api/payment/create-order
Content-Type: application/json

{
    "amount": 50000,
    "currency": "INR",
  "notes": {
    "consultationId": "consultation123"
  }
}
```

### Verify Payment

```javascript
POST /api/payment/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "consultationId": "consultation123",
  "amount": 50000
}
```

## 🔔 Notifications

When payment succeeds or fails, notifications are sent to:
- Patient (`consultation.patientId`)
- Doctor (`consultation.doctorId`)
- Admins (all users with `role: 'admin'`)

## 🧪 Test Mode

- Auto-detects test mode from Razorpay keys (`rzp_test_*`)
- Books consultations even if payment fails
- Sends notifications about payment status

## ➕ Adding Other Apps Later

1. Edit `config/apps.js`
2. Add new app configuration
3. Use app ID in requests (header, query, or notes)

**MediFind continues working** - no changes needed!

## 📝 API Endpoints

- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment signature
- `POST /api/payment/qr-code` - Generate QR code
- `GET /api/payment/qr-code/:qrCodeId` - Get QR code details
- `POST /api/payment/webhook` - Razorpay webhook handler
- `GET /health` - Health check

## 🔒 Security

- Payment signature verification
- Webhook signature verification
- CORS configuration
- Environment variable protection

## 📦 Deployment

Deploy to:
- Railway.app
- Render.com
- Fly.io
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

## 📄 License

MIT

---

**MediFind is configured and ready to use!** 🎉
