# Voice Khata

Build a complete mobile-first web app (PWA) called "VoiceKhata" — India's Zero-Login Voice-to-Ledger for kirana stores.

### Core Vision

A frictionless voice-first accounting app for Indian kirana store owners. Shopkeeper speaks the transaction in Hindi/regional language → AI creates ledger entry → stock updates → WhatsApp invoice is ready in one tap. No complicated login, no typing.

### Must-Have Features (Include All)

1. Direct Voice Ledger

   - Big microphone button on home screen

   - User speaks in Hindi (example: "2 kg chini Ram ko 120 rupaye udhaar")

   - AI converts speech to structured data (item, quantity, price, customer name, payment type: cash/udhaar)

   - Show confirmation screen before saving

   - Support Hindi first (add language selector later)

2. 1-Click WhatsApp Invoice

   - After saving transaction, show a big "WhatsApp Invoice Bhejo" button

   - Generate a clean, professional looking invoice

   - Open WhatsApp with pre-filled message + invoice details

   - Include soft branding of VoiceKhata

3. Auto Stock Update

   - Every sale should automatically reduce stock quantity

   - Ability to set initial stock and minimum stock level for each item

4. Udhaar (Credit) Tracking

   - Automatically add credit amount to customer’s account

   - Customer-wise udhaar list

   - Ability to record payment against udhaar

   - Show total outstanding udhaar of each customer

5. AI Payment Reminder

   - For overdue udhaar, generate polite reminder message in Hindi

   - One-tap send via WhatsApp

6. Daily Summary

   - End of day summary showing:

     - Total Sales

     - Cash Collected

     - Credit Given

     - Low Stock Items

   - Option to share summary on WhatsApp

7. Low Stock Alert

   - Show warning when any item goes below minimum stock level

   - Highlight low stock items on home/dashboard

8. Works Offline

   - App should work without internet

   - All data should sync automatically when internet comes back

   - Use local storage + background sync

### Tech & Design Requirements

- Build as a Progressive Web App (PWA) so it can be installed on Android

- Mobile-first, clean and simple UI (suitable for less educated users)

- Large buttons and fonts

- Primary color: Trustworthy blue + saffron accent

- Use modern stack: Next.js + Tailwind + Supabase (or Firebase)

- Voice: Use Web Speech API + fallback to Whisper API

- WhatsApp: Use wa.me links for now (no official API needed in prototype)

- Authentication: Very light — Phone number + OTP (or even skip full auth in first version using device ID)

### Screens Required

1. Home / Dashboard (Big Speak button + Today’s summary)

2. Voice Recording + Confirmation screen

3. Transactions / Ledger list

4. Customers list + Customer detail (udhaar history)

5. Stock / Inventory list

6. Daily Summary

7. Settings (Shop name, minimum stock, language)

### Extra Instructions

- Keep the entire flow under 8-10 seconds

- Make the UI extremely simple and fast

- Add sample data so the app doesn’t look empty

- Make it look premium but easy for kirana owners

- Write clean, well-commented code

- Make it fully responsive

First, create the complete folder structure and then start building screen by screen. Begin with the Home screen and Voice entry flow. ye idea kaisa hai

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cdcf18fb-fe7c-48df-81f9-90706474e7ec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
