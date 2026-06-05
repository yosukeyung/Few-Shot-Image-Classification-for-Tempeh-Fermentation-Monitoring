import React from 'react';
import logoVideo from '../assets/logo.mp4';

const SplashScreen = ({ onComplete }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <video
        src={logoVideo}
        autoPlay
        muted
        playsInline
        onEnded={onComplete}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
        }}
      />

      {/* Skip button */}
      <button
        onClick={onComplete}
        style={{
          position: 'absolute',
          bottom: '2rem',
          right: '2rem',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.5)',
          padding: '0.4rem 1rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
          cursor: 'pointer',
        }}
      >
        SKIP
      </button>
    </div>
  );
};

export default SplashScreen;
