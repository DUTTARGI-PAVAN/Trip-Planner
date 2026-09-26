import React, { useState, useEffect, useRef } from 'react';

export function UserProfileModal({
  isOpen,
  initialName,
  onSave,
  onClose,
  canClose = true,
}) {
  const [name, setName] = useState(initialName || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setName(initialName || '');
    setError('');
  }, [initialName, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && canClose && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, canClose, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to personalize your experience.');
      return;
    }
    onSave({ name: trimmed });
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (canClose && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-title"
    >
      <div className="modal-content profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="profile-badge-pill">✨ Personalize Your Journey</span>
            <h2 id="user-profile-title" className="modal-title" style={{ marginTop: '0.4rem' }}>
              Welcome to YourTripGuide
            </h2>
            <p className="profile-modal-subtitle">
              Enter your name to personalize your travel planning experience.
            </p>
          </div>
          {canClose && onClose && (
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ✕
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="profile-form">
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="user-fullname" className="form-label">
              👤 Your Name
            </label>
            <input
              id="user-fullname"
              ref={inputRef}
              type="text"
              className={`form-text-input ${error ? 'input-error' : ''}`}
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              maxLength={40}
            />
            {error && <p className="form-error-msg">{error}</p>}
          </div>

          {/* Actions */}
          <div className="profile-modal-actions">
            {canClose && onClose && (
              <button
                type="button"
                className="btn-profile-secondary"
                onClick={onClose}
              >
                Skip for now
              </button>
            )}
            <button
              type="submit"
              className="btn-profile-primary"
            >
              <span>Save & Start Planning</span>
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
