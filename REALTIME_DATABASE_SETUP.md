# Realtime Database Setup Guide

## ✅ Updated to Use Realtime Database

The payment-service has been updated to use **Realtime Database** instead of Firestore because:
- ✅ **No billing required** - Realtime Database is free
- ✅ **Simple setup** - No need to enable billing
- ✅ **Works perfectly** for payment record storage

## Step 1: Enable Realtime Database

1. Go to Firebase Console: https://console.firebase.google.com/project/payment-service-845be
2. Click **"Realtime Database"** in the left sidebar
3. Click **"Create Database"** (if not already created)
4. Choose location: **"United States (us-central1)"** (or closest to you)
5. Choose security rules: **"Start in test mode"**
6. Click **"Enable"**

## Step 2: Set Security Rules

1. In Realtime Database, click the **"Rules"** tab
2. Replace the rules with:

```json
{
  "rules": {
    "orders": {
      ".read": "auth != null",
      ".write": false
    },
    "payments": {
      ".read": "auth != null",
      ".write": false
    },
    "consultations": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

3. Click **"Publish"**

**Note:** The server uses Admin SDK which bypasses security rules, so these rules are for client access only.

## Step 3: Verify Database URL

The server automatically uses the Realtime Database URL:
```
https://payment-service-845be-default-rtdb.firebaseio.com
```

This is configured automatically from your `serviceAccountKey.json`.

## Data Structure

### Orders Node
```
orders/
  {auto-generated-id}/
    razorpayOrderId: "order_xxx"
    amount: 50000
    amountInRupees: 500
    currency: "INR"
    receipt: "receipt_xxx"
    status: "created"
    consultationId: "consultation_id" (optional)
    notes: {}
    createdAt: timestamp
```

### Payments Node
```
payments/
  {auto-generated-id}/
    razorpayPaymentId: "pay_xxx"
    razorpayOrderId: "order_xxx"
    razorpaySignature: "signature_xxx"
    amount: 50000
    amountInRupees: 500
    status: "completed" | "failed"
    verified: true
    consultationId: "consultation_id" (optional)
    notes: {}
    createdAt: timestamp
    verifiedAt: timestamp
```

## Testing

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Create a test order:**
   ```bash
   curl -X POST http://localhost:3001/api/payment/create-order \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 50000,
       "currency": "INR",
       "notes": {
         "consultationId": "test123"
       }
     }'
   ```

3. **Check Realtime Database:**
   - Go to Firebase Console → Realtime Database
   - You should see `orders` node with the order data

## Advantages of Realtime Database

- ✅ **Free** - No billing required
- ✅ **Simple** - JSON-based structure
- ✅ **Fast** - Real-time updates
- ✅ **Perfect for logs** - Great for payment records

## Server Logs

When Firebase is connected, you'll see:
```
✅ Firebase Admin initialized successfully (Realtime Database)
🔥 Firebase Admin: ✅ Connected (Realtime Database)
```

When saving records:
```
✅ Order record saved to Realtime Database: order_xxx
✅ Payment record saved to Realtime Database: pay_xxx
```

## Troubleshooting

### "Permission denied" errors
- Admin SDK bypasses security rules, so this shouldn't happen
- If it does, check service account has proper permissions

### "Database not found"
- Make sure Realtime Database is enabled in Firebase Console
- Check database URL matches your project ID

### Records not saving
- Check server logs for errors
- Verify Realtime Database is enabled
- Check `.env` has `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`

---

**Status:** ✅ Ready to use with Realtime Database (No billing required!)

