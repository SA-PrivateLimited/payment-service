/**
 * App Configuration Example
 * 
 * Copy this file to config/apps.js and configure for your apps
 * Each app can have its own notification settings, Firebase config, etc.
 */

module.exports = {
  // Default app configuration
  default: {
    name: 'Default App',
    // Notification settings
    notifications: {
      enabled: true,
      provider: 'onesignal', // 'onesignal', 'fcm', 'custom', 'none'
      // OneSignal config (if using OneSignal)
      onesignal: {
        appId: process.env.ONESIGNAL_APP_ID || 'b0020b77-3e0c-43c5-b92e-912b1cec1623',
        restApiKey: process.env.ONESIGNAL_REST_API_KEY || '',
      },
      // Custom notification endpoint (if using custom provider)
      customEndpoint: null, // e.g., 'https://your-app.com/api/notifications'
    },
    // Firebase settings
    firebase: {
      // Use payment-service Firebase by default
      usePaymentServiceFirebase: true,
      // Or use app-specific Firebase
      projectId: null,
      serviceAccountPath: null,
    },
    // Order/Consultation update settings
    orderUpdate: {
      enabled: true,
      // Custom endpoint to update orders/consultations in your app
      endpoint: null, // e.g., 'https://your-app.com/api/payment/update-order'
      // Or use Firebase directly
      useFirebase: true,
      // Firebase collection names
      collections: {
        orders: 'orders',
        consultations: 'consultations',
        payments: 'payments',
        users: 'users',
      },
    },
    // Test mode settings
    testMode: {
      // Auto-detect test mode from Razorpay key
      autoDetect: true,
      // Book consultations even if payment fails in test mode
      bookOnPaymentFailure: true,
    },
  },

  // MediFind app configuration
  medifind: {
    name: 'MediFind',
    notifications: {
      enabled: true,
      provider: 'onesignal',
      onesignal: {
        appId: 'b0020b77-3e0c-43c5-b92e-912b1cec1623',
        restApiKey: process.env.ONESIGNAL_REST_API_KEY || '',
      },
    },
    firebase: {
      // MediFind uses its own Firebase project (medifind-doctor)
      usePaymentServiceFirebase: false,
      projectId: 'medifind-doctor',
      // Service account for MediFind Firebase (if different)
      serviceAccountPath: null, // Uses default if null
    },
    orderUpdate: {
      enabled: true,
      useFirebase: true,
      collections: {
        orders: 'orders',
        consultations: 'consultations',
        payments: 'payments',
        users: 'users',
      },
    },
    testMode: {
      autoDetect: true,
      bookOnPaymentFailure: true,
    },
  },

  // Add more app configurations here
  // app2: { ... },
  // app3: { ... },
};

