import { initializeApp, getApp, getApps } from 'firebase/app';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCtqSTywhBqxfYQx7MmqMlGiSv-On3MGBk",
    authDomain: "meatup-f8c49.firebaseapp.com",
    projectId: "meatup-f8c49",
    storageBucket: "meatup-f8c49.firebasestorage.app",
    messagingSenderId: "270170795022",
    appId: "1:270170795022:web:09f1eb597a81c69f22205f"
};

// Initialize Firebase
let app: import('firebase/app').FirebaseApp;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

import { Platform } from 'react-native';

// Initialize Auth with persistence
let auth: import('firebase/auth').Auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    // @ts-ignore
    if (typeof getReactNativePersistence === 'function') {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
    } else {
        auth = getAuth(app);
    }
}

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
