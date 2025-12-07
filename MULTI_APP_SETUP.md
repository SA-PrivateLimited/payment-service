# Multi-App Payment Service Setup

## Overview

The payment-service is designed to be **app-agnostic** and can be used by multiple applications. Each app can have its own:
- Notification settings (OneSignal, FCM, custom endpoint)
- Firebase configuration
- Order/consultation update logic
- Test mode behavior

## Architecture

```
payment-service/
├── server.js                 # Main server (app-agnostic)
├── config/
│   ├── apps.example.js      # Example app configurations
│   └── apps.js              # Your app configurations (create this)
├── src/
│   ├── app-config/          # App configuration manager
│   ├── notifications/       # Notification service (multi-provider)
│   └── order-update/        # Order/consultation update service
└── ...
```

## Quick Start

### 1. Create App Configuration

Copy `config/apps.example.js` to `config/apps.js`:

```bash
cp config/apps.example.js config/apps.js
```

### 2. Configure Your Apps

Edit `config/apps.js` and add your app configurations:

```javascript
module.exports = {
  // Your App 1
  myapp1: {
    name: 'My App 1',
    notifications: {
      enabled: true,
      provider: 'onesignal',
      onesignal: {
        appId: 'your-onesignal-app-id',
        restApiKey: 'your-onesignal-rest-api-key',
      },
    },
    orderUpdate: {
      enabled: true,
      useFirebase: true,
      collections: {
        orders: 'orders',
        consultations: 'bookings', // Your custom collection name
      },
    },
  },

  // Your App 2
  myapp2: {
    name: 'My App 2',
    notifications: {
      enabled: true,
      provider: 'custom',
      customEndpoint: 'https://myapp2.com/api/notifications',
    },
    orderUpdate: {
      enabled: true,
      useFirebase: false,
      endpoint: 'https://myapp2.com/api/orders/update',
    },
  },
};
```

## App Identification

Apps are identified via request headers or query parameters:

### Option 1: Header (Recommended)
```javascript
headers: {
  'X-App-ID': 'myapp1'
}
```

### Option 2: Query Parameter
```
POST /api/payment/verify?appId=myapp1
```

### Option 3: Auto-detect from notes
The server can auto-detect the app from payment notes:
```javascript
notes: {
  appId: 'myapp1',
  consultationId: 'consultation123',
}
```

## API Usage

### Create Order

```javascript
POST /api/payment/create-order
Headers: {
  'X-App-ID': 'myapp1'  // Optional
}
Body: {
  amount: 50000,
  currency: 'INR',
  notes: {
    appId: 'myapp1',           // App identifier
    consultationId: 'consult123', // Your order/consultation ID
    description: 'Order description',
  }
}
```

### Verify Payment

```javascript
POST /api/payment/verify
Headers: {
  'X-App-ID': 'myapp1'  // Optional
}
Body: {
  razorpay_order_id: 'order_xxx',
  razorpay_payment_id: 'pay_xxx',
  razorpay_signature: 'signature_xxx',
  consultationId: 'consult123',  // Your order/consultation ID
  amount: 50000,
  notes: {
    appId: 'myapp1',  // App identifier
  }
}
```

## Notification Providers

### OneSignal (Default)

```javascript
notifications: {
  provider: 'onesignal',
  onesignal: {
    appId: 'your-app-id',
    restApiKey: 'your-rest-api-key',
  },
}
```

### Custom Endpoint

```javascript
notifications: {
  provider: 'custom',
  customEndpoint: 'https://your-app.com/api/notifications',
}
```

The server will POST to your endpoint:
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

### FCM (Coming Soon)

```javascript
notifications: {
  provider: 'fcm',
  fcm: {
    // FCM configuration
  },
}
```

### Disable Notifications

```javascript
notifications: {
  enabled: false,
}
```

## Order Update Methods

### Method 1: Firebase (Default)

```javascript
orderUpdate: {
  enabled: true,
  useFirebase: true,
  collections: {
    orders: 'orders',
    consultations: 'consultations',
    payments: 'payments',
    users: 'users',
  },
}
```

### Method 2: Custom Endpoint

```javascript
orderUpdate: {
  enabled: true,
  useFirebase: false,
  endpoint: 'https://your-app.com/api/orders/update',
}
```

The server will PATCH to your endpoint:
```
PATCH /api/orders/update/{orderId}
Body: {
  paymentStatus: 'paid',
  paymentId: 'pay_xxx',
  paidAt: timestamp,
  updatedAt: timestamp,
}
```

### Method 3: Disable Updates

```javascript
orderUpdate: {
  enabled: false,
}
```

## Test Mode Behavior

### Auto-detect Test Mode

```javascript
testMode: {
  autoDetect: true,  // Detects from Razorpay key (rzp_test_*)
  bookOnPaymentFailure: true,  // Book even if payment fails in test mode
}
```

### Manual Test Mode

```javascript
POST /api/payment/verify
Body: {
  ...,
  isTestMode: true,  // Force test mode
}
```

## Firebase Configuration

### Use Payment-Service Firebase (Default)

```javascript
firebase: {
  usePaymentServiceFirebase: true,
}
```

### Use App-Specific Firebase

```javascript
firebase: {
  usePaymentServiceFirebase: false,
  projectId: 'your-firebase-project-id',
  serviceAccountPath: './config/your-app-service-account.json',
}
```

## Example: MediFind Configuration

```javascript
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
  firebase: {
    usePaymentServiceFirebase: false,
    projectId: 'medifind-doctor',
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
}
```

## Benefits

✅ **Multi-App Support** - One server for multiple apps
✅ **Flexible Notifications** - Choose your notification provider
✅ **Flexible Updates** - Use Firebase or custom endpoints
✅ **App-Specific Config** - Each app has its own settings
✅ **Backward Compatible** - Works with existing MediFind setup
✅ **Easy to Extend** - Add new apps easily

## Migration Guide

### For Existing MediFind Integration

No changes needed! The server will:
1. Auto-detect MediFind from notes or use default config
2. Use existing Firebase setup
3. Send notifications via OneSignal (as before)

### For New Apps

1. Add your app config to `config/apps.js`
2. Include `appId` in payment notes or use `X-App-ID` header
3. Configure notifications and order updates
4. Start using the payment-service!

## Testing

### Test with App ID

```bash
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -H "X-App-ID: myapp1" \
  -d '{
    "amount": 50000,
    "notes": {
      "appId": "myapp1",
      "consultationId": "test123"
    }
  }'
```

### Test without App ID (Uses Default)

```bash
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "notes": {
      "consultationId": "test123"
    }
  }'
```

---

**The payment-service is now multi-app ready!** 🎉

