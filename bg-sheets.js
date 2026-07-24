// bg-sheets.js - Google Drive & Google Sheets API v4 Integration Engine

const SPREADSHEET_TITLE = 'GlossaPop Vocabulary Book';
const SHEET_EN = 'English Words';
const SHEET_FR = 'French Words';
const HEADERS = ['Word', 'IPA', 'CEFR', 'Definition', 'Example Sentence', 'Example Translation', 'Date'];

/**
 * Obtain Google OAuth 2.0 Auth Token with launchWebAuthFlow fallback
 */
function getAuthToken(interactive = false) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity) {
      return reject(new Error('Chrome Identity API is not available in this context.'));
    }

    // 1. First try standard chrome.identity.getAuthToken
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (!chrome.runtime.lastError && token) {
        chrome.storage.local.set({ oauthToken: token });
        return resolve(token);
      }

      const getAuthError = chrome.runtime.lastError ? chrome.runtime.lastError.message : '';

      // 2. Check local token cache
      chrome.storage.local.get(['oauthToken'], (stored) => {
        if (stored.oauthToken && !interactive) {
          return resolve(stored.oauthToken);
        }

        if (!interactive) {
          return reject(new Error(getAuthError || 'Auth token not granted'));
        }

        // 3. Fallback to launchWebAuthFlow for Web Application Client IDs or unpacked ID mismatches
        const clientId = '213944880893-ej291f9246dm8rpc0l8jt20il2akmiak.apps.googleusercontent.com';
        const redirectUri = chrome.identity.getRedirectURL();
        const scopes = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

        chrome.identity.launchWebAuthFlow({
          url: authUrl,
          interactive: true
        }, (redirectUrl) => {
          if (chrome.runtime.lastError || !redirectUrl) {
            const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : (getAuthError || 'Web auth flow cancelled');
            return reject(new Error(err));
          }

          try {
            const hash = new URL(redirectUrl).hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            if (accessToken) {
              chrome.storage.local.set({ oauthToken: accessToken });
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
}

/**
 * Remove cached auth token on disconnect
 */
function removeAuthToken(token) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['oauthToken', 'savedWords']);
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
 * Find existing or create a new GlossaPop Vocabulary Book spreadsheet
 */
async function getOrCreateSpreadsheet(token) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['spreadsheetId'], async (stored) => {
      let spreadsheetId = stored.spreadsheetId;

      // 1. Verify if stored spreadsheet ID still exists, is accessible, and is NOT in Trash
      if (spreadsheetId) {
        try {
          const driveCheck = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=trashed`, {
            headers: { Authorization: `Bearer ${token}` }
          });
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
        const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime%20desc&fields=files(id,name)`, {
          headers: { Authorization: `Bearer ${token}` }
        });

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

      // 3. Create a new Google Spreadsheet workbook if none exists
      try {
        const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            properties: { title: SPREADSHEET_TITLE },
            sheets: [
              { properties: { title: SHEET_EN, gridProperties: { frozenRowCount: 1 } } },
              { properties: { title: SHEET_FR, gridProperties: { frozenRowCount: 1 } } }
            ]
          })
        });

        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(errData.error ? errData.error.message : `Failed to create spreadsheet (HTTP ${createRes.status})`);
        }

        const spreadsheet = await createRes.json();
        spreadsheetId = spreadsheet.spreadsheetId;

        // Populate initial column headers
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            valueInputOption: 'USER_ENTERED',
            data: [
              { range: `'${SHEET_EN}'!A1:G1`, values: [HEADERS] },
              { range: `'${SHEET_FR}'!A1:G1`, values: [HEADERS] }
            ]
          })
        });

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
  const sheetTitle = targetLang === 'fr' ? SHEET_FR : SHEET_EN;

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
  const response = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [rowValues]
    })
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error ? errData.error.message : `Failed to append row (HTTP ${response.status})`);
  }

  return { success: true, spreadsheetId };
}

/**
 * Fetch all saved words from both sheets to build local deduplication cache
 */
async function fetchSpreadsheetWords(token) {
  const spreadsheetId = await getOrCreateSpreadsheet(token);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${encodeURIComponent(SHEET_EN)}!A2:A&ranges=${encodeURIComponent(SHEET_FR)}!A2:A`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

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
 * Export Anki-compatible CSV string for the given language sheet
 */
async function exportAnkiCsv(token, targetLang) {
  const spreadsheetId = await getOrCreateSpreadsheet(token);
  const sheetTitle = targetLang === 'fr' ? SHEET_FR : SHEET_EN;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:G`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

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
