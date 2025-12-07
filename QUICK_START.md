# Payment Service - Quick Start Guide

## ✅ Setup Complete!

Your payment-service is now configured with Firebase integration.

## What's Working

1. ✅ **Firebase Admin SDK** - Initialized and connected
2. ✅ **Service Account Key** - Configured (`serviceAccountKey.json`)
3. ✅ **Payment Record Saving** - Automatically saves to Firestore
4. ✅ **Razorpay Integration** - Ready to process payments

## Next Step: Enable Firestore

**Important:** You need to enable Firestore Database in Firebase Console:

1. Go to: https://console.firebase.google.com/project/payment-service-845be
2. Click **Firestore Database** in the left menu
3. Click **Create Database**
4. Choose **Start in test mode**
5. Select location: **United States (us-central1)** (or closest to you)
6. Click **Enable**

## Start the Server

```bash
cd payment-service
npm start
```

You should see:
```
✅ Firebase Admin initialized successfully
🚀 Payment server running on port 3001
🔥 Firebase Admin: ✅ Connected
```

## Test It

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Create an Order
```bash
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "INR",
    "notes": {
      "consultationId": "test123",
      "description": "Test payment"
    }
  }'
```

### 3. Check Firestore
- Go to Firebase Console → Firestore Database
- Check `orders` collection - you should see the order record

## Integration with MediFind

The payment-service is ready to be used by MediFind app:

1. **MediFind app** calls payment-service APIs
2. **Payment-service** processes payments via Razorpay
3. **Payment records** are saved to Firestore (`payment-service-845be` project)
4. **MediFind app** can read payment records from Firestore

## Configuration Files

- ✅ `.env` - Environment variables configured
- ✅ `serviceAccountKey.json` - Firebase service account (DO NOT COMMIT)
- ✅ `server.js` - Updated with Firebase integration

## Firestore Collections

After enabling Firestore, you'll see these collections:

- **`orders`** - All Razorpay orders created
- **`payments`** - All verified payments and webhook events

## Security Notes

1. ✅ `serviceAccountKey.json` is in `.gitignore` - won't be committed
2. ⚠️ Enable Firestore security rules before production
3. ⚠️ Configure `ALLOWED_ORIGINS` in `.env` for production

## Need Help?

See `FIREBASE_SETUP.md` for detailed Firebase setup instructions.
See `SETUP_COMPLETE.md` for complete setup documentation.

---

**Status:** ✅ Ready to use! Just enable Firestore and start the server.

