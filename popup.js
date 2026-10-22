/**
 * WhatsApp Contact Extractor - Popup Script (v1.8)
 * 
 * Bulletproof Admin & Business Detection:
 * 1. Deep Webpack Object Scanner: Recursively searches ALL Webpack module exports
 *    for any object containing a `participants` array with `isAdmin` or `admin`.
 * 2. Precision Right-Drawer Locator: Finds the actual Group Info right-side container
 *    (avoiding the left chat list #pane-side) and auto-clicks header if not open.
 * 3. Card DOM & Badge Scanner: Inspects participant rows for "Group admin", "Admin",
 *    React Fiber props.isAdmin, and business icons/catalogs.
 * 4. User Admin Resolution: Detects if the logged-in user ("You") has admin rights
 *    via drawer capabilities ("Group permissions", "Edit group settings").
 * 5. Full Academic & Professor Suggestion + Worldwide Country Codes + Spaced Formatting.
 */

// Strict list of 11 CSV column headers in exact order
const CSV_HEADERS = [
  'country_code',
  'country_name',
  'formatted_phone',
  'is_my_contact',
  'saved_name',
  'public_name',
  'academic_title',
  'is_professor',
  'is_business',
  'is_admin',
  'labels'
];

// Fictional sample contacts for offline testing
const SAMPLE_CONTACTS = [
  {
    country_code: 'US',
    country_name: 'United States',
    formatted_phone: '+1 (555) 010-0199',
    is_my_contact: true,
    saved_name: 'Prof. Jane Doe (Fictional)',
    public_name: 'Prof. Jane Doe',
    academic_title: 'Professor',
    is_professor: true,
    is_business: false,
    is_admin: true,
    labels: 'Sample University Faculty'
  },
  {
    country_code: 'GB',
    country_name: 'United Kingdom',
    formatted_phone: '+44 7700 900123',
    is_my_contact: false,
    saved_name: '',
    public_name: 'Acme Supplies (Fictional Business)',
    academic_title: '',
    is_professor: false,
    is_business: true,
    is_admin: false,
    labels: 'Sample Vendor'
  }
];

/**
 * Comprehensive ITU-T E.164 Worldwide Country Calling Code Dictionary (200+ countries).
 */
