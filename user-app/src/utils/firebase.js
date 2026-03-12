// Firebase Phone Authentication
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyClzM1s2MiSjO3GjwKln_0uFP345SgfyqI',
  authDomain:        'ebss-user.firebaseapp.com',
  projectId:         'ebss-user',
  storageBucket:     'ebss-user.firebasestorage.app',
  messagingSenderId: '429467609879',
  appId:             '1:429467609879:web:c1846e01778a147da66552',
  measurementId:     'G-23WZX39VP8',
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en';

let recaptchaVerifier = null;

export function setupRecaptcha(buttonId) {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      recaptchaVerifier = null;
    },
  });
  return recaptchaVerifier;
}

export async function sendOtp(phoneNumber) {
  if (!recaptchaVerifier) throw new Error('reCAPTCHA not ready');
  const fullNumber = '+91' + phoneNumber;
  const result = await signInWithPhoneNumber(auth, fullNumber, recaptchaVerifier);
  return result; // confirmationResult
}

export async function getFirebaseIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated with Firebase');
  return user.getIdToken();
}

export function signOutFirebase() {
  return auth.signOut();
}

export { auth };
