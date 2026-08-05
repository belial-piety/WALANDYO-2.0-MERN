import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#cf1f21', marginBottom: '8px' }}>404</h1>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Page Not Found</h2>
      <p style={{ color: '#8a8578', marginBottom: '24px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/counter')}>
        Back to Safety
      </button>
    </div>
  );
};

export default NotFoundPage;
