// Generic modal + sidebar toggle controller.
// Modals use: <button data-open-modal="modalId"> to open,
// and <button data-close-modal="modalId"> (or a .modal-backdrop
// with the same attribute) to close.

document.addEventListener('click', (e) => {
  const openTrigger = e.target.closest('[data-open-modal]');
  if (openTrigger) {
    const modal = document.getElementById(openTrigger.getAttribute('data-open-modal'));
    if (modal) modal.classList.add('modal-visible');
    return;
  }

  const closeTrigger = e.target.closest('[data-close-modal]');
  if (closeTrigger) {
    const modal = document.getElementById(closeTrigger.getAttribute('data-close-modal'));
    if (modal) modal.classList.remove('modal-visible');
    return;
  }
});

// Esc closes any open modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.modal-visible').forEach((m) => m.classList.remove('modal-visible'));
  }
});

// Sidebar toggle (mobile)
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
  }
});
