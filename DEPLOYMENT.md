# Payment Service Deployment Guide

Deploy the payment-service to a cloud platform so MediFind can use it in release builds.

## 🚀 Deployment Options

### Option 1: Railway.app (Recommended - Easiest)

1. **Sign up**: https://railway.app
2. **Create New Project**
3. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Select the `payment-service` folder as root directory
4. **Add Environment Variables**:
   ```env
   RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
   RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0
   PORT=3001
   NODE_ENV=production
   FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
   ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key
   ```
5. **Upload serviceAccountKey.json**:
   - Go to project settings
   - Upload `serviceAccountKey.json` file
   - Or use environment variables for Firebase credentials
6. **Get Your URL**: `https://your-app-name.railway.app`

### Option 2: Render.com (Free Tier Available)

1. **Sign up**: https://render.com
2. **Create New Web Service**
3. **Connect Repository**:
   - Connect GitHub repository
   - Root Directory: `payment-service`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables** (same as Railway)
5. **Get Your URL**: `https://your-app-name.onrender.com`

### Option 3: Firebase Functions (If using Firebase)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize Firebase Functions**:
   ```bash
   cd payment-service
   firebase init functions
   ```

3. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

4. **Get Your URL**: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/paymentService`

### Option 4: Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Launch**:
   ```bash
   cd payment-service
   fly launch
   ```

4. **Set Secrets**:
   ```bash
   fly secrets set RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
   fly secrets set RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0
   fly secrets set ONESIGNAL_REST_API_KEY=your_key
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

6. **Get Your URL**: `https://your-app-name.fly.dev`

## 🔧 Update MediFind Configuration

After deployment, update MediFind's `.env` file:

### 1. Edit `.env` File

```env
# Development (Local - for testing)
PAYMENT_API_URL_DEV=http://10.0.2.2:3001

# Production (Deployed Server)
PAYMENT_API_URL_PROD=https://your-deployed-url.com
```

**Replace `https://your-deployed-url.com` with your actual deployed URL:**
- Railway: `https://your-app-name.railway.app`
- Render: `https://your-app-name.onrender.com`
- Fly.io: `https://your-app-name.fly.dev`
- Firebase Functions: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/paymentService`

### 2. Rebuild MediFind App

```bash
cd MediFind
npm run android --variant=release
# or
npx react-native run-android --variant=release
```

## ✅ Verify Deployment

### 1. Test Health Endpoint

```bash
curl https://your-deployed-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Payment server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test from MediFind App

1. Build release APK
2. Install on device
3. Try making a payment
4. Check server logs for requests

## 🔒 Security Checklist

- ✅ `RAZORPAY_KEY_SECRET` is set as environment variable (not in code)
- ✅ `FIREBASE_SERVICE_ACCOUNT_PATH` points to secure file
- ✅ CORS is configured for your app's domain
- ✅ HTTPS is enabled (required for production)
- ✅ Environment variables are not exposed in logs

## 📝 Environment Variables Reference

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0

# Firebase
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
# OR use individual credentials:
# FIREBASE_PROJECT_ID=payment-service-845be
# FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@payment-service-845be.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OneSignal
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key

# Server
PORT=3001
NODE_ENV=production

# CORS (Optional - restrict to your app domains)
ALLOWED_ORIGINS=https://your-app.com
```

## 🧪 Testing Release Build

### 1. Update .env in MediFind

```env
PAYMENT_API_URL_PROD=https://your-deployed-url.com
```

### 2. Build Release APK

```bash
cd MediFind/android
./gradlew assembleRelease
```

### 3. Install and Test

```bash
adb install app/build/outputs/apk/release/app-release.apk
```

### 4. Test Payment Flow

1. Open app
2. Book consultation
3. Go to payment screen
4. Select payment method
5. Complete payment
6. Verify payment is processed

## 🐛 Troubleshooting

### Issue: Connection Refused

**Solution**: Check if server is running and URL is correct
```bash
curl https://your-deployed-url.com/health
```

### Issue: CORS Error

**Solution**: Update `ALLOWED_ORIGINS` in payment-service environment variables

### Issue: Firebase Not Initialized

**Solution**: Make sure `serviceAccountKey.json` is uploaded or Firebase credentials are set

### Issue: OneSignal Notifications Not Working

**Solution**: Verify `ONESIGNAL_REST_API_KEY` is set correctly

## 📞 Support

- Check server logs in deployment platform
- Verify environment variables are set
- Test health endpoint
- Check CORS configuration

---

**After deployment, update MediFind's `PAYMENT_API_URL_PROD` and rebuild!** 🚀

