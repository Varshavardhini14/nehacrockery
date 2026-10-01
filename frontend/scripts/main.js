/* ═══════════════════════════════════════════════════════════════
   NEHA CROCKERY HOUSE — Site Interactions
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────────
     WELCOME POPUP — Auto-dismiss after delay
     Shows once per browser session (sessionStorage)
  ─────────────────────────────────────────────────────────────── */
  var POPUP_DURATION = 4000; // ms total display time before auto-dismiss
  var PROGRESS_CSS_DURATION = (POPUP_DURATION - 800) / 1000; // seconds (starts slightly after card loads)

  var overlay = document.getElementById('welcome-overlay');

  // Only run on homepage (index.html)
  var isHomepage =
    window.location.pathname === '/' ||
    window.location.pathname.endsWith('index.html') ||
    window.location.pathname.endsWith('/');

  function dismissPopup() {
    if (!overlay) return;
    overlay.classList.add('dismissed');
    // Remove from DOM after animation completes so it doesn't block interaction
    setTimeout(function () {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 1000);
  }

  if (overlay && isHomepage) {
    // Set CSS variable for progress bar duration
    var progressBar = document.getElementById('welcome-progress-bar');
    if (progressBar) {
      progressBar.style.setProperty(
        '--welcome-duration',
        PROGRESS_CSS_DURATION + 's'
      );
      // Apply the animation duration directly
      progressBar.style.animationDuration = PROGRESS_CSS_DURATION + 's';
    }

    // Auto-dismiss after POPUP_DURATION
    var autoTimer = setTimeout(dismissPopup, POPUP_DURATION);

    // Allow click anywhere on overlay to dismiss early (optional premium UX)
    overlay.addEventListener('click', function () {
      clearTimeout(autoTimer);
      dismissPopup();
    });

    // Store in session so it doesn't re-appear within same tab session
    sessionStorage.setItem('nch-welcomed', '1');

  } else if (overlay) {
    // Not homepage — remove popup immediately
    overlay.parentNode && overlay.parentNode.removeChild(overlay);
  }

  /* ──────────────────────────────────────────────────────────────
     HEADER SCROLL EFFECT
  ─────────────────────────────────────────────────────────────── */
  var header = document.getElementById('site-header');

  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ──────────────────────────────────────────────────────────────
     MOBILE MENU TOGGLE
  ─────────────────────────────────────────────────────────────── */
  var toggle     = document.getElementById('mobile-toggle');
  var mobileMenu = document.getElementById('mobile-menu');

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = mobileMenu.classList.toggle('open');
      toggle.classList.toggle('open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileMenu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close mobile menu when a link is clicked
    var mobileLinks = mobileMenu.querySelectorAll('.mobile-nav-link, .mobile-cta');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (mobileMenu.classList.contains('open') &&
          !mobileMenu.contains(e.target) &&
          !toggle.contains(e.target)) {
        mobileMenu.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  /* ──────────────────────────────────────────────────────────────
     DARK / LIGHT MODE TOGGLE
  ─────────────────────────────────────────────────────────────── */
  var themeToggle = document.getElementById('theme-toggle');
  var htmlEl      = document.documentElement;

  // Load saved preference
  var savedTheme = localStorage.getItem('nch-theme') || 'light';
  htmlEl.setAttribute('data-theme', savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = htmlEl.getAttribute('data-theme');
      var next    = current === 'dark' ? 'light' : 'dark';
      htmlEl.setAttribute('data-theme', next);
      localStorage.setItem('nch-theme', next);
      themeToggle.setAttribute('aria-label',
        next === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
    });
  }

  /* ──────────────────────────────────────────────────────────────
     SCROLL-REVEAL ANIMATION
  ─────────────────────────────────────────────────────────────── */
  function addRevealClasses() {
    // Products section
    var productCards = document.querySelectorAll('.product-card');
    productCards.forEach(function (card, i) {
      card.classList.add('reveal');
      if (i === 1) card.classList.add('reveal-delay-2');
      if (i === 2) card.classList.add('reveal-delay-3');
    });

    // About section
    var aboutImgCol  = document.querySelector('.about-img-col');
    var aboutTextCol = document.querySelector('.about-text-col');
    var features     = document.querySelectorAll('.about-feature-item');

    if (aboutImgCol)  aboutImgCol.classList.add('reveal');
    if (aboutTextCol) {
      aboutTextCol.classList.add('reveal');
      aboutTextCol.classList.add('reveal-delay-2');
    }
    features.forEach(function (f, i) {
      f.classList.add('reveal');
      f.classList.add('reveal-delay-' + (i + 1));
    });

    // Contact cards
    var contactCards = document.querySelectorAll('.contact-card');
    contactCards.forEach(function (card, i) {
      card.classList.add('reveal');
      card.classList.add('reveal-delay-' + (i + 1));
    });

    // Section headers
    document.querySelectorAll('.section-header').forEach(function (el) {
      el.classList.add('reveal');
    });

    // Page banner content
    document.querySelectorAll('.page-banner-content').forEach(function (el) {
      el.classList.add('reveal');
    });
  }

  function observeReveal() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  }

  addRevealClasses();
  observeReveal();

  /* ──────────────────────────────────────────────────────────────
     STATS COUNTER ANIMATION (homepage only)
  ─────────────────────────────────────────────────────────────── */
  function animateCounter(el, target, suffix) {
    var duration = 1600;
    var start    = performance.now();
    var end      = parseInt(target, 10);

    if (isNaN(end)) return;

    function step(now) {
      var elapsed  = now - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3);
      var current  = Math.round(eased * end);
      el.textContent = current + (suffix || '');
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    if (!('IntersectionObserver' in window)) return;

    var statsSection = document.querySelector('.hero-stats');
    if (!statsSection) return;

    var statNumbers = statsSection.querySelectorAll('.stat-number');

    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          statNumbers.forEach(function (el) {
            var text = el.textContent.trim();
            if (text.endsWith('+')) {
              animateCounter(el, text.replace('+', ''), '+');
            }
          });
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterObs.observe(statsSection);
  }

  initCounters();

})();

