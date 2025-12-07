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
const admin = require('firebase-admin');
const path = require('path');
const https = require('https');

// Load modular services
const {getAppConfig, mergeWithDefault} = require('./src/app-config');
const {sendPaymentNotification} = require('./src/notifications');
const {getOrderDetails, updateOrderPaymentStatus} = require('./src/order-update');

const app = express();

/**
 * Middleware to extract app ID from request
 */
function getAppIdFromRequest(req) {
  // Priority 1: Header
  if (req.headers['x-app-id']) {
    return req.headers['x-app-id'];
  }
  
  // Priority 2: Query parameter
  if (req.query.appId) {
    return req.query.appId;
  }
  
  // Priority 3: Request body notes
  if (req.body?.notes?.appId) {
    return req.body.notes.appId;
  }
  
  // Priority 4: Request body (for verify endpoint)
  if (req.body?.appId) {
    return req.body.appId;
  }
  
  return null;
}

// Initialize Firebase Admin SDK (optional - only if service account is provided)
// Supports multiple Firebase projects:
// 1. Payment-service Firebase (for storing payment records)
// 2. MediFind Firebase (for updating consultations)
let database = null;
let firestore = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.FIREBASE_PROJECT_ID) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Use service account key file
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = require(serviceAccountPath);
      
      // Initialize default app (for payment-service Firebase)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`,
      });
      
      // If service account is for MediFind Firebase, also initialize Firestore
      if (serviceAccount.project_id === 'medifind-doctor') {
        firestore = admin.firestore();
        console.log('✅ MediFind Firebase (medifind-doctor) initialized - Firestore enabled');
      }
      
      database = admin.database();
      console.log('✅ Firebase Admin initialized successfully');
      console.log(`   Project: ${serviceAccount.project_id}`);
      console.log(`   Realtime Database: Enabled`);
      console.log(`   Firestore: ${firestore ? 'Enabled' : 'Disabled'}`);
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      // Use individual credentials from environment variables
      const projectId = process.env.FIREBASE_PROJECT_ID;
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com/`,
      });
      
      // If project is MediFind, enable Firestore
      if (projectId === 'medifind-doctor') {
        firestore = admin.firestore();
        console.log('✅ MediFind Firebase (medifind-doctor) initialized - Firestore enabled');
      }
      
      database = admin.database();
      console.log('✅ Firebase Admin initialized successfully');
      console.log(`   Project: ${projectId}`);
      console.log(`   Realtime Database: Enabled`);
      console.log(`   Firestore: ${firestore ? 'Enabled' : 'Disabled'}`);
    }
  } catch (error) {
    console.warn('⚠️  Firebase Admin initialization failed:', error.message);
    console.warn('⚠️  Payment records will not be saved. Continuing without Firebase...');
  }
} else {
  console.log('ℹ️  Firebase Admin not configured. Payment records will not be saved.');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Middleware to attach app config to request
app.use((req, res, next) => {
  const appId = getAppIdFromRequest(req);
  req.appConfig = mergeWithDefault(getAppConfig(appId));
  req.appId = appId || 'default';
  next();
});

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

/**
 * Helper function to save payment record to Realtime Database
 */
async function savePaymentToDatabase(paymentData) {
  if (!database) {
    return; // Firebase not configured, skip
  }

  try {
    const paymentRecord = {
      razorpayPaymentId: paymentData.razorpay_payment_id,
      razorpayOrderId: paymentData.razorpay_order_id,
      razorpaySignature: paymentData.razorpay_signature,
      amount: paymentData.amount || null,
      amountInRupees: paymentData.amount ? paymentData.amount / 100 : null,
      status: 'completed',
      verified: true,
      consultationId: paymentData.consultationId || null,
      notes: paymentData.notes || {},
      createdAt: admin.database.ServerValue.TIMESTAMP,
      verifiedAt: admin.database.ServerValue.TIMESTAMP,
    };

    // Save to payments node in Realtime Database
    const paymentRef = database.ref('payments').push();
    await paymentRef.set(paymentRecord);

    // If consultationId exists, update consultation node
    if (paymentData.consultationId) {
      await database.ref(`consultations/${paymentData.consultationId}`).update({
        paymentStatus: 'paid',
        paymentId: paymentData.razorpay_payment_id,
        paidAt: admin.database.ServerValue.TIMESTAMP,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      });
    }

    console.log(`✅ Payment record saved to Realtime Database: ${paymentData.razorpay_payment_id}`);
  } catch (error) {
    console.error('❌ Error saving payment to Realtime Database:', error);
    // Don't throw - payment verification succeeded, database save is secondary
  }
}

/**
 * Helper function to send OneSignal notification
 */
async function sendOneSignalNotification(userIds, title, body, data = {}) {
  try {
    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || 'b0020b77-3e0c-43c5-b92e-912b1cec1623';
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || 
      'os_v2_app_wabaw5z6brb4lojosevrz3awemukckhdmqsunhvjcdih2ety74puooxs7oddp6jvdj2wudiztxma4nh2e5bpcoariibnh644xmslyga';

    if (!userIds || userIds.length === 0) {
      console.log('No user IDs provided for notification');
      return;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_external_user_ids: userIds,
        headings: {en: title},
        contents: {en: body},
        data: data,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ OneSignal API error:', result);
      return;
    }

    console.log(`✅ Notification sent to ${result.recipients || 0} recipients`);
  } catch (error) {
    console.error('❌ Error sending OneSignal notification:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Helper function to get consultation details from Firebase
 */
async function getConsultationDetails(consultationId) {
  if (!database) {
    return null;
  }

  try {
    // Try Firestore first (if available)
    if (admin.firestore) {
      const firestore = admin.firestore();
      const consultationDoc = await firestore.collection('consultations').doc(consultationId).get();
      if (consultationDoc.exists) {
        return {id: consultationDoc.id, ...consultationDoc.data()};
      }
    }

    // Fallback to Realtime Database
    const consultationSnapshot = await database.ref(`consultations/${consultationId}`).once('value');
    if (consultationSnapshot.exists()) {
      return {id: consultationId, ...consultationSnapshot.val()};
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching consultation:', error);
    return null;
  }
}

/**
 * Helper function to update consultation payment status
 * Tries Firestore first (MediFind uses Firestore), then falls back to Realtime Database
 */
async function updateConsultationPaymentStatus(consultationId, paymentStatus, paymentId = null) {
  if (!database) {
    return;
  }

  try {
    const updateData = {
      paymentStatus: paymentStatus,
      updatedAt: admin.firestore ? admin.firestore.FieldValue.serverTimestamp() : admin.database.ServerValue.TIMESTAMP,
    };

    if (paymentId) {
      updateData.paymentId = paymentId;
    }

    if (paymentStatus === 'paid') {
      updateData.paidAt = admin.firestore ? admin.firestore.FieldValue.serverTimestamp() : admin.database.ServerValue.TIMESTAMP;
    }

    // Try Firestore first (MediFind uses Firestore)
    try {
      const firestore = admin.firestore();
      await firestore.collection('consultations').doc(consultationId).update(updateData);
      console.log(`✅ Consultation ${consultationId} updated in Firestore (paymentStatus: ${paymentStatus})`);
      return;
    } catch (firestoreError) {
      // Firestore not available or error, try Realtime Database
      console.log('Firestore update failed, trying Realtime Database');
    }

    // Fallback to Realtime Database
    await database.ref(`consultations/${consultationId}`).update(updateData);
    console.log(`✅ Consultation ${consultationId} updated in Realtime Database (paymentStatus: ${paymentStatus})`);
  } catch (error) {
    console.error('❌ Error updating consultation:', error);
    // Don't throw - payment verification succeeded, consultation update is secondary
  }
}

/**
 * Helper function to send payment notifications (using modular service)
 */
async function sendPaymentNotifications(appConfig, consultationId, paymentStatus, amount, paymentId = null) {
  try {
    const orderData = await getOrderDetails(appConfig, consultationId);
    if (!orderData) {
      console.warn(`⚠️ Order/Consultation ${consultationId} not found, skipping notifications`);
      return;
    }

    // Collect user IDs to notify
    const userIds = [];
    
    // Add patient/user ID (support multiple field names)
    if (orderData.patientId) {
      userIds.push(orderData.patientId);
    } else if (orderData.userId) {
      userIds.push(orderData.userId);
    } else if (orderData.customerId) {
      userIds.push(orderData.customerId);
    }

    // Add doctor/provider ID (support multiple field names)
    if (orderData.doctorId) {
      userIds.push(orderData.doctorId);
    } else if (orderData.providerId) {
      userIds.push(orderData.providerId);
    } else if (orderData.sellerId) {
      userIds.push(orderData.sellerId);
    }

    // Get admin IDs (if needed - app-specific)
    // This is optional and can be configured per app

    // Send notification using modular service
    await sendPaymentNotification(
      appConfig,
      consultationId,
      paymentStatus,
      amount,
      paymentId,
      orderData
    );
  } catch (error) {
    console.error('❌ Error sending payment notifications:', error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Helper function to save order record to Realtime Database
 */
async function saveOrderToDatabase(orderData, notes = {}) {
  if (!database) {
    return; // Firebase not configured, skip
  }

  try {
    const orderRecord = {
      razorpayOrderId: orderData.id,
      amount: orderData.amount,
      amountInRupees: orderData.amount / 100,
      currency: orderData.currency,
      receipt: orderData.receipt,
      status: orderData.status,
      consultationId: notes.consultationId || null,
      notes: notes,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    };

    const orderRef = database.ref('orders').push();
    await orderRef.set(orderRecord);
    console.log(`✅ Order record saved to Realtime Database: ${orderData.id}`);
  } catch (error) {
    console.error('❌ Error saving order to Realtime Database:', error);
    // Don't throw - order creation succeeded, database save is secondary
  }
}

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

    // Save order to Realtime Database (async, don't wait)
    saveOrderToDatabase(order, notes).catch(err => {
      console.error('Failed to save order to Realtime Database:', err);
    });

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
 *   razorpay_signature: 'signature',
 *   consultationId: 'consultation_id' (optional),
 *   amount: 50000 (optional - amount in paise),
 *   notes: {} (optional),
 *   isTestMode: true (optional - if true, will book consultation even if payment fails)
 * }
 */
app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      consultationId,
      amount,
      notes = {},
      isTestMode = false, // Default to false, set to true for test mode
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
    const isTestPayment = razorpay_payment_id.startsWith('pay_test_') || 
                          process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') || 
                          isTestMode;

    if (isSignatureValid) {
      console.log(`✅ Payment verified successfully: ${razorpay_payment_id}`);

      // Save payment record to Realtime Database (async, don't wait)
      const paymentData = {
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        razorpay_signature: razorpay_signature,
        amount: amount || null,
        consultationId: consultationId || null,
        notes: notes || {},
      };
      savePaymentToDatabase(paymentData).catch(err => {
        console.error('Failed to save payment to Realtime Database:', err);
      });

      // Update order/consultation payment status (using app config)
      if (consultationId) {
        const appConfig = req.appConfig;
        await updateOrderPaymentStatus(appConfig, consultationId, 'paid', razorpay_payment_id);
        
        // Send notifications to patient, doctor, and admin (using app config)
        sendPaymentNotifications(appConfig, consultationId, 'paid', amount, razorpay_payment_id).catch(err => {
          console.error('Failed to send payment notifications:', err);
        });
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        verified_at: new Date().toISOString(),
      });
    } else {
      console.error(`❌ Payment verification failed: ${razorpay_payment_id}`);

      // In test mode, still book consultation even if payment fails
      const appConfig = req.appConfig;
      const shouldBookOnFailure = appConfig.testMode?.bookOnPaymentFailure !== false; // Default true
      
      if ((isTestPayment || appConfig.testMode?.autoDetect) && consultationId && shouldBookOnFailure) {
        console.log(`⚠️ Test mode: Payment failed but booking consultation ${consultationId}`);
        
        // Update consultation payment status to 'pending' (using app config)
        await updateOrderPaymentStatus(appConfig, consultationId, 'pending', null);
        
        // Send notifications about payment failure (but consultation still booked)
        sendPaymentNotifications(appConfig, consultationId, 'failed', amount, razorpay_payment_id).catch(err => {
          console.error('Failed to send payment failure notifications:', err);
        });

        res.json({
          success: false,
          error: 'Invalid payment signature (test mode)',
          payment_id: razorpay_payment_id,
          consultation_booked: true, // Indicate consultation is still booked
          message: 'Payment verification failed, but consultation has been booked (test mode)',
        });
      } else {
      res.status(400).json({
        success: false,
        error: 'Invalid payment signature',
        payment_id: razorpay_payment_id,
      });
      }
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
app.post('/api/payment/webhook', express.raw({type: 'application/json'}), async (req, res) => {
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
        
        // Get consultation ID from payment notes
        const consultationId = payment.notes?.consultationId || payment.notes?.consultation_id;
        
        // Save payment to Realtime Database
        if (database) {
          const paymentData = {
            razorpay_payment_id: payment.id,
            razorpay_order_id: payment.order_id,
            amount: payment.amount,
            status: 'completed',
            method: payment.method,
            consultationId: consultationId,
            notes: payment.notes || {},
          };
          savePaymentToDatabase(paymentData).catch(err => {
            console.error('Failed to save webhook payment to Realtime Database:', err);
          });
        }

        // Update consultation and send notifications (using app config)
        if (consultationId) {
          await updateOrderPaymentStatus(appConfig, consultationId, 'paid', payment.id);
          sendPaymentNotifications(appConfig, consultationId, 'paid', payment.amount, payment.id).catch(err => {
            console.error('Failed to send payment success notifications:', err);
          });
        }
        break;

      case 'payment.failed':
        const failedPayment = event.payload.payment.entity;
        console.log(`❌ Payment failed: ${failedPayment.id}`);
        
        // Get consultation ID and app ID from payment notes
        const failedConsultationId = failedPayment.notes?.consultationId || failedPayment.notes?.consultation_id;
        const appId = failedPayment.notes?.appId || 'default';
        const appConfig = mergeWithDefault(getAppConfig(appId));
        const isTestMode = failedPayment.id.startsWith('pay_test_') || 
                          process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') ||
                          appConfig.testMode?.autoDetect;
        
        // Save failed payment to Realtime Database
        if (database) {
          try {
            const failedPaymentRef = database.ref('payments').push();
            await failedPaymentRef.set({
              razorpayPaymentId: failedPayment.id,
              razorpayOrderId: failedPayment.order_id,
              amount: failedPayment.amount,
              amountInRupees: failedPayment.amount / 100,
              status: 'failed',
              errorCode: failedPayment.error_code,
              errorDescription: failedPayment.error_description,
              consultationId: failedConsultationId,
              createdAt: admin.database.ServerValue.TIMESTAMP,
            });
          } catch (error) {
            console.error('Failed to save failed payment to Realtime Database:', error);
          }
        }

        // In test mode, still book consultation even if payment fails
        if (failedConsultationId) {
          const shouldBookOnFailure = appConfig.testMode?.bookOnPaymentFailure !== false; // Default true
          
          if (isTestMode && shouldBookOnFailure) {
            console.log(`⚠️ Test mode: Payment failed but keeping consultation ${failedConsultationId} booked`);
            await updateOrderPaymentStatus(appConfig, failedConsultationId, 'pending', null);
          } else {
            await updateOrderPaymentStatus(appConfig, failedConsultationId, 'failed', null);
          }
          
          // Send notifications about payment failure (using app config)
          sendPaymentNotifications(appConfig, failedConsultationId, 'failed', failedPayment.amount, failedPayment.id).catch(err => {
            console.error('Failed to send payment failure notifications:', err);
          });
        }
        break;

      case 'order.paid':
        const order = event.payload.order.entity;
        console.log(`✅ Order paid: ${order.id}`);
        
        // Update order status in Realtime Database
        if (database) {
          try {
            const ordersSnapshot = await database.ref('orders').orderByChild('razorpayOrderId').equalTo(order.id).once('value');
            
            if (ordersSnapshot.exists()) {
              const orderKey = Object.keys(ordersSnapshot.val())[0];
              await database.ref(`orders/${orderKey}`).update({
                status: 'paid',
                paidAt: admin.database.ServerValue.TIMESTAMP,
              });
            }
          } catch (error) {
            console.error('Failed to update order in Realtime Database:', error);
          }
        }
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
  console.log(`🔥 Firebase Admin: ${database ? '✅ Connected (Realtime Database)' : '⚠️  Not configured (payment records will not be saved)'}`);
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

