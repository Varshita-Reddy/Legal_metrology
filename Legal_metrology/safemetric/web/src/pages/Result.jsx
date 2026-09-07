import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileDown, 
  ArrowLeft, 
  Scan, 
  Shield, 
  Scale, 
  Layers, 
  ExternalLink,
  Info
} from 'lucide-react';
import { inspectionAPI, reportAPI } from '../services/api';
import EvidenceViewer from '../components/EvidenceViewer';

export const ResultPage = () => {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await inspectionAPI.getById(id);
        setInspection(data);
      } catch (err) {
        setError('Failed to fetch inspection record. Please verify the inspection ID.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#94A3B8', gap: '12px' }}>
        <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid #1E2E4E', borderTopColor: '#3B82F6', borderRadius: '50%' }} />
        Retrieving Legal Metrology Compliance Evaluation...
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '40px 24px' }}>
        <AlertTriangle size={36} color="#EF4444" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF' }}>{error || 'Inspection Not Found'}</h3>
        <Link to="/dashboard" className="btn-primary" style={{ marginTop: '20px' }}>
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const isCompliant = inspection.compliance_status === 'COMPLIANT';
  const isNonCompliant = inspection.compliance_status === 'NON-COMPLIANT';
  const isReview = !isCompliant && !isNonCompliant;

  const statusColor = isCompliant ? '#10B981' : (isNonCompliant ? '#EF4444' : '#F59E0B');
  const statusBg = isCompliant ? 'rgba(16, 185, 129, 0.12)' : (isNonCompliant ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)');
  const statusBorder = isCompliant ? '#059669' : (isNonCompliant ? '#DC2626' : '#D97706');

  const pdfDownloadUrl = reportAPI.getDownloadUrl(inspection.id);
  const imageUrl = inspectionAPI.getImageUrl(inspection.id);

  // Extracted declarations dictionary
  const ext = inspection.extracted_data || {};
  const violations = inspection.violations || [];
  const fields = inspection.fields || [];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Top Breadcrumb & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94A3B8', fontSize: '0.85rem', fontWeight: '500' }}>
          <ArrowLeft size={16} /> Back to Inspection Records
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/scan" className="btn-secondary" style={{ fontSize: '0.82rem' }}>
            <Scan size={16} /> Scan Next Commodity
          </Link>
          <a
            href={pdfDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 18px' }}
          >
            <FileDown size={16} /> DOWNLOAD PDF REPORT
          </a>
        </div>
      </div>

      {/* Hero Compliance Result Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${statusBg} 0%, rgba(15, 29, 54, 0.95) 100%)`,
        border: `2px solid ${statusBorder}`,
        borderRadius: 'var(--radius-xl)',
        padding: '32px 36px',
        boxShadow: `0 8px 32px ${isCompliant ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            backgroundColor: statusColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 6px 24px ${statusColor}66`
          }}>
            {isCompliant && <CheckCircle2 size={40} color="#FFFFFF" />}
            {isNonCompliant && <XCircle size={40} color="#FFFFFF" />}
            {isReview && <AlertTriangle size={40} color="#FFFFFF" />}
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor }}>
              STATUTORY DETERMINATION
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {inspection.compliance_status}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', marginTop: '4px' }}>
              Product: <b>{inspection.product_name}</b> • Record Ref: #INS-{inspection.id}
            </p>
          </div>
        </div>

        {/* Score Ring / Gauge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 20px',
          backgroundColor: '#070D19',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
              COMPLIANCE SCORE
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: statusColor, lineHeight: 1 }}>
              {inspection.compliance_score}%
            </div>
          </div>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: `conic-gradient(${statusColor} ${inspection.compliance_score * 3.6}deg, #1E2E4E 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#070D19' }} />
          </div>
        </div>
      </div>

      {/* Extracted Declarations Key Summary Cards */}
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#38BDF8" /> Extracted Statutory Declarations
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px'
        }}>
          {[
            { label: 'Product Name', val: ext.product_name?.value || inspection.product_name, stat: ext.product_name?.status },
            { label: 'Maximum Retail Price (MRP)', val: ext.mrp?.value, stat: ext.mrp?.status },
            { label: 'Net Quantity', val: ext.net_quantity?.value, stat: ext.net_quantity?.status },
            { label: 'Manufacturing Date', val: ext.manufacturing_date?.value, stat: ext.manufacturing_date?.status },
            { label: 'Best Before / Use By', val: ext.best_before?.value, stat: ext.best_before?.status },
            { label: 'Manufacturer Name', val: ext.manufacturer_name?.value, stat: ext.manufacturer_name?.status },
            { label: 'Manufacturer Address', val: ext.manufacturer_address?.value, stat: ext.manufacturer_address?.status },
            { label: 'Consumer Care Helpline', val: ext.consumer_care?.value, stat: ext.consumer_care?.status },
            { label: 'Country of Origin', val: ext.country_of_origin?.value, stat: ext.country_of_origin?.status },
            { label: 'Batch / Lot Number', val: ext.batch_number?.value, stat: ext.batch_number?.status },
          ].map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' }}>
                  {item.label}
                </span>
                <span className={`badge ${item.stat === 'Found' ? 'badge-compliant' : (item.stat === 'Low Confidence' ? 'badge-review' : 'badge-noncompliant')}`} style={{ fontSize: '0.65rem' }}>
                  {item.stat || 'Missing'}
                </span>
              </div>
              <div style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: item.val ? '#FFFFFF' : 'var(--text-muted)',
                marginTop: '8px',
                wordBreak: 'break-word',
                lineHeight: 1.3
              }}>
                {item.val || '— Not Detected —'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Violations & Compliance Issues */}
      {violations.length > 0 && (
        <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(15, 29, 54, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <XCircle size={22} color="#EF4444" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FFFFFF' }}>
                Compliance Issues & Statutory Violations ({violations.length})
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#FCA5A5' }}>
                Infractions detected under the Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {violations.map((v, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  backgroundColor: '#070D19',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {v.field}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF', marginTop: '2px' }}>
                      {v.issue}
                    </h4>
                  </div>
                  <span className={`badge ${v.severity === 'HIGH' ? 'badge-noncompliant' : 'badge-review'}`}>
                    {v.severity} SEVERITY
                  </span>
                </div>

                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.4 }}>
                  <div style={{ color: '#38BDF8', fontWeight: '600' }}>Citation: {v.rule_reference}</div>
                  <div style={{ marginTop: '2px' }}>Advisory: {v.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Declaration Check Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#FFFFFF' }}>
            Statutory Declaration Audit Table
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '2px' }}>
            Detailed breakdown of OCR extracted values and optical recognition confidence
          </p>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Field / Requirement</th>
              <th>Detected Value</th>
              <th>Compliance Status</th>
              <th>OCR Confidence</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: '600', color: '#FFFFFF' }}>
                  {f.field_name.replace(/_/g, ' ').toUpperCase()}
                </td>
                <td style={{ color: f.extracted_value ? '#CBD5E1' : '#64748B', maxWidth: '380px', wordBreak: 'break-word' }}>
                  {f.extracted_value || '—'}
                </td>
                <td>
                  <span className={`badge ${
                    f.status === 'Found' ? 'badge-compliant' : (f.status === 'Low Confidence' ? 'badge-review' : 'badge-noncompliant')
                  }`}>
                    {f.status}
                  </span>
                </td>
                <td style={{ fontWeight: '600', color: f.confidence >= 90 ? '#10B981' : (f.confidence >= 70 ? '#F59E0B' : '#EF4444') }}>
                  {f.status === 'Missing' ? '—' : `${f.confidence}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evidence Viewer with OCR Bounding Boxes */}
      <EvidenceViewer
        imageUrl={imageUrl}
        boundingBoxes={[]}
        productName={inspection.product_name}
      />

      {/* Regulatory Legal Disclaimer */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#070D19',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Scale size={20} color="#94A3B8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
          <b>Legal Metrology Regulatory Disclaimer:</b> This report provides automated label-compliance assistance based on detected declarations and configured Legal Metrology rules under the Legal Metrology (Packaged Commodities) Rules, 2011. SafeMetric evaluates label declaration compliance only and does not verify physical or consumable product safety. Final regulatory determination remains subject to authorized physical inspection by a designated Legal Metrology officer.
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
