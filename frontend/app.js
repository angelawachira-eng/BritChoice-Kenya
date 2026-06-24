/**
 * BritChoice Kenya - Premium Headless Commerce Frontend
 * Core Application Logic & State Management
 */

// Host configuration for API
const API_BASE = (['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '')
  ? `http://127.0.0.1:${window.location.port || '8000'}`
  : '';

// Convert DB image_path (e.g. "Product_Images/Detergents/foo.jpeg")
// to a WhiteNoise static URL served directly from disk — bypasses Django's
// single-threaded dev server which was queuing all 24 image requests.
function getImageUrl(image_path) {
  if (!image_path) return '/static/images/placeholder.jpg';
  if (image_path.startsWith('http')) return image_path;
  // Strip leading "Product_Images/" and serve from /static/images/
  const relative = image_path.replace(/^Product_Images\//, '');
  return `/static/images/${relative}`;
}

const WHATSAPP_NUMBER = '254722247829';

// Application State
const state = {
  products: [],
  filteredProducts: [],
  categories: new Set(),
  brands: new Set(),
  filters: {
    search: '',
    category: 'all',
    brand: 'all',
    sort: 'default'
  },
  cart: [],
  profile: null,
  collectionMethod: 'pickup',
  pickupLocation: 'Kahawa Sukari',
  deferredPrompt: null,
  // Pagination
  currentPage: 1,
  pageSize: 24,
  // Add localization & map states
  language: 'en',
  deliveryLocation: null,
  paymentMethod: 'mpesa'
};

// Debounce helper — prevents rapid re-renders on search input
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Inline SVGs for icons used inside product cards.
// Using these avoids calling lucide.createIcons() on every render,
// which would otherwise rescan 50+ static HTML icons each time.
const SVG = {
  plus:  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  minus: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
  checkCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  alertCircle: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  chevronsDown: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 6 5 5 5-5"/><path d="m7 13 5 5 5-5"/></svg>',
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  initGoogleTranslateHider();
  initCart();
  initProfile();
  initCookieBanner();
  initPWAInstall();
  fetchProducts();
  setupEventListeners();
  // Run once for all static icons baked into index.html.
  // Dynamic card icons use inline SVG constants above — no repeat scan needed.
  lucide.createIcons();
});

// Suppress Google Translate hover popups and banners dynamically
function initGoogleTranslateHider() {
  const hidePopups = () => {
    const ids = ['goog-gt-tt', 'goog-gt-tt-holder'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      }
    });
    const classes = ['goog-te-balloon-frame', 'goog-te-balloon', 'goog-tooltip', 'goog-tooltip-back', 'goog-te-banner', 'goog-te-banner-frame'];
    classes.forEach(cls => {
      const els = document.getElementsByClassName(cls);
      for (let el of els) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      }
    });
  };

  hidePopups();
  setInterval(hidePopups, 500);

  // Hook MutationObserver for instant DOM addition handling
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const isGoogleElement = 
            node.id === 'goog-gt-tt' || 
            node.id === 'goog-gt-tt-holder' ||
            (node.className && typeof node.className === 'string' && (
              node.className.includes('goog-te-balloon-frame') ||
              node.className.includes('goog-te-balloon') ||
              node.className.includes('goog-tooltip') ||
              node.className.includes('goog-te-banner')
            ));
          if (isGoogleElement) {
            node.style.setProperty('display', 'none', 'important');
            node.style.setProperty('visibility', 'hidden', 'important');
            node.style.setProperty('opacity', '0', 'important');
            node.style.setProperty('pointer-events', 'none', 'important');
          }
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Register PWA Service Worker & Install Prompts
function initPWAInstall() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js?v=15')
        .then(reg => console.log('Service Worker registered with scope:', reg.scope))
        .catch(err => console.log('Service Worker registration failed:', err));
    });
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'RELOAD') {
        console.log('New Service Worker active. Reloading page...');
        window.location.reload();
      }
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPrompt = e;

    const mobBlock = document.getElementById('mobile-install-app-block');
    const footDivider = document.getElementById('footer-install-divider');
    const footBtn = document.getElementById('footer-install-btn');
    const headerBtn = document.getElementById('header-install-btn');

    if (mobBlock) mobBlock.classList.remove('hidden');
    if (footDivider) footDivider.classList.remove('hidden');
    if (footBtn) footBtn.classList.remove('hidden');
    if (headerBtn) headerBtn.classList.remove('hidden');
  });

  window.addEventListener('appinstalled', (e) => {
    state.deferredPrompt = null;
    hideInstallUI();
    console.log('App installed successfully!');
  });
}

function hideInstallUI() {
  const mobBlock = document.getElementById('mobile-install-app-block');
  const footDivider = document.getElementById('footer-install-divider');
  const footBtn = document.getElementById('footer-install-btn');
  const headerBtn = document.getElementById('header-install-btn');

  if (mobBlock) mobBlock.classList.add('hidden');
  if (footDivider) footDivider.classList.add('hidden');
  if (footBtn) footBtn.classList.add('hidden');
  if (headerBtn) headerBtn.classList.add('hidden');
}

async function triggerPWAInstall() {
  const promptEvent = state.deferredPrompt;
  if (!promptEvent) return;
  
  promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  console.log(`Installation outcome: ${outcome}`);
  
  state.deferredPrompt = null;
  hideInstallUI();
}
// Load Cart from LocalStorage
function initCart() {
  const savedCart = localStorage.getItem('britchoice_cart');
  if (savedCart) {
    try {
      state.cart = jsonParseSafe(savedCart, []);
      updateCartUI();
    } catch (e) {
      state.cart = [];
    }
  }
}

// Load Profile from LocalStorage
function initProfile() {
  const savedProfile = localStorage.getItem('britchoice_profile');
  if (savedProfile) {
    state.profile = jsonParseSafe(savedProfile, null);
    updateProfileUI();
  }
}

// Check Cookie Consent
function initCookieBanner() {
  const isAccepted = localStorage.getItem('britchoice_cookie_accepted');
  const banner = document.getElementById('cookie-banner');
  if (!isAccepted && banner) {
    banner.classList.remove('hidden');
  }
}

