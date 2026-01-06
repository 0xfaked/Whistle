import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import './SocialFeed.css';

const SocialFeed = () => {
    const { walletAddress } = useWallet();
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const data = localStorage.getItem('whistle_global_reports');
        if (data) {
            try {
                let parsed = JSON.parse(data);
                // Ensure vote arrays exist
                parsed = parsed.map(r => ({
                    ...r,
                    upvotes: Array.isArray(r.upvotes) ? r.upvotes : [],
                    downvotes: Array.isArray(r.downvotes) ? r.downvotes : []
                }));
                setPosts(parsed);
            } catch (e) {
                console.error("Failed to load feed", e);
            }
        }
    }, []);

    const handleVote = (reportId, type) => {
        if (!walletAddress) {
            alert("Please connect your wallet to interact.");
            return;
        }

        const updatedPosts = posts.map(post => {
            if (post.id !== reportId) return post;

            let newUpvotes = [...post.upvotes];
            let newDownvotes = [...post.downvotes];
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

            return { ...post, upvotes: newUpvotes, downvotes: newDownvotes };
        });

        setPosts(updatedPosts);
        localStorage.setItem('whistle_global_reports', JSON.stringify(updatedPosts));
    };

    const formatTime = (isoString) => {
        const date = new Date(isoString);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="social-feed-page">
            <div className="feed-container">
                {/* Header within feed for mobile feel */}
                <div className="feed-header-sticky">
                    <h2 className="feed-title">Public Feed</h2>
                    <span style={{ fontSize: '1.2rem' }}>🌐</span>
                </div>

                {posts.length === 0 ? (
                    <div className="no-posts">
                        <h3>All caught up!</h3>
                        <p>No reports to show right now.</p>
                        <Link to="/report" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                            Report Now
                        </Link>
                    </div>
                ) : (
                    posts.map(post => {
                        const isUpvoted = post.upvotes.includes(walletAddress);
                        const isDownvoted = post.downvotes.includes(walletAddress);

                        // Extract images for the "media" part
                        const mediaAttachments = (post.attachments || []).filter(a => a.type.startsWith('image/'));
                        const otherAttachments = (post.attachments || []).filter(a => !a.type.startsWith('image/'));

                        return (
                            <div key={post.id} className="feed-post">
                                {/* Header */}
                                <div className="post-header">
                                    <div className="post-avatar">👤</div>
                                    <div className="post-meta">
                                        <div className="post-author">
                                            {post.author.slice(0, 6)}...{post.author.slice(-4)}
                                        </div>
                                        <div className="post-time">{formatTime(post.timestamp)}</div>
                                    </div>
                                    <div style={{ opacity: 0.5 }}>•••</div>
                                </div>

                                {/* Media Carousel (if images exist) */}
                                {mediaAttachments.length > 0 && (
                                    <div className="post-media">
                                        {mediaAttachments.map(att => (
                                            <div key={att.id} className="media-item">
                                                <img src={att.data} alt="Evidence" className="media-img" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Content Short Preview */}
                                <div className="post-content" style={{ paddingTop: mediaAttachments.length > 0 ? '1rem' : '0' }}>
                                    <p>{post.content.replace(/<[^>]*>/g, '').slice(0, 200)}
                                        {post.content.length > 200 ? '...' : ''}
                                    </p>
                                </div>

                                {/* Other Files Badge */}
                                {otherAttachments.length > 0 && (
                                    <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.5rem' }}>
                                        {otherAttachments.map(att => (
                                            <div key={att.id} style={{
                                                background: 'rgba(255,255,255,0.1)',
                                                padding: '0.5rem',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.8rem',
                                                display: 'flex', alignItems: 'center', gap: '0.3rem'
                                            }}>
                                                📄 {att.name}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="post-actions">
                                    <button
                                        className={`action-btn ${isUpvoted ? 'active up' : ''}`}
                                        onClick={() => handleVote(post.id, 'up')}
                                    >
                                        {isUpvoted ? '❤️' : '🤍'}
                                        <span className="action-count">{post.upvotes.length}</span>
                                    </button>

                                    <button
                                        className={`action-btn ${isDownvoted ? 'active down' : ''}`}
                                        onClick={() => handleVote(post.id, 'down')}
                                    >
                                        {isDownvoted ? '👎' : '👎'}
                                        <span className="action-count">{post.downvotes.length}</span>
                                    </button>

                                    <button className="action-btn" onClick={() => navigator.clipboard.writeText(window.location.origin + '/reports/' + post.id)}>
                                        📤
                                    </button>

                                    <Link to={`/reports/${post.id}`} className="read-btn">
                                        Read Full Report →
                                    </Link>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default SocialFeed;
