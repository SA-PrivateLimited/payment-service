# Firebase Setup for Payment Service

This guide will help you set up Firebase Admin SDK in the payment-service to save payment records to Firestore.

## Step 1: Enable Firestore in Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **payment-service**
3. Navigate to **Firestore Database** in the left menu
4. Click **Create Database**
5. Choose **Start in test mode** (for now, you can secure it later)
6. Select a location (choose closest to your users)
7. Click **Enable**

## Step 2: Create Service Account Key

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click on **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file as `serviceAccountKey.json` in the `payment-service` directory
5. **Important:** Add `serviceAccountKey.json` to `.gitignore` to keep it secure

## Step 3: Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Add Firebase configuration to `.env`:
   ```env
   # Firebase Configuration
   FIREBASE_PROJECT_ID=payment-service-845be
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   
   # Or use individual credentials (alternative to service account file)
   # FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@payment-service-845be.iam.gserviceaccount.com
   # FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

## Step 4: Update Firestore Security Rules

In Firebase Console → Firestore Database → Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Payments collection - allow server to write, users to read their own
    match /payments/{paymentId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || 
                      resource.data.consultationId in get(/databases/$(database)/documents/consultations/$(resource.data.consultationId)).data.participants);
      allow write: if request.auth != null; // Server writes via Admin SDK
    }
    
    // Consultations collection - for updating payment status
    match /consultations/{consultationId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && 
                       (request.resource.data.paymentStatus != null || 
                        resource.data.userId == request.auth.uid);
    }
  }
}
```

## Step 5: Install Dependencies

Dependencies are already in `package.json`. If needed, run:
```bash
npm install
```

## Step 6: Test Firebase Connection

The server will automatically initialize Firebase Admin SDK when it starts. Check the console logs for:
```
✅ Firebase Admin initialized successfully
```

## Step 7: Verify Payment Records

After a payment is processed, check Firestore:
1. Go to Firebase Console → Firestore Database
2. Look for the `payments` collection
3. You should see payment records with:
   - `razorpayPaymentId`
   - `razorpayOrderId`
   - `amount`
   - `status`
   - `createdAt`
   - `consultationId`

## Integration with MediFind

The payment-service Firebase project can be used alongside MediFind's existing Firebase project:

- **MediFind App**: Continues using `medifind-doctor` Firebase project for user data, consultations, etc.
- **Payment Service Backend**: Uses `payment-service` Firebase project to store payment records
- **Cross-reference**: Payment records include `consultationId` to link back to MediFind's consultations

## Security Notes

1. **Never commit `serviceAccountKey.json`** to git
2. **Use environment variables** for production deployments
3. **Secure Firestore rules** before going to production
4. **Rotate service account keys** periodically
5. **Use least privilege** - only grant necessary Firestore permissions

## Production Deployment

For production (Railway, Render, Fly.io, etc.):

1. **Set environment variables** in your hosting platform:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY` (escape newlines: `\n`)

2. **Or upload service account key** securely:
   - Railway: Use secrets
   - Render: Use environment variables
   - Fly.io: Use secrets: `fly secrets set FIREBASE_PRIVATE_KEY="..."`

## Troubleshooting

### Firebase Admin not initializing
- Check that `serviceAccountKey.json` exists and is valid
- Verify `FIREBASE_PROJECT_ID` matches your Firebase project
- Check file permissions

### Permission denied errors
- Verify Firestore rules allow writes
- Check service account has proper permissions
- Ensure Firestore is enabled in Firebase Console

### Payment records not saving
- Check server logs for errors
- Verify Firebase Admin initialized successfully
- Check Firestore rules allow writes

