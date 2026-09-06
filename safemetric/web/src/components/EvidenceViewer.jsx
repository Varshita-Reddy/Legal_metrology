import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Download, Eye, Layers } from 'lucide-react';

export const EvidenceViewer = ({ imageUrl, boundingBoxes = [], productName = "Product Label" }) => {
  const [zoom, setZoom] = useState(1);
  const [showBoxes, setShowBoxes] = useState(true);
  const [activeBox, setActiveBox] = useState(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleReset = () => setZoom(1);

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="#38BDF8" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF' }}>
            Photographic Label Evidence & OCR Overlay
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              backgroundColor: showBoxes ? 'rgba(37, 99, 235, 0.2)' : '#1E293B',
              borderColor: showBoxes ? '#3B82F6' : 'var(--border-subtle)'
            }}
          >
            <Eye size={14} />
            {showBoxes ? 'Hide BBoxes' : 'Show BBoxes'}
          </button>

          <button onClick={handleZoomOut} className="btn-secondary" style={{ padding: '6px 10px' }} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94A3B8', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={handleZoomIn} className="btn-secondary" style={{ padding: '6px 10px' }} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button onClick={handleReset} className="btn-secondary" style={{ padding: '6px 10px' }} title="Reset Zoom">
            <RotateCcw size={14} />
          </button>

          <a
            href={imageUrl}
            download={`SafeMetric_Evidence_${productName.replace(/\s+/g, '_')}.png`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Download Original Image"
          >
            <Download size={14} />
          </a>
        </div>
      </div>

      {/* Image Canvas Container */}
      <div style={{
        position: 'relative',
        height: '420px',
        backgroundColor: '#050912',
        borderRadius: 'var(--radius-md)',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border-subtle)',
        padding: '16px'
      }}>
        <div style={{
          position: 'relative',
          display: 'inline-block',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease'
        }}>
          <img
            src={imageUrl}
            alt={productName}
            style={{
              maxWidth: '100%',
              maxHeight: '380px',
              objectFit: 'contain',
              borderRadius: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              display: 'block'
            }}
          />

          {/* Render Bounding Boxes if enabled */}
          {showBoxes && boundingBoxes.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none'
            }}>
              {boundingBoxes.map((b, idx) => {
                const box = b.box;
                if (!box || box.length < 4) return null;
                // Normalize roughly relative to image width 800 x 1000
                const left = (box[0][0] / 800) * 100;
                const top = (box[0][1] / 1000) * 100;
                const width = ((box[1][0] - box[0][0]) / 800) * 100;
                const height = ((box[2][1] - box[0][1]) / 1000) * 100;

                const isHovered = activeBox === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveBox(idx)}
                    onMouseLeave={() => setActiveBox(null)}
                    style={{
                      position: 'absolute',
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${Math.max(width, 4)}%`,
                      height: `${Math.max(height, 2)}%`,
                      border: isHovered ? '2px solid #38BDF8' : '1px solid rgba(59, 130, 246, 0.65)',
                      backgroundColor: isHovered ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.12)',
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.15s ease'
                    }}
                    title={`${b.text} (${b.confidence}%)`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Caption & Instructions */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <span>Visual Evidence ID: #EVD-IMG</span>
        <span>Hover bounding boxes on desktop to view individual declaration confidence</span>
      </div>
    </div>
  );
};

export default EvidenceViewer;
