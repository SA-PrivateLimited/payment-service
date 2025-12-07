# Setup Payment-Service for MediFind Release APK

Complete guide to deploy payment-service and connect it to MediFind for release builds.

## 🎯 Goal

Deploy payment-service to cloud so MediFind release APK can use it instead of localhost.

## 📋 Quick Checklist

- [ ] Deploy payment-service (Railway/Render/Fly.io)
- [ ] Get deployed URL
- [ ] Update MediFind `.env` with `PAYMENT_API_URL_PROD`
- [ ] Upload MediFind Firebase service account (for consultation updates)
- [ ] Rebuild MediFind release APK
- [ ] Test payment flow

## 🚀 Step-by-Step Guide

### Step 1: Deploy Payment-Service

**Option A: Railway.app (Recommended - 5 minutes)**

1. Go to https://railway.app
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select repository → Set root: `payment-service`
5. Add environment variables:
   ```env
   RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
   RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0
   PORT=3001
   NODE_ENV=production
   ONESIGNAL_REST_API_KEY=your_key
   ```
6. Upload `serviceAccountKey.json` (Settings → Files)
7. Get URL: `https://your-app.railway.app`

**Option B: Render.com**

See `DEPLOYMENT.md` for detailed instructions.

### Step 2: Connect to MediFind Firebase

To update consultations in MediFind's Firebase:

1. **Get MediFind Firebase Service Account**:
   - Firebase Console → `medifind-doctor` project
   - Project Settings → Service Accounts
   - Generate new private key
   - Download JSON

2. **Upload to Deployment Platform**:
   - Railway: Settings → Files → Upload JSON
   - Set: `FIREBASE_SERVICE_ACCOUNT_PATH=./medifind-service-account.json`

3. **Or Use Environment Variables**:
   ```env
   FIREBASE_PROJECT_ID=medifind-doctor
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@medifind-doctor.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Step 3: Update MediFind Configuration

Edit `MediFind/.env`:

```env
# Razorpay Key (for checkout UI)
RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1

# Development (for local testing)
PAYMENT_API_URL_DEV=http://10.0.2.2:3001

# Production (UPDATE THIS!)
PAYMENT_API_URL_PROD=https://your-deployed-url.com
```

**Replace `https://your-deployed-url.com` with your actual deployed URL.**

### Step 4: Rebuild Release APK

```bash
cd MediFind
npx react-native run-android --variant=release
```

Or:

```bash
cd MediFind/android
./gradlew assembleRelease
```

### Step 5: Test

1. Install release APK:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

2. Test payment flow:
   - Open app
   - Book consultation
   - Go to payment screen
   - Complete payment
   - Verify consultation updated in Firebase

3. Check server logs:
   - Go to deployment platform
   - Check logs for payment requests
   - Verify consultation updates

## ✅ Verification

### Test Server Health

```bash
curl https://your-deployed-url.com/health
```

Expected:
```json
{
  "status": "ok",
  "message": "Payment server is running"
}
```

### Test Payment Endpoint

```bash
curl -X POST https://your-deployed-url.com/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}'
```

Expected:
```json
{
  "success": true,
  "order": {
    "id": "order_xxx",
    "amount": 50000,
    ...
  }
}
```

## 🔧 Configuration Summary

### Payment-Service Environment Variables

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0

# Firebase (for MediFind consultations)
FIREBASE_SERVICE_ACCOUNT_PATH=./medifind-service-account.json
# OR
FIREBASE_PROJECT_ID=medifind-doctor
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@medifind-doctor.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OneSignal
ONESIGNAL_REST_API_KEY=your_key

# Server
PORT=3001
NODE_ENV=production
```

### MediFind `.env` File

```env
RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
PAYMENT_API_URL_DEV=http://10.0.2.2:3001
PAYMENT_API_URL_PROD=https://your-deployed-url.com
```

## 📚 Documentation

- **`DEPLOYMENT.md`** - Detailed deployment guide
- **`QUICK_DEPLOY.md`** - Quick Railway deployment
- **`FIREBASE_CONNECTION.md`** - Firebase setup details
- **`CONNECT_TO_DEPLOYED_SERVER.md`** - MediFind connection guide

## 🐛 Troubleshooting

### Server Not Responding

- Check server is running (logs in deployment platform)
- Verify URL is correct
- Test health endpoint

### Consultation Not Updated

- Verify Firebase service account is uploaded
- Check Firebase project ID is `medifind-doctor`
- Verify service account has permissions
- Check server logs for errors

### CORS Errors

- Update `ALLOWED_ORIGINS` in payment-service
- Or set to `*` for testing

## 🎉 Success Indicators

✅ Server health check returns `{"status":"ok"}`  
✅ Payment requests appear in server logs  
✅ Consultations updated in Firebase Console  
✅ Notifications sent to users  
✅ Release APK can make payments  

---

**After deployment, update `PAYMENT_API_URL_PROD` in MediFind and rebuild!** 🚀

