/**
 * WhatsApp Contact Extractor - Popup Script (v1.2)
 * 
 * Features:
 * - Hybrid Extractor:
 *   1. Primary: Direct WhatsApp Web IndexedDB access for 100% structured data
 *      (extracts exact phone numbers, saved names, public names, and admin status)
 *   2. Secondary: Advanced DOM Scraper with status filtering & JID parsing
 * - Country Code & Country Name auto-resolution from dial prefixes
 * - Clean RFC 4180 CSV export with UTF-8 BOM (no line-break corruption)
 * - Offline Sample CSV export retained for testing
 */

// Strict list of 10 required CSV column headers in exact order
const CSV_HEADERS = [
  'country_code',
  'country_name',
  'phone_number',
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
    phone_number: '+15550100',
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
    phone_number: '+447700900123',
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

// Sort prefixes descending by length so longer dial codes match first (+971 before +9)
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
 * Parses a phone number or raw string and returns country details.
 */
function parsePhoneAndCountry(rawNumber) {
  if (!rawNumber) {
    return { cleanNumber: '', formatted: '', code: '', name: '' };
  }

  const digits = String(rawNumber).replace(/\D/g, '');
  if (!digits || digits.length < 5) {
    return { cleanNumber: '', formatted: cleanString(rawNumber), code: '', name: '' };
  }

  const cleanNumber = '+' + digits;

  let code = '';
  let name = '';

  for (const c of COUNTRY_MAP) {
    if (digits.startsWith(c.prefix)) {
      code = c.code;
      name = c.name;
      break;
    }
  }

  const formatted = formatCleanPhone(digits, code) || cleanNumber;

  return { cleanNumber, formatted, code, name };
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
 * Injected script executed in WhatsApp Web tab to extract structured group data.
 * Uses a hybrid approach:
 * 1. Checks WhatsApp's IndexedDB for direct group metadata and contact book.
 * 2. Falls back to smart DOM extraction with status filtering.
 */
async function extractGroupMembersHybrid() {
  // Helper: Read all records from an IndexedDB object store
  function readAllFromStore(db, storeName) {
    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) return resolve([]);
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  // 1. Detect open chat header & group title from DOM
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

  // 2. LAYER 1: IndexedDB Structured Extraction
  try {
    const dbList = (await window.indexedDB.databases()) || [];
    for (const dbInfo of dbList) {
      if (!dbInfo.name) continue;

      const db = await new Promise((res) => {
        const req = window.indexedDB.open(dbInfo.name);
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      });

      if (!db) continue;

      const storeNames = Array.from(db.objectStoreNames);
      const hasGroupMeta = storeNames.some((s) => s.includes('group-metadata') || s.includes('group'));
      const hasContact = storeNames.some((s) => s.includes('contact'));

      if (hasGroupMeta || hasContact) {
        const groupStoreName = storeNames.find((s) => s.includes('group-metadata')) || 'group-metadata';
        const contactStoreName = storeNames.find((s) => s === 'contact' || s.includes('contact')) || 'contact';
        const chatStoreName = storeNames.find((s) => s === 'chat' || s.includes('chat')) || 'chat';

        const groups = await readAllFromStore(db, groupStoreName);
        const contacts = await readAllFromStore(db, contactStoreName);
        const chats = await readAllFromStore(db, chatStoreName);

        db.close();

        // Match current active group
        let matchedGroup = null;
        const normTitle = groupTitle.trim().toLowerCase();

        if (groups.length > 0) {
          matchedGroup = groups.find((g) => {
            const subj = (g.subject || g.name || '').trim().toLowerCase();
            return subj && (subj === normTitle || normTitle.includes(subj) || subj.includes(normTitle));
          });
        }

        if (!matchedGroup && chats.length > 0) {
          const matchedChat = chats.find((c) => {
            const cName = (c.name || c.formattedTitle || '').trim().toLowerCase();
            return cName && (cName === normTitle || normTitle.includes(cName));
          });
          if (matchedChat) {
            matchedGroup = groups.find((g) => g.id === matchedChat.id) || matchedChat.groupMetadata;
          }
        }

        if (matchedGroup && matchedGroup.participants && matchedGroup.participants.length > 0) {
          // Map contacts for quick O(1) lookup
          const contactMap = new Map();
          for (const c of contacts) {
            if (c.id) {
              const idStr = typeof c.id === 'string' ? c.id : (c.id._serialized || c.id.user || '');
              if (idStr) contactMap.set(idStr, c);
              if (c.id.user) contactMap.set(String(c.id.user), c);
            }
          }

          const structuredList = [];
          for (const p of matchedGroup.participants) {
            const pId = typeof p.id === 'string' ? p.id : (p.id._serialized || p.id.user || '');
            const userDigits = pId.includes('@') ? pId.split('@')[0].replace(/\D/g, '') : String(p.id?.user || '').replace(/\D/g, '');
            const cInfo = contactMap.get(pId) || contactMap.get(userDigits) || {};

            const isAdmin = Boolean(p.isAdmin || p.isSuperAdmin || p.admin);
            const isBusiness = Boolean(cInfo.isBusiness || cInfo.isEnterprise);
            const savedName = (cInfo.name || cInfo.shortName || '').trim();
            const publicName = (cInfo.pushname || cInfo.verifiedName || '').trim();
            const isMyContact = Boolean(cInfo.isMyContact || (savedName && savedName !== userDigits));

            structuredList.push({
              phone_raw: userDigits ? '+' + userDigits : '',
              saved_name: savedName,
              public_name: publicName || savedName,
              is_my_contact: isMyContact,
              is_business: isBusiness,
              is_admin: isAdmin,
              labels: `${groupTitle} Member`
            });
          }

          if (structuredList.length > 0) {
            return {
              success: true,
              source: 'indexedDB',
              groupTitle: matchedGroup.subject || matchedGroup.name || groupTitle,
              contacts: structuredList
            };
          }
        }
      } else {
        db.close();
      }
    }
  } catch (err) {
    console.warn('IndexedDB extraction skipped, proceeding to DOM parsing:', err);
  }

  // 3. LAYER 2: Smart DOM Extraction with Status Filtering
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

  function isStatusText(str) {
    if (!str) return true;
    const lower = str.toLowerCase().trim();
    return COMMON_STATUS_SNIPPETS.some((s) => lower.includes(s));
  }

  const participantsMap = new Map();

  function upsertContact(key, data) {
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

  // Check Group Info Drawer
  const drawerEl = document.querySelector(
    'div[data-testid="group-info-drawer"], section[data-testid="chat-info-drawer"], div[role="region"]'
  );

  if (drawerEl) {
    const memberCards = drawerEl.querySelectorAll('div[role="listitem"], div[data-testid="cell-frame-container"]');
    for (const card of memberCards) {
      const fullText = (card.innerText || card.textContent || '').trim();
      if (!fullText || fullText.includes('Add member') || fullText.includes('Invite to group')) continue;

      const isAdmin = /admin/i.test(fullText);
      const isBusiness = /business/i.test(fullText) || !!card.querySelector('[data-testid*="business"]');

      // Look for phone numbers in the card
      const phoneMatch = fullText.match(/\+?[0-9\s\-()]{7,}/);
      const phone = phoneMatch ? phoneMatch[0].trim() : '';

      // Look for public name indicated by ~
      const tildeMatch = fullText.match(/~([^\n\r]+)/);
      const publicName = tildeMatch ? tildeMatch[1].trim() : '';

      // Extract saved name: first line that is not a phone and not a status
      const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
      let savedName = '';

      for (const line of lines) {
        if (line === 'You') {
          savedName = 'You';
          break;
        }
        if (!isStatusText(line) && !line.startsWith('~') && (!phone || !line.includes(phone))) {
          savedName = line;
          break;
        }
      }

      const isMyContact = savedName === 'You' || (Boolean(savedName) && savedName !== phone);
      const key = phone || savedName || publicName;

      if (key) {
        upsertContact(key, {
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

  // Check Header Subtitle
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
      if (!item || isStatusText(item)) continue;

      const isPhone = /^\+?[0-9\s\-()]{7,}$/.test(item);

      if (item === 'You') {
        upsertContact('You', {
          phone_raw: '',
          saved_name: 'You',
          public_name: 'You',
          is_my_contact: true,
          is_business: false,
          is_admin: false,
          labels: `${groupTitle} Member`
        });
      } else if (isPhone) {
        upsertContact(item, {
          phone_raw: item,
          saved_name: '',
          public_name: item,
          is_my_contact: false,
          is_business: false,
          is_admin: false,
          labels: `${groupTitle} Member`
        });
      } else {
        upsertContact(item, {
          phone_raw: '',
          saved_name: item,
          public_name: item,
          is_my_contact: true,
          is_business: false,
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
    source: 'dom',
    groupTitle: groupTitle,
    contacts: contactsList
  };
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

    displayStatus(statusEl, 'Reading structured group members...', 'loading', true);

    // Execute with world: 'MAIN' to access WhatsApp's internal IndexedDB models
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

    // Format each contact strictly into the 10 required columns
    const formattedRecords = rawContacts.map((c) => {
      const parsed = parsePhoneAndCountry(c.phone_raw);

      return {
        country_code: parsed.code,
        country_name: parsed.name,
        phone_number: parsed.cleanNumber,
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

    const sourceTag = result.source === 'indexedDB' ? ' (High-Precision Database)' : '';
    displayStatus(
      statusEl,
      `✓ Extracted ${formattedRecords.length} structured contacts${sourceTag} from "${groupName}"! CSV downloaded.`,
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
