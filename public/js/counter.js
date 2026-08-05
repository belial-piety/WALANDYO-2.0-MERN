(function () {
  const menuGrid = document.getElementById('menuGrid');
  const searchInput = document.getElementById('menuSearch');
  const categoryTabs = document.getElementById('categoryTabs');
  const cartList = document.getElementById('cartList');
  const cartCount = document.getElementById('cartCount');
  const subtotalDisplay = document.getElementById('subtotalDisplay');
  const taxDisplay = document.getElementById('taxDisplay');
  const totalDisplay = document.getElementById('totalDisplay');
  const chargeBtn = document.getElementById('chargeBtn');
  const branchIdInput = document.getElementById('branchId');

  if (!menuGrid) return; // not on the counter page

  const taxRate = Number(document.getElementById('taxRateData')?.textContent || 0);
  const cards = Array.from(menuGrid.querySelectorAll('.menu-card'));
  let cart = {}; // id -> { id, name, price, qty, maxStock }
  let activeCategory = 'all';
  let selectedPaymentMethod = 'cash';

  const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ---------------- Category tabs (built from the cards actually on the page) ----------------
  function buildCategoryTabs() {
    const categories = [...new Set(cards.map((c) => c.dataset.category).filter(Boolean))];
    categories.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.category = cat;
      btn.textContent = cat;
      categoryTabs.appendChild(btn);
    });
  }
  buildCategoryTabs();

  categoryTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    activeCategory = btn.dataset.category;
    categoryTabs.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip-active'));
    btn.classList.add('chip-active');
    applyFilters();
  });

  searchInput.addEventListener('input', applyFilters);

  function applyFilters() {
    const q = searchInput.value.trim().toLowerCase();
    cards.forEach((card) => {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const matchesSearch = !q || card.dataset.name.toLowerCase().includes(q);
      card.style.display = matchesCategory && matchesSearch ? '' : 'none';
    });
  }

  // ---------------- Cart ----------------
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (card.disabled) return;
      addToCart(card);
    });
  });

  function addToCart(card) {
    const id = card.dataset.id;
    const maxStock = Number(card.dataset.stock);
    const existing = cart[id];
    const currentQty = existing ? existing.qty : 0;

    if (currentQty + 1 > maxStock) {
      alert('Not enough stock for another ' + card.dataset.name + '.');
      return;
    }

    if (existing) {
      existing.qty += 1;
    } else {
      cart[id] = {
        id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        qty: 1,
        maxStock,
      };
    }
    renderCart();
  }

  function changeQty(id, delta) {
    const item = cart[id];
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      delete cart[id];
    } else if (newQty > item.maxStock) {
      alert('Not enough stock for another ' + item.name + '.');
      return;
    } else {
      item.qty = newQty;
    }
    renderCart();
  }

  function removeItem(id) {
    delete cart[id];
    renderCart();
  }

  function renderCart() {
    const items = Object.values(cart);
    cartList.innerHTML = '';

    if (items.length === 0) {
      cartList.innerHTML = '<div class="empty-state small" id="cartEmpty"><div class="empty-icon">🛍️</div><div>Cart is empty</div></div>';
    } else {
      items.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div class="cart-item-name">${item.name}<div class="cart-item-price">${peso(item.price)} each</div></div>
          <div class="qty-controls">
            <button type="button" class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
            <span>${item.qty}</span>
            <button type="button" class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          </div>
          <div>${peso(item.price * item.qty)}</div>
          <button type="button" class="cart-remove" data-action="remove" data-id="${item.id}">✕</button>
        `;
        cartList.appendChild(row);
      });
    }

    const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    const totalItemCount = items.reduce((sum, it) => sum + it.qty, 0);

    subtotalDisplay.textContent = peso(subtotal);
    taxDisplay.textContent = peso(tax);
    totalDisplay.textContent = peso(total);
    cartCount.textContent = `${totalItemCount} item${totalItemCount === 1 ? '' : 's'}`;
    chargeBtn.textContent = `Charge ${peso(total)}`;
    chargeBtn.disabled = items.length === 0;
  }

  cartList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'inc') changeQty(id, 1);
    if (action === 'dec') changeQty(id, -1);
    if (action === 'remove') removeItem(id);
  });

  // ---------------- Payment method ----------------
  document.querySelectorAll('.pay-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pay-btn').forEach((b) => b.classList.remove('pay-btn-active'));
      btn.classList.add('pay-btn-active');
      selectedPaymentMethod = btn.dataset.method;
    });
  });

  // ---------------- Charge ----------------
  chargeBtn.addEventListener('click', async () => {
    const items = Object.values(cart).map((it) => ({
      menu_item_id: Number(it.id),
      name: it.name,
      price: it.price,
      quantity: it.qty,
    }));
    if (items.length === 0) return;

    chargeBtn.disabled = true;
    chargeBtn.textContent = 'Processing...';

    try {
      const res = await fetch('/counter/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: branchIdInput.value,
          payment_method: selectedPaymentMethod,
          items: JSON.stringify(items),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Could not complete this order.');
        renderCart();
        return;
      }

      window.open(data.receiptUrl, '_blank');
      cart = {};
      renderCart();
      // Refresh so stock counts shown on the menu cards reflect the sale.
      setTimeout(() => location.reload(), 400);
    } catch (err) {
      alert('Network error — could not reach the server.');
      renderCart();
    }
  });

  renderCart();
})();
