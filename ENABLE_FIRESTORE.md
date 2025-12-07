# Enable Firestore Database - Step by Step

## Quick Steps

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/payment-service-845be/firestore

2. **Create Database**
   - Click the **"Create Database"** button (or "Get Started" if first time)

3. **Choose Security Rules**
   - Select **"Start in test mode"** (for development)
   - Click **"Next"**

4. **Select Location**
   - Choose **"United States (us-central1)"** or closest to your users
   - Click **"Enable"**

5. **Wait for Creation**
   - Firestore will take a few seconds to initialize
   - You'll see an empty database with collections view

## Verify Setup

After enabling Firestore:

1. **Check Server Logs**
   - Your server should show: `✅ Firebase Admin initialized successfully`
   - If you see errors, check that `serviceAccountKey.json` is in the correct location

2. **Test Payment Record Saving**
   - Create a test order via API
   - Check Firestore → `orders` collection
   - You should see the order record

## Firestore Security Rules (Recommended)

After enabling Firestore, update the security rules:

1. Go to **Firestore Database** → **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders - server writes via Admin SDK, users can read
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Admin SDK can write
    }
    
    // Payments - server writes via Admin SDK, users can read
    match /payments/{paymentId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Admin SDK can write
    }
  }
}
```

3. Click **"Publish"**

## Troubleshooting

### "Firebase Admin not initialized"
- Check `serviceAccountKey.json` exists in payment-service directory
- Verify `.env` has: `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`
- Check file permissions

### "Permission denied" errors
- Admin SDK bypasses security rules, so this shouldn't happen
- If it does, verify service account has proper permissions in Firebase Console

### "Collection not found"
- This is normal - collections are created automatically when first document is added
- Create a test order and check again

---

**Once Firestore is enabled, your payment records will automatically save!**

