import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../api/axiosClient';
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from '../../components/common/Modal';

export const CounterPage = () => {
  const { selectedBranch } = useAuth();
  const { fetchUnreadCount } = useNotifications();

  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Completed order modal receipt state
  const [lastOrder, setLastOrder] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const branchId = selectedBranch ? selectedBranch._id || selectedBranch : null;

  const loadCatalog = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const [catRes, menuRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu/pos-catalog', { branchId }),
      ]);

      if (catRes.success) setCategories(catRes.data);
      if (menuRes.success) setCatalog(menuRes.data);
    } catch (err) {
      setError('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadCatalog();
    setCart([]);
  }, [loadCatalog, branchId]);

  const addToCart = (item) => {
    if (!item.canSell) return;

    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        if (existing.quantity >= item.currentStock) return prev;
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item._id === itemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.currentStock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i._id !== itemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = 0; // Configured tax
  const total = subtotal + tax;

  const handleCharge = async () => {
    if (cart.length === 0 || !branchId) return;

    try {
      setSubmitting(true);
      setError('');

      const orderPayload = {
        branchId,
        paymentMethod,
        items: cart.map((i) => ({ menuItemId: i._id, quantity: i.quantity })),
      };

      const res = await api.post('/orders', orderPayload);
      if (res.success) {
        setLastOrder(res.data);
        setShowReceiptModal(true);
        setCart([]);
        await loadCatalog(); // Refresh live stock
        fetchUnreadCount();
      }
    } catch (err) {
      setError(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = catalog.filter((item) => {
    const matchesCat =
      selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="counter-layout">
      {/* Left Menu Items Pane */}
      <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div className="search-box" style={{ flex: 1, marginBottom: 0 }}>
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search dishes, drinks, add-ons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="category-tabs">
          <button
            className={`chip ${selectedCategory === 'All' ? 'chip-active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              className={`chip ${selectedCategory === cat.name ? 'chip-active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Cards Grid */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#8a8578' }}>
            Loading menu catalog...
          </div>
        ) : (
          <div className="menu-grid">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`menu-card ${!item.canSell ? 'menu-card-disabled' : ''}`}
                onClick={() => addToCart(item)}
              >
                <div className="menu-card-thumb">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    '🍳'
                  )}
                </div>
                <div className="menu-card-name">{item.name}</div>
                <div className="menu-card-price">₱{item.price.toFixed(2)}</div>
                <div className="menu-card-stock">
                  {item.currentStock <= 0 ? (
                    <span style={{ color: '#cf1f21', fontWeight: 700 }}>Out of stock</span>
                  ) : (
                    <span>{item.currentStock} in stock</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Cart Pane */}
      <div className="order-pane">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} /> Current Order
          </h2>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              style={{ background: 'none', border: 'none', color: '#cf1f21', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear Cart
            </button>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="cart-list">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8a8578', padding: '40px 0' }}>
              Cart is empty. Tap menu items to add.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="cart-item">
                <div className="cart-item-name">
                  {item.name}
                  <div style={{ fontSize: '11px', color: '#8a8578' }}>
                    ₱{item.price.toFixed(2)} each
                  </div>
                </div>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => updateQuantity(item._id, -1)}>
                    <Minus size={12} />
                  </button>
                  <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button className="qty-btn" onClick={() => updateQuantity(item._id, 1)}>
                    <Plus size={12} />
                  </button>
                </div>
                <div style={{ fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                  ₱{(item.price * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => removeFromCart(item._id)}
                  style={{ background: 'none', border: 'none', color: '#cf1f21', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div style={{ borderTop: '1px solid #e6e3d8', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8a8578' }}>
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, marginTop: '6px' }}>
            <span>Total</span>
            <span style={{ color: '#cf1f21' }}>₱{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ borderTop: '1px solid #e6e3d8', paddingTop: '12px' }}>
          <label className="field-label" style={{ marginTop: 0 }}>Payment Method</label>
          <div className="payment-buttons">
            {['cash', 'gcash', 'card'].map((method) => (
              <button
                key={method}
                className={`pay-btn ${paymentMethod === method ? 'pay-btn-active' : ''}`}
                onClick={() => setPaymentMethod(method)}
              >
                {method.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ padding: '14px', marginTop: '10px', fontSize: '15px' }}
          disabled={cart.length === 0 || submitting}
          onClick={handleCharge}
        >
          {submitting ? 'Processing Charge...' : `Charge ₱${total.toFixed(2)}`}
        </button>
      </div>

      {/* Successful Order Receipt Modal */}
      {showReceiptModal && lastOrder && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          title="Order Completed!"
        >
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <CheckCircle2 size={48} color="#1f9d5c" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontWeight: 700, fontSize: '16px' }}>{lastOrder.orderNumber}</div>
            <div style={{ fontSize: '13px', color: '#8a8578' }}>
              Payment ({lastOrder.paymentMethod.toUpperCase()}): ₱{lastOrder.total.toFixed(2)}
            </div>
          </div>

          <div className="receipt" style={{ width: '100%', boxShadow: 'none', padding: '12px' }}>
            <div className="receipt-header">
              <h1>WALANDYO TAPSILOGAN</h1>
              <p>{lastOrder.branch?.name}</p>
            </div>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lastOrder.items.map((i, idx) => (
                  <tr key={idx}>
                    <td>{i.itemName}</td>
                    <td style={{ textAlign: 'center' }}>{i.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₱{i.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="receipt-grand-total">
              <span>Total Paid:</span>
              <span>₱{lastOrder.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
            >
              Print Receipt
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowReceiptModal(false)}
            >
              Done & Next Order
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CounterPage;
