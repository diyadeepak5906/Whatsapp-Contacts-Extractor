/**
 * WhatsApp Contact Extractor - Popup Script (v1.4)
 * 
 * Updated CSV Schema:
 * Exports ONLY 'formatted_phone' (removed raw unformatted 'phone_number').
 * 
 * Columns (9):
 * country_code, country_name, formatted_phone, is_my_contact, saved_name, public_name, is_business, is_admin, labels
 */

// Strict list of 9 required CSV column headers in exact order (phone_number omitted)
const CSV_HEADERS = [
  'country_code',
  'country_name',
  'formatted_phone',
  'is_my_contact',
  'saved_name',
  'public_name',
  'is_business',
  'is_admin',
  'labels'
];

// Fictional sample contacts for offline testing
const SAMPLE_CONTACTS = [
  {
    country_code: 'US',
    country_name: 'United States',
    formatted_phone: '+1 555-0100',
    is_my_contact: true,
    saved_name: 'Sample Contact 1 (Fictional)',
    public_name: 'Jane Doe (Sample)',
    is_business: false,
    is_admin: true,
    labels: 'Sample Customer; Priority'
  },
  {
    country_code: 'GB',
    country_name: 'United Kingdom',
    formatted_phone: '+44 7700 900123',
    is_my_contact: false,
    saved_name: '',
    public_name: 'Acme Supplies (Fictional Business)',
    is_business: true,
    is_admin: false,
    labels: 'Sample Vendor'
  }
];

// Comprehensive country calling code map for automatic prefix detection
const COUNTRY_MAP = [
  { prefix: '1', code: 'US', name: 'United States / Canada' },
  { prefix: '44', code: 'GB', name: 'United Kingdom' },
  { prefix: '91', code: 'IN', name: 'India' },
  { prefix: '61', code: 'AU', name: 'Australia' },
  { prefix: '49', code: 'DE', name: 'Germany' },
  { prefix: '33', code: 'FR', name: 'France' },
  { prefix: '81', code: 'JP', name: 'Japan' },
  { prefix: '86', code: 'CN', name: 'China' },
  { prefix: '55', code: 'BR', name: 'Brazil' },
  { prefix: '971', code: 'AE', name: 'United Arab Emirates' },
  { prefix: '966', code: 'SA', name: 'Saudi Arabia' },
  { prefix: '62', code: 'ID', name: 'Indonesia' },
  { prefix: '92', code: 'PK', name: 'Pakistan' },
  { prefix: '880', code: 'BD', name: 'Bangladesh' },
  { prefix: '234', code: 'NG', name: 'Nigeria' },
  { prefix: '27', code: 'ZA', name: 'South Africa' },
  { prefix: '34', code: 'ES', name: 'Spain' },
  { prefix: '39', code: 'IT', name: 'Italy' },
  { prefix: '7', code: 'RU', name: 'Russia / Kazakhstan' },
  { prefix: '65', code: 'SG', name: 'Singapore' },
  { prefix: '60', code: 'MY', name: 'Malaysia' },
  { prefix: '63', code: 'PH', name: 'Philippines' },
  { prefix: '52', code: 'MX', name: 'Mexico' },
  { prefix: '54', code: 'AR', name: 'Argentina' },
  { prefix: '57', code: 'CO', name: 'Colombia' },
  { prefix: '20', code: 'EG', name: 'Egypt' },
  { prefix: '90', code: 'TR', name: 'Turkey' },
  { prefix: '31', code: 'NL', name: 'Netherlands' },
  { prefix: '41', code: 'CH', name: 'Switzerland' },
  { prefix: '46', code: 'SE', name: 'Sweden' },
  { prefix: '47', code: 'NO', name: 'Norway' },
  { prefix: '45', code: 'DK', name: 'Denmark' },
  { prefix: '353', code: 'IE', name: 'Ireland' },
  { prefix: '64', code: 'NZ', name: 'New Zealand' },
  { prefix: '351', code: 'PT', name: 'Portugal' },
  { prefix: '48', code: 'PL', name: 'Poland' },
  { prefix: '32', code: 'BE', name: 'Belgium' },
  { prefix: '43', code: 'AT', name: 'Austria' },
  { prefix: '30', code: 'GR', name: 'Greece' },
  { prefix: '972', code: 'IL', name: 'Israel' },
  { prefix: '82', code: 'KR', name: 'South Korea' },
  { prefix: '84', code: 'VN', name: 'Vietnam' },
  { prefix: '66', code: 'TH', name: 'Thailand' },
  { prefix: '94', code: 'LK', name: 'Sri Lanka' },
  { prefix: '977', code: 'NP', name: 'Nepal' },
  { prefix: '254', code: 'KE', name: 'Kenya' },
  { prefix: '233', code: 'GH', name: 'Ghana' }
];

