import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Scan, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Eye, 
  FileWarning, 
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardAPI.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94A3B8', gap: '10px' }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #1E2E4E', borderTopColor: '#3B82F6', borderRadius: '50%' }} />
        Loading Legal Metrology Dashboard Metrics...
      </div>
    );
  }

  const total = stats?.total_inspections || 0;
  const compliant = stats?.compliant_count || 0;
  const nonCompliant = stats?.non_compliant_count || 0;
  const reviewRequired = stats?.review_required_count || 0;
  const compliancePct = stats?.compliance_percentage || 0;
  const recent = stats?.recent_inspections || [];
  const violationsMap = stats?.violations_breakdown || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Officer Greeting & Quick Action Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F2744 0%, #0A192F 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Statutory Inspection Portal
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#FFFFFF', marginTop: '4px' }}>
            Good day, {user?.name || 'Inspector'}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px', maxWidth: '640px' }}>
            SafeMetric automated regulatory compliance engine under the <b>Legal Metrology (Packaged Commodities) Rules, 2011</b>.
          </p>
        </div>

        <Link
          to="/scan"
          className="btn-primary"
          style={{
            padding: '14px 28px',
            fontSize: '1rem',
            fontWeight: '700',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)'
          }}
        >
          <Scan size={20} />
          + SCAN PRODUCT
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '18px'
      }}>
        {/* Total Inspections */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Inspections
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FFFFFF', marginTop: '6px' }}>
                {total}
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={22} color="#3B82F6" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={14} /> Recorded in audit database
          </div>
        </div>

        {/* Compliant */}
        <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Compliant Products
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#10B981', marginTop: '6px' }}>
                {compliant}
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--status-compliant-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={22} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10B981', marginTop: '12px' }}>
            {total > 0 ? `${compliancePct}% compliance rate` : 'No inspections recorded'}
          </div>
        </div>

        {/* Non-Compliant */}
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Non-Compliant
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#EF4444', marginTop: '6px' }}>
                {nonCompliant}
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--status-noncompliant-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <XCircle size={22} color="#EF4444" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#EF4444', marginTop: '12px' }}>
            Statutory violations detected
          </div>
        </div>

        {/* Review Required */}
        <div className="card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Review Required
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#F59E0B', marginTop: '6px' }}>
                {reviewRequired}
              </div>
            </div>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--status-review-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={22} color="#F59E0B" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#F59E0B', marginTop: '12px' }}>
            Requires manual physical verification
          </div>
        </div>
      </div>

      {/* Middle Grid: Compliance Health & Violations Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* Compliance Meter & Statutory Summary */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#38BDF8" />
            Overall Compliance Performance
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', margin: '20px 0' }}>
            {/* Circular Gauge */}
            <div style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: `conic-gradient(#10B981 ${compliancePct * 3.6}deg, #1E2E4E 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-card)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF' }}>
                  {compliancePct}%
                </span>
                <span style={{ fontSize: '0.62rem', color: '#94A3B8', textTransform: 'uppercase' }}>
                  COMPLIANT
                </span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF' }}>
                Legal Metrology Benchmark
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginTop: '4px', lineHeight: '1.4' }}>
                Enforcement rate evaluated across mandatory declarations: MRP, Net Quantity, Dates, Manufacturer & Consumer Care Cell.
              </p>
            </div>
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: '#070D19',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: '#94A3B8',
            lineHeight: '1.4'
          }}>
            <b>Statutory Note:</b> A commodity is declared <b>NON-COMPLIANT</b> if any mandatory high-severity declaration is missing, regardless of overall percentage.
          </div>
        </div>

        {/* Violations Breakdown by Field */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileWarning size={18} color="#EF4444" />
            Top Declaration Violations Detected
          </h3>

          {Object.keys(violationsMap).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(violationsMap).map(([field, count]) => (
                <div key={field}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: '#CBD5E1', fontWeight: '500' }}>{field}</span>
                    <span style={{ color: '#EF4444', fontWeight: '700' }}>{count} violations</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#070D19', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(count * 25, 100)}%`,
                      backgroundColor: '#EF4444',
                      borderRadius: '9999px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748B', fontSize: '0.85rem' }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px', display: 'block' }} />
              No statutory violations recorded in current audit batch.
            </div>
          )}
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF' }}>
              Recent Commodity Inspections
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
              Audit log of latest product scans and compliance results
            </p>
          </div>
          <Link
            to="/history"
            style={{
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            View Complete History <ArrowUpRight size={16} />
          </Link>
        </div>

        {recent.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product / Commodity</th>
                <th>Inspection Date</th>
                <th>Status</th>
                <th>Compliance Score</th>
                <th>Issues</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((insp) => (
                <tr key={insp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#070D19',
                        border: '1px solid var(--border-subtle)',
                        flexShrink: 0
                      }}>
                        <img
                          src={insp.image_url}
                          alt={insp.product_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#FFFFFF' }}>
                          {insp.product_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ID: #INS-{insp.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#94A3B8' }}>
                    {new Date(insp.inspection_date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td>
                    <span className={`badge ${
                      insp.compliance_status === 'COMPLIANT'
                        ? 'badge-compliant'
                        : (insp.compliance_status === 'NON-COMPLIANT' ? 'badge-noncompliant' : 'badge-review')
                    }`}>
                      {insp.compliance_status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '700', color: '#FFFFFF' }}>
                      {insp.compliance_score}%
                    </span>
                  </td>
                  <td style={{ color: insp.violations_count > 0 ? '#EF4444' : '#10B981', fontWeight: '500' }}>
                    {insp.violations_count > 0 ? `${insp.violations_count} issues` : '0 issues'}
                  </td>
                  <td>
                    <Link
                      to={`/result/${insp.id}`}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <Eye size={14} />
                      View Result
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Scan size={36} color="#38BDF8" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF' }}>
              No inspections recorded yet
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '4px', marginBottom: '16px' }}>
              Capture or upload a product label to start verifying Legal Metrology compliance.
            </p>
            <Link to="/scan" className="btn-primary" style={{ padding: '8px 20px' }}>
              Inspect First Product
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
