/**
 * Notification Service - Multi-App Support
 * Supports multiple notification providers and apps
 */

/**
 * Send notification via OneSignal
 */
async function sendOneSignalNotification(onesignalConfig, userIds, title, body, data = {}) {
  try {
    if (!userIds || userIds.length === 0) {
      console.log('No user IDs provided for notification');
      return;
    }

    const appId = onesignalConfig.appId || process.env.ONESIGNAL_APP_ID || 'b0020b77-3e0c-43c5-b92e-912b1cec1623';
    const restApiKey = onesignalConfig.restApiKey || process.env.ONESIGNAL_REST_API_KEY || '';

    if (!restApiKey) {
      console.warn('⚠️ OneSignal REST API Key not configured');
      return;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
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
    return result;
  } catch (error) {
    console.error('❌ Error sending OneSignal notification:', error);
    throw error;
  }
}

/**
 * Send notification via custom endpoint
 */
async function sendCustomNotification(endpoint, payload) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Custom notification endpoint error:', error);
      return;
    }

    console.log('✅ Notification sent via custom endpoint');
    return await response.json();
  } catch (error) {
    console.error('❌ Error sending custom notification:', error);
    throw error;
  }
}

/**
 * Send payment notification
 * @param {Object} config - App configuration
 * @param {string} consultationId - Consultation/Order ID
 * @param {string} paymentStatus - 'paid' or 'failed'
 * @param {number} amount - Amount in paise
 * @param {string} paymentId - Payment ID
 * @param {Object} consultationData - Consultation/Order data
 */
async function sendPaymentNotification(config, consultationId, paymentStatus, amount, paymentId, consultationData) {
  try {
    const notificationConfig = config.notifications || {};
    
    if (!notificationConfig.enabled) {
      console.log('Notifications disabled for this app');
      return;
    }

    const provider = notificationConfig.provider || 'onesignal';
    const amountInRupees = amount ? (amount / 100).toFixed(2) : '0.00';
    const isSuccess = paymentStatus === 'paid' || paymentStatus === 'completed';

    // Collect user IDs to notify
    const userIds = [];
    
    // Add patient/user ID
    if (consultationData.patientId) {
      userIds.push(consultationData.patientId);
    } else if (consultationData.userId) {
      userIds.push(consultationData.userId);
    }

    // Add doctor/provider ID
    if (consultationData.doctorId) {
      userIds.push(consultationData.doctorId);
    } else if (consultationData.providerId) {
      userIds.push(consultationData.providerId);
    } else if (consultationData.sellerId) {
      userIds.push(consultationData.sellerId);
    }

    // Get admin IDs from Firebase (for MediFind and other apps using Firebase)
    try {
      const admin = require('firebase-admin');
      const orderUpdateConfig = config.orderUpdate || {};
      const collections = orderUpdateConfig.collections || {};
      const usersCollection = collections.users || 'users';

      // Try Firestore first
      try {
        const firestore = admin.firestore();
        const adminSnapshot = await firestore.collection(usersCollection)
          .where('role', '==', 'admin')
          .get();
        adminSnapshot.forEach(doc => {
          userIds.push(doc.id);
        });
      } catch (firestoreError) {
        // Try Realtime Database
        try {
          const database = admin.database();
          const adminSnapshot = await database.ref(usersCollection)
            .orderByChild('role')
            .equalTo('admin')
            .once('value');
          if (adminSnapshot.exists()) {
            Object.keys(adminSnapshot.val()).forEach(adminId => {
              userIds.push(adminId);
            });
          }
        } catch (dbError) {
          // Firebase not available or error
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch admin IDs:', error);
    }

    if (userIds.length === 0) {
      console.warn('⚠️ No user IDs found for notifications');
      return;
    }

    // Prepare notification data
    const notificationData = {
      type: isSuccess ? 'payment_success' : 'payment_failed',
      consultationId: consultationId,
      orderId: consultationId, // Alias for compatibility
      paymentId: paymentId,
      amount: amount,
      amountInRupees: amountInRupees,
      status: paymentStatus,
      ...consultationData,
    };

    // Send notification based on provider
    switch (provider) {
      case 'onesignal':
        const onesignalConfig = notificationConfig.onesignal || {};
        const title = isSuccess 
          ? '✅ Payment Successful' 
          : '⚠️ Payment Failed';
        
        // Build notification body with context
        let body;
        if (isSuccess) {
          const doctorName = consultationData.doctorName || consultationData.providerName || 'provider';
          body = `Payment of ₹${amountInRupees} received for consultation with ${doctorName}`;
        } else {
          const doctorName = consultationData.doctorName || consultationData.providerName || 'provider';
          const testModeNote = config.testMode?.bookOnPaymentFailure 
            ? ' Consultation will still be booked.' 
            : '';
          body = `Payment of ₹${amountInRupees} failed for consultation with ${doctorName}.${testModeNote}`;
        }
        
        await sendOneSignalNotification(
          onesignalConfig,
          userIds,
          title,
          body,
          notificationData
        );
        break;

      case 'custom':
        if (notificationConfig.customEndpoint) {
          await sendCustomNotification(notificationConfig.customEndpoint, {
            userIds,
            title: isSuccess ? 'Payment Successful' : 'Payment Failed',
            body: notificationData,
            data: notificationData,
          });
        }
        break;

      case 'fcm':
        // FCM implementation would go here
        console.log('FCM notifications not yet implemented');
        break;

      case 'none':
        console.log('Notifications disabled');
        break;

      default:
        console.warn(`Unknown notification provider: ${provider}`);
    }
  } catch (error) {
    console.error('❌ Error sending payment notification:', error);
    // Don't throw - notifications are non-critical
  }
}

module.exports = {
  sendPaymentNotification,
  sendOneSignalNotification,
  sendCustomNotification,
};

