import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { getIPFSUrl } from '../utils/ipfs';
import './ReportsFeed.css';

const ReportsFeed = () => {
    const { walletAddress } = useWallet();
    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                let fetchedReports = [];

                // 1. Try fetching from Blockchain
                if (window.ethereum) {
                    try {
                        // Use a public RPC or the injected provider
                        const provider = new ethers.BrowserProvider(window.ethereum);
                        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

                        const count = await contract.getReportsCount();
                        console.log("Chain Report Count:", count.toString());

                        // Fetch latest 10 reports (reverse order)
                        const total = Number(count);
                        const start = Math.max(0, total - 10);

                        const promises = [];
                        for (let i = total - 1; i >= start; i--) {
                            promises.push(contract.reports(i));
                        }

                        const rawReports = await Promise.all(promises);

                        // Fetch IPFS Content for each
                        const contentPromises = rawReports.map(async (r, index) => {
                            const cid = r.cid;
                            try {
                                const response = await fetch(getIPFSUrl(cid));
                                const json = await response.json();
                                return {
                                    id: cid, // Use CID as ID
                                    ...json, // content, attachments, etc.
                                    author: r.author,
                                    timestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
                                    txHash: "Confirmed",
                                    upvotes: json.upvotes || [],
                                    downvotes: json.downvotes || []
                                };
                            } catch (err) {
                                console.error("Error fetching IPFS", cid, err);
                                return null;
                            }
                        });

                        fetchedReports = (await Promise.all(contentPromises)).filter(r => r !== null);
                    } catch (e) {
                        console.warn("Blockchain fetch failed, falling back to local.", e);
                    }
                }

                setReports(fetchedReports);
            } catch (e) {
                console.error("Failed to load reports", e);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleVote = (e, reportId, type) => {
        e.preventDefault(); // Prevent link navigation if inside a link (though buttons should be outside)
        if (!walletAddress) {
            alert("Please connect your wallet to vote.");
            return;
        }

        const updatedReports = reports.map(report => {
            if (report.id !== reportId) return report;

            let newUpvotes = [...report.upvotes];
            let newDownvotes = [...report.downvotes];
            const hasUpvoted = newUpvotes.includes(walletAddress);
            const hasDownvoted = newDownvotes.includes(walletAddress);

            if (type === 'up') {
                if (hasUpvoted) {
                    // Toggle off
                    newUpvotes = newUpvotes.filter(a => a !== walletAddress);
                } else {
                    // Add upvote, remove downvote if exists
                    newUpvotes.push(walletAddress);
                    if (hasDownvoted) newDownvotes = newDownvotes.filter(a => a !== walletAddress);
                }
            } else if (type === 'down') {
                if (hasDownvoted) {
                    // Toggle off
                    newDownvotes = newDownvotes.filter(a => a !== walletAddress);
                } else {
                    // Add downvote, remove upvote if exists
                    newDownvotes.push(walletAddress);
                    if (hasUpvoted) newUpvotes = newUpvotes.filter(a => a !== walletAddress);
                }
            }

            return { ...report, upvotes: newUpvotes, downvotes: newDownvotes };
        });

        setReports(updatedReports);
        localStorage.setItem('whistle_global_reports', JSON.stringify(updatedReports));
    };

    const getPreview = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.innerText || tmp.textContent || "";
    };

    return (
        <div className="feed-page section-padding">
            <div className="container">
                <div className="feed-header">
                    <h2>Global Whistleblower Feed</h2>
                    <p>
                        Secure, anonymous, and uncensored reports from around the world.
                        Powered by decentralized storage.
                    </p>
                </div>

                <div className="reports-grid">
                    {loading ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                            Loading from Sepolia Network... ⛓️
                        </div>
                    ) : reports.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                            No reports published yet. Be the first to blow the whistle.
                        </div>
                    ) : (
                        reports.map(report => {
                            const upCount = (report.upvotes || []).length;
                            const downCount = (report.downvotes || []).length;
                            const isUpvoted = (report.upvotes || []).includes(walletAddress);
                            const isDownvoted = (report.downvotes || []).includes(walletAddress);

                            return (
                                <div key={report.id} className="report-card glass-panel">
                                    <div className="card-header">
                                        <div className="author-info">
                                            <div className="avatar">🕵️</div>
                                            <div>
                                                <div className="author-addr">{report.author.slice(0, 6)}...{report.author.slice(-4)}</div>
                                                <div className="timestamp">{new Date(report.timestamp).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="report-tx" title="Immutable Transaction">
                                            {report.txHash === 'Confirmed' ? '✅ On-Chain' : `TX: ${report.txHash?.slice(0, 8)}...`}
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <p>{getPreview(report.content)}</p>
                                    </div>

                                    {report.attachments && report.attachments.length > 0 && (
                                        <div className="attachments-preview">
                                            {report.attachments.map((att) => (
                                                <div key={att.id}>
                                                    {att.type.startsWith('image/') ? (
                                                        <div className="att-thumb" style={{ backgroundImage: `url(${att.data})` }}></div>
                                                    ) : (
                                                        <div className="att-file">📄</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="card-footer">
                                        <div className="vote-controls">
                                            <button
                                                className={`vote-btn up ${isUpvoted ? 'active' : ''}`}
                                                onClick={(e) => handleVote(e, report.id, 'up')}
                                                title="Upvote"
                                            >
                                                ▲
                                            </button>
                                            <span className="vote-count">{upCount}</span>

                                            <button
                                                className={`vote-btn down ${isDownvoted ? 'active' : ''}`}
                                                onClick={(e) => handleVote(e, report.id, 'down')}
                                                title="Downvote"
                                            >
                                                ▼
                                            </button>
                                            <span className="vote-count">{downCount}</span>
                                        </div>

                                        <Link to={`/reports/${report.id}`} className="btn-read-more" style={{ textDecoration: 'none' }}>
                                            Read Full Report
                                        </Link>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsFeed;