function updateProfileUI() {
  const dot = document.getElementById('profile-status-dot');
  const guestFields = document.getElementById('cart-guest-fields');
  const profileBadge = document.getElementById('cart-profile-badge');
  const nameSpan = document.getElementById('cart-profile-name-span');
  const phoneSpan = document.getElementById('cart-profile-phone-span');

  if (state.profile) {
    if (dot) dot.classList.remove('hidden');
    if (guestFields) guestFields.classList.add('hidden');
    if (profileBadge) profileBadge.classList.remove('hidden');
    
    // Split first name for cleaner look in the cart badge
    const firstName = state.profile.name.split(' ')[0];
    if (nameSpan) nameSpan.textContent = firstName;
    if (phoneSpan) phoneSpan.textContent = state.profile.phone;
    
    // Pre-populate hidden guest inputs
    const orderNameInput = document.getElementById('order-name');
    const orderPhoneInput = document.getElementById('order-phone');
    if (orderNameInput) orderNameInput.value = state.profile.name;
    if (orderPhoneInput) orderPhoneInput.value = state.profile.phone;

    // Toggle Logged-in/Logged-out Dashboard states
    document.getElementById('profile-state-logged-out').classList.add('hidden');
    document.getElementById('profile-state-logged-in').classList.remove('hidden');

    // Populated dashboard details
    document.getElementById('profile-dashboard-name').textContent = state.profile.name;
    document.getElementById('profile-display-phone').textContent = state.profile.phone;
    document.getElementById('profile-display-email').textContent = state.profile.email || 'Not Provided';
    
    // Initials for avatar
    const initials = state.profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('profile-avatar-letters').textContent = initials;
    
    renderOrderHistory();
  } else {
    if (dot) dot.classList.add('hidden');
    if (guestFields) guestFields.classList.remove('hidden');
    if (profileBadge) profileBadge.classList.add('hidden');
    
    const orderNameInput = document.getElementById('order-name');
    const orderPhoneInput = document.getElementById('order-phone');
    if (orderNameInput) orderNameInput.value = '';
    if (orderPhoneInput) orderPhoneInput.value = '';

    document.getElementById('profile-state-logged-out').classList.remove('hidden');
    document.getElementById('profile-state-logged-in').classList.add('hidden');
  }
  lucide.createIcons();
}

function renderOrderHistory() {
  const container = document.getElementById('orders-history-container');
  const countSpan = document.getElementById('order-history-count');
  const orders = jsonParseSafe(localStorage.getItem('britchoice_orders'), []);
  
  if (countSpan) countSpan.textContent = `(${orders.length})`;

  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="no-history-state">
        <i data-lucide="history"></i>
        <p>You haven't placed any orders yet. Add items to your cart and place an order to see it here!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  container.innerHTML = orders.map(ord => `
    <div class="order-history-card">
      <div class="order-card-header">
        <span class="order-date">${ord.date}</span>
        <span class="order-status"><i data-lucide="check-circle" style="width: 10px; height: 10px; display: inline-block; vertical-align: middle;"></i> Sent</span>
      </div>
      <div class="order-card-items">${ord.items}</div>
      <div class="order-card-footer">
        <span class="order-total-label">${ord.method}</span>
        <span class="order-total-val">KES ${formatPrice(ord.total)}</span>
      </div>
    </div>
  `).join('');
  lucide.createIcons();
}

// Info Modal Tabs switching
function setupInfoModalTabs() {
  const tabBtns = document.querySelectorAll('.info-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
      const activeTabId = btn.getAttribute('data-tab');
      document.getElementById(activeTabId).classList.remove('hidden');
    });
  });
}

function openInfoModal(targetTab = 'about-tab') {
  const modal = document.getElementById('info-modal');
  modal.classList.remove('hidden');
  
  const tabBtns = document.querySelectorAll('.info-tab-btn');
  tabBtns.forEach(btn => {
    if (btn.getAttribute('data-tab') === targetTab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === targetTab) {
      pane.classList.remove('hidden');
    } else {
      pane.classList.add('hidden');
    }
  });
  lucide.createIcons();
}

function closeInfoModal() {
  document.getElementById('info-modal').classList.add('hidden');
  // Revert active bottom tab back to catalog or about depending on active page view
  const aboutPageView = document.getElementById('about-page-view');
  if (aboutPageView && !aboutPageView.classList.contains('hidden')) {
    setActiveBottomNavTab('btn-bottom-about');
  } else {
    setActiveBottomNavTab('btn-bottom-catalog');
  }
}

function openProfileModal() {
  document.getElementById('profile-modal').classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
}

function setActiveHeaderLink(btnId) {
  document.querySelectorAll('.header-nav .nav-link-btn').forEach(btn => {
    if (btn.id === btnId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function setActiveBottomNavTab(btnId) {
  document.querySelectorAll('.mobile-bottom-nav .mobile-bottom-nav-btn').forEach(btn => {
    if (btn.id === btnId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function jsonParseSafe(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// Fetch products from the Django REST API
async function fetchProducts() {
  const gridContainer = document.getElementById('product-grid');
  try {
    console.time('1. fetch /api/products/');
    const response = await fetch(`${API_BASE}/api/products/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    console.timeEnd('1. fetch /api/products/');

    console.time('2. response.json()');
    const data = await response.json();
    console.timeEnd('2. response.json()');

    state.products = data;
    state.categories.clear();
    state.brands.clear();
    state.products.forEach(p => {
      if (p.category) state.categories.add(p.category);
      if (p.brand) state.brands.add(p.brand);
    });

    console.time('3. populateFiltersUI()');
    populateFiltersUI();
    console.timeEnd('3. populateFiltersUI()');

    console.time('4. applyFiltersAndRender()');
    applyFiltersAndRender();
    console.timeEnd('4. applyFiltersAndRender()');

    console.log('Total products rendered:', state.filteredProducts.length);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    gridContainer.innerHTML = `
      <div class="empty-state">
        <i data-lucide="wifi-off"></i>
        <h3>Connection Error</h3>
        <p>Could not connect to the BritChoice backend. Please make sure the Django server is running.</p>
        <button onclick="fetchProducts()" class="btn-primary">Try Again</button>
      </div>
    `;
    lucide.createIcons();
  }
}

