const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// Chemin vers le fichier de service account
const serviceAccountPath = path.join(
  __dirname,
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
);

// Initialiser l'Admin SDK (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log('✅ Firebase Admin SDK initialisé');
}

const db = admin.firestore();

// Références aux collections
const restaurantRef = db.collection('restaurant').doc('config');
const messagesRef = db.collection('messages');

module.exports = { admin, db, restaurantRef, messagesRef };