/**
 * Order/Consultation Update Service - Multi-App Support
 * Handles updating orders/consultations in different apps
 */

const admin = require('firebase-admin');

/**
 * Get order/consultation details from Firebase
 * Supports both Firestore and Realtime Database
 */
async function getOrderDetails(appConfig, orderId) {
  try {
    const orderUpdateConfig = appConfig.orderUpdate || {};
    
    if (!orderUpdateConfig.enabled) {
      return null;
    }

    // Try custom endpoint first
    if (orderUpdateConfig.endpoint && !orderUpdateConfig.useFirebase) {
      const response = await fetch(`${orderUpdateConfig.endpoint}/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
    }

    // Use Firebase
    if (orderUpdateConfig.useFirebase) {
      const collections = orderUpdateConfig.collections || {};
      const consultationCollection = collections.consultations || 'consultations';
      const ordersCollection = collections.orders || 'orders';

      // Try Firestore first
      try {
        const firestore = admin.firestore();
        
        // Try consultations collection
        const consultationDoc = await firestore.collection(consultationCollection).doc(orderId).get();
        if (consultationDoc.exists) {
          const data = consultationDoc.data();
          return {
            id: consultationDoc.id,
            ...data,
            scheduledTime: data.scheduledTime?.toDate ? data.scheduledTime.toDate() : data.scheduledTime,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          };
        }

        // Try orders collection
        const orderDoc = await firestore.collection(ordersCollection).doc(orderId).get();
        if (orderDoc.exists) {
          const data = orderDoc.data();
          return {
            id: orderDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          };
        }
      } catch (firestoreError) {
        // Firestore not available, try Realtime Database
        console.log('Firestore not available, trying Realtime Database');
      }

      // Try Realtime Database
      try {
        const database = admin.database();
        
        // Try consultations node
        const consultationSnapshot = await database.ref(`${consultationCollection}/${orderId}`).once('value');
        if (consultationSnapshot.exists()) {
          return {id: orderId, ...consultationSnapshot.val()};
        }

        // Try orders node
        const orderSnapshot = await database.ref(`${ordersCollection}/${orderId}`).once('value');
        if (orderSnapshot.exists()) {
          return {id: orderId, ...orderSnapshot.val()};
        }
      } catch (dbError) {
        console.error('Realtime Database error:', dbError);
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    return null;
  }
}

/**
 * Update order/consultation payment status
 * Supports both Firestore and Realtime Database, or custom endpoint
 */
async function updateOrderPaymentStatus(appConfig, orderId, paymentStatus, paymentId = null) {
  try {
    const orderUpdateConfig = appConfig.orderUpdate || {};
    
    if (!orderUpdateConfig.enabled) {
      return;
    }

    const updateData = {
      paymentStatus: paymentStatus,
      updatedAt: admin.firestore 
        ? admin.firestore.FieldValue.serverTimestamp() 
        : admin.database.ServerValue.TIMESTAMP,
    };

    if (paymentId) {
      updateData.paymentId = paymentId;
    }

    if (paymentStatus === 'paid') {
      updateData.paidAt = admin.firestore 
        ? admin.firestore.FieldValue.serverTimestamp() 
        : admin.database.ServerValue.TIMESTAMP;
    }

    // Try custom endpoint first
    if (orderUpdateConfig.endpoint && !orderUpdateConfig.useFirebase) {
      await fetch(`${orderUpdateConfig.endpoint}/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      console.log(`✅ Order ${orderId} updated via custom endpoint`);
      return;
    }

    // Use Firebase
    if (orderUpdateConfig.useFirebase) {
      const collections = orderUpdateConfig.collections || {};
      const consultationCollection = collections.consultations || 'consultations';
      const ordersCollection = collections.orders || 'orders';

      // Try Firestore first
      try {
        const firestore = admin.firestore();
        
        // Try consultations collection
        const consultationRef = firestore.collection(consultationCollection).doc(orderId);
        const consultationDoc = await consultationRef.get();
        if (consultationDoc.exists) {
          await consultationRef.update(updateData);
          console.log(`✅ Consultation ${orderId} updated in Firestore (paymentStatus: ${paymentStatus})`);
          return;
        }

        // Try orders collection
        const orderRef = firestore.collection(ordersCollection).doc(orderId);
        const orderDoc = await orderRef.get();
        if (orderDoc.exists) {
          await orderRef.update(updateData);
          console.log(`✅ Order ${orderId} updated in Firestore (paymentStatus: ${paymentStatus})`);
          return;
        }
      } catch (firestoreError) {
        console.log('Firestore update failed, trying Realtime Database');
      }

      // Try Realtime Database
      try {
        const database = admin.database();
        
        // Try consultations node
        const consultationRef = database.ref(`${consultationCollection}/${orderId}`);
        const consultationSnapshot = await consultationRef.once('value');
        if (consultationSnapshot.exists()) {
          await consultationRef.update(updateData);
          console.log(`✅ Consultation ${orderId} updated in Realtime Database (paymentStatus: ${paymentStatus})`);
          return;
        }

        // Try orders node
        const orderRef = database.ref(`${ordersCollection}/${orderId}`);
        const orderSnapshot = await orderRef.once('value');
        if (orderSnapshot.exists()) {
          await orderRef.update(updateData);
          console.log(`✅ Order ${orderId} updated in Realtime Database (paymentStatus: ${paymentStatus})`);
          return;
        }
      } catch (dbError) {
        console.error('Realtime Database update error:', dbError);
      }
    }
  } catch (error) {
    console.error('❌ Error updating order payment status:', error);
    // Don't throw - payment verification succeeded, order update is secondary
  }
}

module.exports = {
  getOrderDetails,
  updateOrderPaymentStatus,
};

