import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext'; // Import useTheme

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const {
    walletAddress,
    isConnecting,
    injectedProviders,
    connectWallet,
    connectStandard,
    disconnectWallet
  } = useWallet();

  const handleConnectClick = () => {
    if (walletAddress) {
      disconnectWallet();
    } else {
      setShowWalletModal(true);
      // Re-trigger discovery just in case
      window.dispatchEvent(new Event("eip6963:requestProvider"));
    }
  };

  const handleProviderSelect = (provider) => {
    setShowWalletModal(false);
    connectWallet(provider);
  };

  const handleStandardSelect = (type) => {
    setShowWalletModal(false);
    connectStandard(type);
  };

  const formatAddress = (addr) => {
    return addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : '';
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-content">
          <Link to="/" className="logo">
            <span>🛡️</span> Whistle
          </Link>
          <div className="nav-links" style={{ alignItems: 'center' }}>
            <Link to="/">Home</Link>
            <Link to="/feed">Feed</Link>
            <Link to="/reports">Reports</Link>
            <button
              onClick={() => setShowDonateModal(true)}
              className="nav-link-item"
            >
              Donate
            </button>
            <button
              onClick={toggleTheme}
              className="btn-icon"
              style={{ fontSize: '1.2rem', padding: '0.5rem', background: 'var(--surface-color)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <Link to="/report" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Report Now</Link>

            <button
              className="btn btn-wallet"
              onClick={handleConnectClick}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : walletAddress ? (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80' }}></span>
                  {formatAddress(walletAddress)}
                </>
              ) : (
                <>
                  <span>🔗</span> Connect Wallet
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Wallet Modal */}
      {showWalletModal && (
        <div className="wallet-modal-overlay" onClick={() => setShowWalletModal(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Connect Wallet</h3>
              <button className="close-modal" onClick={() => setShowWalletModal(false)}>&times;</button>
            </div>

            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Detected Wallets
            </p>

            {/* List EIP-6963 detected providers */}
            {Array.from(injectedProviders.values()).map((detail) => (
              <button key={detail.info.uuid} className="wallet-option" onClick={() => handleProviderSelect(detail)}>
                <img src={detail.info.icon} alt={detail.info.name} style={{ width: '24px', height: '24px' }} />
                <div>
                  <div style={{ fontWeight: '600' }}>{detail.info.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detected in browser</div>
                </div>
              </button>
            ))}

            {injectedProviders.size === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', opacity: 0.7, fontSize: '0.9rem', marginBottom: '1rem' }}>
                No EIP-6963 wallets detected. <br /> Showing standard options:
              </div>
            )}

            {/* Fallback Standard Options */}
            <button className="wallet-option" onClick={() => handleStandardSelect('MetaMask')}>
              <span className="wallet-icon">🦊</span>
              <div>
                <div style={{ fontWeight: '600' }}>MetaMask</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Standard Connection</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && (
        <div className="wallet-modal-overlay" onClick={() => setShowDonateModal(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', background: 'var(--bg-color)', backdropFilter: 'blur(20px)', border: '1px solid var(--glass-border)' }}>
            <div className="modal-header">
              <h3>Support Our Mission 🛡️</h3>
              <button className="close-modal" onClick={() => setShowDonateModal(false)}>&times;</button>
            </div>

            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Your donations help us maintain the platform as a secure, decentralized haven for truth.
              All contributions go directly to server costs and development.
            </p>

            <div className="donate-options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* ETH */}
              <div className="donate-item glass-panel" style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#627eea' }}>Ethereum (ETH)</span>
                  <button
                    onClick={() => handleCopy('0x128537BC64dC70C925Fc72198D1f526446a083b8', 'ETH')}
                    className="btn-icon"
                    title="Copy Address"
                    style={{ fontSize: '0.9rem', padding: '0.2rem 0.5rem', background: copiedKey === 'ETH' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)', color: copiedKey === 'ETH' ? '#34d399' : 'inherit', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {copiedKey === 'ETH' ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  0x128537BC64dC70C925Fc72198D1f526446a083b8
                </div>
              </div>

              {/* BTC */}
              <div className="donate-item glass-panel" style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#f2a900' }}>Bitcoin (BTC)</span>
                  <button
                    onClick={() => handleCopy('bc1q4v8l8t8h5lcxlu02nfxhuqmx7vtn4s60m5md67', 'BTC')}
                    className="btn-icon"
                    title="Copy Address"
                    style={{ fontSize: '0.9rem', padding: '0.2rem 0.5rem', background: copiedKey === 'BTC' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)', color: copiedKey === 'BTC' ? '#34d399' : 'inherit', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {copiedKey === 'BTC' ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  bc1q4v8l8t8h5lcxlu02nfxhuqmx7vtn4s60m5md67
                </div>
              </div>

              {/* SOL */}
              <div className="donate-item glass-panel" style={{ padding: '1rem', borderRadius: '0.5rem', background: 'var(--surface-color)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: '#14f195' }}>Solana (SOL)</span>
                  <button
                    onClick={() => handleCopy('Hot8DpSf5xeqNRAQifbVUJgGXh5MNq9fJVMJySdj9CCq', 'SOL')}
                    className="btn-icon"
                    title="Copy Address"
                    style={{ fontSize: '0.9rem', padding: '0.2rem 0.5rem', background: copiedKey === 'SOL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)', color: copiedKey === 'SOL' ? '#34d399' : 'inherit', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {copiedKey === 'SOL' ? '✅ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Hot8DpSf5xeqNRAQifbVUJgGXh5MNq9fJVMJySdj9CCq
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
