import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: 'AIzaSyBoNw4Rdor3ZtV1rvW-gHX8sQSTo4WFyrA',
  authDomain: 'xcs-v2.firebaseapp.com',
  projectId: 'xcs-v2',
  storageBucket: 'xcs-v2.appspot.com',
  messagingSenderId: '14083520042',
  appId: '1:14083520042:web:66c6be95820ccdd6c83553',
  measurementId: 'G-WWDP45MK4K'
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
