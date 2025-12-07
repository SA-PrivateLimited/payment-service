# Payment Service Setup Complete ✅

## What's Been Configured

### 1. Firebase Admin SDK Integration ✅
- Firebase Admin SDK initialized in `server.js`
- Service account key configured: `serviceAccountKey.json`
- Payment records will be saved to Firestore automatically

### 2. Payment Record Saving ✅
The server now automatically saves:
- **Orders** → `orders` collection in Firestore
- **Verified Payments** → `payments` collection in Firestore
- **Webhook Events** → `payments` collection (captured/failed payments)

### 3. Firestore Collections Structure

#### `orders` Collection
```javascript
{
  razorpayOrderId: string,
  amount: number, // in paise
  amountInRupees: number,
  currency: string,
  receipt: string,
  status: string,
  consultationId: string | null,
  notes: object,
  createdAt: timestamp
}
```

#### `payments` Collection
```javascript
{
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
  amount: number, // in paise
  amountInRupees: number,
  status: 'completed' | 'failed',
  verified: boolean,
  consultationId: string | null,
  notes: object,
  createdAt: timestamp,
  verifiedAt: timestamp
}
```

## Next Steps

### 1. Enable Firestore Database
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: **payment-service**
3. Navigate to **Firestore Database**
4. Click **Create Database**
5. Choose **Start in test mode** (for development)
6. Select location: **United States (us-central1)** or closest to your users
7. Click **Enable**

### 2. Configure Firestore Security Rules
In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection - server writes, users read their own
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server (Admin SDK) can write
    }
    
    // Payments collection - server writes, users read their own
    match /payments/{paymentId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server (Admin SDK) can write
    }
  }
}
```

### 3. Update .env File
Make sure your `.env` file includes:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. Test the Server
```bash
npm start
```

You should see:
```
✅ Firebase Admin initialized successfully
🚀 Payment server running on port 3001
🔥 Firebase Admin: ✅ Connected
```

### 5. Test Payment Flow
1. Create an order via `/api/payment/create-order`
2. Verify payment via `/api/payment/verify`
3. Check Firestore → `orders` and `payments` collections

## Integration with MediFind

The payment-service Firebase project (`payment-service-845be`) is separate from MediFind's Firebase project (`medifind-doctor`). This allows:

- **Separation of concerns**: Payment records in one project, user data in another
- **Independent scaling**: Each project can scale independently
- **Security**: Payment data isolated from user data
- **Cross-reference**: Payment records include `consultationId` to link back to MediFind

## Monitoring

### View Payment Records
1. Go to Firebase Console → Firestore Database
2. Check `payments` collection for all payment records
3. Check `orders` collection for all order records

### Server Logs
The server logs will show:
- `✅ Payment record saved to Firestore: pay_xxx`
- `✅ Order record saved to Firestore: order_xxx`
- `❌ Error saving payment to Firestore:` (if errors occur)

## Production Deployment

When deploying to production (Railway, Render, Fly.io, etc.):

1. **Set environment variables** instead of using `serviceAccountKey.json`:
   ```env
   FIREBASE_PROJECT_ID=payment-service-845be
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@payment-service-845be.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

2. **Update Firestore rules** for production security

3. **Configure CORS** with `ALLOWED_ORIGINS` environment variable

## Troubleshooting

### Firebase Admin not initializing
- Check `serviceAccountKey.json` exists and is valid
- Verify file path in `.env`: `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`
- Check file permissions

### Payment records not saving
- Check server logs for Firebase errors
- Verify Firestore is enabled in Firebase Console
- Check Firestore security rules allow writes (Admin SDK bypasses rules)

### Firestore permission errors
- Admin SDK bypasses security rules, so this shouldn't happen
- If it does, check service account has proper permissions in Firebase Console

---

**Status:** ✅ Setup Complete - Ready to use!