COUNTRY_MAP.sort((a, b) => b.prefix.length - a.prefix.length);

/**
 * Sanitizes a string: removes line breaks, carriage returns, and excess whitespace.
 */
function cleanString(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Formats clean digits into standard phone number representations.
 */
function formatCleanPhone(digits, countryCode) {
  if (!digits) return '';
  if (countryCode === 'US' || countryCode === 'CA') {
    if (digits.length === 11) {
      return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
    }
  } else if (countryCode === 'IN') {
    if (digits.length === 12) {
      return `+91 ${digits.substring(2, 7)} ${digits.substring(7)}`;
    }
  } else if (countryCode === 'GB') {
    if (digits.length === 12) {
      return `+44 ${digits.substring(2, 6)} ${digits.substring(6)}`;
    }
  } else if (countryCode === 'AE') {
    if (digits.length === 12) {
      return `+971 ${digits.substring(3, 5)} ${digits.substring(5, 8)} ${digits.substring(8)}`;
    }
  }
  return '+' + digits;
}

/**
 * Parses a phone number or raw string and returns formatted phone & country details.
 */
function parsePhoneAndCountry(rawNumber) {
  if (!rawNumber) {
    return { formatted: '', code: '', name: '' };
  }

  const digits = String(rawNumber).replace(/\D/g, '');
  if (!digits || digits.length < 5) {
    return { formatted: cleanString(rawNumber), code: '', name: '' };
  }

  let code = '';
  let name = '';

  for (const c of COUNTRY_MAP) {
    if (digits.startsWith(c.prefix)) {
      code = c.code;
      name = c.name;
      break;
    }
  }

  const formatted = formatCleanPhone(digits, code) || cleanString(rawNumber) || ('+' + digits);

  return { formatted, code, name };
}

/**
 * Escapes a cell value according to standard CSV (RFC 4180) rules.
 */
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = cleanString(value);
  if (/[",;]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Converts headers and row objects into RFC 4180 compliant CSV string with UTF-8 BOM.
 */
function buildCsvString(headers, rows) {
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) => {
    return headers.map((key) => escapeCsvValue(row[key])).join(',');
  });
  return [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers a client-side file download via Blob.
 */
function triggerCsvDownload(filename, csvContent) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = objectUrl;
  downloadLink.download = filename;
  downloadLink.style.display = 'none';

  document.body.appendChild(downloadLink);
  downloadLink.click();

  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(objectUrl);
}

/**
 * Displays status message in popup UI.
 */
function displayStatus(element, message, type, persist = false) {
  if (!element) return;
  element.textContent = message;
  element.className = `status-message show-${type}`;

  if (!persist) {
    setTimeout(() => {
      element.className = 'status-message';
      element.textContent = '';
    }, 4500);
  }
}

/**
 * Checks WhatsApp Web connection state in browser tabs.
 */
async function checkWhatsAppTab() {
  const card = document.getElementById('tabStatusCard');
  const text = document.getElementById('tabStatusText');
  if (!card || !text) return null;

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.url && activeTab.url.startsWith('https://web.whatsapp.com')) {
      card.className = 'connection-status connected';
      text.textContent = '● Connected to WhatsApp Web (Active Tab)';
      return activeTab;
    }

    const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
    if (tabs && tabs.length > 0) {
      card.className = 'connection-status warning';
      text.textContent = '● WhatsApp Web open in another tab';
      return tabs[0];
    }

    card.className = 'connection-status not-found';
    text.textContent = '✕ WhatsApp Web is not open';
    return null;
  } catch (err) {
    console.warn('Could not query tabs:', err);
    card.className = 'connection-status not-found';
    text.textContent = 'WhatsApp Web tab not detected';
    return null;
  }
}