// Render dynamic elements for filter sidebar
function populateFiltersUI() {
  // 1. Populate Category sidebar list
  const catList = document.getElementById('category-filter-list');
  // Clear dynamic items, leaving "All Products"
  const allItem = catList.querySelector('[data-category="all"]');
  catList.innerHTML = '';
  catList.appendChild(allItem);

  // Set total count pill
  document.getElementById('total-count-pill').textContent = state.products.length;

  // Compute category counts
  const catCounts = {};
  state.products.forEach(p => {
    catCounts[p.category] = (catCounts[p.category] || 0) + 1;
  });

  // Sort and append category items
  Array.from(state.categories).sort().forEach(catName => {
    const li = document.createElement('li');
    li.setAttribute('data-category', catName);
    
    // Choose appropriate icon based on category
    let iconName = 'tag';
    const cleanCat = catName.toLowerCase();
    if (cleanCat.includes('detergent')) iconName = 'spray-can';
    else if (cleanCat.includes('fragrance')) iconName = 'perfume-bottle';
    else if (cleanCat.includes('household')) iconName = 'armchair';
    else if (cleanCat.includes('laundry')) iconName = 'laundry-basket';
    else if (cleanCat.includes('make-up') || cleanCat.includes('makeup')) iconName = 'brush-stars';
    else if (cleanCat.includes('personal')) iconName = 'soap-hand';
    else if (cleanCat.includes('skin')) iconName = 'droplet';
    else if (cleanCat.includes('supplement')) iconName = 'supplement-bottle';

    li.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${catName}</span>
      <span class="count-pill">${catCounts[catName] || 0}</span>
    `;

    li.addEventListener('click', () => {
      setActiveCategory(catName);
    });

    catList.appendChild(li);
  });

  // 2. Populate Brand dropdown filters
  const brandSelect = document.getElementById('brand-filter-select');
  if (brandSelect) {
    brandSelect.innerHTML = '';

    // Add default "All Brands" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Brands';
    brandSelect.appendChild(allOption);

    // Sort and append brand options
    Array.from(state.brands).sort().forEach(brandName => {
      const opt = document.createElement('option');
      opt.value = brandName;
      opt.textContent = brandName;
      brandSelect.appendChild(opt);
    });

    // Set selected value
    brandSelect.value = state.filters.brand || 'all';
  }

  // 3. Populate Mobile Horizontal Categories Swiper
  const swiperList = document.getElementById('mobile-categories-list');
  if (swiperList) {
    swiperList.innerHTML = '';
    
    // "All Products" pill
    const allPill = document.createElement('button');
    allPill.className = 'category-pill-btn';
    allPill.setAttribute('data-category', 'all');
    allPill.innerHTML = `
      <i data-lucide="layout-grid"></i>
      <span>All Products</span>
    `;
    if (state.filters.category === 'all') {
      allPill.classList.add('active');
    }
    allPill.addEventListener('click', () => {
      setActiveCategory('all');
    });
    swiperList.appendChild(allPill);

    // Dynamic Categories pills
    Array.from(state.categories).sort().forEach(catName => {
      const pill = document.createElement('button');
      pill.className = 'category-pill-btn';
      pill.setAttribute('data-category', catName);
      
      // Choose icon
      let iconName = 'tag';
      const cleanCat = catName.toLowerCase();
      if (cleanCat.includes('detergent')) iconName = 'spray-can';
      else if (cleanCat.includes('fragrance')) iconName = 'perfume-bottle';
      else if (cleanCat.includes('household')) iconName = 'armchair';
      else if (cleanCat.includes('laundry')) iconName = 'laundry-basket';
      else if (cleanCat.includes('make-up') || cleanCat.includes('makeup')) iconName = 'brush-stars';
      else if (cleanCat.includes('personal')) iconName = 'soap-hand';
      else if (cleanCat.includes('skin')) iconName = 'droplet';
      else if (cleanCat.includes('supplement')) iconName = 'supplement-bottle';

      pill.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${catName}</span>
      `;
      if (state.filters.category === catName) {
        pill.classList.add('active');
      }
      pill.addEventListener('click', () => {
        setActiveCategory(catName);
      });
      swiperList.appendChild(pill);
    });

    // Render icons for swiper
    lucide.createIcons({ nodes: document.querySelectorAll('#mobile-categories-list [data-lucide]') });
  }

  // Scope lucide to just the sidebar list — avoids rescanning the whole document
  lucide.createIcons({ nodes: document.querySelectorAll('#category-filter-list [data-lucide]') });
}

