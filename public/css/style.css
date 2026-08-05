/* ===========================================================
   Walandyo Tapsilogan POS — theme
   Palette sampled directly from the client's Figma mockups:
   warm cream surface, red primary accent, soft rounded cards.
   =========================================================== */

:root {
  --bg: #f4f5ef;
  --surface: #ffffff;
  --border: #e6e3d8;
  --text: #2a2621;
  --text-muted: #8a8578;
  --red: #cf1f21;
  --red-dark: #a91819;
  --red-tint: #fdecec;
  --amber: #d9a400;
  --amber-tint: #fdf3d6;
  --green: #1f9d5c;
  --green-tint: #e6f7ee;
  --blue: #2f6fed;
  --sidebar-active: #f1ede2;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 1px 2px rgba(30, 25, 15, 0.04), 0 4px 16px rgba(30, 25, 15, 0.06);
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; }
input, select { font-family: inherit; }
h1, h2, h3 { margin: 0; }

/* ---------------- App shell ---------------- */
.app-shell {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 24px;
}

.brand-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--red);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.brand-badge.large { width: 56px; height: 56px; font-size: 24px; margin: 0 auto 12px; }

.brand-name { font-weight: 700; font-size: 15px; line-height: 1.2; }
.brand-sub { font-size: 10px; letter-spacing: 0.08em; color: var(--text-muted); font-weight: 600; }

.nav { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.nav-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  padding: 8px 12px 6px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  position: relative;
}
.nav-link:hover { background: var(--bg); }
.nav-link.active { background: var(--sidebar-active); font-weight: 700; color: var(--red-dark); }
.nav-icon { font-size: 15px; width: 18px; text-align: center; }
.nav-badge {
  margin-left: auto;
  background: var(--red);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}

.sidebar-footer { padding-top: 12px; }
.user-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--amber-tint); color: var(--amber);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; flex-shrink: 0;
  text-transform: uppercase;
}
.user-name { font-size: 13px; font-weight: 600; }
.user-role { font-size: 11px; color: var(--text-muted); }
.logout-btn {
  width: 100%; padding: 8px; background: none; border: 1px solid var(--border);
  border-radius: var(--radius-sm); font-size: 13px; color: var(--text-muted); font-weight: 600;
}
.logout-btn:hover { background: var(--bg); color: var(--text); }

.main-col { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.topbar {
  display: flex;
  align-items: center;
  padding: 14px 28px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.sidebar-toggle { background: none; border: none; font-size: 16px; color: var(--text-muted); }
.topbar-spacer { flex: 1; }
.system-status { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); font-weight: 500; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); display: inline-block; }

.page { padding: 28px; flex: 1; }