/**
 * Injected script executed in WhatsApp Web tab (world: MAIN).
 * Resolves full contact details including phone numbers for saved contacts.
 */
async function extractGroupMembersHybrid() {
  try {
    const chatPane = document.querySelector('#main, div[data-testid="conversation-panel-wrapper"]');
    const headerEl = chatPane ? chatPane.querySelector('header') : document.querySelector('header');

    if (!headerEl) {
      const qrCanvas = document.querySelector('canvas[aria-label*="QR"], div[data-ref]');
      if (qrCanvas) {
        return { success: false, error: 'Please log in to WhatsApp Web by scanning the QR code first.' };
      }
      return { success: false, error: 'No chat open. Please click into a WhatsApp group chat first.' };
    }

    let groupTitle = 'WhatsApp Group';
    const titleCandidates = headerEl.querySelectorAll('span[title], div[role="button"] span, span[dir="auto"]');
    for (const el of titleCandidates) {
      const tAttr = (el.getAttribute('title') || '').trim();
      const txt = (el.innerText || el.textContent || '').trim();
      if (tAttr && tAttr.length > 0 && !tAttr.includes(',') && !tAttr.startsWith('+')) {
        groupTitle = tAttr;
        break;
      } else if (txt && txt.length > 0 && !txt.includes(',') && !txt.startsWith('+') && !txt.toLowerCase().includes('online')) {
        groupTitle = txt;
        break;
      }
    }

    // Retrieve own phone number for "You"
    function getOwnPhoneNumber() {
      try {
        for (const key of ['last-wid-md', 'last-wid', 'remember-me', 'me-id']) {
          const val = window.localStorage.getItem(key);
          if (val) {
            const match = val.match(/([0-9]{7,})(:[0-9]+)?@/);
            if (match && match[1]) {
              return '+' + match[1];
            }
          }
        }
      } catch (e) {}
      return '';
    }
    const myOwnPhone = getOwnPhoneNumber();

    // Webpack module contact scanning
    const webpackContacts = new Map();
    try {
      if (typeof window.webpackChunkwhatsapp_web_client !== 'undefined') {
        let modules = {};
        window.webpackChunkwhatsapp_web_client.push([
          [Symbol()],
          {},
          function (e) {
            modules = e.c || {};
          }
        ]);

        for (const mId in modules) {
          const exp = modules[mId]?.exports;
          if (!exp) continue;

          const candidates = [exp, exp.default, exp.ContactCollection, exp.Contact, exp.ChatCollection];
          for (const cand of candidates) {
            if (!cand || typeof cand !== 'object') continue;

            const list = cand._models || cand.models || (Array.isArray(cand) ? cand : null);
            if (list && Array.isArray(list) && list.length > 0) {
              for (const item of list) {
                if (!item || !item.id) continue;
                const ser = typeof item.id === 'string' ? item.id : (item.id._serialized || '');
                if (ser.includes('@c.us') || ser.includes('@s.whatsapp.net')) {
                  const digits = ser.split('@')[0].replace(/\D/g, '');
                  if (digits.length >= 7) {
                    const phone = '+' + digits;
                    const name = (item.name || item.formattedTitle || '').trim();
                    const pushname = (item.pushname || item.verifiedName || '').trim();
                    const isMyContact = Boolean(item.isMyContact || item.isAddressBookContact || (name && name !== digits));
                    const isBusiness = Boolean(item.isBusiness || item.isEnterprise);

                    const record = { phone, name, pushname, isMyContact, isBusiness };
                    if (name) webpackContacts.set(name.toLowerCase(), record);
                    if (pushname) webpackContacts.set(pushname.toLowerCase(), record);
                    webpackContacts.set(digits, record);
                  }
                }
              }
            }
          }
        }
      }
    } catch (wpErr) {
      console.warn('Webpack search note:', wpErr);
    }

    // IndexedDB contact scanning
    const indexedDbContacts = new Map();
    try {
      const dbs = (await window.indexedDB.databases()) || [];
      for (const dbInfo of dbs) {
        if (!dbInfo.name) continue;

        const db = await new Promise((res) => {
          const req = window.indexedDB.open(dbInfo.name);
          req.onsuccess = () => res(req.result);
          req.onerror = () => res(null);
        });
        if (!db) continue;

        const storeNames = Array.from(db.objectStoreNames);
        for (const sName of storeNames) {
          if (sName.toLowerCase().includes('contact') || sName.toLowerCase().includes('participant')) {
            const records = await new Promise((res) => {
              try {
                const tx = db.transaction(sName, 'readonly');
                const st = tx.objectStore(sName);
                const req = st.getAll();
                req.onsuccess = () => res(req.result || []);
                req.onerror = () => res([]);
              } catch (e) {
                res([]);
              }
            });

            for (const r of records) {
              const ser = r?.id?._serialized || (typeof r?.id === 'string' ? r.id : '') || r?.jid || '';
              if (ser && (ser.includes('@c.us') || ser.includes('@s.whatsapp.net'))) {
                const digits = ser.split('@')[0].replace(/\D/g, '');
                if (digits.length >= 7) {
                  const phone = '+' + digits;
                  const name = (r.name || r.formattedTitle || '').trim();
                  const pushname = (r.pushname || r.verifiedName || '').trim();
                  const isMyContact = Boolean(r.isMyContact || (name && name !== digits));
                  const isBusiness = Boolean(r.isBusiness || r.isEnterprise);

                  const record = { phone, name, pushname, isMyContact, isBusiness };
                  if (name) indexedDbContacts.set(name.toLowerCase(), record);
                  if (pushname) indexedDbContacts.set(pushname.toLowerCase(), record);
                  indexedDbContacts.set(digits, record);
                }
              }
            }
          }
        }
        db.close();
      }
    } catch (idbErr) {
      console.warn('IndexedDB scan note:', idbErr);
    }

    // Open Group Info drawer if not already open
    let drawerEl = document.querySelector(
      'div[data-testid="group-info-drawer"], section[data-testid="chat-info-drawer"], div[role="region"]'
    );

    if (!drawerEl) {
      const headerBtn = headerEl.querySelector('div[role="button"]') || headerEl;
      if (headerBtn) {
        headerBtn.click();
        await new Promise((r) => setTimeout(r, 600));
        drawerEl = document.querySelector(
          'div[data-testid="group-info-drawer"], section[data-testid="chat-info-drawer"], div[role="region"]'
        );
      }
    }

    // Inspect React props & fiber for Contact model
    function scanReactFiberForPhone(node) {
      if (!node) return null;
      const keys = Object.keys(node);
      const fiberKey = keys.find((k) => k.startsWith('__reactFiber'));
      const propsKey = keys.find((k) => k.startsWith('__reactProps'));

      function inspectObj(obj, depth = 0) {
        if (!obj || typeof obj !== 'object' || depth > 4) return null;

        const idStr = obj.id?._serialized || (typeof obj.id === 'string' ? obj.id : '') || obj.jid || '';
        if (idStr && (idStr.includes('@c.us') || idStr.includes('@s.whatsapp.net'))) {
          const digits = idStr.split('@')[0].replace(/\D/g, '');
          if (digits.length >= 7) {
            return {
              phone: '+' + digits,
              name: obj.name || obj.formattedTitle || '',
              pushname: obj.pushname || obj.verifiedName || '',
              isMyContact: Boolean(obj.isMyContact || (obj.name && obj.name !== digits)),
              isAdmin: Boolean(obj.isAdmin || obj.isSuperAdmin || obj.admin),
              isBusiness: Boolean(obj.isBusiness || obj.isEnterprise)
            };
          }
        }

        for (const k of ['contact', 'participant', 'user', 'item', 'data']) {
          if (obj[k] && typeof obj[k] === 'object') {
            const res = inspectObj(obj[k], depth + 1);
            if (res) return res;
          }
        }
        return null;
      }

      if (propsKey && node[propsKey]) {
        const found = inspectObj(node[propsKey]);
        if (found) return found;
      }

      if (fiberKey && node[fiberKey]) {
        let curr = node[fiberKey];
        let depth = 0;
        while (curr && depth < 10) {
          if (curr.memoizedProps) {
            const found = inspectObj(curr.memoizedProps);
            if (found) return found;
          }
          curr = curr.return;
          depth++;
        }
      }

      return null;
    }

    // Extract JID from avatar image
    function extractPhoneFromImg(cardEl) {
      const img = cardEl.querySelector('img');
      if (!img || !img.src) return '';
      const src = decodeURIComponent(img.src);
      const match = src.match(/u=([0-9]{7,})(@c\.us)?/) || src.match(/([0-9]{7,})@c\.us/);
      if (match && match[1]) {
        return '+' + match[1];
      }
      return '';
    }

    const COMMON_STATUS_SNIPPETS = [
      'hey there',
      'using whatsapp',
      'can\'t talk',
      'whatsapp only',
      'available',
      'busy',
      'at work',
      'in a meeting',
      'battery about to die',
      'urgent calls only',
      'sleeping',
      'group admin',
      'community admin',
      'click here for group info',
      'online',
      'typing...'
    ];

    function isStatus(str) {
      if (!str) return true;
      const lower = str.toLowerCase().trim();
      return COMMON_STATUS_SNIPPETS.some((s) => lower.includes(s));
    }

    const participantsMap = new Map();

    function upsertRecord(key, data) {
      if (!key) return;
      const norm = key.trim().toLowerCase();
      if (!participantsMap.has(norm)) {
        participantsMap.set(norm, data);
      } else {
        const prev = participantsMap.get(norm);
        participantsMap.set(norm, {
          phone_raw: prev.phone_raw || data.phone_raw,
          saved_name: prev.saved_name || data.saved_name,
          public_name: prev.public_name || data.public_name,
          is_my_contact: prev.is_my_contact || data.is_my_contact,
          is_business: prev.is_business || data.is_business,
          is_admin: prev.is_admin || data.is_admin,
          labels: data.labels || prev.labels
        });
      }
    }

    // Parse participant cards from Group Info drawer
    if (drawerEl) {
      const memberCards = drawerEl.querySelectorAll('div[role="listitem"], div[data-testid="cell-frame-container"]');
      for (const card of memberCards) {
        const fullText = (card.innerText || card.textContent || '').trim();
        if (!fullText || fullText.includes('Add member') || fullText.includes('Invite to group')) continue;

        const isAdmin = /admin/i.test(fullText);
        const isBusiness = /business/i.test(fullText) || !!card.querySelector('[data-testid*="business"]');

        const phoneMatch = fullText.match(/\+?[0-9\s\-()]{7,}/);
        let phone = phoneMatch ? phoneMatch[0].trim() : '';

        const tildeMatch = fullText.match(/~([^\n\r]+)/);
        let publicName = tildeMatch ? tildeMatch[1].trim() : '';

        const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
        let savedName = '';

        for (const line of lines) {
          if (line === 'You') {
            savedName = 'You';
            break;
          }
          if (!isStatus(line) && !line.startsWith('~') && (!phone || !line.includes(phone))) {
            savedName = line;
            break;
          }
        }

        // Resolving saved contact phone number
        if (!phone) {
          const fiberInfo = scanReactFiberForPhone(card);
          if (fiberInfo && fiberInfo.phone) {
            phone = fiberInfo.phone;
            if (!publicName && fiberInfo.pushname) publicName = fiberInfo.pushname;
            if (!savedName && fiberInfo.name) savedName = fiberInfo.name;
          }
        }

        if (!phone) {
          phone = extractPhoneFromImg(card);
        }

        if (!phone && savedName) {
          const wpMatch = webpackContacts.get(savedName.toLowerCase());
          if (wpMatch && wpMatch.phone) {
            phone = wpMatch.phone;
            if (!publicName && wpMatch.pushname) publicName = wpMatch.pushname;
          }
        }

        if (!phone && savedName) {
          const idbMatch = indexedDbContacts.get(savedName.toLowerCase());
          if (idbMatch && idbMatch.phone) {
            phone = idbMatch.phone;
            if (!publicName && idbMatch.pushname) publicName = idbMatch.pushname;
          }
        }

        if ((savedName === 'You' || fullText.includes('You')) && !phone) {
          phone = myOwnPhone;
          savedName = 'You';
          publicName = 'You';
        }

        const isMyContact = savedName === 'You' || (Boolean(savedName) && savedName !== phone);
        const key = phone || savedName || publicName;

        if (key) {
          upsertRecord(key, {
            phone_raw: phone,
            saved_name: savedName,
            public_name: publicName || savedName || phone,
            is_my_contact: isMyContact,
            is_business: isBusiness,
            is_admin: isAdmin,
            labels: `${groupTitle} Member`
          });
        }
      }
    }

    // Parse header subtitle
    let headerSubtitle = '';
    const spans = headerEl.querySelectorAll('span');
    for (const s of spans) {
      const tAttr = (s.getAttribute('title') || '').trim();
      const txt = (s.innerText || s.textContent || '').trim();
      if (tAttr && (tAttr.includes(',') || tAttr.startsWith('You') || tAttr.includes('+'))) {
        headerSubtitle = tAttr;
        break;
      }
      if (txt && (txt.includes(',') || txt.startsWith('You') || txt.includes('+')) && txt !== groupTitle) {
        headerSubtitle = txt;
      }
    }

    if (headerSubtitle) {
      const parts = headerSubtitle.split(/,\s*/);
      for (const part of parts) {
        const item = part.trim();
        if (!item || isStatus(item)) continue;

        const isPhone = /^\+?[0-9\s\-()]{7,}$/.test(item);

        if (item === 'You') {
          upsertRecord('You', {
            phone_raw: myOwnPhone,
            saved_name: 'You',
            public_name: 'You',
            is_my_contact: true,
            is_business: false,
            is_admin: false,
            labels: `${groupTitle} Member`
          });
        } else if (isPhone) {
          upsertRecord(item, {
            phone_raw: item,
            saved_name: '',
            public_name: item,
            is_my_contact: false,
            is_business: false,
            is_admin: false,
            labels: `${groupTitle} Member`
          });
        } else {
          const wpMatch = webpackContacts.get(item.toLowerCase());
          const idbMatch = indexedDbContacts.get(item.toLowerCase());
          const resolvedPhone = (wpMatch && wpMatch.phone) || (idbMatch && idbMatch.phone) || '';
          const resolvedPush = (wpMatch && wpMatch.pushname) || (idbMatch && idbMatch.pushname) || item;

          upsertRecord(resolvedPhone || item, {
            phone_raw: resolvedPhone,
            saved_name: item,
            public_name: resolvedPush,
            is_my_contact: true,
            is_business: Boolean(wpMatch?.isBusiness || idbMatch?.isBusiness),
            is_admin: false,
            labels: `${groupTitle} Member`
          });
        }
      }
    }

    const contactsList = Array.from(participantsMap.values());

    if (contactsList.length === 0) {
      return {
        success: false,
        error: `Could not detect members in "${groupTitle}". Please click the group title at the top of WhatsApp Web to open Group Info, then try again.`
      };
    }

    return {
      success: true,
      groupTitle: groupTitle,
      contacts: contactsList
    };

  } catch (err) {
    return { success: false, error: 'Extraction script error: ' + (err.message || String(err)) };
  }
}