// Event Listeners setup
function setupEventListeners() {
  // Search actions
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('search-clear-btn');

  const debouncedSearch = debounce((value) => {
    state.filters.search = value;
    state.currentPage = 1;
    applyFiltersAndRender();
  }, 250);

  searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    debouncedSearch(value);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.filters.search = '';
    clearSearchBtn.classList.add('hidden');
    applyFiltersAndRender();
  });

  // Hero Tags
  document.querySelectorAll('.hero-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tagText = btn.textContent;
      if (tagText === 'Skin Care' || tagText === 'Supplements') {
        setActiveCategory(tagText);
      } else {
        searchInput.value = tagText;
        state.filters.search = tagText;
        clearSearchBtn.classList.remove('hidden');
        applyFiltersAndRender();
      }
    });
  });

  // Sort Selector
  document.getElementById('sort-select').addEventListener('change', (e) => {
    state.filters.sort = e.target.value;
    applyFiltersAndRender();
  });

  // Cart toggles
  document.getElementById('cart-toggle-btn').addEventListener('click', toggleCartDrawer);
  document.getElementById('cart-close-btn').addEventListener('click', toggleCartDrawer);
  document.getElementById('cart-continue-btn').addEventListener('click', toggleCartDrawer);

  // Active filters bar reset
  document.getElementById('clear-all-filters-btn').addEventListener('click', resetAllFilters);
  document.getElementById('reset-filters-btn').addEventListener('click', resetAllFilters);

  // Modal actions
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  const modalBackdrop = document.getElementById('product-modal');
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Modal toggles and actions
  setupInfoModalTabs();
  
  // Header logo refresh/home link
  document.getElementById('logo-refresh-trigger').addEventListener('click', () => {
    resetAllFilters();
    showCatalogView();
    scrollToTop();
  });

  // Header Navigation Link clicks
  document.getElementById('nav-catalog-btn').addEventListener('click', () => {
    resetAllFilters();
    showCatalogView();
    document.querySelector('.main-layout').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('nav-about-btn').addEventListener('click', () => {
    showAboutView();
  });

  document.getElementById('nav-contact-btn').addEventListener('click', () => {
    showCatalogView();
    openInfoModal('contact-tab');
    setActiveHeaderLink('nav-contact-btn');
  });

  // Back from About Page button
  document.getElementById('about-back-btn').addEventListener('click', () => {
    showCatalogView();
  });

  // Mobile Bottom Navigation Bar Link clicks
  const bottomCatalog = document.getElementById('btn-bottom-catalog');
  if (bottomCatalog) {
    bottomCatalog.addEventListener('click', () => {
      resetAllFilters();
      showCatalogView();
      const mainLayout = document.querySelector('.main-layout');
      if (mainLayout) mainLayout.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const bottomAbout = document.getElementById('btn-bottom-about');
  if (bottomAbout) {
    bottomAbout.addEventListener('click', () => {
      showAboutView();
    });
  }

  const bottomContact = document.getElementById('btn-bottom-contact');
  if (bottomContact) {
    bottomContact.addEventListener('click', () => {
      showCatalogView();
      openInfoModal('contact-tab');
      setActiveBottomNavTab('btn-bottom-contact');
    });
  }

  const bottomCart = document.getElementById('btn-bottom-cart');
  if (bottomCart) {
    bottomCart.addEventListener('click', () => {
      toggleCartDrawer();
    });
  }

  // Brand dropdown selector change handler
  const brandSelect = document.getElementById('brand-filter-select');
  if (brandSelect) {
    brandSelect.addEventListener('change', (e) => {
      setActiveBrand(e.target.value);
    });
  }

  // Geolocation button handler
  document.getElementById('detect-location-btn').addEventListener('click', detectUserLocation);

  // Footer Navigation Link clicks
  document.getElementById('footer-about-btn').addEventListener('click', () => {
    showAboutView();
  });
  document.getElementById('footer-contact-btn').addEventListener('click', () => {
    openInfoModal('contact-tab');
  });
  document.getElementById('footer-refund-btn').addEventListener('click', () => {
    openInfoModal('refund-tab');
  });
  document.getElementById('footer-terms-btn').addEventListener('click', () => {
    openInfoModal('terms-tab');
  });
  document.getElementById('footer-privacy-btn').addEventListener('click', () => {
    openInfoModal('privacy-tab');
  });

  // Profile Modal Toggles
  document.getElementById('profile-toggle-btn').addEventListener('click', openProfileModal);
  document.getElementById('profile-modal-close-btn').addEventListener('click', closeProfileModal);
  document.getElementById('info-modal-close-btn').addEventListener('click', closeInfoModal);
  
  // Profile Auth form
  document.getElementById('profile-auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('auth-name').value.trim();
    const phone = document.getElementById('auth-phone').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    
    if (!name || !phone) return;
    
    state.profile = { name, phone, email };
    localStorage.setItem('britchoice_profile', JSON.stringify(state.profile));
    updateProfileUI();
    closeProfileModal();
  });

  // Profile Dashboard actions
  document.getElementById('profile-edit-btn').addEventListener('click', () => {
    document.getElementById('auth-name').value = state.profile.name;
    document.getElementById('auth-phone').value = state.profile.phone;
    document.getElementById('auth-email').value = state.profile.email;
    
    document.getElementById('profile-state-logged-in').classList.add('hidden');
    document.getElementById('profile-state-logged-out').classList.remove('hidden');
  });

  document.getElementById('profile-signout-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to sign out? This will clear your saved profile details.')) {
      state.profile = null;
      localStorage.removeItem('britchoice_profile');
      localStorage.removeItem('britchoice_orders');
      updateProfileUI();
      closeProfileModal();
    }
  });

  // Cart Change Profile link
  document.getElementById('cart-change-profile-btn').addEventListener('click', () => {
    openProfileModal();
  });

  // Cookie banner clicks
  document.getElementById('cookie-accept-btn').addEventListener('click', () => {
    localStorage.setItem('britchoice_cookie_accepted', 'true');
    document.getElementById('cookie-banner').classList.add('hidden');
  });
  document.getElementById('cookie-decline-btn').addEventListener('click', () => {
    localStorage.setItem('britchoice_cookie_accepted', 'declined');
    document.getElementById('cookie-banner').classList.add('hidden');
  });
  document.getElementById('cookie-banner-read-more').addEventListener('click', () => {
    openInfoModal('privacy-tab');
  });

  // Cart Drawer Delivery / Pickup Method toggles
  const tabPickup = document.getElementById('delivery-tab-pickup');
  const tabCourier = document.getElementById('delivery-tab-courier');
  const panePickup = document.getElementById('pane-pickup');
  const paneCourier = document.getElementById('pane-courier');

  tabPickup.addEventListener('click', () => {
    state.collectionMethod = 'pickup';
    tabPickup.classList.add('active');
    tabCourier.classList.remove('active');
    panePickup.classList.remove('hidden');
    paneCourier.classList.add('hidden');
  });

  tabCourier.addEventListener('click', () => {
    state.collectionMethod = 'delivery';
    tabCourier.classList.add('active');
    tabPickup.classList.remove('active');
    paneCourier.classList.remove('hidden');
    panePickup.classList.add('hidden');
    
    // Invalidate Leaflet map size to ensure it renders correctly
    if (deliveryMapInstance) {
      setTimeout(() => {
        deliveryMapInstance.invalidateSize();
      }, 100);
    }
  });

  // Pickup location change dropdown handler
  const pickupSelect = document.getElementById('pickup-location-select');
  pickupSelect.addEventListener('change', (e) => {
    state.pickupLocation = e.target.value;
    const title = document.getElementById('pickup-location-title');
    const desc = document.getElementById('pickup-location-desc');
    
    if (state.pickupLocation === 'Kahawa Sukari') {
      title.textContent = 'Kahawa Sukari (Self Pick-up)';
      desc.textContent = 'Available for direct self-collection. We will verify availability and send exact coordinates via WhatsApp chat.';
    } else {
      title.textContent = 'World Business Centre, CBD Nairobi (Phan Salon)';
      desc.textContent = 'Available for pick up in town. We will coordinate transit to CBD and notify you when ready for collection.';
    }
  });

  // Payment Method Toggle (M-Pesa vs COD)
  const payTabMpesa = document.getElementById('pay-tab-mpesa');
  const payTabCod = document.getElementById('pay-tab-cod');
  const paneMpesa = document.getElementById('pane-mpesa');
  const paneCodEl = document.getElementById('pane-cod');

  payTabMpesa.addEventListener('click', () => {
    state.paymentMethod = 'mpesa';
    payTabMpesa.classList.add('active');
    payTabCod.classList.remove('active');
    paneMpesa.classList.remove('hidden');
    paneCodEl.classList.add('hidden');
  });

  payTabCod.addEventListener('click', () => {
    state.paymentMethod = 'cod';
    payTabCod.classList.add('active');
    payTabMpesa.classList.remove('active');
    paneCodEl.classList.remove('hidden');
    paneMpesa.classList.add('hidden');
  });

  // Mobile Menu Drawer Toggles
  const mobDrawer = document.getElementById('mobile-menu-drawer');
  document.getElementById('mobile-menu-toggle-btn').addEventListener('click', () => {
    mobDrawer.classList.remove('hidden');
  });
  document.getElementById('mobile-menu-close-btn').addEventListener('click', () => {
    mobDrawer.classList.add('hidden');
  });
  mobDrawer.addEventListener('click', (e) => {
    if (e.target === mobDrawer) mobDrawer.classList.add('hidden');
  });

  // Mobile Menu Drawer Link clicks
  document.getElementById('mob-nav-catalog').addEventListener('click', () => {
    mobDrawer.classList.add('hidden');
    resetAllFilters();
    document.querySelector('.main-layout').scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('mob-nav-about').addEventListener('click', () => {
    mobDrawer.classList.add('hidden');
    showAboutView();
  });
  document.getElementById('mob-nav-contact').addEventListener('click', () => {
    mobDrawer.classList.add('hidden');
    openInfoModal('contact-tab');
  });
  document.getElementById('mob-nav-refund').addEventListener('click', () => {
    mobDrawer.classList.add('hidden');
    openInfoModal('refund-tab');
  });
  document.getElementById('mob-nav-terms').addEventListener('click', () => {
    mobDrawer.classList.add('hidden');
    openInfoModal('terms-tab');
  });
  document.getElementById('mob-nav-privacy').addEventListener('click', () => {
    mobDrawer.classList.add('hidden');
    openInfoModal('privacy-tab');
  });

  // PWA Install Button clicks
  document.getElementById('mobile-install-btn').addEventListener('click', triggerPWAInstall);
  document.getElementById('footer-install-btn').addEventListener('click', triggerPWAInstall);
  document.getElementById('header-install-btn').addEventListener('click', triggerPWAInstall);

  // WhatsApp Checkout
  document.getElementById('whatsapp-checkout-btn').addEventListener('click', checkoutWhatsApp);
}

// Toggle drawer state
function toggleCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  drawer.classList.toggle('hidden');
}

// Open modal detail view
function openProductModal(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('product-modal');
  
  // Expose images served relative or absolute
  const imgUrl = getImageUrl(product.image_path);

  document.getElementById('modal-product-img').src = imgUrl;
  document.getElementById('modal-product-img').alt = product.full_product_title || product.product_name;
  
  document.getElementById('modal-product-category').textContent = product.category || 'General';
  document.getElementById('modal-product-title').textContent = product.full_product_title || product.product_name;
  document.getElementById('modal-product-brand').textContent = product.brand || 'Unbranded';
  document.getElementById('modal-product-variant').textContent = product.variant || 'Original';
  const sizeClean = formatSizeQty(product.size_qty);
  document.getElementById('modal-product-size').textContent = (sizeClean && product.unit) ? `${sizeClean} ${product.unit}` : 'Standard';
  document.getElementById('modal-product-sku').textContent = product.sku;
  document.getElementById('modal-product-price').textContent = `KES ${formatPrice(product.price)}`;
  document.getElementById('modal-product-desc').textContent = product.description || 'Premium quality UK imported product.';

  // Set Availability text and color
  const stockSpan = document.getElementById('modal-product-stock');
  if (product.stock_count > 0) {
    stockSpan.textContent = `In Stock (${product.stock_count} units left)`;
    stockSpan.style.color = 'var(--primary-light)';
  } else {
    stockSpan.textContent = 'Out of Stock';
    stockSpan.style.color = '#EF4444';
  }

  // Update Cart Action Button inside Modal
  const actionContainer = document.getElementById('modal-add-to-cart-container');
  const cartItem = state.cart.find(item => item.id === productId);

  if (cartItem) {
    actionContainer.innerHTML = `
      <div class="quantity-control w-full" style="justify-content: space-between; height: 44px;">
        <button class="qty-btn" onclick="updateCartItemQty(${productId}, -1)" style="flex: 1;"><i data-lucide="minus"></i></button>
        <span class="qty-number" style="font-size: 16px;">${cartItem.quantity}</span>
        <button class="qty-btn" onclick="updateCartItemQty(${productId}, 1)" style="flex: 1;"><i data-lucide="plus"></i></button>
      </div>
    `;
  } else {
    if (product.stock_count <= 0) {
      actionContainer.innerHTML = `
        <button id="modal-add-btn" class="btn-secondary w-full" style="cursor: not-allowed; color: var(--text-light);" disabled>
          <i data-lucide="alert-circle"></i> Out of Stock
        </button>
      `;
    } else {
      actionContainer.innerHTML = `
        <button id="modal-add-btn" class="btn-primary w-full" onclick="addToCart(${productId})">
          <i data-lucide="shopping-cart"></i> Add to Cart
        </button>
      `;
    }
  }

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

// Active filters setters
function setActiveCategory(cat) {
  state.filters.category = cat;
  state.currentPage = 1;
  
  // Highlight active sidebar item
  document.querySelectorAll('#category-filter-list li').forEach(li => {
    if (li.getAttribute('data-category') === cat) {
      li.classList.add('active-filter-item');
    } else {
      li.classList.remove('active-filter-item');
    }
  });

  // Highlight active mobile swiper item
  document.querySelectorAll('#mobile-categories-list .category-pill-btn').forEach(btn => {
    if (btn.getAttribute('data-category') === cat) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  applyFiltersAndRender();
}

function setActiveBrand(brand) {
  state.filters.brand = brand;
  state.currentPage = 1;

  // Sync active brand selector dropdown value
  const brandSelect = document.getElementById('brand-filter-select');
  if (brandSelect && brandSelect.value !== brand) {
    brandSelect.value = brand;
  }

  applyFiltersAndRender();
}

function resetAllFilters() {
  state.filters.search = '';
  state.filters.category = 'all';
  state.filters.brand = 'all';
  state.filters.sort = 'default';

  document.getElementById('search-input').value = '';
  document.getElementById('search-clear-btn').classList.add('hidden');
  document.getElementById('sort-select').value = 'default';

  setActiveCategory('all');
  setActiveBrand('all');
}

// Perform client side sorting and filtering
function applyFiltersAndRender() {
  let list = [...state.products];

  // 1. Filter by Search Query
  if (state.filters.search) {
    const q = state.filters.search.toLowerCase();
    list = list.filter(p => 
      (p.product_name && p.product_name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.full_product_title && p.full_product_title.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }

  // 2. Filter by Category
  if (state.filters.category !== 'all') {
    list = list.filter(p => p.category === state.filters.category);
  }

  // 3. Filter by Brand
  if (state.filters.brand !== 'all') {
    list = list.filter(p => p.brand === state.filters.brand);
  }

  // 4. Sort results
  if (state.filters.sort === 'price-asc') {
    list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (state.filters.sort === 'price-desc') {
    list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  } else if (state.filters.sort === 'name-asc') {
    list.sort((a, b) => a.product_name.localeCompare(b.product_name));
  }

  state.filteredProducts = list;
  renderActiveFiltersUI();
  renderProducts();
}

// Update the visible filter tags row
function renderActiveFiltersUI() {
  const container = document.getElementById('active-filters-bar');
  const list = document.getElementById('active-filters-list');
  list.innerHTML = '';

  let count = 0;

  if (state.filters.search) {
    createFilterChip(`Search: "${state.filters.search}"`, () => {
      document.getElementById('search-input').value = '';
      state.filters.search = '';
      document.getElementById('search-clear-btn').classList.add('hidden');
      applyFiltersAndRender();
    });
    count++;
  }

  if (state.filters.category !== 'all') {
    createFilterChip(`Category: ${state.filters.category}`, () => {
      setActiveCategory('all');
    });
    count++;
  }

  if (state.filters.brand !== 'all') {
    createFilterChip(`Brand: ${state.filters.brand}`, () => {
      setActiveBrand('all');
    });
    count++;
  }

  if (count > 0) {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
  }

  function createFilterChip(text, onRemove) {
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      <span>${text}</span>
      <button><i data-lucide="x"></i></button>
    `;
    chip.querySelector('button').addEventListener('click', onRemove);
    list.appendChild(chip);
  }
  // Icons refreshed once in renderProducts after all DOM changes
}

// Render dynamic products grid — paginated for performance
function renderProducts() {
  const grid = document.getElementById('product-grid');
  const empty = document.getElementById('empty-state');
  const countText = document.getElementById('results-count');

  // Title header text
  const catalogTitle = document.getElementById('catalog-title');
  catalogTitle.textContent = state.filters.category !== 'all' ? state.filters.category : 'All Products';

  const total = state.filteredProducts.length;
  countText.textContent = `Showing ${total} product${total === 1 ? '' : 's'}`;

  if (total === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  // Slice to current page
  const visibleCount = state.currentPage * state.pageSize;
  const visibleProducts = state.filteredProducts.slice(0, visibleCount);

  // Build all cards as a single HTML fragment for one DOM write
  const fragment = document.createDocumentFragment();

  visibleProducts.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imgUrl = getImageUrl(product.image_path);

    const variantLabel = product.variant && product.variant.toLowerCase() !== 'original' ? product.variant : '';
    const sizeClean = formatSizeQty(product.size_qty);
    const sizeLabel = (sizeClean && product.unit) ? `${sizeClean} ${product.unit}` : '';

    // Use inline SVG constants — no Lucide scan needed for cards
    const cartItem = state.cart.find(item => item.id === product.id);
    let actionHTML = '';
    if (cartItem) {
      actionHTML = `
        <div class="quantity-control">
          <button class="qty-btn" onclick="updateCartItemQty(${product.id}, -1, event)">${SVG.minus}</button>
          <span class="qty-number">${cartItem.quantity}</span>
          <button class="qty-btn" onclick="updateCartItemQty(${product.id}, 1, event)">${SVG.plus}</button>
        </div>`;
    } else if (product.stock_count <= 0) {
      actionHTML = `<span class="badge-out-of-stock">Sold Out</span>`;
    } else {
      actionHTML = `<button class="btn-icon-only" onclick="addToCart(${product.id}, event)" aria-label="Add to Cart">${SVG.plus}</button>`;
    }

    card.innerHTML = `
      <div class="card-image-wrap" onclick="openProductModal(${product.id})">
        <img src="${imgUrl}" alt="${product.product_name}" loading="lazy">
        ${product.category ? `<span class="badge-overlay">${product.category}</span>` : ''}
      </div>
      <div class="card-info">
        <span class="card-brand">${product.brand || 'Premium'}</span>
        <h3 class="card-title" onclick="openProductModal(${product.id})">${product.full_product_title || product.product_name}</h3>
        <div class="card-spec-row">
          ${variantLabel ? `<span class="card-pill">${variantLabel}</span>` : ''}
          ${sizeLabel ? `<span class="card-pill">${sizeLabel}</span>` : ''}
        </div>
        <div class="card-stock-status">
          ${product.stock_count > 0
            ? `<span class="stock-pill in-stock">${SVG.checkCircle} In Stock: ${product.stock_count}</span>`
            : `<span class="stock-pill out-of-stock">${SVG.alertCircle} Out of Stock</span>`}
        </div>
        <div class="card-price-row">
          <span class="card-price">KES ${formatPrice(product.price)}</span>
          <div class="card-action-box">${actionHTML}</div>
        </div>
      </div>`;

    fragment.appendChild(card);
  });

  // Single DOM write
  grid.innerHTML = '';
  grid.appendChild(fragment);

  // "Load More" button — also uses inline SVG, no lucide needed
  if (visibleCount < total) {
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'btn-secondary load-more-btn';
    loadMoreBtn.style.cssText = 'grid-column: 1 / -1; margin: 1rem auto; padding: 0.75rem 2.5rem;';
    loadMoreBtn.innerHTML = `${SVG.chevronsDown} Load More (${total - visibleCount} remaining)`;
    loadMoreBtn.addEventListener('click', () => {
      state.currentPage++;
      renderProducts();
      loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    grid.appendChild(loadMoreBtn);
  }
  // NO lucide.createIcons() here — all card icons are inline SVG
}

// Formatting price
function formatPrice(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Clean trailing float .0 from size quantities
function formatSizeQty(val) {
  if (!val) return '';
  const str = String(val);
  return str.endsWith('.0') ? str.slice(0, -2) : str;
}

// Shopping Cart Functions
function addToCart(productId, event) {
  if (event) event.stopPropagation();

  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = state.cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      title: product.full_product_title || product.product_name,
      brand: product.brand,
      variant: product.variant,
      size: (product.size_qty && product.unit) ? `${product.size_qty} ${product.unit}` : '',
      price: product.price,
      image_path: product.image_path,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  applyFiltersAndRender();
  triggerAddToCartFeedback(product.product_name || product.full_product_title);
  
  // Update modal detail view if currently open and showing this product
  const modal = document.getElementById('product-modal');
  if (!modal.classList.contains('hidden') && state.activeModalId === productId) {
    openProductModal(productId);
  }
}

// Shake cart icons and trigger toast notification on item add
function triggerAddToCartFeedback(productName) {
  // 1. Shaking animation
  const buttons = ['cart-toggle-btn', 'btn-bottom-cart'];
  buttons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('cart-shake');
      void btn.offsetWidth; // Trigger reflow to restart CSS keyframe animation
      btn.classList.add('cart-shake');
      
      setTimeout(() => {
        btn.classList.remove('cart-shake');
      }, 600);
    }
  });

  // 2. Toast notification
  let toast = document.getElementById('toast-notification-wrap');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification-wrap';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <i data-lucide="check-circle-2"></i>
    <span>Added to Cart: ${productName}</span>
  `;
  
  lucide.createIcons({ nodes: [toast.querySelector('[data-lucide]')] });
  toast.classList.add('show');

  if (state.toastTimeout) {
    clearTimeout(state.toastTimeout);
  }
  state.toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function updateCartItemQty(productId, delta, event) {
  if (event) event.stopPropagation();

  const itemIdx = state.cart.findIndex(item => item.id === productId);
  if (itemIdx === -1) return;

  state.cart[itemIdx].quantity += delta;

  if (state.cart[itemIdx].quantity <= 0) {
    state.cart.splice(itemIdx, 1);
  }

  saveCart();
  updateCartUI();
  applyFiltersAndRender();

  // Dynamically update modal if showing this product
  const modal = document.getElementById('product-modal');
  if (!modal.classList.contains('hidden')) {
    openProductModal(productId);
  }
}

function removeCartItem(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  saveCart();
  updateCartUI();
  applyFiltersAndRender();

  const modal = document.getElementById('product-modal');
  if (!modal.classList.contains('hidden')) {
    openProductModal(productId);
  }
}

function saveCart() {
  localStorage.setItem('britchoice_cart', JSON.stringify(state.cart));
}

// Update all components of the Cart interface
function updateCartUI() {
  const cartBadge = document.getElementById('cart-count-badge');
  const drawerCount = document.getElementById('cart-drawer-count');
  const itemsList = document.getElementById('cart-items-list');
  const emptyState = document.getElementById('cart-empty-state');
  const footer = document.getElementById('cart-footer');
  const subtotalText = document.getElementById('cart-subtotal');

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);

  cartBadge.textContent = totalItems;
  drawerCount.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;

  // Update mobile bottom nav cart badge
  const bottomCartBadge = document.getElementById('bottom-cart-count-badge');
  if (bottomCartBadge) {
    bottomCartBadge.textContent = totalItems;
  }

  if (state.cart.length === 0) {
    itemsList.innerHTML = '';
    emptyState.classList.remove('hidden');
    footer.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  footer.classList.remove('hidden');
  itemsList.innerHTML = '';

  let subtotal = 0;

  state.cart.forEach(item => {
    const itemRow = document.createElement('div');
    itemRow.className = 'cart-item';
    
    const imgUrl = item.image_path.startsWith('http') 
      ? item.image_path 
      : getImageUrl(item.image_path);

    const specText = [item.brand, item.variant, item.size].filter(Boolean).join(' - ');
    const itemTotal = parseFloat(item.price) * item.quantity;
    subtotal += itemTotal;

    itemRow.innerHTML = `
      <div class="cart-item-img">
        <img src="${imgUrl}" alt="${item.title}">
      </div>
      <div class="cart-item-details">
        <h4 class="cart-item-title">${item.title}</h4>
        <span class="cart-item-spec">${specText}</span>
        <div class="cart-item-row">
          <div class="quantity-control" style="transform: scale(0.95); transform-origin: left center;">
            <button class="qty-btn" onclick="updateCartItemQty(${item.id}, -1)"><i data-lucide="minus"></i></button>
            <span class="qty-number">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartItemQty(${item.id}, 1)"><i data-lucide="plus"></i></button>
          </div>
          <span class="cart-item-price">KES ${formatPrice(itemTotal)}</span>
        </div>
        <button class="cart-item-remove-btn" onclick="removeCartItem(${item.id})" aria-label="Remove Item">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;

    itemsList.appendChild(itemRow);
  });

  subtotalText.textContent = `KES ${formatPrice(subtotal)}`;
  lucide.createIcons();
}

// Compile WhatsApp message and launch chat
async function checkoutWhatsApp() {
  if (state.cart.length === 0) return;

  const checkoutBtn = document.getElementById('whatsapp-checkout-btn');
  const originalHTML = checkoutBtn.innerHTML;
  
  // Set button loading state
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> Checking stock...`;
  lucide.createIcons();

  let clientName = '';
  let clientPhone = '';
  let clientEmail = '';
  let deliveryAddress = '';

  if (state.profile) {
    clientName = state.profile.name;
    clientPhone = state.profile.phone;
    clientEmail = state.profile.email;
  } else {
    clientName = document.getElementById('order-name').value.trim();
    clientPhone = document.getElementById('order-phone').value.trim();
    
    if (!clientName || !clientPhone) {
      alert('Please enter your name and WhatsApp number to place an order.');
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = originalHTML;
      lucide.createIcons();
      return;
    }
  }

  // Read payment method from state
  const paymentMethod = state.paymentMethod || 'mpesa';
  let mpesaCode = '';

  if (paymentMethod === 'mpesa') {
    mpesaCode = (document.getElementById('mpesa-code')?.value || '').trim().toUpperCase();
    if (!mpesaCode) {
      alert('Please enter your M-Pesa transaction code to complete the order.');
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = originalHTML;
      lucide.createIcons();
      return;
    }
  }

  if (state.collectionMethod === 'delivery') {
    deliveryAddress = document.getElementById('order-delivery-address').value.trim();
    if (!deliveryAddress) {
      alert('Please enter a delivery address or landmark.');
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = originalHTML;
      lucide.createIcons();
      return;
    }
  }
  
  // Format the checkout items payload for the backend API
  const itemsPayload = state.cart.map(item => ({
    id: item.id,
    quantity: item.quantity
  }));

  try {
    // 1. Call stock-reduction checkout API on Django backend
    const response = await fetch(`${API_BASE}/api/products/checkout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: itemsPayload })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to check out and reduce stock.');
    }

    let msg = `*NEW ORDER - BRITCHOICE KENYA*\n\n`;
    msg += `*Customer:* ${clientName}\n`;
    msg += `*WhatsApp:* ${clientPhone}\n`;
    if (clientEmail) {
      msg += `*Email:* ${clientEmail}\n`;
    }
    
    msg += `\n*Fulfillment Details:*\n`;
    if (state.collectionMethod === 'pickup') {
      const locText = state.pickupLocation === 'Kahawa Sukari' 
        ? 'Kahawa Sukari (Main Store)' 
        : 'World Business Centre, CBD Nairobi (Phan Salon)';
      msg += `• *Method:* Self Pick-up\n`;
      msg += `• *Point:* ${locText}\n`;
    } else {
      msg += `• *Method:* Request Delivery (Courier)\n`;
      msg += `• *Address:* ${deliveryAddress}\n`;
      if (state.deliveryLocation) {
        msg += `• *Coordinates:* ${state.deliveryLocation.lat.toFixed(6)}, ${state.deliveryLocation.lon.toFixed(6)}\n`;
        msg += `• *Pin Link:* https://www.google.com/maps?q=${state.deliveryLocation.lat},${state.deliveryLocation.lon}\n`;
      }
    }
    
    msg += `\n-----------------------------------\n\n`;

    let grandTotal = 0;

    state.cart.forEach((item, idx) => {
      const itemTotal = parseFloat(item.price) * item.quantity;
      grandTotal += itemTotal;
      
      const spec = [item.variant, item.size].filter(Boolean).join(', ');
      const specStr = spec ? ` (${spec})` : '';

      msg += `*${idx + 1}.* ${item.brand} ${item.title}${specStr}\n`;
      msg += `   Qty: ${item.quantity} × KES ${formatPrice(item.price)} = *KES ${formatPrice(itemTotal)}*\n\n`;
    });

    msg += `-----------------------------------\n`;
    msg += `*Total Order Value:* KES ${formatPrice(grandTotal)}\n\n`;

    // Payment method
    if ((state.paymentMethod || 'mpesa') === 'mpesa') {
      msg += `*Payment Method:* M-Pesa Paybill\n`;
      msg += `• *Business No:* 222111\n`;
      msg += `• *Account No:* 017000029397\n`;
      msg += `• *Transaction Code:* ${mpesaCode}\n\n`;
    } else {
      msg += `*Payment Method:* Cash on Pick-up / Delivery\n\n`;
    }

    msg += `Please confirm my order availability and advise on pickup/delivery. Thank you!`;

    // 3. Save to local order history log
    const orderLog = {
      date: new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      items: state.cart.map(item => `${item.brand} ${item.title} (${item.quantity}x)`).join(', '),
      total: grandTotal,
      method: state.collectionMethod === 'pickup' 
        ? `Pick-up (${state.pickupLocation})` 
        : 'Courier Delivery'
    };
    const pastOrders = jsonParseSafe(localStorage.getItem('britchoice_orders'), []);
    pastOrders.unshift(orderLog);
    localStorage.setItem('britchoice_orders', JSON.stringify(pastOrders));

    // Update Profile dashboard if active
    if (state.profile) {
      renderOrderHistory();
    }

    // 4. Clear cart since stock is successfully reserved and reduced
    state.cart = [];
    saveCart();
    updateCartUI();
    
    // Refresh products in catalog so stock count reduction updates on screen
    await fetchProducts();

    // 5. Open WhatsApp in new tab
    const encodedMsg = encodeURIComponent(msg);
    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
    window.open(waUrl, '_blank');

  } catch (error) {
    alert(`Order Aborted: ${error.message}`);
  } finally {
    // Restore button state
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = originalHTML;
    lucide.createIcons();
  }
}

// ==========================================
// NEW FEATURES: VIEW SWAPPER, GEOLOCATION MAPS
// ==========================================

// Helper to scroll the fixed container to the top
function scrollToTop() {
  const container = document.getElementById('app-body-container');
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// View Swapper Functions
function showCatalogView() {
  document.getElementById('about-page-view').classList.add('hidden');
  document.querySelector('.hero-section').classList.remove('hidden');
  document.querySelector('.main-layout').classList.remove('hidden');
  document.querySelector('.trust-testimonials-section').classList.remove('hidden');
  const footer = document.querySelector('.app-footer-page');
  if (footer) footer.classList.remove('hidden');
  setActiveHeaderLink('nav-catalog-btn');
  setActiveBottomNavTab('btn-bottom-catalog');
}

// Show About view and swap elements
function showAboutView() {
  document.getElementById('about-page-view').classList.remove('hidden');
  document.querySelector('.hero-section').classList.add('hidden');
  document.querySelector('.main-layout').classList.add('hidden');
  document.querySelector('.trust-testimonials-section').classList.add('hidden');
  const footer = document.querySelector('.app-footer-page');
  if (footer) footer.classList.add('hidden');
  setActiveHeaderLink('nav-about-btn');
  setActiveBottomNavTab('btn-bottom-about');
  scrollToTop();
}

// Map and Geolocation functionality
let deliveryMapInstance = null;
let deliveryMarkerInstance = null;

function initDeliveryMap(lat, lon) {
  const mapContainer = document.getElementById('delivery-map-container');
  mapContainer.classList.remove('hidden');

  if (deliveryMapInstance) {
    deliveryMapInstance.setView([lat, lon], 16);
    if (deliveryMarkerInstance) {
      deliveryMarkerInstance.setLatLng([lat, lon]);
    } else {
      deliveryMarkerInstance = L.marker([lat, lon], { draggable: true }).addTo(deliveryMapInstance);
      bindMarkerDragEvent();
    }
    setTimeout(() => {
      deliveryMapInstance.invalidateSize();
    }, 100);
    return;
  }

  // Create Map instance
  deliveryMapInstance = L.map('delivery-map').setView([lat, lon], 16);

  // Add OSM base layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(deliveryMapInstance);

  // Add draggable Marker
  deliveryMarkerInstance = L.marker([lat, lon], { draggable: true }).addTo(deliveryMapInstance);
  bindMarkerDragEvent();

  setTimeout(() => {
    deliveryMapInstance.invalidateSize();
  }, 100);
}

function bindMarkerDragEvent() {
  if (!deliveryMarkerInstance) return;
  deliveryMarkerInstance.on('dragend', function (event) {
    const position = deliveryMarkerInstance.getLatLng();
    state.deliveryLocation = { lat: position.lat, lon: position.lng };
    reverseGeocode(position.lat, position.lng);
  });
}

async function reverseGeocode(lat, lon) {
  const addressTextarea = document.getElementById('order-delivery-address');
  const statusEl = document.getElementById('location-status');
  
  statusEl.textContent = 'Resolving address...';
  statusEl.classList.remove('hidden');

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
      headers: {
        'Accept-Language': 'en'
      }
    });
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    if (data && data.display_name) {
      addressTextarea.value = data.display_name;
      statusEl.textContent = 'Location resolved!';
    } else {
      statusEl.textContent = 'Could not resolve address, please enter landmark.';
    }
  } catch (error) {
    console.error('Nominatim error:', error);
    statusEl.textContent = 'Network error, please enter landmark manually.';
  }
}

function detectUserLocation() {
  const statusEl = document.getElementById('location-status');
  statusEl.classList.remove('hidden');
  statusEl.textContent = 'Detecting your location...';

  if (!navigator.geolocation) {
    statusEl.textContent = 'Geolocation is not supported by your browser.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      state.deliveryLocation = { lat, lon };
      
      initDeliveryMap(lat, lon);
      reverseGeocode(lat, lon);
    },
    (error) => {
      console.error('Geolocation error:', error);
      let errMsg = 'Failed to retrieve location. Please check settings.';
      if (error.code === error.PERMISSION_DENIED) {
        errMsg = 'Permission denied. Please allow location permissions.';
      }
      statusEl.textContent = errMsg;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ==========================================
// TESTIMONIAL CAROUSEL
// ==========================================
function initTestimonialCarousel() {
  const track = document.getElementById('testimonial-track');
  const carousel = document.getElementById('testimonial-carousel');

  if (!track || !carousel) return;

  const cards = Array.from(track.children);
  const total = cards.length;
  let current = 0;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
  }

  // Auto-glide only — no manual controls
  setInterval(() => goTo(current + 1), 7000);
}

// Call carousel init after DOM is ready
document.addEventListener('DOMContentLoaded', initTestimonialCarousel);
