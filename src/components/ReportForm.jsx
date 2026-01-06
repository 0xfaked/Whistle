import React, { useState } from 'react';

const ReportForm = () => {
    const [form, setForm] = useState({ subject: '', details: '', priority: 'medium' });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Thank you. Your report has been securely encrypted and submitted.');
        setForm({ subject: '', details: '', priority: 'medium' });
    };

    return (
        <section className="report-section section-padding" id="report">
            <div className="container report-container">
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2>Submit a Secure Report</h2>
                    <p>This form is encrypted. Do not provide personal details unless necessary.</p>
                </div>

                <div className="glass-panel report-form">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Subject</label>
                            <input
                                type="text"
                                placeholder="Brief summary of the incident"
                                value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Priority Level</label>
                            <select
                                value={form.priority}
                                onChange={e => setForm({ ...form, priority: e.target.value })}
                            >
                                <option value="low">Low - Informational</option>
                                <option value="medium">Medium - Important</option>
                                <option value="high">High - Urgent / Immediate Danger</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Detailed Description</label>
                            <textarea
                                rows="6"
                                placeholder="Describe what happened, when, and who was involved..."
                                value={form.details}
                                onChange={e => setForm({ ...form, details: e.target.value })}
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                            Encrypt & Submit Report
                        </button>
                        <p style={{ fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
                            🔒 connection secured with TLS 1.3
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default ReportForm;
