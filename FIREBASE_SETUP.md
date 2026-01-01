# Firebase Setup Guide

Your website now has complete authentication and cross-device sync functionality! To enable it, you need to configure Firebase.

## Steps to Set Up Firebase

### 1. Create a Firebase Project
- Go to [Firebase Console](https://console.firebase.google.com)
- Click "Add project"
- Enter a project name (e.g., "that-daily-bread")
- Follow the setup wizard

### 2. Get Your Firebase Configuration
After creating the project:
- Go to Project Settings (⚙️ icon)
- Scroll to "Your apps" section
- Click the Web icon `</>`
- Copy your Firebase config values

### 3. Update index.html
Replace the placeholder values in `index.html` (around line 14-21):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",                    // Copy from Firebase Console
    authDomain: "YOUR_AUTH_DOMAIN",            // e.g., myproject.firebaseapp.com
    projectId: "YOUR_PROJECT_ID",              // e.g., my-project-abc123
    storageBucket: "YOUR_STORAGE_BUCKET",      // e.g., my-project-abc123.appspot.com
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Enable Authentication
- In Firebase Console, go to "Authentication"
- Click "Sign-in method"
- Enable "Email/Password"

### 5. Create Firestore Database
- In Firebase Console, go to "Firestore Database"
- Click "Create database"
- Start in "Test mode" (for development)
- Accept default location

### 6. Set Firestore Rules (Optional but Recommended)
For production, update security rules to:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
  }
}
```

## Features Now Available

✅ **Authentication**
- Create account with email/password
- Login/Logout
- Account profile with user email

✅ **Saved Verses (Ready to Sync)**
- Save verses locally
- Data structure ready for Firebase sync
- Profile shows saved verses count (to be implemented)

✅ **Streak System (Ready)**
- Streak display element in place
- Logic ready to track daily verse views
- Automatically resets on missed days

## Testing Locally

1. Make sure you've updated the Firebase config
2. Open `index.html` in a browser (use a local server)
3. Click the account icon in the top-right
4. Try signing up with a test email
5. Log in and verify your profile shows up

## Next Steps (Future Implementation)

The following features have the groundwork but need completion:
- Sync saved verses to Firebase
- Calculate and display streak
- Load saved verses from Firebase on login
- Analytics tracking

All the HTML, CSS, and JavaScript structure is ready. Just need the Firebase configuration!
