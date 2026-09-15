require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { restaurantRef, messagesRef, db } = require('./firebase');

async function migrate() {
  try {
    console.log('🚀 Début de la migration vers Firestore...\n');

    // --- Migration du restaurant ---
    const restaurantPath = path.join(__dirname, 'data', 'restaurant.json');
    if (fs.existsSync(restaurantPath)) {
      const rawData = fs.readFileSync(restaurantPath, 'utf8');
      const data = JSON.parse(rawData);

      await restaurantRef.set(data);
      console.log('✅ Restaurant importé dans Firestore');
    } else {
      console.log('⚠️  Fichier restaurant.json introuvable, ignoré');
    }

    // --- Migration des messages ---
    const messagesPath = path.join(__dirname, 'data', 'messages.json');
    if (fs.existsSync(messagesPath)) {
      const rawMessages = fs.readFileSync(messagesPath, 'utf8');
      const messages = JSON.parse(rawMessages);

      if (messages.length > 0) {
        // Supprimer les anciens messages
        const existing = await messagesRef.get();
        const batch = db.batch();
        existing.docs.forEach(doc => batch.delete(doc.ref));

        // Ajouter les nouveaux
        messages.forEach(m => {
          const newDoc = messagesRef.doc();
          batch.set(newDoc, {
            name: m.name || 'Inconnu',
            email: m.email || '',
            subject: m.subject || 'Sans sujet',
            message: m.message || '',
            read: false,
            createdAt: m.timestamp || new Date().toISOString()
          });
        });

        await batch.commit();
        console.log(`✅ ${messages.length} message(s) importé(s)`);
      } else {
        console.log('ℹ️  Aucun message à importer');
      }
    } else {
      console.log('⚠️  Fichier messages.json introuvable, ignoré');
    }

    console.log('\n🎉 Migration terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error.message);
    process.exit(1);
  }
}

migrate();