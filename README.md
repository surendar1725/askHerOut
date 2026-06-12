# 💌 Ask-Out Site

A cute, funny single-page site to ask someone on a date — with a No button that runs away.

## Setup

### 1. Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** (start in test mode)
4. Go to Project Settings → General → Your apps → Add Web App
5. Copy the config values

### 2. Local development
```bash
cp .env.local.example .env.local
# Fill in your Firebase values
npm install
npm run dev
```

### 3. GitHub Pages deploy

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** → select **GitHub Actions**
3. Go to **Settings → Secrets → Actions** and add these secrets:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Push to `main` — it auto-deploys! ✨

### 4. View responses
In the Firebase Console → Firestore → `dateResponses` collection you'll see:
- `date` — when they're free
- `time` — what time
- `dateIdea` — what kind of date they want
- `noAttempts` — how many times they tried to click No 😂
- `submittedAt` — timestamp

## Tech
- Next.js 15 + TypeScript
- Tailwind CSS
- Framer Motion
- canvas-confetti
- Firebase Firestore