const COUNTRY_MAP = [
  // 1-digit prefixes
  { prefix: '1', code: 'US', name: 'United States / Canada' },
  { prefix: '7', code: 'RU', name: 'Russia / Kazakhstan' },

  // 2-digit prefixes
  { prefix: '20', code: 'EG', name: 'Egypt' },
  { prefix: '27', code: 'ZA', name: 'South Africa' },
  { prefix: '30', code: 'GR', name: 'Greece' },
  { prefix: '31', code: 'NL', name: 'Netherlands' },
  { prefix: '32', code: 'BE', name: 'Belgium' },
  { prefix: '33', code: 'FR', name: 'France' },
  { prefix: '34', code: 'ES', name: 'Spain' },
  { prefix: '36', code: 'HU', name: 'Hungary' },
  { prefix: '39', code: 'IT', name: 'Italy' },
  { prefix: '40', code: 'RO', name: 'Romania' },
  { prefix: '41', code: 'CH', name: 'Switzerland' },
  { prefix: '43', code: 'AT', name: 'Austria' },
  { prefix: '44', code: 'GB', name: 'United Kingdom' },
  { prefix: '45', code: 'DK', name: 'Denmark' },
  { prefix: '46', code: 'SE', name: 'Sweden' },
  { prefix: '47', code: 'NO', name: 'Norway' },
  { prefix: '48', code: 'PL', name: 'Poland' },
  { prefix: '49', code: 'DE', name: 'Germany' },
  { prefix: '51', code: 'PE', name: 'Peru' },
  { prefix: '52', code: 'MX', name: 'Mexico' },
  { prefix: '53', code: 'CU', name: 'Cuba' },
  { prefix: '54', code: 'AR', name: 'Argentina' },
  { prefix: '55', code: 'BR', name: 'Brazil' },
  { prefix: '56', code: 'CL', name: 'Chile' },
  { prefix: '57', code: 'CO', name: 'Colombia' },
  { prefix: '58', code: 'VE', name: 'Venezuela' },
  { prefix: '60', code: 'MY', name: 'Malaysia' },
  { prefix: '61', code: 'AU', name: 'Australia' },
  { prefix: '62', code: 'ID', name: 'Indonesia' },
  { prefix: '63', code: 'PH', name: 'Philippines' },
  { prefix: '64', code: 'NZ', name: 'New Zealand' },
  { prefix: '65', code: 'SG', name: 'Singapore' },
  { prefix: '66', code: 'TH', name: 'Thailand' },
  { prefix: '81', code: 'JP', name: 'Japan' },
  { prefix: '82', code: 'KR', name: 'South Korea' },
  { prefix: '84', code: 'VN', name: 'Vietnam' },
  { prefix: '86', code: 'CN', name: 'China' },
  { prefix: '90', code: 'TR', name: 'Turkey' },
  { prefix: '91', code: 'IN', name: 'India' },
  { prefix: '92', code: 'PK', name: 'Pakistan' },
  { prefix: '93', code: 'AF', name: 'Afghanistan' },
  { prefix: '94', code: 'LK', name: 'Sri Lanka' },
  { prefix: '95', code: 'MM', name: 'Myanmar' },
  { prefix: '98', code: 'IR', name: 'Iran' },

  // 3-digit prefixes
  { prefix: '211', code: 'SS', name: 'South Sudan' },
  { prefix: '212', code: 'MA', name: 'Morocco' },
  { prefix: '213', code: 'DZ', name: 'Algeria' },
  { prefix: '216', code: 'TN', name: 'Tunisia' },
  { prefix: '218', code: 'LY', name: 'Libya' },
  { prefix: '220', code: 'GM', name: 'Gambia' },
  { prefix: '221', code: 'SN', name: 'Senegal' },
  { prefix: '222', code: 'MR', name: 'Mauritania' },
  { prefix: '223', code: 'ML', name: 'Mali' },
  { prefix: '224', code: 'GN', name: 'Guinea' },
  { prefix: '225', code: 'CI', name: 'Ivory Coast' },
  { prefix: '226', code: 'BF', name: 'Burkina Faso' },
  { prefix: '227', code: 'NE', name: 'Niger' },
  { prefix: '228', code: 'TG', name: 'Togo' },
  { prefix: '229', code: 'BJ', name: 'Benin' },
  { prefix: '230', code: 'MU', name: 'Mauritius' },
  { prefix: '231', code: 'LR', name: 'Liberia' },
  { prefix: '232', code: 'SL', name: 'Sierra Leone' },
  { prefix: '233', code: 'GH', name: 'Ghana' },
  { prefix: '234', code: 'NG', name: 'Nigeria' },
  { prefix: '235', code: 'TD', name: 'Chad' },
  { prefix: '236', code: 'CF', name: 'Central African Republic' },
  { prefix: '237', code: 'CM', name: 'Cameroon' },
  { prefix: '238', code: 'CV', name: 'Cape Verde' },
  { prefix: '239', code: 'ST', name: 'Sao Tome and Principe' },
  { prefix: '240', code: 'GQ', name: 'Equatorial Guinea' },
  { prefix: '241', code: 'GA', name: 'Gabon' },
  { prefix: '242', code: 'CG', name: 'Republic of the Congo' },
  { prefix: '243', code: 'CD', name: 'Democratic Republic of the Congo' },
  { prefix: '244', code: 'AO', name: 'Angola' },
  { prefix: '245', code: 'GW', name: 'Guinea-Bissau' },
  { prefix: '248', code: 'SC', name: 'Seychelles' },
  { prefix: '249', code: 'SD', name: 'Sudan' },
  { prefix: '250', code: 'RW', name: 'Rwanda' },
  { prefix: '251', code: 'ET', name: 'Ethiopia' },
  { prefix: '252', code: 'SO', name: 'Somalia' },
  { prefix: '253', code: 'DJ', name: 'Djibouti' },
  { prefix: '254', code: 'KE', name: 'Kenya' },
  { prefix: '255', code: 'TZ', name: 'Tanzania' },
  { prefix: '256', code: 'UG', name: 'Uganda' },
  { prefix: '257', code: 'BI', name: 'Burundi' },
  { prefix: '258', code: 'MZ', name: 'Mozambique' },
  { prefix: '260', code: 'ZM', name: 'Zambia' },
  { prefix: '261', code: 'MG', name: 'Madagascar' },
  { prefix: '262', code: 'RE', name: 'Reunion / Mayotte' },
  { prefix: '263', code: 'ZW', name: 'Zimbabwe' },
  { prefix: '264', code: 'NA', name: 'Namibia' },
  { prefix: '265', code: 'MW', name: 'Malawi' },
  { prefix: '266', code: 'LS', name: 'Lesotho' },
  { prefix: '267', code: 'BW', name: 'Botswana' },
  { prefix: '268', code: 'SZ', name: 'Eswatini' },
  { prefix: '269', code: 'KM', name: 'Comoros' },
  { prefix: '291', code: 'ER', name: 'Eritrea' },
  { prefix: '297', code: 'AW', name: 'Aruba' },
  { prefix: '298', code: 'FO', name: 'Faroe Islands' },
  { prefix: '299', code: 'GL', name: 'Greenland' },
  { prefix: '350', code: 'GI', name: 'Gibraltar' },
  { prefix: '351', code: 'PT', name: 'Portugal' },
  { prefix: '352', code: 'LU', name: 'Luxembourg' },
  { prefix: '353', code: 'IE', name: 'Ireland' },
  { prefix: '354', code: 'IS', name: 'Iceland' },
  { prefix: '355', code: 'AL', name: 'Albania' },
  { prefix: '356', code: 'MT', name: 'Malta' },
  { prefix: '357', code: 'CY', name: 'Cyprus' },
  { prefix: '358', code: 'FI', name: 'Finland' },
  { prefix: '359', code: 'BG', name: 'Bulgaria' },
  { prefix: '370', code: 'LT', name: 'Lithuania' },
  { prefix: '371', code: 'LV', name: 'Latvia' },
  { prefix: '372', code: 'EE', name: 'Estonia' },
  { prefix: '373', code: 'MD', name: 'Moldova' },
  { prefix: '374', code: 'AM', name: 'Armenia' },
  { prefix: '375', code: 'BY', name: 'Belarus' },
  { prefix: '376', code: 'AD', name: 'Andorra' },
  { prefix: '377', code: 'MC', name: 'Monaco' },
  { prefix: '378', code: 'SM', name: 'San Marino' },
  { prefix: '380', code: 'UA', name: 'Ukraine' },
  { prefix: '381', code: 'RS', name: 'Serbia' },
  { prefix: '382', code: 'ME', name: 'Montenegro' },
  { prefix: '383', code: 'XK', name: 'Kosovo' },
  { prefix: '385', code: 'HR', name: 'Croatia' },
  { prefix: '386', code: 'SI', name: 'Slovenia' },
  { prefix: '387', code: 'BA', name: 'Bosnia and Herzegovina' },
  { prefix: '389', code: 'MK', name: 'North Macedonia' },
  { prefix: '420', code: 'CZ', name: 'Czech Republic' },
  { prefix: '421', code: 'SK', name: 'Slovakia' },
  { prefix: '423', code: 'LI', name: 'Liechtenstein' },
  { prefix: '500', code: 'FK', name: 'Falkland Islands' },
  { prefix: '501', code: 'BZ', name: 'Belize' },
  { prefix: '502', code: 'GT', name: 'Guatemala' },
  { prefix: '503', code: 'SV', name: 'El Salvador' },
  { prefix: '504', code: 'HN', name: 'Honduras' },
  { prefix: '505', code: 'NI', name: 'Nicaragua' },
  { prefix: '506', code: 'CR', name: 'Costa Rica' },
  { prefix: '507', code: 'PA', name: 'Panama' },
  { prefix: '509', code: 'HT', name: 'Haiti' },
  { prefix: '591', code: 'BO', name: 'Bolivia' },
  { prefix: '592', code: 'GY', name: 'Guyana' },
  { prefix: '593', code: 'EC', name: 'Ecuador' },
  { prefix: '594', code: 'GF', name: 'French Guiana' },
  { prefix: '595', code: 'PY', name: 'Paraguay' },
  { prefix: '597', code: 'SR', name: 'Suriname' },
  { prefix: '598', code: 'UY', name: 'Uruguay' },
  { prefix: '599', code: 'CW', name: 'Curacao' },
  { prefix: '670', code: 'TL', name: 'East Timor' },
  { prefix: '673', code: 'BN', name: 'Brunei' },
  { prefix: '674', code: 'NR', name: 'Nauru' },
  { prefix: '675', code: 'PG', name: 'Papua New Guinea' },
  { prefix: '676', code: 'TO', name: 'Tonga' },
  { prefix: '677', code: 'SB', name: 'Solomon Islands' },
  { prefix: '678', code: 'VU', name: 'Vanuatu' },
  { prefix: '679', code: 'FJ', name: 'Fiji' },
  { prefix: '680', code: 'PW', name: 'Palau' },
  { prefix: '682', code: 'CK', name: 'Cook Islands' },
  { prefix: '685', code: 'WS', name: 'Samoa' },
  { prefix: '686', code: 'KI', name: 'Kiribati' },
  { prefix: '687', code: 'NC', name: 'New Caledonia' },
  { prefix: '688', code: 'TV', name: 'Tuvalu' },
  { prefix: '689', code: 'PF', name: 'French Polynesia' },
  { prefix: '852', code: 'HK', name: 'Hong Kong' },
  { prefix: '853', code: 'MO', name: 'Macau' },
  { prefix: '855', code: 'KH', name: 'Cambodia' },
  { prefix: '856', code: 'LA', name: 'Laos' },
  { prefix: '880', code: 'BD', name: 'Bangladesh' },
  { prefix: '886', code: 'TW', name: 'Taiwan' },
  { prefix: '960', code: 'MV', name: 'Maldives' },
  { prefix: '961', code: 'LB', name: 'Lebanon' },
  { prefix: '962', code: 'JO', name: 'Jordan' },
  { prefix: '963', code: 'SY', name: 'Syria' },
  { prefix: '964', code: 'IQ', name: 'Iraq' },
  { prefix: '965', code: 'KW', name: 'Kuwait' },
  { prefix: '966', code: 'SA', name: 'Saudi Arabia' },
  { prefix: '967', code: 'YE', name: 'Yemen' },
  { prefix: '968', code: 'OM', name: 'Oman' },
  { prefix: '970', code: 'PS', name: 'Palestine' },
  { prefix: '971', code: 'AE', name: 'United Arab Emirates' },
  { prefix: '972', code: 'IL', name: 'Israel' },
  { prefix: '973', code: 'BH', name: 'Bahrain' },
  { prefix: '974', code: 'QA', name: 'Qatar' },
  { prefix: '975', code: 'BT', name: 'Bhutan' },
  { prefix: '976', code: 'MN', name: 'Mongolia' },
  { prefix: '977', code: 'NP', name: 'Nepal' },
  { prefix: '992', code: 'TJ', name: 'Tajikistan' },
  { prefix: '993', code: 'TM', name: 'Turkmenistan' },
  { prefix: '994', code: 'AZ', name: 'Azerbaijan' },
  { prefix: '995', code: 'GE', name: 'Georgia' },
  { prefix: '996', code: 'KG', name: 'Kyrgyzstan' },
  { prefix: '998', code: 'UZ', name: 'Uzbekistan' }
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
 * Analyzes contact names and status to suggest if the person is a Doctor or University Professor.
 */
function detectAcademicRole(savedName, publicName, aboutText) {
  const combined = `${savedName || ''} ${publicName || ''} ${aboutText || ''}`.trim();

  // 1. Explicit Professor keywords
  const isProfExplicit =
    /\b(prof|prof\.|professor|asst\.?\s*prof|assoc\.?\s*prof|assistant\s+professor|associate\s+professor|adjunct\s+professor|visiting\s+professor)\b/i.test(combined);

  // 2. Doctor keywords
  const isDrExplicit =
    /\b(dr|dr\.|doctor|dott|dra)\b/i.test(combined);

  // 3. PhD / Academic doctorate credentials
  const hasAcademicDegree =
    /\b(ph\.?d|d\.?phil|d\.?sc|postdoc|post-doc|m\.?phil)\b/i.test(combined);

  // 4. Medical degrees
  const hasMedicalDegree =
    /\b(mbbs|m\.?d\.?|bams|bhms|bds|m\.?s\.?\b|frcs|mrcp)\b/i.test(combined);

  // 5. University / Higher Education affiliation keywords
  const hasUniversityContext =
    /\b(university|univ|college|faculty|department|dept\.?|lecturer|senior\s+lecturer|academic|academics|dean|h\.?o\.?d\.?|campus|institute\s+of\s+technology|iit|iim|mit|oxford|cambridge|harvard|stanford|polytechnic)\b/i.test(combined);

  let academicTitle = '';
  let isProfessor = false;

  if (isProfExplicit && isDrExplicit) {
    academicTitle = 'Prof. Dr.';
  } else if (isProfExplicit) {
    academicTitle = 'Professor';
  } else if (isDrExplicit) {
    academicTitle = 'Doctor';
  } else if (hasAcademicDegree) {
    academicTitle = 'PhD / Researcher';
  } else if (hasMedicalDegree) {
    academicTitle = 'Doctor (Medical)';
  } else if (/\b(lecturer|faculty|dean|hod)\b/i.test(combined)) {
    academicTitle = 'University Faculty';
  }

  if (isProfExplicit) {
    isProfessor = true;
  } else if (isDrExplicit && (hasUniversityContext || hasAcademicDegree || !hasMedicalDegree)) {
    isProfessor = true;
  } else if (hasUniversityContext && (isDrExplicit || hasAcademicDegree || /\b(faculty|lecturer|dean|hod|chair)\b/i.test(combined))) {
    isProfessor = true;
  } else {
    isProfessor = false;
  }

  return { academicTitle, isProfessor };
}

/**
 * Formats digits into a clean, human-readable phone number with spaces.
 */
function formatWithSpaces(digits, prefix) {
  if (!digits) return '';
  const countryPrefix = prefix || '';
  const rest = countryPrefix && digits.startsWith(countryPrefix)
    ? digits.substring(countryPrefix.length)
    : digits;

  let formattedRest = '';
  if (countryPrefix === '91' && rest.length === 10) {
    formattedRest = `${rest.substring(0, 5)} ${rest.substring(5)}`;
  } else if (countryPrefix === '1' && rest.length === 10) {
    formattedRest = `(${rest.substring(0, 3)}) ${rest.substring(3, 6)}-${rest.substring(6)}`;
  } else if (countryPrefix === '966' && rest.length === 9) {
    formattedRest = `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
  } else if (countryPrefix === '234' && rest.length === 10) {
    formattedRest = `${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6)}`;
  } else if (countryPrefix === '216' && rest.length === 8) {
    formattedRest = `${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
  } else if (countryPrefix === '243' && rest.length === 9) {
    formattedRest = `${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6)}`;
  } else if (countryPrefix === '61' && rest.length === 9) {
    formattedRest = `${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6)}`;
  } else {
    formattedRest = rest.replace(/(\d{3,4})(?=\d)/g, '$1 ');
  }

  return `+${countryPrefix} ${formattedRest}`.trim();
}

/**
 * Parses phone number and returns country details & formatted phone.
 */
function parsePhoneAndCountry(rawNumber, fallbackPublicName) {
  let source = cleanString(rawNumber);

  if ((!source || !source.includes(' ')) && fallbackPublicName && fallbackPublicName.startsWith('+') && fallbackPublicName.includes(' ')) {
    source = cleanString(fallbackPublicName);
  }

  if (!source) {
    return { formatted: '', code: '', name: '' };
  }

  const digits = source.replace(/\D/g, '');
  if (!digits || digits.length < 5) {
    return { formatted: source, code: '', name: '' };
  }

  let code = '';
  let name = '';
  let matchedPrefix = '';

  for (const c of COUNTRY_MAP) {
    if (digits.startsWith(c.prefix)) {
      code = c.code;
      name = c.name;
      matchedPrefix = c.prefix;
      break;
    }
  }

  let formatted = '';
  if (source.startsWith('+') && source.includes(' ')) {
    formatted = source;
  } else {
    formatted = formatWithSpaces(digits, matchedPrefix) || ('+' + digits);
  }

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
 * Extracts full group member details including exact Admin & Business status.
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
    const myOwnDigits = myOwnPhone.replace(/\D/g, '');

    // Sets & Maps for definitive Admin and Business detection
    const adminDigitsSet = new Set();
    const adminNamesSet = new Set();
    const businessDigitsSet = new Set();
    const webpackContacts = new Map();

    // 1. SCAN ALL WEBPACK MODULES DEEPLY FOR GROUPMETADATA & CONTACTS
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

        function inspectWebpackObject(obj, depth = 0) {
          if (!obj || typeof obj !== 'object' || depth > 3) return;

          // Check if object is a group metadata with participants
          if (Array.isArray(obj.participants) && obj.participants.length > 0) {
            for (const p of obj.participants) {
              const ser = p?.id?._serialized || (typeof p?.id === 'string' ? p.id : '') || p?.id?.user || '';
              const digits = ser.split('@')[0].replace(/\D/g, '');
              const isAdmin = Boolean(p.isAdmin || p.isSuperAdmin || p.admin === 'admin' || p.admin === 'superadmin' || p.admin);
              if (digits && isAdmin) {
                adminDigitsSet.add(digits);
              }
            }
          }

          // Check if object has groupMetadata property
          if (obj.groupMetadata && Array.isArray(obj.groupMetadata.participants)) {
            for (const p of obj.groupMetadata.participants) {
              const ser = p?.id?._serialized || (typeof p?.id === 'string' ? p.id : '') || p?.id?.user || '';
              const digits = ser.split('@')[0].replace(/\D/g, '');
              const isAdmin = Boolean(p.isAdmin || p.isSuperAdmin || p.admin === 'admin' || p.admin === 'superadmin' || p.admin);
              if (digits && isAdmin) {
                adminDigitsSet.add(digits);
              }
            }
          }

          // Check collections with models
          const list = obj._models || obj.models || (Array.isArray(obj) ? obj : null);
          if (Array.isArray(list) && list.length > 0) {
            for (const item of list) {
              if (!item) continue;

              // Check if model has participants
              if (Array.isArray(item.participants)) {
                for (const p of item.participants) {
                  const ser = p?.id?._serialized || (typeof p?.id === 'string' ? p.id : '') || p?.id?.user || '';
                  const digits = ser.split('@')[0].replace(/\D/g, '');
                  const isAdmin = Boolean(p.isAdmin || p.isSuperAdmin || p.admin === 'admin' || p.admin === 'superadmin' || p.admin);
                  if (digits && isAdmin) {
                    adminDigitsSet.add(digits);
                  }
                }
              }

              // Check if model is a contact
              if (item.id) {
                const ser = typeof item.id === 'string' ? item.id : (item.id._serialized || '');
                if (ser.includes('@c.us') || ser.includes('@s.whatsapp.net')) {
                  const digits = ser.split('@')[0].replace(/\D/g, '');
                  if (digits.length >= 7) {
                    const phone = '+' + digits;
                    const name = (item.name || item.formattedTitle || '').trim();
                    const pushname = (item.pushname || item.verifiedName || '').trim();
                    const about = (item.status || item.about || '').trim();
                    const username = (item.username || item.handle || '').replace(/^@/, '').trim().toLowerCase();
                    const isMyContact = Boolean(item.isMyContact || item.isAddressBookContact || (name && name !== digits));
                    const isBusiness = Boolean(item.isBusiness || item.isEnterprise || item.isVerified || item.verifiedName);

                    if (isBusiness) businessDigitsSet.add(digits);

                    const record = { phone, name, pushname, about, isMyContact, isBusiness };
                    if (name) webpackContacts.set(name.toLowerCase(), record);
                    if (pushname) webpackContacts.set(pushname.toLowerCase(), record);
                    if (username) {
                      webpackContacts.set(username, record);
                      webpackContacts.set('@' + username, record);
                    }
                    webpackContacts.set(digits, record);
                  }
                }
              }
            }
          }
        }

        for (const mId in modules) {
          const exp = modules[mId]?.exports;
          if (!exp) continue;
          inspectWebpackObject(exp);
          if (exp.default) inspectWebpackObject(exp.default);
          if (exp.ChatCollection) inspectWebpackObject(exp.ChatCollection);
          if (exp.GroupMetadataCollection) inspectWebpackObject(exp.GroupMetadataCollection);
        }
      }
    } catch (wpErr) {
      console.warn('Webpack search note:', wpErr);
    }

    // 2. SCAN INDEXEDDB FOR GROUPMETADATA ADMINS & BUSINESS CONTACTS
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
          const sLower = sName.toLowerCase();

          if (sLower.includes('group') || sLower.includes('chat') || sLower.includes('participant')) {
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
              const parts = r.participants || r.groupMetadata?.participants;
              if (parts && Array.isArray(parts)) {
                for (const p of parts) {
                  const ser = typeof p.id === 'string' ? p.id : (p.id?._serialized || '');
                  const digits = ser.split('@')[0].replace(/\D/g, '');
                  const isAdmin = Boolean(p.isAdmin || p.isSuperAdmin || p.admin === 'admin' || p.admin === 'superadmin' || p.admin);
                  if (digits && isAdmin) {
                    adminDigitsSet.add(digits);
                  }
                }
              }
            }
          }

          if (sLower.includes('contact')) {
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
                  const about = (r.status || r.about || '').trim();
                  const username = (r.username || r.handle || '').replace(/^@/, '').trim().toLowerCase();
                  const isMyContact = Boolean(r.isMyContact || (name && name !== digits));
                  const isBusiness = Boolean(r.isBusiness || r.isEnterprise || r.isVerified || r.verifiedName);

                  if (isBusiness) businessDigitsSet.add(digits);

                  const record = { phone, name, pushname, about, isMyContact, isBusiness };
                  if (name) indexedDbContacts.set(name.toLowerCase(), record);
                  if (pushname) indexedDbContacts.set(pushname.toLowerCase(), record);
                  if (username) {
                    indexedDbContacts.set(username, record);
                    indexedDbContacts.set('@' + username, record);
                  }
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

    // 3. LOCATE THE REAL RIGHT-SIDE GROUP INFO DRAWER (avoids left chat-list #pane-side)
    function findRightDrawer() {
      // Look for containers situated strictly on the right half of the browser viewport
      const allDivs = Array.from(document.querySelectorAll('div, section'));
      for (const el of allDivs) {
        if (el.clientWidth > 250 && el.clientHeight > 300) {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth * 0.45 && rect.left > window.innerWidth * 0.25) {
            const text = el.innerText || '';
            // Must have group drawer indicators and not be the left search bar
            if ((text.includes('participants') || text.includes('Group info') || text.includes('Exit group') || text.includes('Group permissions') || text.includes('Group settings')) && !text.includes('Search or start new chat')) {
              return el;
            }
          }
        }
      }
      return null;
    }

    let drawerEl = findRightDrawer();

    // If Group Info drawer is not currently open, auto-click group header to open it
    if (!drawerEl) {
      const headerBtn = headerEl.querySelector('div[role="button"]') || headerEl;
      if (headerBtn) {
        headerBtn.click();
        await new Promise((r) => setTimeout(r, 800));
        drawerEl = findRightDrawer();
      }
    }

    // Check if the current user ("You") has group admin powers
    let isUserGroupAdmin = false;
    if (drawerEl) {
      const drawerText = drawerEl.innerText || '';
      // Only admins see "Group permissions", "Edit group settings", or "Dismiss as admin"
      if (drawerText.includes('Group permissions') || drawerText.includes('Edit group settings') || drawerText.includes('Group settings')) {
        isUserGroupAdmin = true;
      }
    }

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
          about: prev.about || data.about,
          is_my_contact: Boolean(prev.is_my_contact || data.is_my_contact),
          is_business: Boolean(prev.is_business || data.is_business),
          is_admin: Boolean(prev.is_admin || data.is_admin),
          labels: data.labels || prev.labels
        });
      }
    }

    // Finds participant cards inside the right drawer
    function findDrawerCards(container) {
      if (!container) return [];

      // Strategy 1: specific roles and testids
      const specific = container.querySelectorAll(
        'div[data-testid="cell-frame-container"], div[role="listitem"], div[role="button"][data-testid*="cell"], div[data-testid*="list-item"]'
      );
      if (specific.length > 0) return Array.from(specific);

      // Strategy 2: Trace cards from avatar images
      const images = container.querySelectorAll('img');
      const cardSet = new Set();
      for (const img of images) {
        let parent = img.parentElement;
        let depth = 0;
        while (parent && parent !== container && depth < 6) {
          if (parent.getAttribute('role') === 'button' || parent.getAttribute('role') === 'listitem') {
            cardSet.add(parent);
            break;
          }
          parent = parent.parentElement;
          depth++;
        }
      }
      if (cardSet.size > 0) return Array.from(cardSet);

      // Strategy 3: Elements containing phone numbers or admin markers
      const allDivs = container.querySelectorAll('div');
      const candidates = [];
      for (const d of allDivs) {
        if (d.children.length >= 2 && d.children.length <= 6 && (d.innerText.toLowerCase().includes('admin') || /\+?[0-9\s\-()]{8,}/.test(d.innerText))) {
          candidates.push(d);
        }
      }
      return candidates;
    }

    // Scrapes cards from drawer and detects Admin badge in text/DOM
    function scrapeCardsFromDrawer(container) {
      if (!container) return;
      const memberCards = findDrawerCards(container);

      for (const card of memberCards) {
        const fullText = (card.innerText || card.textContent || '').trim();
        if (!fullText || fullText.includes('Add member') || fullText.includes('Invite to group')) continue;

        // Admin detection: checks text, badges, titles, and testids
        const hasAdminText = /\b(admin|group admin|community admin|administrador|مشرف)\b/i.test(fullText);
        const hasAdminBadge = !!card.querySelector('[title*="admin" i], [aria-label*="admin" i], [data-testid*="admin" i], [data-icon*="admin" i]');
        let isAdmin = hasAdminText || hasAdminBadge;

        // Business detection
        const hasBusinessText = /business/i.test(fullText);
        const hasBusinessBadge = !!card.querySelector('[title*="business" i], [aria-label*="business" i], [data-testid*="business" i], [data-icon*="business" i]');
        let isBusiness = hasBusinessText || hasBusinessBadge;

        const phoneMatch = fullText.match(/\+?[0-9\s\-()]{7,}/);
        let phone = phoneMatch ? phoneMatch[0].trim() : '';

        const tildeMatch = fullText.match(/~([^\n\r]+)/);
        let publicName = tildeMatch ? tildeMatch[1].trim() : '';

        const lines = fullText.split('\n').map((l) => l.trim()).filter(Boolean);
        let savedName = '';
        let aboutText = '';

        for (const line of lines) {
          if (line === 'You') {
            savedName = 'You';
            break;
          }
          if (!isStatus(line) && !line.startsWith('~') && (!phone || !line.includes(phone))) {
            savedName = line;
            break;
          } else if (isStatus(line)) {
            aboutText = line;
          }
        }

        if (isAdmin && savedName) {
          adminNamesSet.add(savedName.toLowerCase());
        }

        if (!phone) {
          phone = extractPhoneFromImg(card);
        }

        if (savedName) {
          const normName = savedName.toLowerCase();
          const cleanHandle = normName.replace(/^@/, '');
          const wpMatch = webpackContacts.get(normName) || webpackContacts.get(cleanHandle);
          if (wpMatch) {
            if (!phone && wpMatch.phone) phone = wpMatch.phone;
            if (!publicName && wpMatch.pushname) publicName = wpMatch.pushname;
            if (!aboutText && wpMatch.about) aboutText = wpMatch.about;
            if (wpMatch.isBusiness) isBusiness = true;
          }
        }

        if (savedName) {
          const normName = savedName.toLowerCase();
          const cleanHandle = normName.replace(/^@/, '');
          const idbMatch = indexedDbContacts.get(normName) || indexedDbContacts.get(cleanHandle);
          if (idbMatch) {
            if (!phone && idbMatch.phone) phone = idbMatch.phone;
            if (!publicName && idbMatch.pushname) publicName = idbMatch.pushname;
            if (!aboutText && idbMatch.about) aboutText = idbMatch.about;
            if (idbMatch.isBusiness) isBusiness = true;
          }
        }

        const digits = phone.replace(/\D/g, '');
        if (digits && adminDigitsSet.has(digits)) {
          isAdmin = true;
        }
        if (digits && businessDigitsSet.has(digits)) {
          isBusiness = true;
        }

        if (savedName === 'You' || fullText.includes('You')) {
          if (!phone) phone = myOwnPhone;
          savedName = 'You';
          publicName = 'You';
          if (isUserGroupAdmin) isAdmin = true;
        }

        const isMyContact = savedName === 'You' || (Boolean(savedName) && savedName !== phone);
        const key = phone || savedName || publicName;

        if (key) {
          upsertRecord(key, {
            phone_raw: phone,
            saved_name: savedName,
            public_name: publicName || savedName || phone,
            about: aboutText,
            is_my_contact: isMyContact,
            is_business: isBusiness,
            is_admin: isAdmin,
            labels: `${groupTitle} Member`
          });
        }
      }
    }

    // Auto-scroll virtualized participant drawer
    if (drawerEl) {
      scrapeCardsFromDrawer(drawerEl);

      let scrollContainer = drawerEl;
      const divs = drawerEl.querySelectorAll('div');
      for (const d of divs) {
        if (d.scrollHeight > d.clientHeight && d.clientHeight > 150) {
          const style = window.getComputedStyle(d);
          if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            scrollContainer = d;
            break;
          }
        }
      }

      if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
        const totalHeight = scrollContainer.scrollHeight;
        const step = Math.max(300, Math.floor(scrollContainer.clientHeight * 0.8));
        let currY = 0;

        while (currY < totalHeight) {
          currY += step;
          scrollContainer.scrollTop = currY;
          await new Promise((r) => setTimeout(r, 120));
          scrapeCardsFromDrawer(drawerEl);
        }

        scrollContainer.scrollTop = 0;
      }
    }

    // 4. PARSE HEADER SUBTITLE & CROSS-REFERENCE DEFINITIVE ADMIN SETS
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
          const isYouAdmin = isUserGroupAdmin || (myOwnDigits && adminDigitsSet.has(myOwnDigits));

          upsertRecord('You', {
            phone_raw: myOwnPhone,
            saved_name: 'You',
            public_name: 'You',
            is_my_contact: true,
            is_business: false,
            is_admin: Boolean(isYouAdmin),
            labels: `${groupTitle} Member`
          });
        } else if (isPhone) {
          const digits = item.replace(/\D/g, '');
          const isAdmin = digits && adminDigitsSet.has(digits);
          const isBusiness = digits && businessDigitsSet.has(digits);

          upsertRecord(item, {
            phone_raw: item,
            saved_name: '',
            public_name: item,
            is_my_contact: false,
            is_business: Boolean(isBusiness),
            is_admin: Boolean(isAdmin),
            labels: `${groupTitle} Member`
          });
        } else {
          const normItem = item.toLowerCase();
          const cleanHandle = normItem.replace(/^@/, '');
          const wpMatch = webpackContacts.get(normItem) || webpackContacts.get(cleanHandle);
          const idbMatch = indexedDbContacts.get(normItem) || indexedDbContacts.get(cleanHandle);

          const resolvedPhone = (wpMatch && wpMatch.phone) || (idbMatch && idbMatch.phone) || '';
          const resolvedPush = (wpMatch && wpMatch.pushname) || (idbMatch && idbMatch.pushname) || item;
          const about = (wpMatch && wpMatch.about) || (idbMatch && idbMatch.about) || '';
          const digits = resolvedPhone.replace(/\D/g, '');

          const isAdmin = Boolean(
            (digits && adminDigitsSet.has(digits)) ||
            adminNamesSet.has(normItem) ||
            adminNamesSet.has(cleanHandle)
          );
          const isBusiness = Boolean(
            (digits && businessDigitsSet.has(digits)) ||
            wpMatch?.isBusiness ||
            idbMatch?.isBusiness
          );

          upsertRecord(resolvedPhone || item, {
            phone_raw: resolvedPhone,
            saved_name: item,
            public_name: resolvedPush,
            about: about,
            is_my_contact: true,
            is_business: isBusiness,
            is_admin: isAdmin,
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

    displayStatus(statusEl, 'Analyzing members, admin roles & business status...', 'loading', true);

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

    // Format each contact into the 11 columns with Academic & Professor detection
    let formattedRecords = rawContacts.map((c) => {
      const parsed = parsePhoneAndCountry(c.phone_raw, c.public_name);
      const academic = detectAcademicRole(c.saved_name, c.public_name, c.about);

      return {
        country_code: parsed.code,
        country_name: parsed.name,
        formatted_phone: parsed.formatted,
        is_my_contact: Boolean(c.is_my_contact),
        saved_name: cleanString(c.saved_name),
        public_name: cleanString(c.public_name),
        academic_title: academic.academicTitle,
        is_professor: Boolean(academic.isProfessor),
        is_business: Boolean(c.is_business),
        is_admin: Boolean(c.is_admin),
        labels: cleanString(c.labels || `${groupName} Member`)
      };
    });

    // Check filter selection
    const filterSelect = document.getElementById('exportFilterSelect');
    const selectedFilter = filterSelect ? filterSelect.value : 'all';

    if (selectedFilter === 'saved_only') {
      formattedRecords = formattedRecords.filter((r) => r.is_my_contact || Boolean(r.saved_name));
    } else if (selectedFilter === 'academic_only') {
      formattedRecords = formattedRecords.filter((r) => Boolean(r.academic_title) || r.is_professor);
    }

    if (formattedRecords.length === 0) {
      displayStatus(
        statusEl,
        `No contacts matched the "${selectedFilter.replace('_', ' ')}" filter. Try switching back to "All Members".`,
        'warning',
        true
      );
      extractBtn.disabled = false;
      return;
    }

    // Build and download CSV
    const csvContent = buildCsvString(CSV_HEADERS, formattedRecords);
    const sanitizedTitle = groupName.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30);
    const filterTag = selectedFilter !== 'all' ? `_${selectedFilter}` : '';
    const filename = `whatsapp_contacts_${sanitizedTitle}${filterTag}.csv`;

    triggerCsvDownload(filename, csvContent);

    const adminCount = formattedRecords.filter((r) => r.is_admin).length;
    const profCount = formattedRecords.filter((r) => r.is_professor).length;

    displayStatus(
      statusEl,
      `✓ Exported ${formattedRecords.length} contacts (${adminCount} admins, ${profCount} professors) from "${groupName}"! CSV downloaded.`,
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
        const filterSelect = document.getElementById('exportFilterSelect');
        const selectedFilter = filterSelect ? filterSelect.value : 'all';

        let sampleToExport = SAMPLE_CONTACTS;
        if (selectedFilter === 'academic_only') {
          sampleToExport = SAMPLE_CONTACTS.filter((s) => s.is_professor || Boolean(s.academic_title));
        } else if (selectedFilter === 'saved_only') {
          sampleToExport = SAMPLE_CONTACTS.filter((s) => s.is_my_contact);
        }

        const csv = buildCsvString(CSV_HEADERS, sampleToExport);
        triggerCsvDownload('whatsapp_contacts_sample.csv', csv);
        displayStatus(statusEl, `✓ Sample CSV (${sampleToExport.length} rows) downloaded successfully!`, 'success');
      } catch (err) {
        console.error('Export error:', err);
        displayStatus(statusEl, 'Failed to export sample CSV.', 'error');
      }
    });
  }
});
