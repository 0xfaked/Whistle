import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Brand Column */}
                    <div className="footer-brand">
                        <h2>🛡️ Whistle</h2>
                        <p>
                            The world's first fully decentralized whistleblower platform.
                            Empowering truth through immutable blockchain technology and secure IPFS storage.
                        </p>
                        <p className="copyright-text" style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
                            © 2026 Whistle Protocol. <br /> Open Source & Uncensored.
                        </p>
                    </div>

                    {/* Links Column 1 */}
                    <div className="footer-column">
                        <h4>Platform</h4>
                        <ul className="footer-links">
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/reports">Global Feed</Link></li>
                            <li><Link to="/report">Submit Report</Link></li>
                            <li><a href="#features">How it Works</a></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div className="footer-column">
                        <h4>Resources</h4>
                        <ul className="footer-links">
                            <li><a href="#">Security Guide</a></li>
                            <li><a href="#">PGP Keys</a></li>
                            <li><a href="#">Transparency Report</a></li>
                            <li><a href="#">Canary</a></li>
                        </ul>
                    </div>

                    {/* Links Column 3 */}
                    <div className="footer-column">
                        <h4>Legal</h4>
                        <ul className="footer-links">
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                            <li><a href="#">Disclaimer</a></li>
                            <li><a href="#">Cookie Policy</a></li>
                        </ul>
                    </div>
                </div>


            </div>
        </footer>
    );
};

export default Footer;
