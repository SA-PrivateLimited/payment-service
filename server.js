/**
 * Razorpay Payment Server - Reusable for Multiple Apps
 * 
 * This server handles Razorpay payment operations securely on the backend:
 * - Creating payment orders
 * - Verifying payment signatures
 * - Generating UPI payment links
 * - Handling webhooks
 * 
 * Setup:
 * 1. Install dependencies: npm install
 * 2. Copy env.example to .env and configure
 * 3. Start server: npm start
 * 
 * Deploy to:
 * - Railway.app (railway.app)
 * - Render.com (render.com)
 * - Fly.io (fly.io)
 * - Heroku (heroku.com)
 * - DigitalOcean App Platform
 * - AWS Elastic Beanstalk
 */

require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// CORS configuration - Allow requests from any origin (configure as needed)
app.use((req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*']; // Allow all origins if not specified (configure for production)

  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize Razorpay
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ ERROR: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env file');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Payment server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Razorpay Payment Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      createOrder: 'POST /api/payment/create-order',
      verifyPayment: 'POST /api/payment/verify',
      generateUPILink: 'POST /api/payment/generate-upi-link',
      webhook: 'POST /api/payment/webhook',
    },
  });
});

/**
 * Create a Razorpay order
 * POST /api/payment/create-order
 * Body: {
 *   amount: 50000, // Amount in paise (50000 = ₹500)
 *   currency: 'INR',
 *   receipt: 'order_receipt_id', // Optional
 *   notes: { // Optional metadata
 *     consultationId: 'consultation_id',
 *     description: 'Consultation with Dr. Name',
 *     appName: 'MediFind'
 *   }
 * }
 */
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const {amount, currency = 'INR', receipt, notes = {}} = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least ₹1 (100 paise) and must be a number',
      });
    }

    // Validate currency (Razorpay primarily supports INR)
    if (currency !== 'INR') {
      return res.status(400).json({
        success: false,
        error: 'Currently only INR currency is supported',
      });
    }

    // Create order
    const order = await razorpay.orders.create({
      amount: Math.round(amount), // Ensure amount is an integer (paise)
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes: notes,
    });

    console.log(`✅ Order created: ${order.id} for amount: ₹${amount / 100}`);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order',
      details: error.error?.description || null,
    });
  }
});

/**
 * Verify payment signature
 * POST /api/payment/verify
 * Body: {
 *   razorpay_order_id: 'order_id',
 *   razorpay_payment_id: 'payment_id',
 *   razorpay_signature: 'signature'
 * }
 */
app.post('/api/payment/verify', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payment details: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    // Create signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Verify signature
    const isSignatureValid = generatedSignature === razorpay_signature;

    if (isSignatureValid) {
      console.log(`✅ Payment verified successfully: ${razorpay_payment_id}`);
      res.json({
        success: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        verified_at: new Date().toISOString(),
      });
    } else {
      console.error(`❌ Payment verification failed: ${razorpay_payment_id}`);
      res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
        payment_id: razorpay_payment_id,
      });
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify payment',
    });
  }
});

/**
 * Get QR Code details by ID
 * GET /api/payment/qr-code/:qrCodeId
 */
app.get('/api/payment/qr-code/:qrCodeId', async (req, res) => {
  try {
    const {qrCodeId} = req.params;

    const qrCode = await razorpay.qrCode.fetch(qrCodeId);

    console.log(`✅ QR Code fetched: ${qrCodeId}`);

    res.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        type: qrCode.type,
        usage: qrCode.usage,
        payment_amount: qrCode.payment_amount,
        status: qrCode.status,
        image_url: qrCode.image_url,
        short_url: qrCode.short_url,
        upi_uri: qrCode.upi_uri,
        amount_received: qrCode.amount_received,
        amount_paid: qrCode.amount_paid,
        created_at: qrCode.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching QR code:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch QR code',
      details: error.error?.description || null,
    });
  }
});

/**
 * Generate UPI QR Code using Razorpay API
 * POST /api/payment/generate-upi-link
 * Body: {
 *   amount: 50000, // Amount in paise
 *   description: 'Consultation payment', // Optional
 *   name: 'MediFind Consultation', // Optional
 *   qrCodeId: 'qr_xxx' // Optional - if provided, fetches existing QR code instead of creating new
 * }
 */
