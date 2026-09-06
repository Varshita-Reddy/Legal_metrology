import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Upload, 
  Scan, 
  RotateCcw, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Sparkles, 
  Info, 
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { inspectionAPI } from '../services/api';
import AnalysisProgress from '../components/AnalysisProgress';

export const ScanPage = () => {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' or 'upload'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [demoCommodity, setDemoCommodity] = useState(null);
  const [productName, setProductName] = useState('');

  // Camera state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Quality check state
  const [qualityAlert, setQualityAlert] = useState(null);

  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pendingResultId, setPendingResultId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  // Initialize camera stream when camera tab is active
  useEffect(() => {
    if (activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, capturedImage]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access browser camera. Check camera permissions or switch to the Upload option.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setSelectedFile(file);
        setPreviewUrl(url);
        setCapturedImage(url);
        setDemoCommodity(null);
        evaluateClientImageQuality(canvas);
      }
    }, 'image/jpeg', 0.95);
    stopCamera();
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setQualityAlert(null);
    startCamera();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setDemoCommodity(null);
    setQualityAlert(null);

    // Simple resolution check
    const img = new Image();
    img.onload = () => {
      if (img.width < 450 || img.height < 450) {
        setQualityAlert(`Low resolution image (${img.width}x${img.height} px). Small text such as MRP and Mfg dates may be hard to detect.`);
      }
    };
    img.src = url;
  };

  const handleSelectDemo = (demoType, name) => {
    setDemoCommodity(demoType);
    setSelectedFile(null);
    setCapturedImage(null);
    setProductName(name);
    setQualityAlert(null);
    setPreviewUrl(`/demo_samples/sample_${demoType}.png`);
  };

  const evaluateClientImageQuality = (canvas) => {
    // Quick heuristic sharpness check
    if (canvas.width < 600) {
      setQualityAlert('Image resolution is lower than standard. Ensure packaging label fills the camera frame.');
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCapturedImage(null);
    setDemoCommodity(null);
    setQualityAlert(null);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile && !demoCommodity) {
      setErrorMessage('Please capture a photo, upload an image, or select a demo sample commodity.');
      return;
    }

    setErrorMessage('');
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      if (demoCommodity) {
        formData.append('demo_sample', demoCommodity);
      }
      if (productName) {
        formData.append('product_name', productName);
      }

      const result = await inspectionAPI.analyze(formData);
      setPendingResultId(result.id);
    } catch (err) {
      setIsAnalyzing(false);
      setErrorMessage(
        err.response?.data?.detail || 'Unable to analyze package label. Please verify the image and try again.'
      );
    }
  };

  const handleAnalysisComplete = () => {
    if (pendingResultId) {
      navigate(`/result/${pendingResultId}`);
    }
  };

  if (isAnalyzing) {
    return <AnalysisProgress onComplete={handleAnalysisComplete} />;
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Verification Station
          </span>
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: '800', color: '#FFFFFF', marginTop: '2px' }}>
          Inspect Product Label
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginTop: '4px' }}>
          Capture or upload a packaged commodity label to verify Legal Metrology (Packaged Commodities) Rules, 2011 declarations.
        </p>
      </div>

      {errorMessage && (
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
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Demo Benchmark Selector Banner */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(15, 29, 54, 0.7)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#38BDF8" />
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#FFFFFF' }}>
            Pre-loaded Benchmark Samples:
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleSelectDemo('saferice', 'SafeRice Premium')}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderColor: demoCommodity === 'saferice' ? '#10B981' : 'var(--border-subtle)',
              backgroundColor: demoCommodity === 'saferice' ? 'var(--status-compliant-bg)' : '#1E293B',
              color: demoCommodity === 'saferice' ? '#10B981' : '#FFFFFF'
            }}
          >
            ✓ SafeRice (Compliant)
          </button>
          <button
            type="button"
            onClick={() => handleSelectDemo('wafer', 'Crispy Delight Wafers')}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderColor: demoCommodity === 'wafer' ? '#EF4444' : 'var(--border-subtle)',
              backgroundColor: demoCommodity === 'wafer' ? 'var(--status-noncompliant-bg)' : '#1E293B',
              color: demoCommodity === 'wafer' ? '#EF4444' : '#FFFFFF'
            }}
          >
            ✕ Crispy Wafers (Non-Compliant)
          </button>
          <button
            type="button"
            onClick={() => handleSelectDemo('oil', 'Mediterranean Olive Oil')}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderColor: demoCommodity === 'oil' ? '#F59E0B' : 'var(--border-subtle)',
              backgroundColor: demoCommodity === 'oil' ? 'var(--status-review-bg)' : '#1E293B',
              color: demoCommodity === 'oil' ? '#F59E0B' : '#FFFFFF'
            }}
          >
            ⚠ Olive Oil (Review Req.)
          </button>
        </div>
      </div>

      {/* Inspection Mode Tabs */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '20px',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('camera'); handleRemove(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'transparent',
              borderBottom: activeTab === 'camera' ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === 'camera' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'camera' ? '700' : '500',
              fontSize: '0.9rem'
            }}
          >
            <Camera size={18} />
            Live Camera Scan
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('upload'); handleRemove(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              background: 'transparent',
              borderBottom: activeTab === 'upload' ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === 'upload' ? '#FFFFFF' : 'var(--text-secondary)',
              fontWeight: activeTab === 'upload' ? '700' : '500',
              fontSize: '0.9rem'
            }}
          >
            <Upload size={18} />
            Upload Product Label Image
          </button>
        </div>

        {/* Tab 1: Live Browser Camera View */}
        {activeTab === 'camera' && (
          <div>
            {!capturedImage ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: '#000000' }}>
                {cameraError ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: '#EF4444' }}>
                    <AlertTriangle size={36} style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: '600' }}>{cameraError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('upload')}
                      className="btn-primary"
                      style={{ marginTop: '16px', padding: '8px 18px' }}
                    >
                      Use Upload Mode Instead
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {/* Viewfinder Overlay */}
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      right: '20px',
                      bottom: '20px',
                      border: '2px dashed rgba(56, 189, 248, 0.7)',
                      borderRadius: '12px',
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      paddingBottom: '20px'
                    }}>
                      <span style={{
                        backgroundColor: 'rgba(15, 29, 54, 0.85)',
                        color: '#38BDF8',
                        padding: '6px 14px',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        letterSpacing: '0.04em'
                      }}>
                        ALIGN PRODUCT LABEL INSIDE FRAME
                      </span>
                    </div>

                    {/* Capture Trigger */}
                    <div style={{
                      position: 'absolute',
                      bottom: '24px',
                      left: '0',
                      right: '0',
                      display: 'flex',
                      justifyContent: 'center'
                    }}>
                      <button
                        type="button"
                        onClick={handleCapture}
                        style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          backgroundColor: '#FFFFFF',
                          border: '4px solid #2563EB',
                          boxShadow: '0 0 20px rgba(37, 99, 235, 0.8)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Capture Photo"
                      >
                        <Camera size={26} color="#1D4ED8" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 2: Upload Area */}
        {activeTab === 'upload' && !previewUrl && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) processSelectedFile(file);
            }}
            style={{
              border: '2px dashed var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'rgba(7, 13, 25, 0.5)',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('file-upload-input')?.click()}
          >
            <input
              id="file-upload-input"
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <Upload size={26} color="#38BDF8" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF' }}>
              Upload Product Label Image
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94A3B8', marginTop: '6px' }}>
              Drag and drop package photo here, or click to browse
            </p>
            <span style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '12px',
              backgroundColor: '#070D19',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid var(--border-subtle)'
            }}>
              Supported: PNG, JPG, JPEG, WEBP (Max 15MB)
            </span>
          </div>
        )}

        {/* Image Preview & Confirmation (for camera capture, file upload, or demo selection) */}
        {previewUrl && (
          <div>
            <div style={{
              position: 'relative',
              backgroundColor: '#050912',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              maxHeight: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
              padding: '16px'
            }}>
              <img
                src={previewUrl}
                alt="Label Preview"
                style={{
                  maxHeight: '400px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}
              />

              <button
                type="button"
                onClick={handleRemove}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.85)',
                  color: '#FFFFFF',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Image Quality Warning if flagged */}
            {qualityAlert && (
              <div style={{
                marginTop: '14px',
                padding: '12px 16px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid #D97706',
                color: '#FDE68A',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div>
                  <b>Image Quality Advisory:</b> {qualityAlert}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '20px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                {activeTab === 'camera' && capturedImage && (
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="btn-secondary"
                  >
                    <RotateCcw size={16} />
                    Retake Photo
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="btn-secondary"
                >
                  <RefreshCw size={16} />
                  Choose Different Label
                </button>
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                className="btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: '700' }}
              >
                <Scan size={20} />
                ANALYZE PRODUCT COMPLIANCE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanPage;
