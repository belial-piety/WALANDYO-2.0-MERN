import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX } from 'lucide-react';

export const ForbiddenPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <ShieldX size={64} color="#cf1f21" style={{ margin: '0 auto 16px' }} />
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>403 - Access Forbidden</h1>
      <p style={{ color: '#8a8578', marginBottom: '24px' }}>
        You do not have permission to view this page. Contact your administrator if you believe this is an error.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/counter')}>
        Return to POS Counter
      </button>
    </div>
  );
};

export default ForbiddenPage;
