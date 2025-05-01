# Simple Phishing Detector

A modern AI-powered phishing detection tool that analyzes suspicious email messages using both machine learning and traditional security heuristics. Uses keyword and basic scoring.


---

## Features

- **OpenAI GPT-4 Integration** for intelligent phishing tone detection
- **Keyword-Based Threat Scoring** using common red flag phrases
- **Brand Domain Mismatch Detection** (e.g., fake PayPal links)
- **Secure Logging to Firebase Firestore**
- **Clean UI** with Tailwind CSS and Framer Motion
- **Real-Time Risk Scoring**

---

## How It Works

1. User pastes a suspicious message into the analyzer
2. App runs:
   - Keyword scanning
   - URL base domain checks vs known safe brands
   - GPT-4-based phishing tone analysis
3. Combined risk score is calculated and shown to the user
4. Results are logged securely to Firestore for future auditing

---

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, TailwindCSS, Framer Motion
- **AI:** OpenAI GPT-4 via API
- **Backend:** Firebase Firestore for secure logging
- **Security Features:**
  - Rate limiting
  - Input sanitization (validator)
  - Safe domain checking with `psl`
  - Disabled clickable links in the UI

---

## Setup (Local)

1. Clone the repo
2. Install dependencies

```bash
npm install

```

# Add your .env.local

```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

```bash
npm run dev

```