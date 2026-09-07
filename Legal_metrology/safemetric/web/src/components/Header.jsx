import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname === '/dashboard') return 'Compliance Overview';
    if (pathname === '/scan') return 'Product Inspection Scan';
    if (pathname.startsWith('/result')) return 'Statutory Compliance Result';
    if (pathname === '/history') return 'Inspection Records & Audit Trail';
    if (pathname === '/reports') return 'Statutory Reports Archive';
    if (pathname === '/profile') return 'Inspector Profile & Department';
    return 'SafeMetric System';
  };

  return (
    <header style={{
      height: '64px',
      backgroundColor: 'rgba(11, 22, 44, 0.75)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 36px',
      position: 'sticky',
      top: 0,
      zIndex: 20
    }}>
      {/* Title & Department */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF' }}>
          {getPageTitle(location.pathname)}
        </h2>
        <span style={{
          fontSize: '0.75rem',
          backgroundColor: 'rgba(30, 58, 138, 0.5)',
          color: '#93C5FD',
          padding: '3px 10px',
          borderRadius: '9999px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px'
        }}>
          <Shield size={12} />
          {user?.organization || 'Legal Metrology Department'}
        </span>
      </div>

      {/* Right Action & System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.78rem',
          color: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          padding: '4px 10px',
          borderRadius: '9999px',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'inline-block',
            boxShadow: '0 0 8px #10B981'
          }} />
          Engine Online • PCR 2011 Active
        </div>

        {location.pathname !== '/scan' && (
          <Link
            to="/scan"
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <Plus size={16} />
            Scan Product
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