app.post('/api/payment/generate-upi-link', async (req, res) => {
  try {
    const {
      amount,
      description = 'Payment',
      name = 'MediFind Consultation',
      notes = {},
      qrCodeId, // Optional: use existing QR code if provided
      useExisting = false, // Default to creating new QR codes dynamically
    } = req.body;

    let qrCode;

    // Use existing QR code only if explicitly requested
    if (useExisting && qrCodeId) {
      console.log(`📋 Using existing QR Code: ${qrCodeId}`);
      qrCode = await razorpay.qrCode.fetch(qrCodeId);
      console.log(`✅ QR Code fetched: ${qrCode.id} (Usage: ${qrCode.usage}, Amount: ${qrCode.payment_amount ? '₹' + qrCode.payment_amount / 100 : 'Variable'})`);
    } else {
      // Create new QR Code dynamically for each payment (default behavior)
      if (!amount || typeof amount !== 'number' || amount < 100) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be at least ₹1 (100 paise) and must be a number',
        });
      }

      const amountInRupees = amount / 100;
      console.log(`🆕 Creating new QR Code dynamically for amount: ₹${amountInRupees}`);
      
      qrCode = await razorpay.qrCode.create({
        type: 'upi_qr',
        name: name,
        usage: 'single_use', // Single use - one payment per QR code
        fixed_amount: true, // Fixed amount - amount is pre-set
        payment_amount: Math.round(amount), // Amount in paise
        description: description,
        customer_id: notes.customerId || undefined,
        notes: {
          ...notes,
          consultationId: notes.consultationId,
          createdAt: new Date().toISOString(),
        },
      });
      console.log(`✅ QR Code created dynamically: ${qrCode.id} for ₹${amountInRupees}`);
    }

    // Validate amount if provided
    if (amount && typeof amount === 'number') {
      if (qrCode.payment_amount && qrCode.payment_amount !== amount) {
        console.warn(`⚠️ QR Code has fixed amount ₹${qrCode.payment_amount / 100}, but request is for ₹${amount / 100}`);
      }
    }

    // Get QR Code image URL
    const qrCodeImage = qrCode.image_url; // PNG image URL
    const qrCodeLink = qrCode.short_url; // Short URL for the QR code
    const upiLink = qrCode.upi_uri || qrCodeLink; // UPI link for direct payment

    // For variable amount QR codes, include amount in UPI link
    let finalUpiLink = upiLink;
    if (!qrCode.payment_amount && amount) {
      // QR code has variable amount, add amount to UPI link if needed
      // Note: For Razorpay QR codes, the amount is usually not needed in the link
      // as users will enter the amount manually when scanning
      finalUpiLink = upiLink;
    }

    res.json({
      success: true,
      qrCodeId: qrCode.id,
      qrCodeImage: qrCodeImage, // Use this to display QR code image
      qrCodeLink: qrCodeLink, // Short URL for the QR code
      upiLink: finalUpiLink, // UPI link for direct payment
      amount: amount || qrCode.payment_amount || null, // Requested amount or QR code fixed amount
      amountInRupees: amount ? amount / 100 : (qrCode.payment_amount ? qrCode.payment_amount / 100 : null),
      isVariableAmount: !qrCode.payment_amount, // True if QR code accepts variable amounts
      status: qrCode.status,
      amountReceived: qrCode.amount_received || 0,
      amountPaid: qrCode.amount_paid || 0,
      usage: qrCode.usage, // 'single_use' or 'multiple_use'
    });
  } catch (error) {
    console.error('❌ Error with QR code:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process QR code',
      details: error.error?.description || null,
    });
  }
});

/**
 * Razorpay Webhook Handler
 * POST /api/payment/webhook
 * Handles payment status updates from Razorpay
 * 
 * Configure webhook in Razorpay Dashboard:
 * Settings > Webhooks > Add New Webhook
 * URL: https://your-server.com/api/payment/webhook
 * Events: payment.captured, payment.failed, order.paid
 */
app.post('/api/payment/webhook', express.raw({type: 'application/json'}), (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.warn('⚠️  Webhook secret not configured. Skipping signature verification.');
      return res.status(200).json({received: true});
    }

    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      console.error('❌ Webhook signature missing');
      return res.status(400).json({error: 'Signature missing'});
    }

    const text = req.body.toString();
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== signature) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({error: 'Invalid signature'});
    }

    const event = JSON.parse(text);
    console.log(`📥 Webhook received: ${event.event}`);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        const payment = event.payload.payment.entity;
        console.log(`✅ Payment captured: ${payment.id}, Amount: ₹${payment.amount / 100}`);
        // TODO: Update payment status in your database
        // Call your database update function here
        break;

      case 'payment.failed':
        const failedPayment = event.payload.payment.entity;
        console.log(`❌ Payment failed: ${failedPayment.id}`);
        // TODO: Handle failed payment in your database
        break;

      case 'order.paid':
        const order = event.payload.order.entity;
        console.log(`✅ Order paid: ${order.id}`);
        // TODO: Update order status in your database
        break;

      default:
        console.log(`ℹ️  Unhandled webhook event: ${event.event}`);
    }

    res.status(200).json({received: true});
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({error: 'Webhook processing failed'});
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Default QR Code ID to use (set to null to create new QR codes dynamically)
// For dynamic generation, leave this empty or set to null
const DEFAULT_QR_CODE_ID = process.env.DEFAULT_QR_CODE_ID || null;

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Payment server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Razorpay Key ID: ${process.env.RAZORPAY_KEY_ID ? '✅ Configured' : '❌ NOT CONFIGURED'}`);
  console.log(`📱 QR Code Mode: ${DEFAULT_QR_CODE_ID ? `Using existing: ${DEFAULT_QR_CODE_ID}` : '✅ Dynamic (creating new QR codes per payment)'}`);
  console.log(`🌐 Allowed Origins: ${process.env.ALLOWED_ORIGINS || 'All (*)'}`);
  console.log(`\n📚 API Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/payment/qr-code/:qrCodeId`);
  console.log(`   POST /api/payment/create-order`);
  console.log(`   POST /api/payment/verify`);
  console.log(`   POST /api/payment/generate-upi-link`);
  console.log(`   POST /api/payment/webhook\n`);
});

module.exports = app;

