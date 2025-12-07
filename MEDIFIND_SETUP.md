# MediFind Payment Service Setup - Complete Guide

## ✅ Current Configuration

The payment-service is **configured for MediFind** and ready to use. Other apps can be added later without any changes to MediFind's integration.

## 🎯 What's Configured

### ✅ MediFind as Default App
- **No app ID needed** - MediFind is the default configuration
- **OneSignal notifications** - Configured for MediFind
- **Firebase integration** - Uses MediFind's Firebase (medifind-doctor)
- **Test mode handling** - Books consultations even if payment fails

### ✅ Features Enabled
- ✅ Payment verification
- ✅ Order/consultation updates in Firebase
- ✅ Notifications to patient, doctor, and admin
- ✅ Test mode support (books consultation on payment failure)
- ✅ Payment records saved to Firebase

## 📋 MediFind Integration

### Current Setup (No Changes Needed)

MediFind can continue using the payment-service **exactly as before**:

```typescript
// In MediFind app - no changes needed
const response = await fetch('http://localhost:3001/api/payment/create-order', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    amount: 50000,
    notes: {
      consultationId: 'consultation123',
      description: 'Consultation with Dr. Name',
    },
  }),
});
```

### Payment Verification

```typescript
const verifyResponse = await fetch('http://localhost:3001/api/payment/verify', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    consultationId: 'consultation123',
    amount: 50000,
  }),
});
```

## 🔔 Notifications

### Who Gets Notified

When payment succeeds or fails, notifications are sent to:

1. **Patient** (`consultation.patientId`)
2. **Doctor** (`consultation.doctorId`)
3. **Admins** (all users with `role: 'admin'`)

### Notification Messages

**Payment Success:**
- Title: `✅ Payment Successful`
- Body: `Payment of ₹500.00 received for consultation with Dr. Name`

**Payment Failed (Test Mode):**
- Title: `⚠️ Payment Failed`
- Body: `Payment of ₹500.00 failed for consultation with Dr. Name. Consultation will still be booked.`

## 🧪 Test Mode Behavior

### Current Behavior

- ✅ **Auto-detects test mode** from Razorpay keys (`rzp_test_*`)
- ✅ **Books consultation** even if payment fails
- ✅ **Sends notifications** about payment failure
- ✅ **Updates consultation** with `paymentStatus: 'pending'`

### Example Flow

1. User books consultation → Consultation created with `paymentStatus: 'pending'`
2. User attempts payment → Payment fails (test mode)
3. Server detects test mode → Consultation remains booked
4. Notifications sent → Patient, doctor, and admin notified
5. Consultation status → `paymentStatus: 'pending'` (can be paid later)

## 📊 Firebase Updates

### Consultation Updates

When payment succeeds:
```javascript
{
  paymentStatus: 'paid',
  paymentId: 'pay_xxx',
  paidAt: timestamp,
  updatedAt: timestamp,
}
```

When payment fails (test mode):
```javascript
{
  paymentStatus: 'pending', // Still booked
  updatedAt: timestamp,
}
```

### Payment Records

Saved to `payments` collection:
```javascript
{
  razorpayPaymentId: 'pay_xxx',
  razorpayOrderId: 'order_xxx',
  razorpaySignature: 'signature_xxx',
  amount: 50000,
  amountInRupees: 500,
  status: 'completed' | 'failed',
  consultationId: 'consultation123',
  createdAt: timestamp,
}
```

## 🔧 Configuration File

Located at: `config/apps.js`

```javascript
module.exports = {
  default: {
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
};
```

## 🚀 Adding Other Apps Later

When you're ready to add other apps:

1. **Edit `config/apps.js`**
2. **Add new app configuration:**
   ```javascript
   myapp: {
     name: 'My App',
     notifications: { ... },
     orderUpdate: { ... },
   }
   ```
3. **Use app ID in requests:**
   - Header: `X-App-ID: myapp`
   - Query: `?appId=myapp`
   - Notes: `notes: {appId: 'myapp'}`

**MediFind continues working** - no changes needed!

## ✅ Current Status

- ✅ **MediFind configured** as default app
- ✅ **Notifications working** - Patient, doctor, admin
- ✅ **Firebase integration** - Updates consultations
- ✅ **Test mode** - Books consultations on payment failure
- ✅ **Multi-app ready** - Architecture supports future apps
- ✅ **Backward compatible** - Existing MediFind code works

## 📝 Environment Variables

Make sure `.env` has:

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0

# Firebase (for payment-service)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# OneSignal (for MediFind notifications)
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
```

## 🧪 Testing

### Test Payment Flow

```bash
# 1. Create order
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "notes": {
      "consultationId": "test123"
    }
  }'

# 2. Verify payment (will fail in test mode, but consultation booked)
curl -X POST http://localhost:3001/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_test_xxx",
    "razorpay_signature": "test_signature",
    "consultationId": "test123",
    "amount": 50000
  }'
```

### Expected Results

1. ✅ Order created
2. ✅ Payment verification attempted
3. ✅ Consultation updated (even if payment fails in test mode)
4. ✅ Notifications sent to patient, doctor, admin
5. ✅ Payment record saved

---

**MediFind is fully configured and ready to use!** 🎉

Other apps can be added later by simply adding configurations to `config/apps.js`.

