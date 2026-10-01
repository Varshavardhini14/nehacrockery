/* =================================================================
   NEHA CROCKERY HOUSE — ADMIN DASHBOARD JAVASCRIPT
   Full CRUD for Products & Brands, JSON Export, CSV Import
   Data persisted in localStorage for session continuity
================================================================= */

(function () {
  'use strict';

  /* ─── CONSTANTS ─── */
  const WA_NUMBER = '918870413413';
  const DEFAULT_PASSWORD_KEY = 'nch_admin_password';
  const DEFAULT_PASSWORD = 'neha2024';
  const PRODUCTS_KEY = 'nch_products';
  const BRANDS_KEY = 'nch_brands';
  const DATA_BASE = '../../frontend/data/';

  /* ─── STATE ─── */
  let products = [];
  let brands = [];
  let editProductIndex = null;
  let editBrandIndex = null;
  let currentTab = 'products';
  let productSearchTerm = '';
  let productFilterCat = 'all';
  let productFilterStatus = 'all';

  /* ─── INIT ─── */
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    setupLogin();
    await loadData();
  }

  /* ─── LOGIN ─── */
  function setupLogin() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const pw = document.getElementById('admin-password').value;
      const storedPw = localStorage.getItem(DEFAULT_PASSWORD_KEY) || DEFAULT_PASSWORD;
      if (pw === storedPw) {
        document.getElementById('admin-login-overlay').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'flex';
        setupDashboard();
      } else {
        document.getElementById('admin-login-error').textContent = 'Incorrect password. Try again.';
        document.getElementById('admin-password').value = '';
      }
    });
  }

  /* ─── LOAD DATA ─── */
  async function loadData() {
    /* Try localStorage first, then fall back to JSON files */
    const localProducts = localStorage.getItem(PRODUCTS_KEY);
    const localBrands = localStorage.getItem(BRANDS_KEY);

    if (localProducts) {
      try { products = JSON.parse(localProducts).products || []; } catch { products = []; }
    } else {
      try {
        const res = await fetch(DATA_BASE + 'products.json');
        const data = await res.json();
        products = data.products || [];
        saveProducts();
      } catch { products = []; }
    }

    if (localBrands) {
      try { brands = JSON.parse(localBrands).brands || []; } catch { brands = []; }
    } else {
      try {
        const res = await fetch(DATA_BASE + 'brands.json');
        const data = await res.json();
        brands = data.brands || [];
        saveBrands();
      } catch { brands = []; }
    }
  }

  /* ─── SAVE TO LOCALSTORAGE ─── */
  function saveProducts() {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify({ products }));
  }
  function saveBrands() {
    localStorage.setItem(BRANDS_KEY, JSON.stringify({ brands }));
  }

  /* ─── SETUP DASHBOARD ─── */
  function setupDashboard() {
    setupTabs();
    renderProductsTable();
    renderBrandsTable();
    setupProductActions();
    setupBrandActions();
    setupExportImport();
    setupSettings();
    setupLogout();
    setupEnquiriesTab();
    setupApiUrlSetting();
  }

  /* ─── ENQUIRIES TAB (stub — ready for backend) ─── */
  function setupEnquiriesTab() {
    // Stub: when a backend is connected, replace this with an API fetch
    // e.g. fetch(apiUrl + '/enquiries').then(r => r.json()).then(renderEnquiries);
    // For now, the tab displays the static placeholder from the HTML
  }

  /* ─── API URL SETTING (stub) ─── */
  function setupApiUrlSetting() {
    const dashboard = document.getElementById('admin-dashboard');
    const input = document.getElementById('api-url-input');
    const btn = document.getElementById('btn-save-api-url');
    const msg = document.getElementById('api-url-msg');

    // Restore saved API URL
    const savedUrl = localStorage.getItem('nch_api_url') || '';
    if (input) input.value = savedUrl;
    if (dashboard && savedUrl) dashboard.setAttribute('data-api-url', savedUrl);

    if (btn) {
      btn.addEventListener('click', function () {
        const url = (input ? input.value.trim() : '');
        localStorage.setItem('nch_api_url', url);
        if (dashboard) dashboard.setAttribute('data-api-url', url);
        if (msg) { msg.textContent = url ? 'API URL saved.' : 'API URL cleared (using localStorage mode).'; }
        setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
      });
    }
  }

  /* ─── TABS ─── */
  function setupTabs() {
    document.querySelectorAll('.admin-nav-link').forEach(btn => {
      btn.addEventListener('click', function () {
        const tab = this.dataset.tab;
        switchTab(tab);
      });
    });
  }
  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.admin-nav-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    const navBtn = document.getElementById('admin-nav-' + tab);
    if (navBtn) navBtn.classList.add('active');
    const tabEl = document.getElementById('tab-' + tab);
    if (tabEl) tabEl.style.display = 'block';
  }

  /* ─── PRODUCTS TABLE ─── */
  function renderProductsTable() {
    const filtered = getFilteredProducts();
    const countEl = document.getElementById('admin-product-count');
    if (countEl) countEl.textContent = `${filtered.length} of ${products.length} products`;

    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-table-loading">No products found</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (p, i) {
      const realIndex = products.indexOf(p);
      const tags = (p.tags || []).map(t => `<span class="admin-badge admin-badge--tag">${t}</span>`).join('');
      const statusBadge = p.active
        ? '<span class="admin-badge admin-badge--active">Active</span>'
        : '<span class="admin-badge admin-badge--inactive">Inactive</span>';
      return `<tr>
        <td><code style="font-size:11px;">${escHtml(p.id || '')}</code></td>
        <td><strong>${escHtml(p.name || '')}</strong></td>
        <td>${escHtml(p.brand || '—')}</td>
        <td>${formatCategory(p.category)}</td>
        <td>${tags || '—'}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="admin-action-btn admin-action-btn--edit" onclick="editProduct(${realIndex})">Edit</button>
          <button class="admin-action-btn admin-action-btn--toggle" onclick="toggleProductActive(${realIndex})">${p.active ? 'Deactivate' : 'Activate'}</button>
          <button class="admin-action-btn admin-action-btn--delete" onclick="deleteProduct(${realIndex})">Delete</button>
        </td>
      </tr>`;
    }).join('');
  }

  function getFilteredProducts() {
    return products.filter(p => {
      const matchSearch = !productSearchTerm ||
        (p.name || '').toLowerCase().includes(productSearchTerm) ||
        (p.id || '').toLowerCase().includes(productSearchTerm) ||
        (p.brand || '').toLowerCase().includes(productSearchTerm);
      const matchCat = productFilterCat === 'all' || p.category === productFilterCat;
      const matchStatus = productFilterStatus === 'all' ||
        (productFilterStatus === 'active' && p.active) ||
        (productFilterStatus === 'inactive' && !p.active);
      return matchSearch && matchCat && matchStatus;
    });
  }

  /* ─── PRODUCT ACTIONS ─── */
  function setupProductActions() {
    /* Search */
    const searchInput = document.getElementById('admin-product-search');
    if (searchInput) searchInput.addEventListener('input', function () {
      productSearchTerm = this.value.toLowerCase();
      renderProductsTable();
    });
    /* Category filter */
    const catFilter = document.getElementById('admin-product-filter-cat');
    if (catFilter) catFilter.addEventListener('change', function () {
      productFilterCat = this.value;
      renderProductsTable();
    });
    /* Status filter */
    const statusFilter = document.getElementById('admin-product-filter-status');
    if (statusFilter) statusFilter.addEventListener('change', function () {
      productFilterStatus = this.value;
      renderProductsTable();
    });
    /* Add button */
    const addBtn = document.getElementById('btn-add-product');
    if (addBtn) addBtn.addEventListener('click', () => openProductModal());
    /* Modal close */
    document.getElementById('product-modal-close')?.addEventListener('click', closeProductModal);
    document.getElementById('product-cancel-btn')?.addEventListener('click', closeProductModal);
    document.getElementById('product-save-btn')?.addEventListener('click', saveProduct);
    /* Overlay close */
    document.getElementById('product-modal-overlay')?.addEventListener('click', function (e) {
      if (e.target === this) closeProductModal();
    });
  }

  function openProductModal(index) {
    editProductIndex = (index !== undefined) ? index : null;
    const modal = document.getElementById('product-modal-overlay');
    const title = document.getElementById('product-modal-title');
    title.textContent = editProductIndex !== null ? 'Edit Product' : 'Add Product';

    /* Reset form */
    document.getElementById('product-form').reset();
    document.getElementById('product-form-error').textContent = '';

    if (editProductIndex !== null) {
      const p = products[editProductIndex];
      document.getElementById('pf-id').value = p.id || '';
      document.getElementById('pf-name').value = p.name || '';
      document.getElementById('pf-brand').value = p.brand || '';
      document.getElementById('pf-category').value = p.category || '';
      document.getElementById('pf-material').value = p.material || '';
      document.getElementById('pf-capacity').value = p.capacity || '';
      document.getElementById('pf-set-contents').value = p.set_contents || '';
      document.getElementById('pf-packaging').value = p.packaging || '';
      document.getElementById('pf-features').value = (p.features || []).join(', ');
      document.getElementById('pf-images').value = (p.images || []).join(', ');
      document.getElementById('pf-mrp').value = p.mrp || '';
      document.getElementById('pf-featured').checked = (p.tags || []).includes('featured');
      document.getElementById('pf-new-arrival').checked = (p.tags || []).includes('new_arrival');
      document.getElementById('pf-active').checked = p.active !== false;
    }
    modal.style.display = 'flex';
  }

  function closeProductModal() {
    document.getElementById('product-modal-overlay').style.display = 'none';
    editProductIndex = null;
  }

  function saveProduct() {
    const idVal = document.getElementById('pf-id').value.trim();
    const nameVal = document.getElementById('pf-name').value.trim();
    const catVal = document.getElementById('pf-category').value;
    const errEl = document.getElementById('product-form-error');

    if (!idVal || !nameVal || !catVal) {
      errEl.textContent = 'Product ID, Name and Category are required.';
      return;
    }
    errEl.textContent = '';

    const tags = [];
    if (document.getElementById('pf-featured').checked) tags.push('featured');
    if (document.getElementById('pf-new-arrival').checked) tags.push('new_arrival');

    const product = {
      id: idVal,
      name: nameVal,
      brand: document.getElementById('pf-brand').value.trim(),
      category: catVal,
      tags,
      material: document.getElementById('pf-material').value.trim(),
      capacity: document.getElementById('pf-capacity').value.trim(),
      set_contents: document.getElementById('pf-set-contents').value.trim(),
      packaging: document.getElementById('pf-packaging').value.trim(),
      features: document.getElementById('pf-features').value.split(',').map(s => s.trim()).filter(Boolean),
      images: document.getElementById('pf-images').value.split(',').map(s => s.trim()).filter(Boolean),
      mrp: document.getElementById('pf-mrp').value ? parseFloat(document.getElementById('pf-mrp').value) : null,
      whatsapp_enquiry: true,
      active: document.getElementById('pf-active').checked
    };

    if (editProductIndex !== null) {
      products[editProductIndex] = product;
      showToast('Product updated successfully', 'success');
    } else {
      products.unshift(product);
      showToast('Product added successfully', 'success');
    }

    saveProducts();
    renderProductsTable();
    closeProductModal();
  }

  /* These need to be global for inline onclick */
  window.editProduct = function (index) { openProductModal(index); };
  window.deleteProduct = function (index) {
    if (confirm(`Delete product "${products[index].name}"? This cannot be undone.`)) {
      products.splice(index, 1);
      saveProducts();
      renderProductsTable();
      showToast('Product deleted', 'error');
    }
  };
  window.toggleProductActive = function (index) {
    products[index].active = !products[index].active;
    saveProducts();
    renderProductsTable();
    showToast(products[index].active ? 'Product activated' : 'Product deactivated', 'success');
  };

  /* ─── BRANDS TABLE ─── */
  function renderBrandsTable() {
    const countEl = document.getElementById('admin-brand-count');
    if (countEl) countEl.textContent = `${brands.length} brands`;
    const tbody = document.getElementById('admin-brands-tbody');
    if (!tbody) return;

    if (brands.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-table-loading">No brands yet. Add your first brand.</td></tr>';
      return;
    }

    tbody.innerHTML = brands.map(function (b, i) {
      const ownTag = b.own_brand ? '<span class="admin-badge admin-badge--own">Own Brand</span>' : '—';
      const statusBadge = b.active
        ? '<span class="admin-badge admin-badge--active">Active</span>'
        : '<span class="admin-badge admin-badge--inactive">Inactive</span>';
      return `<tr>
        <td><code style="font-size:11px;">${escHtml(b.id || '')}</code></td>
        <td><strong>${escHtml(b.name || '')}</strong><br/><span style="color:#6b7280;font-size:12px;">${escHtml(b.tagline || '')}</span></td>
        <td>${ownTag}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="admin-action-btn admin-action-btn--edit" onclick="editBrand(${i})">Edit</button>
          <button class="admin-action-btn admin-action-btn--toggle" onclick="toggleBrandActive(${i})">${b.active ? 'Deactivate' : 'Activate'}</button>
          <button class="admin-action-btn admin-action-btn--delete" onclick="deleteBrand(${i})">Delete</button>
        </td>
      </tr>`;
    }).join('');
  }

  function setupBrandActions() {
    document.getElementById('btn-add-brand')?.addEventListener('click', () => openBrandModal());
    document.getElementById('brand-modal-close')?.addEventListener('click', closeBrandModal);
    document.getElementById('brand-cancel-btn')?.addEventListener('click', closeBrandModal);
    document.getElementById('brand-save-btn')?.addEventListener('click', saveBrand);
    document.getElementById('brand-modal-overlay')?.addEventListener('click', function (e) {
      if (e.target === this) closeBrandModal();
    });
  }

  function openBrandModal(index) {
    editBrandIndex = (index !== undefined) ? index : null;
    document.getElementById('brand-modal-title').textContent = editBrandIndex !== null ? 'Edit Brand' : 'Add Brand';
    document.getElementById('brand-form').reset();
    document.getElementById('brand-form-error').textContent = '';

    if (editBrandIndex !== null) {
      const b = brands[editBrandIndex];
      document.getElementById('bf-id').value = b.id || '';
      document.getElementById('bf-name').value = b.name || '';
      document.getElementById('bf-tagline').value = b.tagline || '';
      document.getElementById('bf-desc').value = b.description || '';
      document.getElementById('bf-logo').value = b.logo || '';
      document.getElementById('bf-own-brand').checked = b.own_brand || false;
      document.getElementById('bf-active').checked = b.active !== false;
    }
    document.getElementById('brand-modal-overlay').style.display = 'flex';
  }

  function closeBrandModal() {
    document.getElementById('brand-modal-overlay').style.display = 'none';
    editBrandIndex = null;
  }

  function saveBrand() {
    const idVal = document.getElementById('bf-id').value.trim();
    const nameVal = document.getElementById('bf-name').value.trim();
    const errEl = document.getElementById('brand-form-error');

    if (!idVal || !nameVal) { errEl.textContent = 'Brand ID and Name are required.'; return; }
    errEl.textContent = '';

    const brand = {
      id: idVal,
      name: nameVal,
      tagline: document.getElementById('bf-tagline').value.trim(),
      description: document.getElementById('bf-desc').value.trim(),
      logo: document.getElementById('bf-logo').value.trim(),
      own_brand: document.getElementById('bf-own-brand').checked,
      active: document.getElementById('bf-active').checked
    };

    if (editBrandIndex !== null) {
      brands[editBrandIndex] = brand;
      showToast('Brand updated', 'success');
    } else {
      brands.push(brand);
      showToast('Brand added', 'success');
    }

    saveBrands();
    renderBrandsTable();
    closeBrandModal();
  }

  window.editBrand = function (i) { openBrandModal(i); };
  window.deleteBrand = function (i) {
    if (confirm(`Delete brand "${brands[i].name}"?`)) {
      brands.splice(i, 1);
      saveBrands();
      renderBrandsTable();
      showToast('Brand deleted', 'error');
    }
  };
  window.toggleBrandActive = function (i) {
    brands[i].active = !brands[i].active;
    saveBrands();
    renderBrandsTable();
    showToast(brands[i].active ? 'Brand activated' : 'Brand deactivated', 'success');
  };

  /* ─── EXPORT / IMPORT ─── */
  function setupExportImport() {
    document.getElementById('btn-export-products')?.addEventListener('click', function () {
      downloadJSON({ products }, 'products.json');
      showToast('products.json downloaded', 'success');
    });
    document.getElementById('btn-export-brands')?.addEventListener('click', function () {
      downloadJSON({ brands }, 'brands.json');
      showToast('brands.json downloaded', 'success');
    });
    document.getElementById('btn-import-csv')?.addEventListener('click', importCSV);
  }

  function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  function importCSV() {
    const fileInput = document.getElementById('csv-import-input');
    const file = fileInput.files[0];
    if (!file) { alert('Please select a CSV file first.'); return; }

    const reader = new FileReader();
    reader.onload = function (e) {
      const rows = e.target.result.split('\n').filter(r => r.trim());
      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const preview = document.getElementById('csv-import-preview');
      let parsedCount = 0;
      let importedProducts = [];

      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
        importedProducts.push({
          id: obj.id || 'IMP-' + (i),
          name: obj.name || 'Imported Product',
          brand: obj.brand || '',
          category: obj.category || 'crockery',
          tags: obj.tags ? obj.tags.split(';') : [],
          material: obj.material || '',
          capacity: obj.capacity || '',
          images: [],
          features: [],
          mrp: null,
          active: obj.active !== 'false'
        });
        parsedCount++;
      }

      preview.style.display = 'block';
      preview.innerHTML = `<strong>Parsed ${parsedCount} products from CSV.</strong><br/><br/>` +
        importedProducts.slice(0, 5).map(p => `${p.id}: ${p.name} (${p.category})`).join('<br/>') +
        (parsedCount > 5 ? `<br/>... and ${parsedCount - 5} more` : '') +
        `<br/><br/><button class="admin-btn admin-btn-primary" id="confirm-import-btn" style="margin-top:8px;">Add ${parsedCount} Products to List</button>`;

      document.getElementById('confirm-import-btn')?.addEventListener('click', function () {
        products = [...importedProducts, ...products];
        saveProducts();
        renderProductsTable();
        preview.style.display = 'none';
        fileInput.value = '';
        showToast(`${parsedCount} products imported`, 'success');
        switchTab('products');
      });
    };
    reader.readAsText(file);
  }

  /* ─── SETTINGS ─── */
  function setupSettings() {
    document.getElementById('change-password-form')?.addEventListener('submit', function (e) {
      e.preventDefault();
      const current = document.getElementById('current-password').value;
      const newPw = document.getElementById('new-password').value;
      const confirm = document.getElementById('confirm-password').value;
      const stored = localStorage.getItem(DEFAULT_PASSWORD_KEY) || DEFAULT_PASSWORD;
      const msg = document.getElementById('password-msg');

      if (current !== stored) { msg.style.color = 'red'; msg.textContent = 'Current password is incorrect.'; return; }
      if (newPw.length < 6) { msg.style.color = 'red'; msg.textContent = 'New password must be at least 6 characters.'; return; }
      if (newPw !== confirm) { msg.style.color = 'red'; msg.textContent = 'Passwords do not match.'; return; }

      localStorage.setItem(DEFAULT_PASSWORD_KEY, newPw);
      msg.style.color = 'green';
      msg.textContent = 'Password updated successfully.';
      this.reset();
    });

    document.getElementById('btn-reset-data')?.addEventListener('click', function () {
      if (confirm('This will clear all unsaved changes and reload data from the original JSON files. Continue?')) {
        localStorage.removeItem(PRODUCTS_KEY);
        localStorage.removeItem(BRANDS_KEY);
        location.reload();
      }
    });
  }

  /* ─── LOGOUT ─── */
  function setupLogout() {
    document.getElementById('admin-logout-btn')?.addEventListener('click', function () {
      document.getElementById('admin-dashboard').style.display = 'none';
      document.getElementById('admin-login-overlay').style.display = 'flex';
      document.getElementById('admin-password').value = '';
      document.getElementById('admin-login-error').textContent = '';
    });
  }

  /* ─── UTILITIES ─── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatCategory(cat) {
    const map = {
      crockery: 'Crockery', cutlery: 'Cutlery', glassware: 'Glassware',
      melamineware: 'Melamineware', acrylicware: 'Acrylicware',
      kitchenware: 'Kitchenware', hotelware: 'Hotelware',
      'wooden-handicrafts': 'Wooden'
    };
    return map[cat] || cat;
  }

  function showToast(msg, type) {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'admin-toast show ' + (type || '');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'admin-toast'; }, 3000);
  }

})();
