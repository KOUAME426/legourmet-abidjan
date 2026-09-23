// ============================================================
// CONFIGURATION DE L'URL DE L'API
// ============================================================
const API_HOST = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? '' // En local, même serveur
  : 'https://legourmet-abidjan.onrender.com'; // URL du backend Render

const API_BASE = `${API_HOST}/api`;

// ============================================================
// ÉTAT GLOBAL
// ============================================================
let TOKEN = localStorage.getItem('adminToken') || null;
let restaurantData = null;

// ============================================================
// OUTILS
// ============================================================
function $(id) { return document.getElementById(id); }

function showToast(message, isError = false) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 && path !== '/admin/login') {
    logout();
    throw new Error('Session expirée, reconnectez-vous');
  }

  if (!response.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

// ============================================================
// AUTHENTIFICATION
// ============================================================
$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = $('password').value;
  $('loginError').textContent = '';

  try {
    const data = await api('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });

    if (!data.token) {
      throw new Error('Aucun token reçu du serveur');
    }

    TOKEN = data.token;
    localStorage.setItem('adminToken', TOKEN);
    enterDashboard();
  } catch (error) {
    $('loginError').textContent = error.message;
  }
});

function logout() {
  TOKEN = null;
  localStorage.removeItem('adminToken');
  $('dashboard').classList.add('hidden');
  $('loginScreen').classList.remove('hidden');
  $('password').value = '';
}

$('logoutBtn').addEventListener('click', logout);

async function enterDashboard() {
  try {
    await api('/admin/verify');
    $('loginScreen').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    await loadRestaurant();
    loadMessages();
  } catch (error) {
    logout();
  }
}

// ============================================================
// NAVIGATION ENTRE ONGLETS
// ============================================================
document.querySelectorAll('.sidebar nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;

    document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    $(`tab-${tab}`).classList.add('active');

    $('pageTitle').textContent = link.textContent.trim();
  });
});

// ============================================================
// CHARGEMENT DES DONNÉES
// ============================================================
async function loadRestaurant() {
  restaurantData = await api('/restaurant');
  fillInfoForm();
  renderMenuEditor();
  renderHoursEditor();
  renderReviewsEditor();
  renderSocialsEditor();
  renderGalleryEditor();
}

async function saveRestaurant(partialData) {
  await api('/admin/restaurant', {
    method: 'PUT',
    body: JSON.stringify(partialData)
  });
  await loadRestaurant();
}

// ============================================================
// MESSAGES
// ============================================================
async function loadMessages() {
  try {
    const messages = await api('/admin/messages');
    renderMessages(messages);
  } catch (error) {
    console.error(error);
  }
}

function renderMessages(messages) {
  const container = $('messagesList');

  if (messages.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox" style="font-size:3rem;color:#ccc;margin-bottom:16px;"></i><p>Aucun message pour le moment</p></div>';
    return;
  }

  container.innerHTML = messages.map(m => `
    <div class="message-card ${m.read ? '' : 'unread'}">
      <div class="message-header">
        <div>
          <h3>${escapeHtml(m.name)}</h3>
          <div class="email">${escapeHtml(m.email)}</div>
        </div>
        <div class="message-actions">
          ${!m.read ? `<button class="btn btn-primary btn-small" onclick="markRead('${m.id}')"><i class="fas fa-check"></i> Lu</button>` : ''}
          <button class="btn btn-danger btn-small" onclick="deleteMessage('${m.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <div class="message-subject">${escapeHtml(m.subject)}</div>
      <div class="message-body">${escapeHtml(m.message)}</div>
      <div class="message-meta">
        <span><i class="far fa-clock"></i> ${new Date(m.createdAt).toLocaleString('fr-FR')}</span>
        ${!m.read ? '<span style="color:var(--color-success);font-weight:600;">● Non lu</span>' : '<span>Lu</span>'}
      </div>
    </div>
  `).join('');
}

async function markRead(id) {
  try {
    await api(`/admin/messages/${id}/read`, { method: 'PUT' });
    loadMessages();
  } catch (error) {
    showToast(error.message, true);
  }
}

async function deleteMessage(id) {
  if (!confirm('Supprimer ce message ?')) return;
  try {
    await api(`/admin/messages/${id}`, { method: 'DELETE' });
    showToast('Message supprimé');
    loadMessages();
  } catch (error) {
    showToast(error.message, true);
  }
}

// ============================================================
// INFORMATIONS GÉNÉRALES
// ============================================================
function fillInfoForm() {
  $('infoName').value = restaurantData.name || '';
  $('infoTagline').value = restaurantData.tagline || '';
  $('infoDescription').value = restaurantData.description || '';
  $('infoPhone').value = restaurantData.phone || '';
  $('infoWhatsapp').value = restaurantData.whatsapp || '';
  $('infoEmail').value = restaurantData.email || '';
  $('infoAddress').value = restaurantData.address || '';
  $('infoMapEmbed').value = restaurantData.mapEmbed || '';
}

