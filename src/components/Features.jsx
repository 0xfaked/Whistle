import React from 'react';

const Features = () => {
    const features = [
        {
            icon: '🕶️',
            title: 'Total Anonymity',
            desc: 'We do not track IP addresses, browser fingerprints, or metadata. Your identity remains strictly yours.'
        },
        {
            icon: '🛡️',
            title: 'End-to-End Encryption',
            desc: 'All data is encrypted on your device before transmission. Only the intended recipient holds the key.'
        },
        {
            icon: '⚖️',
            title: 'Legal Protection',
            desc: 'Our platform is compliant with international whistleblower protection laws (EU Directive, SOX).'
        },
        {
            icon: '📁',
            title: 'Secure File Drop',
            desc: 'Upload documents, photos, and evidence securely. Metadata is automatically stripped from files.'
        }
    ];

    return (
        <section className="section-padding" id="features">
            <div className="container">
                <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
                    <h2>Why Trust Whistle?</h2>
                    <p>We've built a fortress around your information. No compromises.</p>
                </div>

                <div className="features-grid">
                    {features.map((f, i) => (
                        <div className="glass-panel feature-card" key={i}>
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p style={{ marginTop: '0.5rem' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
