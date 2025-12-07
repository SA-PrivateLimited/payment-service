/**
 * App Configuration Manager
 * Loads and manages app-specific configurations
 */

const path = require('path');
const fs = require('fs');

let appConfigs = null;

/**
 * Load app configurations
 */
function loadAppConfigs() {
  if (appConfigs) {
    return appConfigs;
  }

  try {
    // Try to load from config/apps.js
    const configPath = path.resolve(__dirname, '../../config/apps.js');
    if (fs.existsSync(configPath)) {
      appConfigs = require(configPath);
      console.log('✅ Loaded app configurations from config/apps.js');
      return appConfigs;
    }
  } catch (error) {
    console.warn('⚠️ Could not load config/apps.js, using defaults');
  }

  // Default configuration
  appConfigs = {
    default: {
      name: 'Default App',
      notifications: {
        enabled: true,
        provider: 'onesignal',
        onesignal: {
          appId: process.env.ONESIGNAL_APP_ID || 'b0020b77-3e0c-43c5-b92e-912b1cec1623',
          restApiKey: process.env.ONESIGNAL_REST_API_KEY || '',
        },
      },
      firebase: {
        usePaymentServiceFirebase: true,
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

  return appConfigs;
}

/**
 * Get app configuration
 * @param {string} appId - App identifier (from request header or query param)
 */
function getAppConfig(appId = null) {
  const configs = loadAppConfigs();
  
  if (!appId) {
    return configs.default || configs.medifind || Object.values(configs)[0];
  }

  return configs[appId] || configs.default || Object.values(configs)[0];
}

/**
 * Merge app config with default config
 */
function mergeWithDefault(appConfig) {
  const defaultConfig = loadAppConfigs().default || {};
  
  return {
    ...defaultConfig,
    ...appConfig,
    notifications: {
      ...defaultConfig.notifications,
      ...appConfig.notifications,
      onesignal: {
        ...defaultConfig.notifications?.onesignal,
        ...appConfig.notifications?.onesignal,
      },
    },
    orderUpdate: {
      ...defaultConfig.orderUpdate,
      ...appConfig.orderUpdate,
      collections: {
        ...defaultConfig.orderUpdate?.collections,
        ...appConfig.orderUpdate?.collections,
      },
    },
    testMode: {
      ...defaultConfig.testMode,
      ...appConfig.testMode,
    },
  };
}

module.exports = {
  loadAppConfigs,
  getAppConfig,
  mergeWithDefault,
};

