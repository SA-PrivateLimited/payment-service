# Quick Deploy Guide - Railway.app

## 🚀 Deploy in 5 Minutes

### Step 1: Sign Up
1. Go to https://railway.app
2. Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your repository
4. Set Root Directory to: `payment-service`

### Step 3: Add Environment Variables
Go to Variables tab and add:

```env
RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1
RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0
PORT=3001
NODE_ENV=production
ONESIGNAL_REST_API_KEY=your_onesignal_rest_api_key
```

### Step 4: Upload Firebase Service Account
1. Go to Settings → Files
2. Upload `serviceAccountKey.json`
3. Or set Firebase credentials as environment variables

### Step 5: Get Your URL
1. Go to Settings → Networking
2. Generate domain
3. Copy the URL (e.g., `https://payment-service-production.up.railway.app`)

### Step 6: Update MediFind
Edit `MediFind/.env`:

```env
PAYMENT_API_URL_PROD=https://your-railway-url.railway.app
```

### Step 7: Rebuild MediFind
```bash
cd MediFind
npx react-native run-android --variant=release
```

## ✅ Done!

Your payment-service is now deployed and MediFind can use it in release builds!

## 🧪 Test

```bash
curl https://your-railway-url.railway.app/health
```

Expected: `{"status":"ok","message":"Payment server is running"}`

---

**That's it! Your payment-service is live!** 🎉

