import React from 'react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <section className="hero" id="home">
            <div className="hero-bg"></div>
            <div className="container hero-content">
                <div className="hero-text">
                    <h1>Speak Truth to Power, Safely & Anonymously.</h1>
                    <p style={{ marginBottom: '2rem' }}>
                        The world's most secure platform for whistleblowing. We protect your identity with
                        military-grade encryption while ensuring your voice is heard by the right people.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/report" className="btn btn-primary">Report Now</Link>
                        <a href="#features" className="btn btn-outline">How it Works</a>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <h4>100%</h4>
                            <p>Anonymous</p>
                        </div>
                        <div className="stat-item">
                            <h4>256-bit</h4>
                            <p>Encryption</p>
                        </div>
                    </div>
                </div>

                {/* Dynamic Hero Visual */}
                <div className="hero-visual">
                    <div className="pulse-container">
                        <div className="pulse-ring ring-1"></div>
                        <div className="pulse-ring ring-2"></div>
                        <div className="pulse-ring ring-3"></div>
                        <div className="shield-card glass-panel">
                            <div className="shield-icon">🛡️</div>
                            <div className="shield-info">
                                <h4>Sentinel Active</h4>
                                <div className="encryption-line">
                                    <span className="dot online"></span>
                                    <span>E2E Encrypted Channel</span>
                                </div>
                                <div className="code-rain">
                                    0x4f...a92b
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