/**
 * Handles Live WhatsApp Group Members extraction.
 */
async function handleExtractLiveGroup(statusEl, extractBtn) {
  try {
    displayStatus(statusEl, 'Connecting to WhatsApp Web...', 'loading', true);
    extractBtn.disabled = true;

    const targetTab = await checkWhatsAppTab();
    if (!targetTab) {
      displayStatus(
        statusEl,
        'WhatsApp Web is not open. Please open web.whatsapp.com, log in, and click into a group chat.',
        'error',
        true
      );
      extractBtn.disabled = false;
      return;
    }

    displayStatus(statusEl, 'Extracting formatted contact data...', 'loading', true);

    let injectionResults;
    try {
      injectionResults = await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        world: 'MAIN',
        func: extractGroupMembersHybrid
      });
    } catch (worldErr) {
      console.warn('world: MAIN not supported, running in default context:', worldErr);
      injectionResults = await chrome.scripting.executeScript({
        target: { tabId: targetTab.id },
        func: extractGroupMembersHybrid
      });
    }

    if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
      displayStatus(statusEl, 'Failed to read data from WhatsApp Web. Please refresh the page and try again.', 'error');
      extractBtn.disabled = false;
      return;
    }

    const result = injectionResults[0].result;

    if (!result.success) {
      displayStatus(statusEl, result.error || 'Could not extract group members.', 'warning', true);
      extractBtn.disabled = false;
      return;
    }

    const rawContacts = result.contacts || [];
    const groupName = result.groupTitle || 'WhatsApp_Group';

    // Format each contact strictly into the 9 columns (phone_number omitted, formatted_phone only)
    const formattedRecords = rawContacts.map((c) => {
      const parsed = parsePhoneAndCountry(c.phone_raw);

      return {
        country_code: parsed.code,
        country_name: parsed.name,
        formatted_phone: parsed.formatted,
        is_my_contact: Boolean(c.is_my_contact),
        saved_name: cleanString(c.saved_name),
        public_name: cleanString(c.public_name),
        is_business: Boolean(c.is_business),
        is_admin: Boolean(c.is_admin),
        labels: cleanString(c.labels || `${groupName} Member`)
      };
    });

    // Build and download CSV
    const csvContent = buildCsvString(CSV_HEADERS, formattedRecords);
    const sanitizedTitle = groupName.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30);
    const filename = `whatsapp_contacts_${sanitizedTitle}.csv`;

    triggerCsvDownload(filename, csvContent);

    const resolvedCount = formattedRecords.filter((r) => Boolean(r.formatted_phone)).length;

    displayStatus(
      statusEl,
      `✓ Extracted ${formattedRecords.length} contacts (${resolvedCount} formatted phones) from "${groupName}"! CSV downloaded.`,
      'success',
      true
    );

  } catch (error) {
    console.error('Extraction error:', error);
    displayStatus(statusEl, 'Error: ' + (error.message || 'Failed to extract WhatsApp contacts.'), 'error', true);
  } finally {
    extractBtn.disabled = false;
  }
}

/**
 * Main initialization on DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  const extractGroupBtn = document.getElementById('extractGroupBtn');
  const exportSampleBtn = document.getElementById('exportSampleBtn');
  const statusEl = document.getElementById('statusMessage');

  checkWhatsAppTab();

  if (extractGroupBtn) {
    extractGroupBtn.addEventListener('click', () => {
      handleExtractLiveGroup(statusEl, extractGroupBtn);
    });
  }

  if (exportSampleBtn) {
    exportSampleBtn.addEventListener('click', () => {
      try {
        const csv = buildCsvString(CSV_HEADERS, SAMPLE_CONTACTS);
        triggerCsvDownload('whatsapp_contacts_sample.csv', csv);
        displayStatus(statusEl, '✓ Sample CSV downloaded successfully!', 'success');
      } catch (err) {
        console.error('Export error:', err);
        displayStatus(statusEl, 'Failed to export sample CSV.', 'error');
      }
    });
  }
});
