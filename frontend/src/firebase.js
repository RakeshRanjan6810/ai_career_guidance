import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDD6gGxMy4_ssGjXvU5i16kJ9nIArRPixU",
    authDomain: "carrier-cb914.firebaseapp.com",
    projectId: "carrier-cb914",
    storageBucket: "carrier-cb914.firebasestorage.app",
    messagingSenderId: "425653750486",
    appId: "1:425653750486:web:d79e10a0c5076858c25777",
    measurementId: "G-BNPGF5ZFPS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