/* ---------------- Page header / cards ---------------- */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.page-header h1 { font-size: 24px; font-weight: 700; }
.page-sub { margin: 4px 0 0; color: var(--text-muted); font-size: 14px; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  margin-bottom: 20px;
}
.card-title { font-weight: 700; font-size: 15px; margin-bottom: 12px; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-sub { margin: 2px 0 0; font-size: 13px; color: var(--text-muted); }

/* ---------------- Buttons ---------------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 600;
  transition: opacity 0.15s ease;
}
.btn:hover { opacity: 0.9; }
.btn-primary { background: var(--red); color: #fff; }
.btn-secondary, .btn-ghost { background: var(--surface); color: var(--text); border-color: var(--border); }
.btn-secondary:hover, .btn-ghost:hover { background: var(--bg); }
.btn-danger { background: #fff; color: var(--red); border-color: var(--red); }
.btn-block { width: 100%; }
.btn-charge {
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--red);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
}
.btn-charge:disabled { background: #f0b3b1; cursor: not-allowed; }

.link-btn { background: none; border: none; color: var(--blue); font-size: 13px; font-weight: 600; padding: 4px 6px; }
.link-btn-danger { color: var(--red); }
.inline-form { display: inline; }

/* ---------------- Forms ---------------- */
.field-label { display: block; font-size: 13px; font-weight: 600; margin: 12px 0 6px; }
.field-hint { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
.field-input, .field-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  background: var(--surface);
  color: var(--text);
}
.field-input:focus, .field-select:focus { outline: none; border-color: var(--red); }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.toggle-row { display: flex; align-items: center; gap: 10px; margin: 16px 0 4px; font-size: 14px; cursor: pointer; }
.toggle-track {
  width: 38px; height: 22px; border-radius: 999px; background: var(--border);
  position: relative; transition: background 0.15s ease; flex-shrink: 0;
}
.toggle-track::after {
  content: ""; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
  border-radius: 50%; background: #fff; transition: transform 0.15s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.toggle-row input { display: none; }
.toggle-row input:checked + .toggle-track { background: var(--red); }
.toggle-row input:checked + .toggle-track::after { transform: translateX(16px); }

.alert { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 16px; }
.alert-error { background: var(--red-tint); color: var(--red-dark); border: 1px solid #f3c6c6; }

/* ---------------- Tables ---------------- */
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th {
  text-align: left; font-size: 12px; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.03em; padding: 10px 12px; border-bottom: 1px solid var(--border);
}
.data-table td { padding: 12px; border-bottom: 1px solid var(--border); }
.data-table tbody tr:last-child td { border-bottom: none; }
.text-right { text-align: right; }
.empty-cell { text-align: center; color: var(--text-muted); padding: 32px 12px; }
.totals-foot td { border-top: 2px solid var(--border); border-bottom: none; padding-top: 14px; }

/* ---------------- Badges ---------------- */
.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
.badge-green { background: var(--green-tint); color: var(--green); }
.badge-amber { background: var(--amber-tint); color: var(--amber); }
.badge-red { background: var(--red-tint); color: var(--red); }
.badge-gray { background: #eeece4; color: var(--text-muted); }

/* ---------------- Empty states ---------------- */
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
.empty-state.small { padding: 40px 12px; }
.empty-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.6; }

/* ---------------- Thumbnails ---------------- */
.thumb-sm {
  width: 40px; height: 40px; border-radius: var(--radius-sm); background: var(--bg);
  display: flex; align-items: center; justify-content: center; overflow: hidden; font-size: 18px;
}
.thumb-sm img { width: 100%; height: 100%; object-fit: cover; }

/* ---------------- Modals (data-open-modal pattern) ---------------- */
.modal { position: fixed; inset: 0; z-index: 50; display: none; align-items: center; justify-content: center; }
.modal.modal-visible { display: flex; }
.modal-backdrop { position: absolute; inset: 0; background: rgba(20, 16, 10, 0.5); }
.modal-box {
  position: relative; background: var(--surface); border-radius: var(--radius);
  padding: 24px; width: 440px; max-width: 92vw; max-height: 88vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
}
.modal-box.modal-sm { width: 360px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.modal-header h2 { font-size: 17px; }
.modal-close { background: none; border: none; font-size: 18px; color: var(--text-muted); }
.modal-note { font-size: 13px; color: var(--text-muted); margin: 2px 0 12px; }
.modal-divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

/* Counter view uses a simpler always-relevant overlay (kept separate on purpose) */
.modal-overlay { display: none; }

/* ---------------- Counter / POS ---------------- */
.counter-layout { display: grid; grid-template-columns: 1fr 360px; gap: 20px; align-items: start; }

.menu-pane-header { margin-bottom: 16px; }
.search-box {
  display: flex; align-items: center; gap: 8px; background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 12px;
}
.search-box input { border: none; outline: none; flex: 1; font-size: 14px; background: none; }
.search-icon { color: var(--text-muted); }

.category-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border);
  background: var(--surface); font-size: 13px; font-weight: 600; color: var(--text);
}
.chip-active { background: var(--red); color: #fff; border-color: var(--red); }

.menu-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 14px;
  min-height: 200px; align-content: start;
}
.menu-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 14px; text-align: left; display: flex; flex-direction: column; gap: 4px; box-shadow: var(--shadow);
}
.menu-card:hover { border-color: var(--red); }
.menu-card-disabled { opacity: 0.45; cursor: not-allowed; }
.menu-card-thumb {
  width: 100%; aspect-ratio: 1.4; border-radius: var(--radius-sm); background: var(--bg);
  display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 6px; overflow: hidden;
}
.menu-card-thumb img { width: 100%; height: 100%; object-fit: cover; }
.menu-card-name { font-weight: 600; font-size: 14px; }
.menu-card-price { color: var(--red-dark); font-weight: 700; font-size: 14px; }
.menu-card-stock { font-size: 11px; color: var(--text-muted); }

.order-pane {
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 18px; display: flex; flex-direction: column; gap: 12px;
  position: sticky; top: 20px;
}
.order-pane-header { display: flex; align-items: center; justify-content: space-between; font-weight: 700; font-size: 15px; }
.order-icon { margin-right: 6px; }
.branch-select-row .static-branch { font-size: 13px; font-weight: 600; color: var(--text-muted); padding: 4px 2px; }

.cart-list { min-height: 120px; max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.cart-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.cart-item-name { flex: 1; font-weight: 600; }
.cart-item-price { color: var(--text-muted); font-size: 12px; }
.qty-controls { display: flex; align-items: center; gap: 6px; }
.qty-btn {
  width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface);
  font-size: 13px; line-height: 1; display: flex; align-items: center; justify-content: center;
}
.cart-remove { background: none; border: none; color: var(--red); font-size: 12px; }

.order-totals { border-top: 1px solid var(--border); padding-top: 12px; display: flex; flex-direction: column; gap: 4px; }
.totals-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); }
.totals-total { font-size: 16px; font-weight: 700; color: var(--text); padding-top: 4px; }

