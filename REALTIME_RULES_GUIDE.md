# Realtime Database Security Rules Guide

## Quick Setup

### Option 1: Simple Rules (Recommended for Start)

Use this for development/testing. Allows authenticated users to read, but only server (Admin SDK) can write:

```json
{
  "rules": {
    "orders": {
      ".read": "auth != null",
      ".write": false
    },
    "payments": {
      ".read": "auth != null",
      ".write": false
    },
    "consultations": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

**What this does:**
- ✅ Authenticated users can **read** orders and payments
- ✅ Only **server (Admin SDK)** can write orders and payments (bypasses rules)
- ✅ Authenticated users can **read/write** consultations

### Option 2: Test Mode (Development Only)

**⚠️ WARNING: Only use for development/testing!**

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**What this does:**
- ✅ **Anyone** can read/write (no security)
- ⚠️ **Use only for testing** - Remove before production!

### Option 3: Production Rules (Secure)

More secure rules with user-specific access:

```json
{
  "rules": {
    "orders": {
      ".read": "auth != null",
      ".write": false,
      "$orderId": {
        ".read": "auth != null",
        ".write": false
      }
    },
    "payments": {
      ".read": "auth != null",
      ".write": false,
      "$paymentId": {
        ".read": "auth != null",
        ".write": false
      }
    },
    "consultations": {
      ".read": "auth != null",
      ".write": "auth != null && (root.child('consultations').child($consultationId).child('userId').val() === auth.uid || root.child('consultations').child($consultationId).child('doctorId').val() === auth.uid)",
      "$consultationId": {
        ".read": "auth != null",
        ".write": "auth != null && (data.child('userId').val() === auth.uid || data.child('doctorId').val() === auth.uid || newData.child('paymentStatus').exists())"
      }
    }
  }
}
```

## How to Apply Rules

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/project/payment-service-845be
2. Click **"Realtime Database"** in left sidebar
3. Click **"Rules"** tab

### Step 2: Paste Rules
1. Copy one of the rule sets above
2. Paste into the rules editor
3. Click **"Publish"**

### Step 3: Verify
- Rules should save without errors
- You'll see "Rules published successfully"

## Rule Explanation

### Basic Syntax

```json
{
  "rules": {
    "path": {
      ".read": "condition",
      ".write": "condition"
    }
  }
}
```

### Common Conditions

| Condition | Meaning |
|-----------|---------|
| `true` | Allow everyone |
| `false` | Deny everyone |
| `auth != null` | Only authenticated users |
| `auth.uid == 'user123'` | Only specific user |
| `data.child('userId').val() == auth.uid` | User owns the data |

### Variables

- `$variable` - Wildcard variable (e.g., `$orderId`)
- `auth` - Authentication object
- `data` - Existing data
- `newData` - New data being written
- `root` - Root of database

## Important Notes

### Server Writes (Admin SDK)

⚠️ **Important:** The payment-service server uses Firebase Admin SDK, which **bypasses all security rules**. This means:

- ✅ Server can **always write** regardless of rules
- ✅ Rules only apply to **client-side access**
- ✅ Set `.write: false` for `orders` and `payments` to prevent client writes
- ✅ Server writes will still work because Admin SDK bypasses rules

### Why `.write: false` Works

Even though `.write: false` denies writes, the server can still write because:
- Admin SDK uses **service account credentials**
- Service accounts have **admin privileges**
- Admin privileges **bypass security rules**

This is exactly what you want:
- ✅ Server can write payment records securely
- ✅ Clients cannot write payment records directly
- ✅ Clients can read payment records (if authenticated)

## Recommended Setup

### For Development:
Use **Option 1: Simple Rules** (above)

### For Production:
Use **Option 3: Production Rules** (above)

### For Testing Only:
Use **Option 2: Test Mode** (temporary, remove before production)

## Testing Rules

### Test Read Access
```javascript
// Should work if authenticated
database.ref('orders').once('value', (snapshot) => {
  console.log(snapshot.val());
});
```

### Test Write Access
```javascript
// Should fail (client write denied)
database.ref('orders').push({ test: 'data' })
  .then(() => console.log('Write succeeded'))
  .catch((error) => console.log('Write failed:', error));
```

## Troubleshooting

### "Permission denied" errors
- Check user is authenticated (`auth != null`)
- Verify rules are published
- Check rule syntax is valid JSON

### Server can't write
- This shouldn't happen - Admin SDK bypasses rules
- Check service account is configured correctly
- Verify database URL is correct

### Rules won't save
- Check JSON syntax is valid
- Remove comments (JSON doesn't support comments)
- Use a JSON validator

## Files Included

- `REALTIME_DATABASE_RULES_SIMPLE.json` - Simple rules (recommended)
- `REALTIME_DATABASE_RULES.json` - Production rules (secure)
- `REALTIME_DATABASE_RULES_TEST_MODE.json` - Test mode (development only)

---

**Quick Start:** Copy `REALTIME_DATABASE_RULES_SIMPLE.json` and paste into Firebase Console → Realtime Database → Rules tab → Publish

