import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpDown, Eye, Trash2, Calendar, FileText, CheckCircle2, XCircle, AlertTriangle, Scan } from 'lucide-react';
import { inspectionAPI } from '../services/api';

export const HistoryPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await inspectionAPI.list({
        status: statusFilter,
        search: search || undefined,
        sort_by: sortBy,
      });
      setInspections(data);
    } catch (err) {
      console.error('Failed to load inspection history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete inspection record for "${name}" (#INS-${id})?`)) {
      try {
        await inspectionAPI.delete(id);
        setInspections((prev) => prev.filter((i) => i.id !== id));
      } catch (err) {
        alert('Failed to delete inspection.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Regulatory Log
            </span>
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
            Inspection History & Audit Trail
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#94A3B8', marginTop: '2px' }}>
            Comprehensive database records of all commodity inspections conducted by your office
          </p>
        </div>

        <Link to="/scan" className="btn-primary">
          <Scan size={18} /> Inspect New Commodity
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['ALL', 'COMPLIANT', 'NON-COMPLIANT', 'REVIEW REQUIRED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  border: statusFilter === st ? '1px solid #3B82F6' : '1px solid var(--border-subtle)',
                  backgroundColor: statusFilter === st ? 'rgba(37, 99, 235, 0.2)' : '#070D19',
                  color: statusFilter === st ? '#FFFFFF' : '#94A3B8',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Form & Sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '220px' }}>
              <Search size={16} color="#64748B" style={{ position: 'absolute', left: '10px', top: '12px' }} />
              <input
                type="text"
                placeholder="Search product..."
                className="form-input"
                style={{ paddingLeft: '34px', paddingRight: '10px', height: '38px', fontSize: '0.82rem' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input"
              style={{ width: '130px', height: '38px', fontSize: '0.82rem' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score">Highest Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
            <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #1E2E4E', borderTopColor: '#3B82F6', borderRadius: '50%', margin: '0 auto 12px' }} />
            Loading inspection records...
          </div>
        ) : inspections.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Inspection ID</th>
                <th>Date</th>
                <th>Compliance Status</th>
                <th>Score</th>
                <th>Violations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#070D19',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0
                      }}>
                        <img
                          src={i.image_url}
                          alt={i.product_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                        {i.product_name}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#94A3B8', fontFamily: 'monospace' }}>
                    #INS-{i.id}
                  </td>
                  <td style={{ color: '#94A3B8' }}>
                    {new Date(i.inspection_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td>
                    <span className={`badge ${
                      i.compliance_status === 'COMPLIANT'
                        ? 'badge-compliant'
                        : (i.compliance_status === 'NON-COMPLIANT' ? 'badge-noncompliant' : 'badge-review')
                    }`}>
                      {i.compliance_status}
                    </span>
                  </td>
                  <td style={{ fontWeight: '700', color: '#FFFFFF' }}>
                    {i.compliance_score}%
                  </td>
                  <td style={{ color: i.violations_count > 0 ? '#EF4444' : '#10B981', fontWeight: '500' }}>
                    {i.violations_count > 0 ? `${i.violations_count} detected` : 'None'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/result/${i.id}`}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Eye size={14} /> View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(i.id, i.product_name)}
                        style={{
                          background: 'transparent',
                          color: '#EF4444',
                          padding: '6px',
                          borderRadius: '6px'
                        }}
                        title="Delete Inspection"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <FileText size={36} color="#64748B" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF' }}>
              No inspections match current criteria
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px' }}>
              Try adjusting your search query or status filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
