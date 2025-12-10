const admin = require('firebase-admin');

try {
    const serviceAccount = require('../serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized with Service Account');
} catch (error) {
    console.warn('Firebase Admin Initialization Warning: serviceAccountKey.json not found. Google Auth verification on backend will fail. Please add backend/serviceAccountKey.json.');
    if (!admin.apps.length) {
        admin.initializeApp(); // Fallback for some envs, likely to fail actual verification without creds
    }
}

module.exports = admin;
