// test_auth.js - Comprehensive Unit Tests for OAuth Token Refresh, Expiration & 401 Auto-Retry Logic

const fs = require('fs');

// Storage mocks
let storageSync = {};
let storageLocal = {};
let mockLaunchWebAuthFlowUrl = null;
let mockLaunchWebAuthFlowResult = null;
let mockAuthTokenGranted = null;

global.chrome = {
  storage: {
    sync: {
      get: (keys, cb) => cb(keys.reduce((a, c) => ({ ...a, [c]: storageSync[c] }), {})),
      set: (obj, cb) => { Object.assign(storageSync, obj); if (cb) cb(); }
    },
    local: {
      get: (keys, cb) => cb(keys.reduce((a, c) => ({ ...a, [c]: storageLocal[c] }), {})),
      set: (obj, cb) => { Object.assign(storageLocal, obj); if (cb) cb(); },
      remove: (keys, cb) => { keys.forEach(k => delete storageLocal[k]); if (cb) cb(); }
    }
  },
  identity: {
    getRedirectURL: () => 'https://mock.chromiumapp.org/',
    getAuthToken: (opts, cb) => {
      if (mockAuthTokenGranted) {
        delete chrome.runtime.lastError;
        return cb(mockAuthTokenGranted);
      }
      chrome.runtime.lastError = { message: 'getAuthToken failed' };
      cb(null);
    },
    launchWebAuthFlow: (opts, cb) => {
      delete chrome.runtime.lastError;
      mockLaunchWebAuthFlowUrl = opts.url;
      if (mockLaunchWebAuthFlowResult) {
        cb(mockLaunchWebAuthFlowResult);
      } else {
        cb(null);
      }
    },
    removeCachedAuthToken: (opts, cb) => cb()
  },
  runtime: {}
};

const path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../bg-sheets.js'), 'utf8'));

