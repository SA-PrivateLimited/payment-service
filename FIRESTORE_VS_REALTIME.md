# Firestore vs Realtime Database - Important Difference

## The Problem

You're seeing a parse error because:
- ❌ You're in **Realtime Database** rules section
- ✅ But using **Firestore** security rules syntax

These are **two different Firebase products** with different syntax!

## Solution: Use Firestore Database

The payment-service is configured to use **Firestore Database**, not Realtime Database.

### Step 1: Navigate to Firestore Database

1. In Firebase Console, click **"Firestore Database"** in the left sidebar (NOT "Realtime Database")
2. If you see "Create Database" button, click it
3. If you see the data view, you're in the right place

### Step 2: Enable Firestore (if not already enabled)

1. Click **"Create Database"** button
2. Choose **"Start in test mode"**
3. Select location: **"United States (us-central1)"**
4. Click **"Enable"**

### Step 3: Set Firestore Security Rules

1. Click the **"Rules"** tab in Firestore Database
2. Use these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection - server writes via Admin SDK, users can read
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Admin SDK can write
    }
    
    // Payments collection - server writes via Admin SDK, users can read
    match /payments/{paymentId} {
      allow read: if request.auth != null;
      allow write: if false; // Only Admin SDK can write
    }
  }
}
```

3. Click **"Publish"**

## Key Differences

### Realtime Database
- URL: `/database/payment-service-845be-default-rtdb/`
- Rules syntax: JSON-based rules
- Example: `{ "rules": { ".read": true, ".write": false } }`

### Firestore Database
- URL: `/firestore/`
- Rules syntax: Uses `service cloud.firestore` and `match` statements
- Example: `match /payments/{paymentId} { allow read: if request.auth != null; }`

## Why Firestore?

The payment-service uses **Firestore** because:
- ✅ Better for structured data (orders, payments)
- ✅ Better querying capabilities
- ✅ More scalable
- ✅ Better integration with Firebase Admin SDK

## Current Status

- ✅ Payment-service server: Configured for Firestore
- ✅ Firebase Admin SDK: Configured for Firestore
- ⏳ Firestore Database: Needs to be enabled
- ⏳ Firestore Rules: Need to be set

## Quick Fix

1. Go to: https://console.firebase.google.com/project/payment-service-845be/firestore
2. Click **"Create Database"** (if not already created)
3. Choose **"Start in test mode"**
4. Select location and enable
5. Go to **Rules** tab
6. Paste the Firestore rules above
7. Click **"Publish"**

---

**Remember:** Always use **Firestore Database**, not Realtime Database for payment-service!

