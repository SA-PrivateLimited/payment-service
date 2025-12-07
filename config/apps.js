/**
 * App Configuration for Payment Service
 * 
 * Currently configured for MediFind
 * Add more apps as needed
 */

module.exports = {
  // Default/MediFind configuration
  default: {
    name: 'MediFind',
    notifications: {
      enabled: true,
      provider: 'onesignal',
      onesignal: {
        appId: process.env.ONESIGNAL_APP_ID || 'b0020b77-3e0c-43c5-b92e-912b1cec1623',
        restApiKey: process.env.ONESIGNAL_REST_API_KEY || '',
      },
    },
    firebase: {
      // MediFind uses its own Firebase project (medifind-doctor)
      usePaymentServiceFirebase: false,
      projectId: 'medifind-doctor',
      serviceAccountPath: null, // Uses default service account
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
      bookOnPaymentFailure: true, // Book consultation even if payment fails in test mode
    },
  },

  // MediFind explicit configuration (same as default)
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
      usePaymentServiceFirebase: false,
      projectId: 'medifind-doctor',
      serviceAccountPath: null,
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
};

