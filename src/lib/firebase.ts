import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyAnNFETgIp92Ru22WqAG-p_yRsrjk9QjiQ",
  authDomain: "xcsbyrestrafes.firebaseapp.com",
  projectId: "xcsbyrestrafes",
  storageBucket: "xcsbyrestrafes.firebasestorage.app",
  messagingSenderId: "349487090032",
  appId: "1:349487090032:web:72b252e9bf49acfabfa7b5",
  measurementId: "G-N12CXH8X0F"

};


// Initialize Firebase
const app = () => {
  const apps = getApps();
  if (apps.length < 1) {
    initializeApp(firebaseConfig);
  }
  return apps[0];
};

const auth = getAuth(app());

export default app;
export const initFirebase = () => {
  return app();
};
export { auth };