/* ═══════════════════════════════════════════════════════════════
   PRODUCT ENGINE — loads products.json & brands.json, renders cards
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var WA_NUMBER = '918870413413';
  var DATA_BASE = '../data/';
  var CATEGORY_ICONS = {
    crockery: '🍽️', cutlery: '🍴', glassware: '🥂', melamineware: '🥣',
    acrylicware: '🥤', kitchenware: '🍳', hotelware: '🏨',
    'wooden-handicrafts': '🪵', 'new-arrivals': '✨'
  };
  var CATEGORY_LABELS = {
    crockery: 'Crockery & Dinnerware', cutlery: 'Cutlery',
    glassware: 'Glassware & Bottles', melamineware: 'Melamineware',
    acrylicware: 'Acrylicware', kitchenware: 'Kitchenware',
    hotelware: 'Hotelware', 'wooden-handicrafts': 'Wooden Handicrafts',
    'new-arrivals': 'New Arrivals'
  };

  /* ── State ── */
  var allProducts = [];
  var allBrands = [];
  var filteredProducts = [];
  var currentPage = 1;
  var PAGE_SIZE = 12;
  var activeCategory = 'all';
  var activeBrand = null;
  var searchTerm = '';
  var sortOrder = 'default';

  /* ── Fetch helpers ── */
  function fetchJSON(path, cb) {
    // Try localStorage first (admin panel data)
    var localKey = path.includes('products') ? 'nch_products' : 'nch_brands';
    var cached = localStorage.getItem(localKey);
    if (cached) {
      try {
        var d = JSON.parse(cached);
        cb(null, d);
        return;
      } catch (e) { /* fall through */ }
    }
    fetch(path)
      .then(function (r) { return r.json(); })
      .then(function (d) { cb(null, d); })
      .catch(function (e) { cb(e, null); });
  }

  /* ── Build a product card HTML ── */
  function buildProductCard(product) {
    var tags = product.tags || [];
    var isFeatured = tags.includes('featured');
    var isNew = tags.includes('new_arrival');
    var imageHtml = '';

    if (product.images && product.images.length > 0) {
      imageHtml = '<img src="' + escHtml(product.images[0]) + '" alt="' + escHtml(product.name) + '" class="product-card-img" loading="lazy" />';
    } else {
      var icon = CATEGORY_ICONS[product.category] || '📦';
      imageHtml = '<div class="product-card-img-placeholder" aria-hidden="true">' + icon + '</div>';
    }

    var badgesHtml = '';
    if (isFeatured) badgesHtml += '<span class="product-badge product-badge--featured">Featured</span>';
    if (isNew) badgesHtml += '<span class="product-badge product-badge--new">New</span>';
    if (product.brand && product.brand.toLowerCase() === 'taroba') {
      badgesHtml += '<span class="product-badge" style="background:var(--gold);color:white;">Taroba®</span>';
    }

    var waMsg = encodeURIComponent(
      'Hello, I would like to enquire about: ' + product.name +
      (product.id ? ' (Code: ' + product.id + ')' : '') + '.'
    );

    var catLabel = CATEGORY_LABELS[product.category] || product.category;
    var metaInfo = [];
    if (product.material) metaInfo.push(product.material);
    if (product.capacity) metaInfo.push(product.capacity);
    if (product.set_contents) metaInfo.push(product.set_contents);

    return '<article class="product-card" data-id="' + escHtml(product.id || '') + '">' +
      '<div class="product-card-img-wrap">' + imageHtml +
      (badgesHtml ? '<div class="product-card-badges">' + badgesHtml + '</div>' : '') +
      '</div>' +
      '<div class="product-card-body">' +
        (product.brand ? '<span class="product-card-brand">' + escHtml(product.brand) + '</span>' : '') +
        '<h3 class="product-card-name">' + escHtml(product.name) + '</h3>' +
        '<span class="product-card-category">' + catLabel + '</span>' +
        (metaInfo.length ? '<span class="product-card-meta">' + escHtml(metaInfo.join(' · ')) + '</span>' : '') +
      '</div>' +
      '<div class="product-card-footer">' +
        '<a href="https://wa.me/' + WA_NUMBER + '?text=' + waMsg + '" ' +
        'class="product-enquire-btn" target="_blank" rel="noopener" ' +
        'aria-label="Enquire about ' + escHtml(product.name) + ' on WhatsApp">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">' +
        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>' +
        '</svg>Enquire on WhatsApp</a>' +
      '</div>' +
    '</article>';
  }

  /* ── Build brand card HTML ── */
  function buildBrandCard(brand) {
    var logoHtml = brand.logo
      ? '<img src="' + escHtml(brand.logo) + '" alt="' + escHtml(brand.name) + '" class="brand-card-logo" />'
      : '<div class="brand-card-logo-placeholder">' + escHtml(brand.name.charAt(0)) + '</div>';

    return '<div class="brand-card' + (brand.own_brand ? ' brand-card--own' : '') + '">' +
      logoHtml +
      (brand.own_brand ? '<span class="brand-own-badge">Own Brand</span>' : '') +
      '<span class="brand-card-name">' + escHtml(brand.name) + '</span>' +
      (brand.tagline ? '<span class="brand-card-tagline">' + escHtml(brand.tagline) + '</span>' : '') +
    '</div>';
  }

  /* ── Homepage: Featured products ── */
  function initHomepageFeatured() {
    var featuredGrid = document.getElementById('featured-products-grid');
    var arrivalsScroll = document.getElementById('new-arrivals-scroll');
    var brandsGrid = document.getElementById('homepage-brands-grid');
    if (!featuredGrid && !arrivalsScroll && !brandsGrid) return;

    fetchJSON(DATA_BASE + 'products.json', function (err, data) {
      if (err || !data) return;
      allProducts = (data.products || []).filter(function (p) { return p.active !== false; });

      if (featuredGrid) {
        var featured = allProducts.filter(function (p) { return (p.tags || []).includes('featured'); }).slice(0, 4);
        if (featured.length === 0) {
          featuredGrid.innerHTML = '<p class="products-loading-text" style="grid-column:1/-1;text-align:center;padding:40px;">Featured products will appear here once added via the admin panel.</p>';
        } else {
          featuredGrid.innerHTML = featured.map(buildProductCard).join('');
        }
      }

      if (arrivalsScroll) {
        var newArrivals = allProducts.filter(function (p) { return (p.tags || []).includes('new_arrival'); }).slice(0, 8);
        if (newArrivals.length === 0) {
          arrivalsScroll.innerHTML = '<p class="products-loading-text" style="padding:40px;">New arrivals will appear here once added.</p>';
        } else {
          arrivalsScroll.innerHTML = newArrivals.map(buildProductCard).join('');
        }
      }
    });

    fetchJSON(DATA_BASE + 'brands.json', function (err, data) {
      if (err || !data || !brandsGrid) return;
      allBrands = (data.brands || []).filter(function (b) { return b.active !== false; });
      if (allBrands.length === 0) {
        brandsGrid.innerHTML = '<p class="brands-note"><p>Brand logos will appear here once added.</p></p>';
      } else {
        brandsGrid.innerHTML = allBrands.map(buildBrandCard).join('');
      }
    });
  }

  /* ── Brands page ── */
  function initBrandsPage() {
    var grid = document.getElementById('brands-full-grid');
    if (!grid) return;
    fetchJSON(DATA_BASE + 'brands.json', function (err, data) {
      if (err || !data) return;
      var brands = (data.brands || []).filter(function (b) { return b.active !== false; });
      if (brands.length === 0) {
        grid.innerHTML = '<div class="brand-placeholder-note"><p>&#9670; Brand logos and names will appear here once added.</p><p>Use the <a href="admin/" class="inline-link">admin panel</a> to add brands.</p></div>';
      } else {
        grid.innerHTML = brands.map(buildBrandCard).join('');
      }
    });
  }

  /* ── Taroba page ── */
  function initTarobaPage() {
    var grid = document.getElementById('taroba-products-grid');
    if (!grid) return;
    fetchJSON(DATA_BASE + 'products.json', function (err, data) {
      if (err || !data) return;
      var tarobaProducts = (data.products || []).filter(function (p) {
        return p.active !== false && (p.brand || '').toLowerCase() === 'taroba';
      }).slice(0, 8);
      if (tarobaProducts.length === 0) {
        grid.innerHTML = '<p class="products-loading-text" style="grid-column:1/-1;text-align:center;padding:40px 20px;">Taroba products will appear here once added via the admin panel.</p>';
      } else {
        grid.innerHTML = tarobaProducts.map(buildProductCard).join('');
      }
    });
  }

  /* ── Products page ── */
  function initProductsPage() {
    var grid = document.getElementById('products-main-grid');
    if (!grid) return;

    // Read URL params
    var params = new URLSearchParams(window.location.search);
    var urlCat = params.get('category');
    var urlBrand = params.get('brand');
    if (urlCat) activeCategory = urlCat;
    if (urlBrand) activeBrand = urlBrand;

    // Set active chip from URL param
    if (urlCat || urlBrand) {
      document.querySelectorAll('.category-chip').forEach(function (chip) {
        chip.classList.remove('active');
        if (chip.dataset.cat === urlCat) chip.classList.add('active');
      });
    }

    fetchJSON(DATA_BASE + 'products.json', function (err, data) {
      if (err || !data) {
        grid.innerHTML = '<div class="products-empty"><div class="products-empty-icon">📦</div><p class="products-empty-desc">Could not load products. Please try again later.</p></div>';
        return;
      }
      allProducts = (data.products || []).filter(function (p) { return p.active !== false; });
      applyFiltersAndRender();
    });

    // Chip click
    document.querySelectorAll('.category-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('.category-chip').forEach(function (c) { c.classList.remove('active'); });
        this.classList.add('active');
        activeCategory = this.dataset.cat || 'all';
        activeBrand = null;
        currentPage = 1;
        applyFiltersAndRender();
        // Update URL without reload
        var url = new URL(window.location.href);
        if (activeCategory === 'all') url.searchParams.delete('category');
        else url.searchParams.set('category', activeCategory);
        window.history.replaceState({}, '', url.toString());
      });
    });

    // Search
    var searchEl = document.getElementById('products-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        searchTerm = this.value.toLowerCase().trim();
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Sort
    var sortEl = document.getElementById('products-sort');
    if (sortEl) {
      sortEl.addEventListener('change', function () {
        sortOrder = this.value;
        currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Load more
    var loadMoreBtn = document.getElementById('products-load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        currentPage++;
        applyFiltersAndRender(true);
      });
    }
  }

  function applyFiltersAndRender(append) {
    var grid = document.getElementById('products-main-grid');
    var countEl = document.getElementById('products-count');
    var loadMoreWrap = document.getElementById('products-loadmore-wrap');
    if (!grid) return;

    // Filter
    filteredProducts = allProducts.filter(function (p) {
      var matchCat = activeCategory === 'all' ||
        (activeCategory === 'new-arrivals' ? (p.tags || []).includes('new_arrival') : p.category === activeCategory);
      var matchBrand = !activeBrand || (p.brand || '').toLowerCase() === activeBrand.toLowerCase();
      var matchSearch = !searchTerm ||
        (p.name || '').toLowerCase().includes(searchTerm) ||
        (p.brand || '').toLowerCase().includes(searchTerm) ||
        (p.id || '').toLowerCase().includes(searchTerm) ||
        (p.category || '').toLowerCase().includes(searchTerm);
      return matchCat && matchBrand && matchSearch;
    });

    // Sort
    if (sortOrder === 'name-asc') filteredProducts.sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); });
    else if (sortOrder === 'name-desc') filteredProducts.sort(function (a, b) { return (b.name || '').localeCompare(a.name || ''); });
    else if (sortOrder === 'brand') filteredProducts.sort(function (a, b) { return (a.brand || '').localeCompare(b.brand || ''); });

    var total = filteredProducts.length;
    var pageProducts = filteredProducts.slice(0, currentPage * PAGE_SIZE);

    if (countEl) countEl.textContent = 'Showing ' + Math.min(pageProducts.length, total) + ' of ' + total + ' products';

    if (total === 0) {
      grid.innerHTML = '<div class="products-empty">' +
        '<div class="products-empty-icon">🔍</div>' +
        '<h3 class="products-empty-title">No Products Found</h3>' +
        '<p class="products-empty-desc">Try adjusting your search or filter, or contact us for the full range.</p>' +
        '<a href="https://wa.me/' + WA_NUMBER + '" class="btn-whatsapp" target="_blank" rel="noopener">Ask on WhatsApp &#8594;</a>' +
        '</div>';
      if (loadMoreWrap) loadMoreWrap.style.display = 'none';
      return;
    }

    if (append) {
      grid.insertAdjacentHTML('beforeend', pageProducts.slice((currentPage - 1) * PAGE_SIZE).map(buildProductCard).join(''));
    } else {
      grid.innerHTML = pageProducts.map(buildProductCard).join('');
    }

    if (loadMoreWrap) {
      loadMoreWrap.style.display = pageProducts.length < total ? 'block' : 'none';
    }
  }

  /* ── Reviews carousel nav ── */
  function initReviewsNav() {
    var carousel = document.getElementById('reviews-carousel');
    var prevBtn = document.getElementById('reviews-prev');
    var nextBtn = document.getElementById('reviews-next');
    if (!carousel) return;

    var SCROLL_AMOUNT = 372; // card width + gap
    if (prevBtn) prevBtn.addEventListener('click', function () { carousel.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' }); });
    if (nextBtn) nextBtn.addEventListener('click', function () { carousel.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' }); });
  }

  /* ── Contact enquiry form → WhatsApp ── */
  function initContactForm() {
    var form = document.getElementById('contact-enquiry-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('ct-name') || {}).value || '';
      var business = (document.getElementById('ct-business') || {}).value || '';
      var phone = (document.getElementById('ct-phone') || {}).value || '';
      var category = (document.getElementById('ct-category') || {}).value || '';
      var message = (document.getElementById('ct-message') || {}).value || '';

      if (!name.trim() || !phone.trim() || !message.trim()) {
        alert('Please fill in Name, Phone and Message fields.');
        return;
      }

      var text = 'Hello Neha Crockery House,\n\n' +
        'Name: ' + name + '\n' +
        (business ? 'Business: ' + business + '\n' : '') +
        'Phone: ' + phone + '\n' +
        (category ? 'Category: ' + category + '\n' : '') +
        '\nMessage:\n' + message;

      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank');
    });
  }

  /* ── Index enquiry form → WhatsApp ── */
  function initEnquiryForm() {
    var form = document.getElementById('homepage-enquiry-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('enq-name') || {}).value || '';
      var business = (document.getElementById('enq-business') || {}).value || '';
      var phone = (document.getElementById('enq-phone') || {}).value || '';
      var category = (document.getElementById('enq-category') || {}).value || '';
      var message = (document.getElementById('enq-message') || {}).value || '';

      if (!name.trim() || !phone.trim() || !message.trim()) {
        alert('Please fill in Name, Phone and Message.');
        return;
      }

      var text = 'Hello Neha Crockery House,\n\n' +
        'Name: ' + name + '\n' +
        (business ? 'Business: ' + business + '\n' : '') +
        'Phone: ' + phone + '\n' +
        (category ? 'Category: ' + category + '\n' : '') +
        '\nMessage:\n' + message;

      window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank');
    });
  }

  /* ── Escape HTML ── */
  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ── Init all ── */
  document.addEventListener('DOMContentLoaded', function () {
    initHomepageFeatured();
    initBrandsPage();
    initTarobaPage();
    initProductsPage();
    initReviewsNav();
    initContactForm();
    initEnquiryForm();
  });

})();

