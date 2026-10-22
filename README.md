# WhatsApp Contact Extractor (Chrome Extension)

A Chrome Extension built using **Manifest V3** for extracting WhatsApp group members directly from WhatsApp Web (`web.whatsapp.com`) into a structured, clean CSV spreadsheet.

---

## What's New in v1.2 (High-Precision Data Structuring)

- **High-Precision IndexedDB Layer:** Connects directly to WhatsApp Web's internal group metadata database (`model-storage`). Extracts the full phone number / JID (`+91...`, `+1...`, etc.) for every member, including contacts saved in your phone book.
- **Clean Field Separation:**
  - Phone numbers are formatted into clean E.164 (`+919876543210`) and human-readable format (`+91 98765 43210`).
  - WhatsApp status messages (*"Hey there! I am using WhatsApp"*, *"Available"*, etc.) are strictly filtered out so they never corrupt the `public_name` or `saved_name` columns.
  - Admin roles (*"Group admin"*, *"Community admin"*) are separated cleanly into the boolean `is_admin` column.
- **Automatic Country Code & Name Resolution:** Derives the two-letter ISO country code (`US`, `IN`, `GB`, `AE`, etc.) and country name directly from the international dial prefix.
- **Zero Line-Break Corruptions:** Sanitizes all text fields to strip stray `\r` or `\n` characters, ensuring every contact occupies exactly one row in Microsoft Excel and Google Sheets.
- **RFC 4180 Standard Escaping & UTF-8 BOM:** Ensures Excel, Google Sheets, and LibreOffice parse all columns without delimiter or encoding issues.

---

## 10-Column CSV Schema

The exported CSV file strictly contains these **10 columns** in exact order:

| # | Column Header | Description | Example Value |
|---|---|---|---|
| 1 | `country_code` | Two-letter ISO country code | `IN` |
| 2 | `country_name` | Full country name | `India` |
| 3 | `phone_number` | Raw unformatted phone number with country prefix | `+919876543210` |
| 4 | `formatted_phone` | Cleanly formatted human-readable phone number | `+91 98765 43210` |
| 5 | `is_my_contact` | Boolean indicating if contact is saved in address book | `true` |
| 6 | `saved_name` | Name assigned in your contact list | `Rahul Sharma` |
| 7 | `public_name` | Public profile display name (`pushname`) | `Rahul` |
| 8 | `is_business` | Boolean indicating WhatsApp Business profile | `false` |
| 9 | `is_admin` | Boolean indicating if member has admin role | `true` |
| 10 | `labels` | Group member tag | `Marketing Team Member` |

---

## How to Install in Google Chrome

1. Open Google Chrome.
2. In the address bar, navigate to:
   ```text
   chrome://extensions
   ```
3. In the top-right corner, toggle **Developer mode** **ON**.
4. Click **Load unpacked** (top-left).
5. Select this project folder:
   ```text
   c:\Users\diyad\OneDrive\Desktop\whatsapp contract extractor
   ```
   *(If you previously loaded it, simply click the 🔄 **Reload** icon on the WhatsApp Contact Extractor card).*
6. Pin the extension to your Chrome toolbar by clicking the puzzle icon in the top right.

---

## How to Extract Clean Structured Group Contacts

1. In Google Chrome, open **[web.whatsapp.com](https://web.whatsapp.com)** and log in.
2. Click into any **WhatsApp Group** from your chat list on the left.
3. *(Recommended)*: Click the **Group Title** at the top of the chat to open the right-side **Group Info** panel.
4. Click the **WhatsApp Contact Extractor** extension icon in your Chrome toolbar.
5. Click **Extract Group Members**.
6. The extension will read the structured database, format all 10 columns, and automatically download:
   ```text
   whatsapp_contacts_[group_name].csv
   ```
7. Open the CSV in Microsoft Excel or Google Sheets to see your clean, structured spreadsheet!