async function runAuthUnitTests() {
  console.log('===============================================================');
  console.log('🧪 GlossaPop OAuth Token Expiration & Silent Refresh Test Suite');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  // TEST 1: Block silent token requests when disconnected
  try {
    storageSync = { googleAuthConnected: false };
    storageLocal = {};
    await getAuthToken(false);
    console.log('❌ [Test 1] FAIL: Expected getAuthToken(false) to throw when disconnected');
    failed++;
  } catch (err) {
    if (err.message.includes('disconnected')) {
      console.log('✅ [Test 1] PASS: Disconnected state successfully blocks silent token requests');
      passed++;
    } else {
      console.log('❌ [Test 1] FAIL: Unexpected error message:', err.message);
      failed++;
    }
  }

  // TEST 2: Use cached valid token when Date.now() < oauthTokenExpiry
  try {
    storageSync = { googleAuthConnected: true };
    storageLocal = {
      oauthToken: 'VALID_MOCK_TOKEN_123',
      oauthTokenExpiry: Date.now() + 3000 * 1000 // Valid for ~50 mins
    };
    mockAuthTokenGranted = null;
    const token = await getAuthToken(false);
    if (token === 'VALID_MOCK_TOKEN_123') {
      console.log('✅ [Test 2] PASS: Valid cached token reused without external OAuth flow');
      passed++;
    } else {
      console.log('❌ [Test 2] FAIL: Expected VALID_MOCK_TOKEN_123, got:', token);
      failed++;
    }
  } catch (err) {
    console.log('❌ [Test 2] FAIL:', err.message);
    failed++;
  }

  // TEST 3: Silent token refresh via launchWebAuthFlow with prompt=none when expired
  try {
    storageSync = { googleAuthConnected: true };
    storageLocal = {
      oauthToken: 'EXPIRED_MOCK_TOKEN_999',
      oauthTokenExpiry: Date.now() - 1000 // Expired 1 second ago
    };
    mockAuthTokenGranted = null;
    mockLaunchWebAuthFlowResult = 'https://mock.chromiumapp.org/#access_token=REFRESHED_TOKEN_777&expires_in=3600';
    
    const token = await getAuthToken(false);
    if (token === 'REFRESHED_TOKEN_777' && mockLaunchWebAuthFlowUrl.includes('prompt=none')) {
      console.log('✅ [Test 3] PASS: Expired token triggered silent refresh with prompt=none');
      passed++;
    } else {
      console.log('❌ [Test 3] FAIL: Expected REFRESHED_TOKEN_777 and prompt=none, got:', token, mockLaunchWebAuthFlowUrl);
      failed++;
    }
  } catch (err) {
    console.log('❌ [Test 3] FAIL:', err.message);
    failed++;
  }

  // TEST 4: fetchWithAuthAutoRetry 401 Interceptor and Auto-Retry Success
  try {
    storageSync = { googleAuthConnected: true };
    storageLocal = {
      oauthToken: 'TOKEN_401_MOCK',
      oauthTokenExpiry: Date.now() + 3000 * 1000
    };
    mockLaunchWebAuthFlowResult = 'https://mock.chromiumapp.org/#access_token=RETRY_SUCCESS_TOKEN&expires_in=3600';

    let callsCount = 0;
    const mockApiCall = async (t) => {
      callsCount++;
      if (t === 'TOKEN_401_MOCK') {
        return { status: 401, ok: false };
      }
      return { status: 200, ok: true, data: 'SUCCESS' };
    };

    const result = await fetchWithAuthAutoRetry(mockApiCall);
    if (result.status === 200 && callsCount === 2) {
      console.log('✅ [Test 4] PASS: 401 response cleared old token, silently refreshed, and retried API call');
      passed++;
    } else {
      console.log('❌ [Test 4] FAIL: Expected status 200 on retry, got:', result, 'calls:', callsCount);
      failed++;
    }
  } catch (err) {
    console.log('❌ [Test 4] FAIL:', err.message);
    failed++;
  }

  // TEST 5: fetchWithAuthAutoRetry 401 Silent Refresh Failure sets googleAuthConnected = false
  try {
    storageSync = { googleAuthConnected: true };
    storageLocal = {
      oauthToken: 'REVOKED_TOKEN_000',
      oauthTokenExpiry: Date.now() + 3000 * 1000
    };
    mockLaunchWebAuthFlowResult = null; // Silent refresh fails because user logged out

    const mockApiCall = async (t) => ({ status: 401, ok: false });

    try {
      await fetchWithAuthAutoRetry(mockApiCall);
      console.log('❌ [Test 5] FAIL: Expected fetchWithAuthAutoRetry to throw after failed refresh');
      failed++;
    } catch (err) {
      if (!storageSync.googleAuthConnected) {
        console.log('✅ [Test 5] PASS: Failed silent refresh after 401 automatically updated googleAuthConnected to false');
        passed++;
      } else {
        console.log('❌ [Test 5] FAIL: googleAuthConnected was not set to false');
        failed++;
      }
    }
  } catch (err) {
    console.log('❌ [Test 5] FAIL:', err.message);
    failed++;
  }

  // TEST 6: removeAuthToken cleans oauthTokenExpiry
  try {
    storageLocal = { oauthToken: 'XYZ', oauthTokenExpiry: 999999, savedWords: { cat: true } };
    storageSync = { googleAuthConnected: true };

    await removeAuthToken('XYZ');

    if (!storageLocal.oauthToken && !storageLocal.oauthTokenExpiry && !storageSync.googleAuthConnected) {
      console.log('✅ [Test 6] PASS: removeAuthToken properly cleared token expiry timestamp');
      passed++;
    } else {
      console.log('❌ [Test 6] FAIL: Storage not properly cleared:', storageLocal, storageSync);
      failed++;
    }
  } catch (err) {
    console.log('❌ [Test 6] FAIL:', err.message);
    failed++;
  }

  console.log('===============================================================');
  console.log(`📊 OAuth Unit Test Summary: ${passed} PASSED / ${failed} FAILED out of ${passed + failed} Checks`);
  console.log('===============================================================');
  
  if (failed > 0) process.exit(1);
}

runAuthUnitTests();
