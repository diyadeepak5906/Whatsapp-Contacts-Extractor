# WhatsApp Contact Extractor (Chrome Extension)

A Chrome Extension built using **Manifest V3** for extracting WhatsApp group members directly from WhatsApp Web (`web.whatsapp.com`) into a structured, clean CSV spreadsheet.

---

## What's New in v1.8 (Bulletproof Admin & Business Resolution)

- **Dedicated Right-Drawer Locator:** Prevents selectors from accidentally querying the left chat sidebar (`#pane-side`), ensuring the actual Group Info right drawer is parsed.
- **Deep Webpack Module Scanner:** Dynamically traverses all loaded modules to extract official `participants` lists containing `isAdmin` and `admin` tags.
- **Card DOM & Badge Detection:** Inspects participant rows for *"Group admin"*, *"Community admin"*, *"Admin"*, badges, and React Fiber component properties.
- **User Admin Capability Check:** Automatically detects if you ("You") are a group admin by checking for administrative settings (*"Group permissions"*, *"Edit group settings"*).
- **Academic & Professor Suggestion (`academic_title`, `is_professor`):** Identifies doctors, professors, and university affiliations with filter options.
- **200+ Worldwide Country Codes:** Full support for Tunisia (`+216`), DR Congo (`+243`), Saudi Arabia (`+966`), Nigeria (`+234`), Australia (`+61`), India (`+91`), US (`+1`), etc.

---

## 11-Column CSV Schema

The exported CSV file contains these **11 columns** in exact order:

| # | Column Header | Description | Example Value |
|---|---|---|---|
| 1 | `country_code` | Two-letter ISO country code | `SA`, `TN`, `NG`, `IN`, `US` |
| 2 | `country_name` | Full country name | `Saudi Arabia`, `Tunisia`, `Nigeria` |
| 3 | `formatted_phone` | Cleanly formatted phone number with spaces | `+966 53 403 6153` |
| 4 | `is_my_contact` | Boolean indicating if contact is saved in address book | `true` |
| 5 | `saved_name` | Name assigned in your contact list | `Prof. Jane Doe` |
| 6 | `public_name` | Public profile display name | `Jane Doe` |
| 7 | `academic_title` | Detected title (e.g. `Doctor`, `Professor`, `Prof. Dr.`, `PhD / Researcher`) | `Professor` |
| 8 | `is_professor` | Boolean suggestion if person is a university professor / faculty | `true` / `false` |
| 9 | `is_business` | Boolean indicating WhatsApp Business profile | `true` / `false` |
| 10 | `is_admin` | Boolean indicating if member has admin role | `true` / `false` |
| 11 | `labels` | Group member tag | `Bloq Academy Connect Member` |

---

## How to Install and Update in Chrome

1. Open Google Chrome and go to `chrome://extensions`.
2. Toggle **Developer mode** **ON** (top-right).
3. Click the 🔄 **Reload** icon on the **WhatsApp Contact Extractor** card.
4. Pin the extension to your Chrome toolbar.

---

## How to Extract WhatsApp Group Contacts

1. In Chrome, open **[web.whatsapp.com](https://web.whatsapp.com)** and log in.
2. Refresh your WhatsApp Web tab (`F5`).
3. Open any **WhatsApp Group**.
4. Click the **Group Title** at the top of the chat to open the right-side **Group Info** panel.
5. Click the **WhatsApp Contact Extractor** extension icon in your Chrome toolbar.
6. Click **Extract Group Members**.
7. The status bar will report how many admins were identified and the CSV will download with `is_admin` accurately set to `TRUE` for group administrators.
