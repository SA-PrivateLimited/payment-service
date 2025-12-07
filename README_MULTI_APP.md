# Multi-App Payment Service - Complete Guide

## 🎯 Overview

The payment-service is now **fully multi-app compatible**! It can handle payments for multiple applications, each with their own:
- Notification providers (OneSignal, FCM, custom endpoints)
- Firebase configurations
- Order/consultation update logic
- Test mode behavior

## 🏗️ Architecture

```
payment-service/
├── server.js                    # Main server (app-agnostic)
├── config/
│   ├── apps.example.js         # Example configurations
│   └── apps.js                 # Your app configs (create this)
├── src/
│   ├── app-config/             # App configuration manager
│   │   └── index.js
│   ├── notifications/          # Multi-provider notification service
│   │   └── index.js
│   └── order-update/           # Order/consultation update service
│       └── index.js
└── ...
```

## 🚀 Quick Start

### Step 1: Create App Configuration

```bash
cp config/apps.example.js config/apps.js
```

### Step 2: Configure Your Apps

Edit `config/apps.js`:

```javascript
module.exports = {
  // MediFind (existing)
  medifind: {
    name: 'MediFind',
    notifications: {
      enabled: true,
      provider: 'onesignal',
      onesignal: {
        appId: 'b0020b77-3e0c-43c5-b92e-912b1cec1623',
        restApiKey: process.env.ONESIGNAL_REST_API_KEY,
      },
    },
    orderUpdate: {
      enabled: true,
      useFirebase: true,
      collections: {
        consultations: 'consultations',
        payments: 'payments',
        users: 'users',
      },
    },
    testMode: {
      autoDetect: true,
      bookOnPaymentFailure: true,
    },
  },

  // Your New App
  myapp: {
    name: 'My App',
    notifications: {
      enabled: true,
      provider: 'custom',
      customEndpoint: 'https://myapp.com/api/notifications',
    },
    orderUpdate: {
      enabled: true,
      useFirebase: false,
      endpoint: 'https://myapp.com/api/orders/update',
    },
    testMode: {
      autoDetect: true,
      bookOnPaymentFailure: false,
    },
  },
};
```

### Step 3: Use in Your App

#### Option 1: Header (Recommended)
```javascript
fetch('http://payment-service:3001/api/payment/create-order', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-App-ID': 'myapp',  // App identifier
  },
  body: JSON.stringify({
    amount: 50000,
    notes: {
      consultationId: 'order123',
    },
  }),
});
```

#### Option 2: Query Parameter
```javascript
fetch('http://payment-service:3001/api/payment/create-order?appId=myapp', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({amount: 50000}),
});
```

#### Option 3: Notes (Auto-detect)
```javascript
fetch('http://payment-service:3001/api/payment/create-order', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    amount: 50000,
    notes: {
      appId: 'myapp',  // Auto-detected
      consultationId: 'order123',
    },
  }),
});
```

## 📋 Features

### ✅ Multi-App Support
- Each app has its own configuration
- App identified via header, query param, or notes
- Backward compatible (works without app ID)

### ✅ Flexible Notifications
- **OneSignal** - Push notifications via OneSignal
- **Custom Endpoint** - POST to your own endpoint
- **FCM** - Coming soon
- **Disabled** - Turn off notifications

### ✅ Flexible Order Updates
- **Firebase** - Update Firestore or Realtime Database
- **Custom Endpoint** - PATCH to your endpoint
- **Disabled** - Skip updates

### ✅ Test Mode Handling
- Auto-detect from Razorpay keys
- Book consultations even if payment fails (configurable)
- App-specific test mode behavior

## 🔧 Configuration Options

### Notification Providers

#### OneSignal
```javascript
notifications: {
  provider: 'onesignal',
  onesignal: {
    appId: 'your-app-id',
    restApiKey: 'your-rest-api-key',
  },
}
```

#### Custom Endpoint
```javascript
notifications: {
  provider: 'custom',
  customEndpoint: 'https://your-app.com/api/notifications',
}
```

Your endpoint will receive:
```json
{
  "userIds": ["user1", "user2"],
  "title": "Payment Successful",
  "body": "...",
  "data": {
    "type": "payment_success",
    "consultationId": "...",
    "paymentId": "...",
    "amount": 50000,
    ...
  }
}
```

### Order Update Methods

#### Firebase
```javascript
orderUpdate: {
  useFirebase: true,
  collections: {
    orders: 'orders',
    consultations: 'bookings',  // Your custom name
  },
}
```

#### Custom Endpoint
```javascript
orderUpdate: {
  useFirebase: false,
  endpoint: 'https://your-app.com/api/orders/update',
}
```

Your endpoint will receive:
```
PATCH /api/orders/update/{orderId}
Body: {
  paymentStatus: 'paid',
  paymentId: 'pay_xxx',
  paidAt: timestamp,
  updatedAt: timestamp,
}
```

## 📝 API Usage Examples

### Create Order

```bash
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "X-App-ID: myapp" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "notes": {
      "consultationId": "order123",
      "description": "Order description"
    }
  }'
```

### Verify Payment

```bash
curl -X POST http://localhost:3001/api/payment/verify \
  -H "Content-Type: application/json" \
  -H "X-App-ID: myapp" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx",
    "consultationId": "order123",
    "amount": 50000
  }'
```

## 🔄 Backward Compatibility

**Existing MediFind integration continues to work!**

- If no app ID is provided, uses default config
- MediFind can continue using existing API calls
- No breaking changes

## 🧪 Testing

### Test with App ID
```bash
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "X-App-ID: myapp" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "notes": {"consultationId": "test123"}}'
```

### Test without App ID (Uses Default)
```bash
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "notes": {"consultationId": "test123"}}'
```

## 📚 Documentation

- `MULTI_APP_SETUP.md` - Detailed setup guide
- `config/apps.example.js` - Example configurations
- `src/` - Modular service implementations

## ✨ Benefits

✅ **One Server, Multiple Apps** - Share payment infrastructure
✅ **App-Specific Config** - Each app has its own settings
✅ **Easy to Extend** - Add new apps easily
✅ **Backward Compatible** - Existing integrations work
✅ **Flexible** - Choose notification/update methods per app

---

**The payment-service is now ready for multiple apps!** 🎉

