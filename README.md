# Razorpay Payment Server

A reusable, secure Razorpay payment server that can be used by multiple applications. All sensitive payment operations (order creation, signature verification) are handled server-side for maximum security.

## Features

- ✅ **Secure Order Creation** - Orders are created server-side using Razorpay API
- ✅ **Payment Verification** - Server-side signature verification prevents fraud
- ✅ **UPI QR Code Generation** - Generate UPI payment links for QR codes
- ✅ **Webhook Support** - Handle Razorpay webhooks for payment status updates
- ✅ **Multi-App Ready** - Can be used by multiple applications
- ✅ **CORS Configuration** - Configurable CORS for security
- ✅ **Error Handling** - Comprehensive error handling and logging

## Quick Start

### 1. Installation

```bash
cd payment-service
npm install
```

### 2. Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` and add your Razorpay credentials:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
MERCHANT_NAME=YourAppName
MERCHANT_UPI_ID=yourbusiness@paytm
```

### 3. Run Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and version.

### Create Order
```
POST /api/payment/create-order
Content-Type: application/json

Body:
{
  "amount": 50000,        // Amount in paise (₹500 = 50000)
  "currency": "INR",      // Optional, defaults to INR
  "receipt": "order_123", // Optional
  "notes": {              // Optional metadata
    "consultationId": "123",
    "appName": "MediFind"
  }
}

Response:
{
  "success": true,
  "order": {
    "id": "order_xxx",
    "amount": 50000,
    "currency": "INR",
    "status": "created"
  }
}
```

### Verify Payment
```
POST /api/payment/verify
Content-Type: application/json

Body:
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}

Response:
{
  "success": true,
  "message": "Payment verified successfully",
  "payment_id": "pay_xxx",
  "order_id": "order_xxx"
}
```

### Generate UPI Link
```
POST /api/payment/generate-upi-link
Content-Type: application/json

Body:
{
  "amount": 50000,                    // Amount in paise
  "upiId": "merchant@paytm",          // Optional, uses env var if not provided
  "description": "Payment for order", // Optional
  "merchantName": "AppName"           // Optional, uses env var if not provided
}

Response:
{
  "success": true,
  "upiLink": "upi://pay?pa=...",
  "transactionId": "TXNxxx",
  "amount": 50000,
  "amountInRupees": 500
}
```

### Webhook Handler
```
POST /api/payment/webhook
Content-Type: application/json
X-Razorpay-Signature: signature

Body: (Razorpay webhook payload)

Response:
{
  "received": true
}
```

## Integration with Client Apps

### React Native Example

Update your client-side payment service:

```typescript
const API_BASE_URL = 'http://your-server.com';

// Create order
const createOrder = async (amount: number) => {
  const response = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  return response.json();
};

// Verify payment
const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
  const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    }),
  });
  return response.json();
};
```

## Deployment

### Railway.app

1. Connect your GitHub repository
2. Select the `payment-service` directory as root
3. Set environment variables in Railway dashboard
4. Deploy!

### Render.com

1. Create new Web Service
2. Connect repository and set root directory to `payment-service`
3. Build command: `npm install`
4. Start command: `npm start`
5. Set environment variables
6. Deploy!

### Fly.io

```bash
cd payment-service
fly launch
# Follow prompts and set environment variables
fly deploy
```

### Heroku

```bash
cd payment-service
heroku create your-app-name
heroku config:set RAZORPAY_KEY_ID=xxx
heroku config:set RAZORPAY_KEY_SECRET=xxx
git push heroku main
```

## Security Best Practices

1. **Never expose Key Secret** - Keep `RAZORPAY_KEY_SECRET` only on server
2. **Use HTTPS** - Always use HTTPS in production
3. **Verify Signatures** - Always verify payment signatures server-side
4. **Configure CORS** - Set `ALLOWED_ORIGINS` in production
5. **Enable Webhooks** - Use webhooks for payment status updates
6. **Log Security Events** - Monitor logs for suspicious activity

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RAZORPAY_KEY_ID` | Yes | Your Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Your Razorpay Key Secret |
| `MERCHANT_NAME` | No | Merchant name for UPI links |
| `MERCHANT_UPI_ID` | No | Merchant UPI ID for UPI links |
| `RAZORPAY_WEBHOOK_SECRET` | No | Webhook secret for signature verification |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed origins |

## Troubleshooting

### Server won't start
- Check if `.env` file exists and has required variables
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correct
- Check if port 3001 is available

### Payment verification fails
- Ensure signature is generated correctly on client
- Verify `RAZORPAY_KEY_SECRET` matches the one used in Razorpay Dashboard
- Check that order ID and payment ID are correct

### CORS errors
- Add your client app URL to `ALLOWED_ORIGINS` in `.env`
- For development, you can temporarily set `ALLOWED_ORIGINS=*` (not recommended for production)

## License

MIT

# payment-service
