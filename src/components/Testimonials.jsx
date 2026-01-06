import React from 'react';
import './Testimonials.css';

const testimonials = [
    {
        id: 1,
        outlet: "The Guardian",
        text: "Whistle has revolutionized how we receive sensitive information. The blockchain verification adds a layer of trust we've never seen before.",
        author: "Investigative Desk"
    },
    {
        id: 2,
        outlet: "NY Times",
        text: "A game-changer for source protection. The anonymity features are robust and truly military-grade.",
        author: "Tech & Privacy"
    },
    {
        id: 3,
        outlet: "TechCrunch",
        text: "Finally, a decentralized solution to censorship. Whistle empowers voices that would otherwise be silenced.",
        author: "Editor in Chief"
    },
    {
        id: 4,
        outlet: "Reuters",
        text: "The speed and security of the IPFS integration allow us to verify assets faster than ever.",
        author: "Global News Team"
    },
    {
        id: 5,
        outlet: "WIRED",
        text: "Web3 meets journalism. This platform is what the future of free speech looks like.",
        author: "Security Analysis"
    },
    {
        id: 6,
        outlet: "BBC News",
        text: "Protecting the whistleblower is paramount. Whistle's architecture ensures zero traceability.",
        author: "Digital Rights"
    }
];

const Testimonials = () => {
    return (
        <section className="testimonials-section">
            <div className="container">
                <div className="testimonials-header">
                    <h2>Verified by Global Media</h2>
                    <p>Trusted by the world's leading investigative journalists.</p>
                </div>

                <div className="marquee-container">
                    <div className="marquee-track">
                        {/* Double the list for seamless infinite scroll */}
                        {[...testimonials, ...testimonials].map((item, index) => (
                            <div key={`${item.id}-${index}`} className="testimonial-card">
                                <div className="outlet-logo">
                                    <span>📰</span> {item.outlet}
                                </div>
                                <p className="quote-text">"{item.text}"</p>
                                <div className="quote-author">— {item.author}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