$('infoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await saveRestaurant({
      name: $('infoName').value,
      tagline: $('infoTagline').value,
      description: $('infoDescription').value,
      phone: $('infoPhone').value,
      whatsapp: $('infoWhatsapp').value,
      email: $('infoEmail').value,
      address: $('infoAddress').value,
      mapEmbed: $('infoMapEmbed').value
    });
    showToast('Informations enregistrées');
  } catch (error) {
    showToast(error.message, true);
  }
});

// ============================================================
// MENU
// ============================================================
function renderMenuEditor() {
  const container = $('menuEditor');
  const menu = restaurantData.menu || [];

  container.innerHTML = menu.map((cat, catIndex) => `
    <div class="editor-block">
      <div class="editor-block-header">
        <input type="text" value="${escapeAttr(cat.category)}" 
               onchange="updateCategory(${catIndex}, this.value)" 
               style="font-size:1.1rem;font-weight:600;border:none;background:transparent;padding:4px 8px;flex:1;" />
        <button class="btn btn-danger btn-small" onclick="removeCategory(${catIndex})"><i class="fas fa-trash"></i> Supprimer</button>
      </div>
      ${cat.items.map((item, itemIndex) => `
        <div class="editor-item">
          <div class="editor-item-header">
            <strong>Plat ${itemIndex + 1}</strong>
            <button class="btn btn-danger btn-small" onclick="removeItem(${catIndex}, ${itemIndex})"><i class="fas fa-trash"></i></button>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Nom</label>
              <input type="text" value="${escapeAttr(item.name)}" onchange="updateItem(${catIndex}, ${itemIndex}, 'name', this.value)" />
            </div>
            <div class="form-group"><label>Prix (FCFA)</label>
              <input type="number" value="${item.price}" onchange="updateItem(${catIndex}, ${itemIndex}, 'price', parseInt(this.value))" />
            </div>
          </div>
          <div class="form-group"><label>Description</label>
            <textarea rows="2" onchange="updateItem(${catIndex}, ${itemIndex}, 'description', this.value)">${escapeHtml(item.description)}</textarea>
          </div>
          <div class="form-group"><label>URL de l'image</label>
            <input type="text" value="${escapeAttr(item.image || '')}" onchange="updateItem(${catIndex}, ${itemIndex}, 'image', this.value)" />
          </div>
        </div>
      `).join('')}
      <button class="btn btn-secondary btn-small" onclick="addItem(${catIndex})"><i class="fas fa-plus"></i> Ajouter un plat</button>
    </div>
  `).join('');
}

function updateCategory(index, value) { restaurantData.menu[index].category = value; }
function removeCategory(index) {
  if (!confirm('Supprimer cette catégorie et tous ses plats ?')) return;
  restaurantData.menu.splice(index, 1);
  renderMenuEditor();
}
function addItem(catIndex) {
  restaurantData.menu[catIndex].items.push({ name: 'Nouveau plat', description: '', price: 0, image: '' });
  renderMenuEditor();
}
function removeItem(catIndex, itemIndex) {
  restaurantData.menu[catIndex].items.splice(itemIndex, 1);
  renderMenuEditor();
}
function updateItem(catIndex, itemIndex, field, value) {
  restaurantData.menu[catIndex].items[itemIndex][field] = value;
}

$('addCategoryBtn').addEventListener('click', () => {
  restaurantData.menu.push({ category: 'Nouvelle catégorie', items: [] });
  renderMenuEditor();
});

$('saveMenuBtn').addEventListener('click', async () => {
  try {
    await saveRestaurant({ menu: restaurantData.menu });
    showToast('Menu enregistré');
  } catch (error) {
    showToast(error.message, true);
  }
});

