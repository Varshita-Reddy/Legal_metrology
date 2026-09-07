import React, { useState, useEffect } from 'react';
import { User, Shield, Building, Mail, Calendar, KeyRound, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { profileAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileAPI.get();
        setProfileData(data);
        setName(data.name || '');
        setRole(data.role || '');
        setOrganization(data.organization || '');
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        role,
        organization,
        new_password: newPassword || undefined
      };
      const res = await profileAPI.update(payload);
      setMessage('Officer credentials updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      if (res.user) {
        setAuthUser(res.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94A3B8', gap: '10px' }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #1E2E4E', borderTopColor: '#3B82F6', borderRadius: '50%' }} />
        Loading Inspector Profile...
      </div>
    );
  }

  const stats = profileData?.stats || { total_inspections: 0, compliant: 0, non_compliant: 0, review_required: 0 };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Authorized Personnel
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
          Inspector Profile & Credentials
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '4px' }}>
          Manage your official enforcement credentials, department association, and personal inspection record audit
        </p>
      </div>

      {message && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid #10B981',
          color: '#6EE7B7',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid #DC2626',
          color: '#FCA5A5',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="card" style={{
        padding: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
        background: 'linear-gradient(135deg, #0F2744 0%, #0A192F 100%)'
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          backgroundColor: '#1E3A8A',
          color: '#93C5FD',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: '800',
          border: '3px solid #3B82F6',
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
          flexShrink: 0
        }}>
          {name ? name.charAt(0).toUpperCase() : 'O'}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF' }}>
              {name}
            </h2>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              {role}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px', fontSize: '0.82rem', color: '#94A3B8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building size={15} color="#38BDF8" /> {organization}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={15} color="#38BDF8" /> {profileData?.email}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="#38BDF8" /> Member Since {new Date(profileData?.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Officer Personal Inspection Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
            Total Recorded
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FFFFFF', marginTop: '4px' }}>
            {stats.total_inspections}
          </div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#10B981', textTransform: 'uppercase' }}>
            Compliant
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10B981', marginTop: '4px' }}>
            {stats.compliant}
          </div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#EF4444', textTransform: 'uppercase' }}>
            Non-Compliant
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#EF4444', marginTop: '4px' }}>
            {stats.non_compliant}
          </div>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase' }}>
            Review Required
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#F59E0B', marginTop: '4px' }}>
            {stats.review_required}
          </div>
        </div>
      </div>

      {/* Edit Profile & Password Form */}
      <div className="card" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px' }}>
          Edit Officer Information & Security Settings
        </h3>

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                Designation / Role
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
              Organization / Directorate
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '18px', marginTop: '6px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} color="#38BDF8" /> Change Password (Leave blank to keep current)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  New Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#CBD5E1', marginBottom: '6px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ padding: '10px 24px' }}
            >
              <Save size={16} />
              {saving ? 'Saving Updates...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
