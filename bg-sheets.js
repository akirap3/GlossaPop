// bg-sheets.js - Google Drive & Google Sheets API v4 Integration Engine

const SPREADSHEET_TITLE = 'GlossaPop Vocabulary Book';
const HEADERS = ['Word', 'IPA', 'CEFR', 'Definition', 'Example Sentence', 'Example Translation', 'Date'];

// 10-Language Sheet Title Mapping
const LANGUAGE_SHEET_MAP = {
  'en': 'English Words',
  'fr': 'French Words',
  'es': 'Spanish Words',
  'de': 'German Words',
  'ja': 'Japanese Words',
  'ko': 'Korean Words',
  'it': 'Italian Words',
  'pt': 'Portuguese Words',
  'zh-tw': 'Traditional Chinese Words',
  'zh-cn': 'Simplified Chinese Words',
  'zh': 'Chinese Words'
};

const ALL_SHEET_TITLES = [
  'English Words',
  'French Words',
  'Spanish Words',
  'German Words',
  'Japanese Words',
  'Korean Words',
  'Italian Words',
  'Portuguese Words',
  'Traditional Chinese Words',
  'Simplified Chinese Words'
];

function getSheetTitleForLang(targetLang) {
  if (!targetLang) return 'English Words';
  const langKey = targetLang.toLowerCase().trim();
  return LANGUAGE_SHEET_MAP[langKey] || 'English Words';
}

/**
 * Obtain Google OAuth 2.0 Auth Token with silent auto-refresh and launchWebAuthFlow support.
 */
function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      return reject(new Error('Chrome Identity API is not available in this context.'));
    }

    // 1. Check user's explicit connection preference state first
    chrome.storage.sync.get(['googleAuthConnected'], (storedSync) => {
      // If user explicitly disconnected, block all silent/background token requests
      if (!storedSync.googleAuthConnected && !interactive) {
        return reject(new Error('Google Account is disconnected. Please connect in Options.'));
      }

      // 2. Check cached token and expiry timestamp in local storage
      chrome.storage.local.get(['oauthToken', 'oauthTokenExpiry'], (storedLocal) => {
        const now = Date.now();
        const cachedToken = storedLocal.oauthToken;
        const expiry = storedLocal.oauthTokenExpiry || 0;

        // If cached token exists and is NOT expired (leave 60s safety buffer), return immediately
        if (cachedToken && expiry > now + 60000 && !interactive) {
          return resolve(cachedToken);
        }

        // 3. Try standard chrome.identity.getAuthToken
        chrome.identity.getAuthToken({ interactive }, (token) => {
          if (!chrome.runtime.lastError && token) {
            const tokenExpiry = Date.now() + 3500 * 1000;
            chrome.storage.local.set({ oauthToken: token, oauthTokenExpiry: tokenExpiry });
            return resolve(token);
          }

          const getAuthError = chrome.runtime.lastError ? chrome.runtime.lastError.message : '';

          // 4. Fallback to launchWebAuthFlow (supports silent refresh via prompt=none when interactive=false)
          const clientId = '213944880893-ej291f9246dm8rpc0l8jt20il2akmiak.apps.googleusercontent.com';
          const redirectUri = chrome.identity.getRedirectURL();
          const scopes = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
          
          let authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;
          if (!interactive) {
            authUrl += '&prompt=none'; // Silent refresh without popup
          }

          chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: interactive
          }, (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
              const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : (getAuthError || 'Web auth flow failed');
              return reject(new Error(err));
            }

            try {
              const hash = new URL(redirectUrl).hash.substring(1);
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const expiresIn = parseInt(params.get('expires_in') || '3600', 10);
              
              if (accessToken) {
                const tokenExpiry = Date.now() + (expiresIn - 60) * 1000;
                chrome.storage.local.set({ oauthToken: accessToken, oauthTokenExpiry: tokenExpiry });
                resolve(accessToken);
              } else {
                reject(new Error('No access_token returned from OAuth flow'));
              }
            } catch (e) {
              reject(new Error('Failed to parse OAuth redirect URL: ' + e.message));
            }
          });
        });
      });
    });
  });
}

/**
 * Remove cached auth token on disconnect
 */
function removeAuthToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['oauthToken', 'oauthTokenExpiry', 'savedWords']);
    chrome.storage.sync.set({ googleAuthConnected: false });

    if (token) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST' }).catch(() => {});
    }

    if (typeof chrome !== 'undefined' && chrome.identity) {
      if (token) {
        chrome.identity.removeCachedAuthToken({ token }, () => resolve());
      } else {
        chrome.identity.getAuthToken({ interactive: false }, (t) => {
          if (t) chrome.identity.removeCachedAuthToken({ token: t }, () => resolve());
          else resolve();
        });
      }
    } else {
      resolve();
    }
  });
}

/**
 * Executes a Google API fetch call with token auto-refresh and 401 retry handling.
 */
async function fetchWithAuthAutoRetry(fetchCallFn) {
  const storedSync = await new Promise(r => chrome.storage.sync.get(['googleAuthConnected'], r));
  if (!storedSync.googleAuthConnected) {
    throw new Error('Google Account is disconnected. Please connect in Options.');
  }

  let token = await getAuthToken(false);
  let res = await fetchCallFn(token);

  // If HTTP 401 Unauthorized (token expired or revoked), handle auto-refresh & retry once
  if (res.status === 401) {
    console.warn('Google API returned 401 Unauthorized. Clearing expired token and attempting silent refresh...');
    await new Promise(r => chrome.storage.local.remove(['oauthToken', 'oauthTokenExpiry'], r));

    try {
      token = await getAuthToken(false); // Attempt silent token refresh
      res = await fetchCallFn(token);    // Retry API call once with fresh token
    } catch (refreshErr) {
      console.warn('Silent token refresh failed after 401. Setting googleAuthConnected = false:', refreshErr);
      await new Promise(r => chrome.storage.sync.set({ googleAuthConnected: false }, r));
      throw new Error('Google Account session expired. Please reconnect in Options.');
    }
  }

  return res;
}

/**
 * Dynamically ensures that the target language tab exists in the user's Google Spreadsheet.
 * Creates the tab on-the-fly with frozen header row if missing.
 */
async function ensureSheetExists(token, spreadsheetId, sheetTitle) {
  try {
    const metaRes = await fetchWithAuthAutoRetry(t => fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${t}` }
    }));
    
    if (!metaRes.ok) return;
    const metaData = await metaRes.json();
    const existingTitles = (metaData.sheets || []).map(s => s.properties.title);
    
    if (existingTitles.includes(sheetTitle)) return;

    console.log(`📌 Dynamic Tab Creation: Adding missing "${sheetTitle}" tab to Google Spreadsheet...`);

    await fetchWithAuthAutoRetry(t => fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: sheetTitle, gridProperties: { frozenRowCount: 1 } }
            }
          }
        ]
      })
    }));

    await fetchWithAuthAutoRetry(t => fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${t}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${sheetTitle}'!A1:G1`, values: [HEADERS] }
        ]
      })
    }));
  } catch (err) {
    console.warn(`Failed to dynamically create sheet tab "${sheetTitle}":`, err);
  }
}

/**
 * Find existing or create a new GlossaPop Vocabulary Book spreadsheet
 */
