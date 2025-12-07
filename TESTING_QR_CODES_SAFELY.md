# Testing QR Codes Safely - No Real Money

## ⚠️ Important: Test Mode vs Live Mode

### Current Status

Your Razorpay Key ID starts with `rzp_test_` which means you're in **TEST MODE** ✅

- ✅ **Test Mode:** QR codes created will NOT process real payments
- ✅ **Safe to Test:** You can scan and test without any real money being deducted
- ✅ **Test Payments:** Use Razorpay test credentials to simulate payments

## How Razorpay Test Mode Works

### QR Codes in Test Mode

1. **QR Code Created:** When you create a QR code with test keys (`rzp_test_*`):
   - QR code is created successfully ✅
   - QR code can be scanned ✅
   - **BUT:** Payment will NOT go through with real money ✅

2. **Payment Attempt:**
   - User scans QR code
   - Opens UPI app (PhonePe, Google Pay, Paytm, etc.)
   - Enters amount
   - **Payment will FAIL** because it's a test QR code
   - **No money is deducted** ✅

### Why Payments Fail in Test Mode

- Test QR codes are **not linked to real merchant accounts**
- UPI apps reject test QR codes automatically
- This is **by design** - to prevent accidental real payments during testing

## Safe Testing Methods

### Method 1: Use Razorpay Test Credentials (Recommended)

Razorpay provides test credentials for testing payments:

1. **Test UPI ID:** Use Razorpay's test UPI ID
2. **Test Payment:** Simulate payment through Razorpay dashboard
3. **No Real Money:** All test transactions are simulated

**Steps:**
1. Create QR code via API (already in test mode)
2. Check QR code in Razorpay Dashboard → QR Codes
3. Use Razorpay's test payment simulator
4. Verify payment status updates

### Method 2: Test Payment Flow Without Scanning

Instead of scanning QR code, test the payment flow:

1. **Create Order:**
   ```bash
   curl -X POST http://localhost:3001/api/payment/create-order \
     -H "Content-Type: application/json" \
     -d '{"amount": 50000, "currency": "INR"}'
   ```

2. **Generate QR Code:**
   ```bash
   curl -X POST http://localhost:3001/api/payment/generate-upi-link \
     -H "Content-Type: application/json" \
     -d '{"amount": 50000, "description": "Test payment"}'
   ```

3. **Verify QR Code Created:**
   - Check response for `qrCodeId`
   - Check Razorpay Dashboard → QR Codes
   - QR code should appear there

4. **Simulate Payment (Manual):**
   - In Razorpay Dashboard → QR Codes
   - Click on your test QR code
   - Use "Simulate Payment" option (if available)
   - Or manually mark as paid for testing

### Method 3: Use Razorpay Webhook Simulator

1. **Create QR Code** via API
2. **Go to Razorpay Dashboard** → Webhooks
3. **Use Webhook Simulator** to simulate payment events
4. **Test your webhook handler** without real payments

## Current Configuration Check

### Your Current Setup

```env
RAZORPAY_KEY_ID=rzp_test_RonHQZJYS2mpi1  # ✅ TEST MODE
RAZORPAY_KEY_SECRET=zZ9m6ItAl3ifPnn3Tivv1Oa0  # ✅ TEST SECRET
```

**Status:** ✅ **You're in TEST MODE - Safe to test!**

## Testing Checklist

### ✅ Safe to Test

- [x] Create QR codes (test mode)
- [x] Scan QR codes (will fail, no money deducted)
- [x] Test payment flow
- [x] Test webhook handlers
- [x] Test payment verification
- [x] Test Firebase integration

### ❌ Will NOT Work in Test Mode

- [ ] Real UPI payments (by design - payments fail)
- [ ] Real money transactions (not possible in test mode)
- [ ] Actual payment processing (simulated only)

## How to Verify Test Mode

### Check Razorpay Dashboard

1. Go to: https://dashboard.razorpay.com
2. Check top right corner:
   - **"Test Mode"** badge = ✅ Safe
   - **"Live Mode"** badge = ⚠️ Real payments

### Check QR Codes

1. Go to: Razorpay Dashboard → QR Codes
2. Test QR codes will show:
   - Status: "Created" or "Active"
   - Mode: "Test"
   - Amount: Test amount
   - **No real payments possible** ✅

## Testing Payment Verification

Even though real payments won't go through, you can test the verification flow:

### Option 1: Manual Verification Test

```bash
# Create a test order
curl -X POST http://localhost:3001/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000}'

# Get order ID from response, then test verification
curl -X POST http://localhost:3001/api/payment/verify \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_test_xxx",
    "razorpay_signature": "test_signature"
  }'
```

### Option 2: Use Razorpay Test Payment IDs

Razorpay provides test payment IDs for testing:
- Payment ID format: `pay_test_xxxxxxxxxxxxx`
- These are simulated payments for testing

## Important Notes

### ⚠️ Before Going Live

1. **Switch to Live Mode:**
   - Get live keys from Razorpay (`rzp_live_*`)
   - Update `.env` with live credentials
   - **QR codes will process REAL payments** ⚠️

2. **Test Thoroughly:**
   - Test all payment flows
   - Test error handling
   - Test webhook handlers
   - Test Firebase integration

3. **Security:**
   - Never commit live keys to git
   - Use environment variables
   - Rotate keys periodically

## Summary

### ✅ You're Safe to Test!

- **Current Mode:** TEST MODE (`rzp_test_*`)
- **QR Code Scanning:** Safe - payments will fail, no money deducted
- **Payment Flow:** Can be tested end-to-end
- **Firebase Integration:** Can be tested with test payments

### 🧪 Testing Steps

1. Create QR code via API ✅
2. Scan QR code with UPI app ✅ (payment will fail - expected)
3. Check Razorpay Dashboard for QR code status ✅
4. Test payment verification flow ✅
5. Test Firebase record saving ✅

### 🚀 Going Live

When ready for production:
1. Get live Razorpay keys
2. Update `.env` with live credentials
3. Test with small amount first
4. Monitor payments closely

---

**Bottom Line:** You're in TEST MODE - scan all the QR codes you want, no real money will be deducted! ✅

