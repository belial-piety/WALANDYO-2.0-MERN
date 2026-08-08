import React, { useEffect } from 'react';

export const Modal = ({ isOpen, onClose, title, subtitle, children, dismissable = true }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && dismissable) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, dismissable]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-backdrop" onClick={dismissable ? onClose : undefined} />
      <div className="modal-box">
        <div className="modal-header">
          <h2>{title}</h2>
          {dismissable && (
            <button className="modal-close" onClick={onClose}>
              &times;
            </button>
          )}
        </div>
        {subtitle && <p className="field-hint" style={{ marginBottom: '16px' }}>{subtitle}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
