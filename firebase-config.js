// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDOh5zxiYQOIAE-2W7KElUeIybE8w_MtKY",
    authDomain: "el-toufan.firebaseapp.com",
    projectId: "el-toufan",
    storageBucket: "el-toufan.firebasestorage.app",
    messagingSenderId: "504489496991",
    appId: "1:504489496991:web:f11970186177ee12ca2daa",
    measurementId: "G-959HCQRK44"
};

// Initialize Firebase (Using v8 syntax)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Enable Long Polling to bypass potential network/Firewall blocks (common in some regions)
db.settings({ experimentalForceLongPolling: true });

const storage = (typeof firebase.storage === "function") ? firebase.storage() : null;
if (!storage) console.warn("⚠️ Firebase Storage is not loaded correctly. Check script imports.");

