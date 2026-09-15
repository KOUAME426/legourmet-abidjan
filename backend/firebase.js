const path = require('path');
require('dotenv').config();

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let serviceAccount;

// En production (Render), on lit le JSON depuis une variable d'environnement
// En local, on lit le fichier firebase-service-account.json
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log("✅ Firebase : credentials chargés depuis la variable d'environnement");
  } catch (e) {
    console.error("❌ Erreur de parsing du JSON Firebase depuis la variable d'environnement :", e.message);
    process.exit(1);
  }
} else {
  try {
    const serviceAccountPath = path.join(
      __dirname,
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
    );
    serviceAccount = require(serviceAccountPath);
    console.log("✅ Firebase : credentials chargés depuis le fichier local");
  } catch (e) {
    console.error("❌ Impossible de charger les credentials Firebase.");
    console.error("   En local : vérifiez firebase-service-account.json");
    console.error("   En production : vérifiez la variable FIREBASE_SERVICE_ACCOUNT_JSON");
    console.error("   Détail :", e.message);
    process.exit(1);
  }
}

// Initialiser l'app (une seule fois)
if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialisé');
}

const db = getFirestore();

// Références aux collections
const restaurantRef = db.collection('restaurant').doc('config');
const messagesRef = db.collection('messages');

module.exports = { db, restaurantRef, messagesRef };