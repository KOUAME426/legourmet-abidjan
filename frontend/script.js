// ============================================================
// CONFIGURATION DES IMAGES DU CARROUSEL
// ============================================================
const heroImages = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80',
  'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1600&q=80',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1600&q=80'
];

// ============================================================
// GESTION DU CARROUSEL
// ============================================================
let currentSlide = 0;
let slideInterval = null;
const slidesContainer = document.getElementById('heroSlider');
const dotsContainer = document.getElementById('sliderDots');

function initSlider() {
  heroImages.forEach((src, index) => {
    const slide = document.createElement('div');
    slide.className = `slide${index === 0 ? ' active' : ''}`;
    slide.style.backgroundImage = `url(${src})`;
    slidesContainer.appendChild(slide);
  });

  heroImages.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = `dot${index === 0 ? ' active' : ''}`;
    dot.dataset.index = index;
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  startSlider();
}

function goToSlide(index) {
  clearInterval(slideInterval);
  const slides = slidesContainer.querySelectorAll('.slide');
  slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
  const dots = dotsContainer.querySelectorAll('.dot');
  dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  currentSlide = index;
  startSlider();
}

function nextSlide() {
  goToSlide((currentSlide + 1) % heroImages.length);
}

function startSlider() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 4500);
}

// ============================================================
// CHARGEMENT DES DONNÉES
// ============================================================
let restaurantData = null;

function formatPrice(price) {
  return price.toLocaleString('fr-FR') + ' FCFA';
}

function renderMenu() {
  if (!restaurantData) return;
  const tabsContainer = document.getElementById('menuTabs');
  const gridContainer = document.getElementById('menuGrid');

  tabsContainer.innerHTML = '';
  restaurantData.menu.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.className = `menu-tab${idx === 0 ? ' active' : ''}`;
    btn.dataset.index = idx;
    btn.textContent = cat.category;
    tabsContainer.appendChild(btn);
  });

  showCategory(0);

  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.menu-tab');
    if (!tab) return;
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    showCategory(parseInt(tab.dataset.index));
  });
}

function showCategory(index) {
  if (!restaurantData) return;
  const grid = document.getElementById('menuGrid');
  const category = restaurantData.menu[index];
  if (!category) return;
  grid.innerHTML = '';

  const whatsappNum = restaurantData.whatsapp.replace(/\s/g, '');

  category.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'menu-item';

    // Construction de la carte avec image, infos, prix et bouton
    div.innerHTML = `
      <div class="menu-item-image">
        <img src="${item.image || 'https://via.placeholder.com/300x200?text=Plat'}" alt="${item.name}" loading="lazy" />
      </div>
      <div class="menu-item-content">
        <div class="menu-item-info">
          <h4>${item.name}</h4>
          <p>${item.description}</p>
        </div>
        <div class="menu-item-footer">
          <span class="menu-item-price">${formatPrice(item.price)}</span>
          <a href="https://wa.me/${whatsappNum}?text=Bonjour%2C%20je%20souhaite%20commander%20%22${encodeURIComponent(item.name)}%22" 
             target="_blank" 
             class="btn btn-whatsapp btn-order">
            <i class="fab fa-whatsapp"></i> Commander
          </a>
        </div>
      </div>
    `;
    grid.appendChild(div);
  });
}

function renderGallery() {
  if (!restaurantData) return;
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  restaurantData.gallery.forEach((src) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `<img src="${src}" alt="Plat ou ambiance" loading="lazy" />`;
    div.addEventListener('click', () => openLightbox(src));
    grid.appendChild(div);
  });
}

function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  img.src = src;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

