# WhatsApp Contact Extractor (Chrome Extension)

A Chrome Extension built using **Manifest V3** for extracting WhatsApp group members directly from WhatsApp Web (`web.whatsapp.com`) into a structured, clean CSV spreadsheet.

---

## What's New in v1.4

- **Single Formatted Phone Column:** Removed the raw unformatted `phone_number` column and retained exclusively **`formatted_phone`** (e.g. `+91 98765 43210`, `+1 (555) 012-3456`) per user requirement.
- **9-Column Clean CSV Schema:**
  `country_code, country_name, formatted_phone, is_my_contact, saved_name, public_name, is_business, is_admin, labels`
- **Saved Contacts Phone Resolution:** Resolves phone numbers for saved contacts using React component props, Webpack memory cache, avatar JIDs, and session state.

---

## 9-Column CSV Schema

The exported CSV file strictly contains these **9 columns** in exact order:

| # | Column Header | Description | Example Value |
|---|---|---|---|
| 1 | `country_code` | Two-letter ISO country code | `IN` |
| 2 | `country_name` | Full country name | `India` |
| 3 | `formatted_phone` | Cleanly formatted human-readable phone number | `+91 98765 43210` |
| 4 | `is_my_contact` | Boolean indicating if contact is saved in address book | `true` |
| 5 | `saved_name` | Name assigned in your contact list | `Rahul Sharma` |
| 6 | `public_name` | Public profile display name (`pushname`) | `Rahul` |
| 7 | `is_business` | Boolean indicating WhatsApp Business profile | `false` |
| 8 | `is_admin` | Boolean indicating if member has admin role | `true` |
| 9 | `labels` | Group member tag | `Marketing Team Member` |

---

## How to Install and Update in Chrome

1. Open Google Chrome and go to `chrome://extensions`.
2. Toggle **Developer mode** **ON** (top-right).
3. Click the 🔄 **Reload** icon on the **WhatsApp Contact Extractor** card.
4. Pin the extension to your Chrome toolbar.

---

## How to Extract WhatsApp Group Contacts

1. In Chrome, open **[web.whatsapp.com](https://web.whatsapp.com)** and log in.
2. Refresh your WhatsApp Web tab (`F5`) to ensure the updated extension context is active.
3. Open any **WhatsApp Group**.
4. Click the **Group Title** at the top of the chat to open the right-side **Group Info** panel.
5. Click the **WhatsApp Contact Extractor** extension icon in your Chrome toolbar.
6. Click **Extract Group Members**.
7. The extension will automatically download `whatsapp_contacts_[group_name].csv` with the updated 9-column schema.
