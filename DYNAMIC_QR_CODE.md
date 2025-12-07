# Dynamic QR Code Generation - Configured ✅

## Current Setup

Your payment server is now configured to **generate QR codes dynamically** for each payment.

### How It Works

1. **Each Payment Gets Unique QR Code:**
   - When user selects "UPI QR Code" payment method
   - Backend creates a new QR code via Razorpay API
   - QR code has the exact amount (consultation fee + 2% GST)
   - QR code is single-use (one payment per QR code)

2. **QR Code Properties:**
   - **Type:** UPI QR Code
   - **Usage:** Single Use (can only be paid once)
   - **Amount:** Fixed (exact amount pre-set)
   - **Tracking:** Each QR code tracked separately in Razorpay dashboard

3. **Benefits:**
   - ✅ Each consultation has unique QR code
   - ✅ Fixed amount - no user input needed
   - ✅ Better payment tracking and reconciliation
   - ✅ Prevents duplicate payments
   - ✅ Professional Razorpay-branded QR codes

## Configuration

**Server (.env):**
```env
# Leave DEFAULT_QR_CODE_ID empty or commented out for dynamic generation
# DEFAULT_QR_CODE_ID=
```

**Server Code:**
- Default behavior: `useExisting = false` (creates new QR codes)
- Each payment request creates a new QR code with fixed amount

## QR Code Details

When a QR code is created:
- **ID:** Unique ID like `qr_RonXXXXXX`
- **Amount:** Exact amount in paise (consultation fee + GST)
- **Description:** Consultation details
- **Status:** Active
- **Image URL:** Razorpay QR code image
- **Single Use:** Can only be paid once

## Viewing QR Codes

All dynamically generated QR codes appear in your Razorpay Dashboard:
- **Location:** Dashboard → QR Codes
- **See:** All QR codes with payment status
- **Track:** Which QR code was paid and when

## Example Flow

1. User books consultation: ₹500
2. System calculates: ₹500 + 2% GST = ₹510
3. QR code created: `qr_RonXXXXXX` for ₹510
4. User scans QR code
5. Payment processed: ₹510 (exact amount, no user input)
6. QR code marked as paid in dashboard

## Testing

Test the dynamic generation:
1. Book a consultation
2. Go to payment screen
3. Select "UPI QR Code"
4. Check Razorpay dashboard → QR Codes
5. You'll see a new QR code created with the exact amount

## Status

✅ **Dynamic QR Code Generation: ENABLED**
- Each payment creates new QR code
- Fixed amount pre-set
- Single use per QR code
- Tracked in Razorpay dashboard