function renderReviews() {
  if (!restaurantData) return;
  const grid = document.getElementById('reviewsGrid');
  grid.innerHTML = '';
  restaurantData.reviews.forEach(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-stars">${stars}</div>
      <blockquote>“${r.text}”</blockquote>
      <div class="review-author">${r.author} <span>· ${r.location}</span></div>
    `;
    grid.appendChild(card);
  });
}

function renderHours() {
  if (!restaurantData) return;
  const container = document.getElementById('hoursList');
  container.innerHTML = '';
  restaurantData.hours.forEach(h => {
    const div = document.createElement('div');
    div.className = 'hours-item';
    div.innerHTML = `<span class="day">${h.day}</span><span class="time">${h.time}</span>`;
    container.appendChild(div);
  });
}

function renderSocials() {
  if (!restaurantData) return;
  const container = document.getElementById('contactSocials');
  container.innerHTML = '';
  restaurantData.socials.forEach(s => {
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `<i class="${s.icon}"></i>`;
    a.title = s.name;
    container.appendChild(a);
  });

  const footerContainer = document.getElementById('footerSocials');
  footerContainer.innerHTML = '';
  restaurantData.socials.forEach(s => {
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `<i class="${s.icon}"></i>`;
    a.title = s.name;
    footerContainer.appendChild(a);
  });
}

function populateContactInfo() {
  if (!restaurantData) return;
  document.getElementById('contactAddress').textContent = restaurantData.address;
  document.getElementById('contactPhone').textContent = restaurantData.phone;
  document.getElementById('contactEmail').textContent = restaurantData.email;
  document.getElementById('footerPhone').textContent = restaurantData.phone;
  document.getElementById('mapAddress').textContent = restaurantData.address;
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  document.getElementById('heroDescription').textContent = restaurantData.description;

  if (restaurantData.mapEmbed) {
    document.getElementById('googleMap').src = restaurantData.mapEmbed;
  }

  const waNum = restaurantData.whatsapp.replace(/\s/g, '');
  const waLink = `https://wa.me/${waNum}`;
  document.querySelectorAll('#heroWhatsApp, #navWhatsApp, #floatWhatsApp').forEach(el => el.href = waLink);

  const phoneLink = `tel:${restaurantData.phone.replace(/\s/g, '')}`;
  document.getElementById('floatPhone').href = phoneLink;
}

// ============================================================
// FORMULAIRE DE CONTACT
// ============================================================
function initContactForm() {
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('formName').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const subject = document.getElementById('formSubject').value.trim() || 'Sans sujet';
    const message = document.getElementById('formMessage').value.trim();

    if (!name || !email || !message) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message })
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Merci ! Votre message a été enregistré.');
        form.reset();
      } else {
        alert('❌ Erreur : ' + (result.error || ''));
      }
    } catch (error) {
      alert('❌ Erreur réseau. Vérifiez que le serveur est démarré.');
    }
  });
}

// ============================================================
// NAVIGATION, SCROLL, ANIMATIONS
// ============================================================
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      links.classList.remove('open');
    });
  });
}

function initHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.pageYOffset > 60);
  });
}

function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.btn)');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.pageYOffset >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  });
}

function initScrollAnimations() {
  const items = document.querySelectorAll('.menu-item, .review-card, .gallery-item, .about-image, .about-text, .contact-form, .info-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.6s ease ${i * 0.06}s, transform 0.6s ease ${i * 0.06}s`;
    observer.observe(el);
  });
  setTimeout(() => {
    items.forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }
    });
  }, 200);
}

// ============================================================
// CHARGEMENT DES DONNÉES
// ============================================================
async function loadData() {
  try {
    const response = await fetch('/api/restaurant');
    if (!response.ok) throw new Error('Erreur réseau');
    const data = await response.json();
    restaurantData = data;
    renderMenu();
    renderGallery();
    renderReviews();
    renderHours();
    renderSocials();
    populateContactInfo();
    initContactForm();
    document.title = `${data.name} — Restaurant à Abidjan`;
    document.querySelectorAll('.logo').forEach(el => {
      const parts = data.name.split(' ');
      if (parts.length > 1) {
        el.innerHTML = `${parts[0]} <span>${parts.slice(1).join(' ')}</span>`;
      } else {
        el.textContent = data.name;
      }
    });
    initScrollAnimations();
  } catch (error) {
    console.error('Erreur de chargement :', error);
    alert('Impossible de charger les données. Vérifiez que le serveur est lancé.');
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initSlider();
  initMobileNav();
  initHeaderScroll();
  initScrollSpy();
  loadData();
});