.payment-methods { border-top: 1px solid var(--border); padding-top: 12px; }
.payment-buttons { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 6px; }
.pay-btn {
  padding: 10px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border);
  background: var(--surface); font-size: 12px; font-weight: 600;
}
.pay-btn-active { border-color: var(--red); background: var(--red-tint); color: var(--red-dark); }

/* ---------------- Reports ---------------- */
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
.stat-card {
  background: var(--surface); border-radius: var(--radius); padding: 16px; display: flex; align-items: center;
  gap: 12px; border-left: 3px solid var(--border); box-shadow: var(--shadow);
}
.stat-red { border-left-color: var(--red); }
.stat-amber { border-left-color: var(--amber); }
.stat-blue { border-left-color: var(--blue); }
.stat-icon { font-size: 20px; }
.stat-label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.stat-value { font-size: 18px; font-weight: 700; }

.tabs { display: flex; gap: 6px; margin-bottom: 14px; }
.tab { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); font-size: 13px; font-weight: 600; color: var(--text-muted); }
.tab-active { background: var(--sidebar-active); color: var(--text); }
.tab-panel-hidden { display: none; }
.perf-summary { display: flex; gap: 28px; margin-bottom: 16px; }
.perf-summary div { display: flex; flex-direction: column; font-size: 13px; color: var(--text-muted); }
.perf-summary strong { font-size: 18px; color: var(--text); font-weight: 700; }

/* ---------------- Notifications ---------------- */
.notif-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.notif-item { display: flex; align-items: center; gap: 12px; padding: 14px 4px; border-bottom: 1px solid var(--border); }
.notif-item:last-child { border-bottom: none; }
.notif-icon { font-size: 18px; }
.notif-body { flex: 1; }
.notif-message { font-weight: 600; font-size: 14px; }
.notif-meta { font-size: 12px; color: var(--text-muted); }

/* ---------------- Login ---------------- */
.login-body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); }
.login-card {
  width: 380px; max-width: 92vw; background: var(--surface); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 36px 32px; text-align: center;
}
.login-title { font-size: 20px; margin: 4px 0 2px; }
.login-tagline { color: var(--text-muted); font-size: 13px; margin: 0 0 20px; font-style: italic; }
.login-form { text-align: left; }
.login-hint { font-size: 11px; color: var(--text-muted); margin-top: 18px; line-height: 1.6; }

/* ---------------- Receipt / print ---------------- */
.receipt-body { background: var(--bg); display: flex; justify-content: center; padding: 40px 16px; }
.receipt {
  width: 380px; max-width: 100%; background: var(--surface); border-radius: var(--radius);
  box-shadow: var(--shadow); padding: 28px; font-size: 13px;
}
.receipt-header { text-align: center; margin-bottom: 16px; }
.receipt-header .brand-badge { margin: 0 auto 8px; }
.receipt-header h1 { font-size: 17px; }
.receipt-header p { margin: 2px 0; color: var(--text-muted); font-size: 12px; }
.receipt-tagline { font-style: italic; }
.receipt-meta { border-top: 1px dashed var(--border); border-bottom: 1px dashed var(--border); padding: 10px 0; margin-bottom: 10px; }
.receipt-meta div { display: flex; justify-content: space-between; padding: 2px 0; color: var(--text-muted); }
.receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
.receipt-table th { text-align: left; font-size: 11px; color: var(--text-muted); padding-bottom: 6px; }
.receipt-table td { padding: 3px 0; }
.receipt-totals { border-top: 1px dashed var(--border); padding-top: 10px; }
.receipt-totals div { display: flex; justify-content: space-between; padding: 2px 0; color: var(--text-muted); }
.receipt-grand-total { font-weight: 700; font-size: 15px; color: var(--text) !important; }
.receipt-grand-total span { color: var(--text); }
.receipt-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
@media print { .no-print { display: none; } .receipt-body { padding: 0; background: #fff; } .receipt { box-shadow: none; } }

/* ---------------- Error pages ---------------- */
.error-page { text-align: center; padding: 100px 20px; }
.error-icon { font-size: 40px; margin-bottom: 12px; }
.error-page h1 { font-size: 22px; margin-bottom: 8px; }
.error-page p { color: var(--text-muted); margin-bottom: 20px; }

/* ---------------- Responsive ---------------- */
@media (max-width: 960px) {
  .counter-layout { grid-template-columns: 1fr; }
  .order-pane { position: static; }
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .sidebar { position: fixed; z-index: 40; height: 100vh; transform: translateX(-100%); transition: transform 0.2s ease; }
  .sidebar.sidebar-open { transform: translateX(0); }
  .page { padding: 16px; }
  .stat-cards { grid-template-columns: 1fr 1fr; }
  .field-row { grid-template-columns: 1fr; }
}
