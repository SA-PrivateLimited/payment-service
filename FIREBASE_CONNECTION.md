# Firebase Connection Setup for MediFind

The payment-service needs to connect to MediFind's Firebase project (`medifind-doctor`) to update consultations.

## 🔧 Configuration Options

### Option 1: Use MediFind's Firebase Service Account (Recommended)

1. **Get Service Account Key from MediFind Firebase**:
   - Go to Firebase Console: https://console.firebase.google.com
   - Select project: `medifind-doctor`
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download the JSON file

2. **Upload to Deployment Platform**:
   - **Railway**: Settings → Files → Upload `medifind-service-account.json`
   - **Render**: Add as environment variable or upload file
   - **Fly.io**: Use `fly secrets` or upload file

3. **Set Environment Variable**:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./medifind-service-account.json
   ```

### Option 2: Use Environment Variables

Instead of uploading a file, you can set individual credentials:

```env
FIREBASE_PROJECT_ID=medifind-doctor
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@medifind-doctor.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://medifind-doctor-default-rtdb.firebaseio.com
```

**Get these values from the service account JSON file.**

### Option 3: Use Payment-Service Firebase (Current Setup)

Currently configured to use `payment-service-845be` Firebase project. This works for:
- Saving payment records
- Storing orders

But for updating MediFind consultations, you need to connect to `medifind-doctor`.

## 🔄 Multi-Firebase Setup

The payment-service can connect to multiple Firebase projects:

1. **Payment-Service Firebase** (`payment-service-845be`):
   - Stores payment records
   - Stores orders
   - Uses Realtime Database

2. **MediFind Firebase** (`medifind-doctor`):
   - Updates consultations
   - Reads consultation data
   - Uses Firestore

### Current Configuration

In `config/apps.js`:

```javascript
medifind: {
  firebase: {
    usePaymentServiceFirebase: false,
    projectId: 'medifind-doctor',
    serviceAccountPath: null, // Uses default if null
  },
}
```

## 📝 Setup Steps

### 1. Get MediFind Firebase Credentials

1. Go to Firebase Console
2. Select `medifind-doctor` project
3. Project Settings → Service Accounts
4. Generate new private key
5. Download JSON file

### 2. Configure Payment-Service

**For Local Development:**

Copy service account JSON to `payment-service/` directory:
```bash
cp ~/Downloads/medifind-doctor-firebase-adminsdk-xxxxx.json payment-service/medifind-service-account.json
```

Update `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./medifind-service-account.json
```

**For Deployment:**

Upload `medifind-service-account.json` to your deployment platform and set:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./medifind-service-account.json
```

### 3. Update Code (If Needed)

The payment-service already supports connecting to MediFind's Firebase through the app configuration. Make sure:

1. `config/apps.js` has MediFind config
2. Service account file is accessible
3. Firebase Admin SDK can initialize

## ✅ Verification

### Test Firebase Connection

```bash
curl https://your-deployed-url.com/health
```

Check server logs for:
```
✅ Firebase Admin initialized successfully (Realtime Database)
```

### Test Consultation Update

1. Make a payment from MediFind app
2. Check server logs for:
   ```
   ✅ Consultation {id} updated in Firestore (paymentStatus: paid)
   ```
3. Verify in Firebase Console that consultation was updated

## 🔒 Security Notes

- ✅ Service account key should be kept secure
- ✅ Never commit service account JSON to git
- ✅ Use environment variables in production
- ✅ Restrict service account permissions if possible

## 🐛 Troubleshooting

### Issue: "Firebase Admin initialization failed"

**Solutions:**
- Verify service account file path is correct
- Check file permissions
- Verify Firebase project ID matches
- Check environment variables are set correctly

### Issue: "Consultation not found"

**Solutions:**
- Verify Firebase project is `medifind-doctor`
- Check consultation ID is correct
- Verify Firestore collection name is `consultations`
- Check service account has read/write permissions

### Issue: "Permission denied"

**Solutions:**
- Verify service account has proper permissions
- Check Firestore security rules allow updates
- Verify database URL is correct

---

**After setup, test by making a payment from MediFind and verifying the consultation is updated in Firebase!** ✅

