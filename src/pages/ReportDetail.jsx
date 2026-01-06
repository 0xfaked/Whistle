import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import './ReportDetail.css';

const ReportDetail = () => {
    const { id } = useParams();
    const { walletAddress } = useWallet();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching specific report
        const data = localStorage.getItem('whistle_global_reports');
        if (data) {
            try {
                const reports = JSON.parse(data);
                let found = reports.find(r => r.id === id);
                if (found) {
                    // Ensure structure exists
                    found = {
                        ...found,
                        upvotes: Array.isArray(found.upvotes) ? found.upvotes : [],
                        downvotes: Array.isArray(found.downvotes) ? found.downvotes : []
                    };
                }
                setReport(found || null);
            } catch (e) {
                console.error("Error loading report", e);
            }
        }
        setLoading(false);
    }, [id]);

    const handleVote = (type) => {
        if (!walletAddress) {
            alert("Please connect your wallet to vote.");
            return;
        }
        if (!report) return;

        // We need to update the global list to persist changes
        const data = localStorage.getItem('whistle_global_reports');
        if (!data) return;

        const reports = JSON.parse(data);
        const updatedReports = reports.map(r => {
            if (r.id !== report.id) return r;

            let newUpvotes = Array.isArray(r.upvotes) ? [...r.upvotes] : [];
            let newDownvotes = Array.isArray(r.downvotes) ? [...r.downvotes] : [];
            const hasUpvoted = newUpvotes.includes(walletAddress);
            const hasDownvoted = newDownvotes.includes(walletAddress);

            if (type === 'up') {
                if (hasUpvoted) {
                    newUpvotes = newUpvotes.filter(a => a !== walletAddress);
                } else {
                    newUpvotes.push(walletAddress);
                    if (hasDownvoted) newDownvotes = newDownvotes.filter(a => a !== walletAddress);
                }
            } else if (type === 'down') {
                if (hasDownvoted) {
                    newDownvotes = newDownvotes.filter(a => a !== walletAddress);
                } else {
                    newDownvotes.push(walletAddress);
                    if (hasUpvoted) newUpvotes = newUpvotes.filter(a => a !== walletAddress);
                }
            }

            const updated = { ...r, upvotes: newUpvotes, downvotes: newDownvotes };
            setReport(updated); // Update local state immediately
            return updated;
        });

        localStorage.setItem('whistle_global_reports', JSON.stringify(updatedReports));
    };

    if (loading) return <div className="section-padding text-center">Loading...</div>;
    if (!report) return <div className="section-padding text-center">Report not found.</div>;

    return (
        <div className="report-detail-page section-padding">
            <div className="container report-container glass-panel">
                <Link to="/reports" className="back-link">← Back to Feed</Link>

                <div className="detail-header">
                    <div className="meta-info">
                        <div className="author-badge">
                            <span>🕵️</span>
                            <span>{report.author.slice(0, 6)}...{report.author.slice(-4)}</span>
                        </div>
                        <span>{new Date(report.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="tx-hash">
                        Verified Transaction Hash: {report.txHash}
                    </div>
                </div>

                <div
                    className="report-body"
                    dangerouslySetInnerHTML={{ __html: report.content }}
                />

                <div className="vote-controls">
                    <button
                        className={`vote-btn up ${(report.upvotes || []).includes(walletAddress) ? 'active' : ''}`}
                        onClick={() => handleVote('up')}
                        title="Upvote"
                    >
                        ▲
                    </button>
                    <span className="vote-count">{(report.upvotes || []).length}</span>

                    <button
                        className={`vote-btn down ${(report.downvotes || []).includes(walletAddress) ? 'active' : ''}`}
                        onClick={() => handleVote('down')}
                        title="Downvote"
                    >
                        ▼
                    </button>
                    <span className="vote-count">{(report.downvotes || []).length}</span>
                </div>

                {report.attachments && report.attachments.length > 0 && (
                    <div className="report-attachments">
                        <h3>Evidence Files ({report.attachments.length})</h3>

                        {report.attachments.map(att => (
                            <div key={att.id} className="attachment-item">
                                {att.type.startsWith('image/') ? (
                                    <div>
                                        <h4>{att.name}</h4>
                                        <img src={att.data} alt={att.name} className="detail-image" />
                                    </div>
                                ) : (
                                    <div className="att-download-card">
                                        <span style={{ fontSize: '2rem' }}>📄</span>
                                        <div>
                                            <strong>{att.name}</strong>
                                            <br />
                                            <a href={att.data} download={att.name} className="btn-text">Download PDF</a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportDetail;
