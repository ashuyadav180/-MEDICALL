import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { FIREBASE_CONFIG, FIREBASE_IS_CONFIGURED } from './config';

let app = null;
let auth = null;

if (FIREBASE_IS_CONFIGURED) {
  app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
  auth = firebase.auth();
}

export { firebase, app, auth, FIREBASE_IS_CONFIGURED };