// ============================================================
// HORAIRES
// ============================================================
function renderHoursEditor() {
  const container = $('hoursEditor');
  const hours = restaurantData.hours || [];
  container.innerHTML = `
    <div class="editor-block">
      ${hours.map((h, i) => `
        <div class="editor-item">
          <div class="editor-item-header">
            <strong>Plage ${i + 1}</strong>
            <button class="btn btn-danger btn-small" onclick="removeHour(${i})"><i class="fas fa-trash"></i></button>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Jour(s)</label><input type="text" value="${escapeAttr(h.day)}" onchange="updateHour(${i}, 'day', this.value)" /></div>
            <div class="form-group"><label>Horaires</label><input type="text" value="${escapeAttr(h.time)}" onchange="updateHour(${i}, 'time', this.value)" /></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
function updateHour(i, field, value) { restaurantData.hours[i][field] = value; }
function removeHour(i) { restaurantData.hours.splice(i, 1); renderHoursEditor(); }
$('addHourBtn').addEventListener('click', () => {
  restaurantData.hours.push({ day: 'Nouveau jour', time: '00h00 – 00h00' });
  renderHoursEditor();
});
$('saveHoursBtn').addEventListener('click', async () => {
  try {
    await saveRestaurant({ hours: restaurantData.hours });
    showToast('Horaires enregistrés');
  } catch (error) { showToast(error.message, true); }
});

// ============================================================
// AVIS
// ============================================================
function renderReviewsEditor() {
  const container = $('reviewsEditor');
  const reviews = restaurantData.reviews || [];
  container.innerHTML = `
    <div class="editor-block">
      ${reviews.map((r, i) => `
        <div class="editor-item">
          <div class="editor-item-header">
            <strong>Avis ${i + 1}</strong>
            <button class="btn btn-danger btn-small" onclick="removeReview(${i})"><i class="fas fa-trash"></i></button>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Auteur</label><input type="text" value="${escapeAttr(r.author)}" onchange="updateReview(${i}, 'author', this.value)" /></div>
            <div class="form-group"><label>Localisation</label><input type="text" value="${escapeAttr(r.location)}" onchange="updateReview(${i}, 'location', this.value)" /></div>
          </div>
          <div class="form-group"><label>Note (1-5)</label><input type="number" min="1" max="5" value="${r.rating}" onchange="updateReview(${i}, 'rating', parseInt(this.value))" /></div>
          <div class="form-group"><label>Texte</label><textarea rows="2" onchange="updateReview(${i}, 'text', this.value)">${escapeHtml(r.text)}</textarea></div>
        </div>
      `).join('')}
    </div>
  `;
}
function updateReview(i, field, value) { restaurantData.reviews[i][field] = value; }
function removeReview(i) { if (confirm('Supprimer ?')) { restaurantData.reviews.splice(i, 1); renderReviewsEditor(); } }
$('addReviewBtn').addEventListener('click', () => {
  restaurantData.reviews.push({ author: 'Nouveau client', location: 'Abidjan', text: '', rating: 5 });
  renderReviewsEditor();
});
$('saveReviewsBtn').addEventListener('click', async () => {
  try {
    await saveRestaurant({ reviews: restaurantData.reviews });
    showToast('Avis enregistrés');
  } catch (error) { showToast(error.message, true); }
});

// ============================================================
// RÉSEAUX SOCIAUX
// ============================================================
function renderSocialsEditor() {
  const container = $('socialsEditor');
  const socials = restaurantData.socials || [];
  container.innerHTML = `
    <div class="editor-block">
      ${socials.map((s, i) => `
        <div class="editor-item">
          <div class="editor-item-header">
            <strong>Réseau ${i + 1}</strong>
            <button class="btn btn-danger btn-small" onclick="removeSocial(${i})"><i class="fas fa-trash"></i></button>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Nom</label><input type="text" value="${escapeAttr(s.name)}" onchange="updateSocial(${i}, 'name', this.value)" /></div>
            <div class="form-group"><label>Icône (ex: fab fa-instagram)</label><input type="text" value="${escapeAttr(s.icon)}" onchange="updateSocial(${i}, 'icon', this.value)" /></div>
          </div>
          <div class="form-group"><label>URL</label><input type="text" value="${escapeAttr(s.url)}" onchange="updateSocial(${i}, 'url', this.value)" /></div>
        </div>
      `).join('')}
    </div>
  `;
}
function updateSocial(i, field, value) { restaurantData.socials[i][field] = value; }
function removeSocial(i) { restaurantData.socials.splice(i, 1); renderSocialsEditor(); }
$('addSocialBtn').addEventListener('click', () => {
  restaurantData.socials.push({ name: 'Nouveau', icon: 'fab fa-facebook', url: 'https://' });
  renderSocialsEditor();
});
$('saveSocialsBtn').addEventListener('click', async () => {
  try {
    await saveRestaurant({ socials: restaurantData.socials });
    showToast('Réseaux sociaux enregistrés');
  } catch (error) { showToast(error.message, true); }
});

// ============================================================
// GALERIE
// ============================================================
function renderGalleryEditor() {
  const container = $('galleryEditor');
  const gallery = restaurantData.gallery || [];
  container.innerHTML = `
    <div class="editor-block">
      ${gallery.map((url, i) => `
        <div class="editor-item">
          <div class="editor-item-header">
            <strong>Image ${i + 1}</strong>
            <button class="btn btn-danger btn-small" onclick="removeGalleryImage(${i})"><i class="fas fa-trash"></i></button>
          </div>
          <div class="form-group"><label>URL de l'image</label><input type="text" value="${escapeAttr(url)}" onchange="updateGalleryImage(${i}, this.value)" /></div>
        </div>
      `).join('')}
    </div>
  `;
}
function updateGalleryImage(i, value) { restaurantData.gallery[i] = value; }
function removeGalleryImage(i) { restaurantData.gallery.splice(i, 1); renderGalleryEditor(); }
$('addGalleryBtn').addEventListener('click', () => {
  restaurantData.gallery.push('https://images.unsplash.com/photo-XXXXX?w=600&q=80');
  renderGalleryEditor();
});
$('saveGalleryBtn').addEventListener('click', async () => {
  try {
    await saveRestaurant({ gallery: restaurantData.gallery });
    showToast('Galerie enregistrée');
  } catch (error) { showToast(error.message, true); }
});

// ============================================================
// SÉCURITÉ (échappement HTML)
// ============================================================
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[s]);
}
function escapeAttr(str) { return escapeHtml(str); }

// ============================================================
// DÉMARRAGE
// ============================================================
if (TOKEN) {
  enterDashboard();
}