async function getOrCreateSpreadsheet(token) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['spreadsheetId'], async (stored) => {
      let spreadsheetId = stored.spreadsheetId;

      // 1. Verify if stored spreadsheet ID still exists, is accessible, and is NOT in Trash
      if (spreadsheetId) {
        try {
          const driveCheck = await fetchWithAuthAutoRetry(t => fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=trashed`, {
            headers: { Authorization: `Bearer ${t}` }
          }));
          if (driveCheck.ok) {
            const fileMeta = await driveCheck.json();
            if (!fileMeta.trashed) {
              return resolve(spreadsheetId);
            }
            console.warn('Stored spreadsheet is in Trash, searching for active file in My Drive...');
          }
        } catch (e) {
          console.warn('Stored spreadsheet verify failed:', e);
        }
      }

      // 2. Search Google Drive for an existing "GlossaPop Vocabulary Book" file
      try {
        const query = encodeURIComponent(`name = '${SPREADSHEET_TITLE}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
        const searchRes = await fetchWithAuthAutoRetry(t => fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime%20desc&fields=files(id,name)`, {
          headers: { Authorization: `Bearer ${t}` }
        }));

        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.files && searchData.files.length > 0) {
            const existingId = searchData.files[0].id;
            await new Promise(r => chrome.storage.sync.set({ spreadsheetId: existingId }, r));
            return resolve(existingId);
          }
        }
      } catch (e) {
        console.warn('Drive search for existing spreadsheet failed:', e);
      }

      // 3. Create a new Google Spreadsheet workbook if none exists (with all 10 language tabs)
      try {
        const initialSheets = ALL_SHEET_TITLES.map(title => ({
          properties: { title, gridProperties: { frozenRowCount: 1 } }
        }));
        
        const initialHeaderData = ALL_SHEET_TITLES.map(title => ({
          range: `'${title}'!A1:G1`, values: [HEADERS]
        }));

        const createRes = await fetchWithAuthAutoRetry(t => fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${t}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: { title: SPREADSHEET_TITLE },
            sheets: initialSheets
          })
        }));

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(errData.error ? errData.error.message : `Failed to create spreadsheet (HTTP ${createRes.status})`);
        }

        const spreadsheet = await createRes.json();
        spreadsheetId = spreadsheet.spreadsheetId;

        // Populate initial column headers for all 10 language tabs
        await fetchWithAuthAutoRetry(t => fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${t}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: initialHeaderData
          })
        }));

        chrome.storage.sync.set({ spreadsheetId });
        resolve(spreadsheetId);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Append a vocabulary word row to the corresponding Google Sheet tab
 */
async function appendWordToSheet(token, targetLang, wordData) {
  const spreadsheetId = await getOrCreateSpreadsheet(token);
  const sheetTitle = getSheetTitleForLang(targetLang);

  await ensureSheetExists(token, spreadsheetId, sheetTitle);

  const today = new Date().toISOString().split('T')[0];
  const rowValues = [
    wordData.word || '',
    wordData.phonetic || '',
    wordData.cefr || '',
    wordData.definition || '',
    wordData.exampleSentence || '',
    wordData.exampleTranslation || '',
    today
  ];

  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A:G:append?valueInputOption=USER_ENTERED`;
  const response = await fetchWithAuthAutoRetry(t => fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${t}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowValues]
    })
  }));

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error ? errData.error.message : `Failed to append row (HTTP ${response.status})`);
  }

  return { success: true, spreadsheetId };
}

/**
 * Fetch all saved words from all sheets to build local deduplication cache
 */
async function fetchSpreadsheetWords(token) {
  const spreadsheetId = await getOrCreateSpreadsheet(token);

  let existingTitles = ALL_SHEET_TITLES;
  try {
    const metaRes = await fetchWithAuthAutoRetry(t => fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, {
      headers: { Authorization: `Bearer ${t}` }
    }));
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      if (metaData.sheets && Array.isArray(metaData.sheets)) {
        existingTitles = metaData.sheets.map(s => s.properties.title);
      }
    }
  } catch (e) {}

  const rangesQuery = existingTitles.map(t => `ranges=${encodeURIComponent(t)}!A2:A`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`;

  const response = await fetchWithAuthAutoRetry(t => fetch(url, {
    headers: { Authorization: `Bearer ${t}` }
  }));

  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet words (HTTP ${response.status})`);
  }

  const data = await response.json();
  const savedWordsMap = {};

  if (data.valueRanges && Array.isArray(data.valueRanges)) {
    data.valueRanges.forEach(vr => {
      if (vr.values && Array.isArray(vr.values)) {
        vr.values.forEach(row => {
          if (row && row[0]) {
            const w = row[0].trim().toLowerCase();
            if (w) savedWordsMap[w] = true;
          }
        });
      }
    });
  }

  // Persist local cache
  await new Promise(resolve => {
    chrome.storage.local.set({ savedWords: savedWordsMap }, () => resolve());
  });

  return savedWordsMap;
}

/**
 * Export CSV string for the given language sheet
 */
async function exportAnkiCsv(token, targetLang) {
  const spreadsheetId = await getOrCreateSpreadsheet(token);
  const sheetTitle = getSheetTitleForLang(targetLang);

  await ensureSheetExists(token, spreadsheetId, sheetTitle);

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:G`;
  const response = await fetchWithAuthAutoRetry(t => fetch(url, {
    headers: { Authorization: `Bearer ${t}` }
  }));

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data for export (HTTP ${response.status})`);
  }

  const data = await response.json();
  const rows = data.values || [];

  if (rows.length === 0) {
    return HEADERS.join(',') + '\n';
  }

  // Format as RFC 4180 CSV
  const csvLines = rows.map(row => {
    return row.map(cell => {
      const val = (cell || '').toString().replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
  });

  return csvLines.join('\n');
}
