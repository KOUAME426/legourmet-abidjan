require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { db, restaurantRef, messagesRef } = require('./firebase');
const { generateToken, requireAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ----- MIDDLEWARE -----
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================================
// ROUTES PUBLIQUES (accessibles à tous)
// ============================================================

// 1. Infos du restaurant
app.get('/api/restaurant', async (req, res) => {
  try {
    const doc = await restaurantRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Aucun restaurant trouvé' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur : ' + error.message });
  }
});

// 2. Menu uniquement
app.get('/api/menu', async (req, res) => {
  try {
    const doc = await restaurantRef.get();
    if (!doc.exists) return res.status(404).json({ error: 'Menu introuvable' });
    res.json(doc.data().menu);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur : ' + error.message });
  }
});

// 3. Enregistrer un message de contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nom, email et message sont obligatoires.' });
    }
    await messagesRef.add({
      name: name.trim(),
      email: email.trim(),
      subject: subject ? subject.trim() : 'Sans sujet',
      message: message.trim(),
      read: false,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true, message: 'Message enregistré.' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur : ' + error.message });
  }
});

// ============================================================
// ROUTES ADMIN (protégées)
// ============================================================

// Connexion admin
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' });

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  const token = generateToken();
  res.json({ success: true, token });
});

// Vérifier que le token est valide
app.get('/api/admin/verify', requireAuth, (req, res) => {
  res.json({ success: true });
});

// ---- MESSAGES ----

// Liste des messages
app.get('/api/admin/messages', requireAuth, async (req, res) => {
  try {
    const snapshot = await messagesRef.orderBy('createdAt', 'desc').get();
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer un message comme lu
app.put('/api/admin/messages/:id/read', requireAuth, async (req, res) => {
  try {
    await messagesRef.doc(req.params.id).update({ read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un message
app.delete('/api/admin/messages/:id', requireAuth, async (req, res) => {
  try {
    await messagesRef.doc(req.params.id).delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- RESTAURANT ----

// Mettre à jour tout le restaurant
app.put('/api/admin/restaurant', requireAuth, async (req, res) => {
  try {
    await restaurantRef.set(req.body, { merge: true });
    const updated = await restaurantRef.get();
    res.json({ success: true, restaurant: { id: updated.id, ...updated.data() } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DÉMARRAGE
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
  console.log(`📁 Frontend : http://localhost:${PORT}`);
  console.log(`🔐 Admin    : http://localhost:${PORT}/admin.html`);
});