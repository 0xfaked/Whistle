import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { encryptDraft, decryptDraft } from '../utils/secureStorage';
import { uploadToIPFS } from '../utils/ipfs';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/contract';
import { ethers } from 'ethers';
import './ReportEditor.css';

// debounce helper (3 s)
const debounce = (fn, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
};

const ReportEditor = () => {
    const { walletAddress } = useWallet();
    const navigate = useNavigate();
    const address = walletAddress;

    const [status, setStatus] = useState('New'); // New | Saved | Saving… | Unsaved
    const [drafts, setDrafts] = useState([]);
    const [showDraftsPanel, setShowDraftsPanel] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [currentDraftId, setCurrentDraftId] = useState(null);
    const [attachments, setAttachments] = useState([]); // [{id, name, type, data}]
    const editorRef = useRef(null);
    const fileInputRef = useRef(null);

    // Load all drafts on mount
    useEffect(() => {
        if (!address) {
            setDrafts([]);
            return;
        }
        const encrypted = localStorage.getItem(`drafts_collection_${address}`);
        if (encrypted) {
            const decrypted = decryptDraft(encrypted, address);
            if (Array.isArray(decrypted)) {
                setDrafts(decrypted);
            }
        }
    }, [address]);

    // Keyboard Shortcut for Save (Ctrl+S / Cmd+S)
    const saveCurrentDraftRef = useRef(null);

    // Update ref on every render so the event listener always calls the latest version
    useEffect(() => {
        saveCurrentDraftRef.current = saveCurrentDraft;
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (saveCurrentDraftRef.current) {
                    saveCurrentDraftRef.current();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Persist drafts to storage
    const persistDrafts = (updatedDrafts) => {
        if (!address) return;
        try {
            const encrypted = encryptDraft(updatedDrafts, address);
            localStorage.setItem(`drafts_collection_${address}`, encrypted);
            setDrafts(updatedDrafts);
        } catch (e) {
            alert("Storage limit reached. Please remove some attachments or drafts.");
            setStatus('Error');
        }
    };

    const saveCurrentDraft = () => {
        if (!address) return;
        setStatus('Saving…');

        const content = editorRef.current?.innerHTML || '';
        if (!content.trim() && attachments.length === 0) {
            setStatus('Empty');
            return;
        }

        const now = new Date().toISOString();
        let updatedDrafts = [...drafts];

        const draftData = {
            content,
            attachments,
            updatedAt: now
        };

        if (currentDraftId) {
            // Update existing
            updatedDrafts = updatedDrafts.map(d =>
                d.id === currentDraftId ? { ...d, ...draftData } : d
            );
        } else {
            // Create new
            const newId = Date.now();
            const newDraft = { id: newId, ...draftData, createdAt: now };
            updatedDrafts.unshift(newDraft); // Add to top
            setCurrentDraftId(newId);
        }

        persistDrafts(updatedDrafts);
        setStatus('Saved');
    };

    const debouncedSave = useCallback(debounce(saveCurrentDraft, 2000), [drafts, currentDraftId, address, attachments]);

    const handleInput = () => {
        setStatus('Unsaved');
        debouncedSave();
    };

    const loadDraft = (draft) => {
        if (status === 'Unsaved') {
            if (!window.confirm("You have unsaved changes. Discard them?")) return;
        }

        setCurrentDraftId(draft.id);
        setAttachments(draft.attachments || []);
        if (editorRef.current) {
            editorRef.current.innerHTML = draft.content;
        }
        setStatus('Saved');
        setShowDraftsPanel(false);
    };

    const createNewReport = () => {
        if (status === 'Unsaved') {
            if (!window.confirm("You have unsaved changes. Discard them?")) return;
        }
        setCurrentDraftId(null);
        setAttachments([]);
        if (editorRef.current) editorRef.current.innerHTML = '';
        setStatus('New');
        setShowDraftsPanel(false);
    };

    const deleteDraft = (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Delete this draft permanently?")) return;
        const updated = drafts.filter(d => d.id !== id);
        persistDrafts(updated);
        if (currentDraftId === id) {
            createNewReport();
        }
    };

    // File Handling
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const MAX_SIZE = 2 * 1024 * 1024;

        files.forEach(file => {
            if (file.size > MAX_SIZE) {
                alert(`File ${file.name} is too large (Max 2MB).`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (evt) => {
                setAttachments(prev => {
                    const newAtt = [
                        ...prev,
                        {
                            id: Date.now() + Math.random(),
                            name: file.name,
                            type: file.type,
                            data: evt.target.result
                        }
                    ];
                    setTimeout(saveCurrentDraft, 100);
                    return newAtt;
                });
            };
            reader.readAsDataURL(file);
        });

        setStatus('Unsaved');
    };

    const removeAttachment = (id) => {
        if (!window.confirm("Remove this attachment?")) return;
        setAttachments(prev => {
            const updated = prev.filter(a => a.id !== id);
            setTimeout(saveCurrentDraft, 100);
            return updated;
        });
    };

    // Toolbar commands
    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        setStatus('Unsaved');
        debouncedSave();
    };

    const handleSubmit = async () => {
        // Validation before modal
        if (!address) {
            alert('Connect your wallet first.');
            return;
        }
        const content = editorRef.current?.innerHTML || '';

        if (!content.trim() && attachments.length === 0) {
            alert("Report is empty.");
            return;
        }

        setShowSubmitModal(true);
    };

    const executeSubmit = async () => {
        setShowSubmitModal(false);
        if (!address) return;

        const content = editorRef.current?.innerHTML || '';

        setStatus('Saving…');

        try {
            // 1. Prepare Data
            const reportData = {
                author: address,
                content: content,
                attachments: attachments,
                timestamp: new Date().toISOString(),
                upvotes: [],
                downvotes: []
            };

            // 2. Upload to IPFS (Decentralized Storage)
            console.log("Uploading to IPFS...");
            const cid = await uploadToIPFS(reportData);
            console.log("IPFS CID:", cid);

            let txHash = 'Pending-On-Chain';

            // 3. Publish to Blockchain (if contract is set)
            if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "YOUR_CONTRACT_ADDRESS_HERE" && window.ethereum) {
                try {
                    // Force switch to Sepolia (Chain ID: 0xaa36a7)
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: '0xaa36a7' }],
                        });
                    } catch (switchError) {
                        // This error code indicates that the chain has not been added to MetaMask.
                        if (switchError.code === 4902) {
                            try {
                                await window.ethereum.request({
                                    method: 'wallet_addEthereumChain',
                                    params: [
                                        {
                                            chainId: '0xaa36a7',
                                            chainName: 'Sepolia Test Network',
                                            nativeCurrency: {
                                                name: 'SepoliaETH',
                                                symbol: 'SepoliaETH',
                                                decimals: 18
                                            },
                                            rpcUrls: ['https://sepolia.infura.io/v3/'],
                                            blockExplorerUrls: ['https://sepolia.etherscan.io']
                                        },
                                    ],
                                });
                            } catch (addError) {
                                throw new Error("Please switch to Sepolia network manually.");
                            }
                        } else {
                            throw switchError;
                        }
                    }

                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner();
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

                    console.log("Sending transaction...");
                    const tx = await contract.publishReport(cid);
                    console.log("Transaction sent:", tx.hash);
                    txHash = tx.hash;

                    await tx.wait();
                    console.log("Transaction confirmed!");
                    alert(`Report Published on Sepolia! TX: ${txHash}`);
                } catch (err) {
                    console.error("Blockchain Error:", err);
                    alert("Blockchain transaction failed. Saving locally only.");
                    // Fallback to local storage if chain fails
                }
            } else {
                console.warn("Contract not configured or wallet missing. Saving to local mock.");
                alert("Report uploaded to IPFS! (Contract not connected yet)");
            }

            // 4. Update Local Feed (Hybrid Approach for UI speed)
            const newReport = {
                id: cid, // Use IPFS CID as ID
                ...reportData,
                txHash: txHash
            };

            const existingFeed = localStorage.getItem('whistle_global_reports');
            const feed = existingFeed ? JSON.parse(existingFeed) : [];
            feed.unshift(newReport);
            localStorage.setItem('whistle_global_reports', JSON.stringify(feed));

            // 5. Cleanup
            if (currentDraftId) {
                const updated = drafts.filter(d => d.id !== currentDraftId);
                persistDrafts(updated);
            }

            createNewReport();
            navigate('/reports');

        } catch (error) {
            console.error("Submission failed", error);
            alert("Failed to submit report. See console.");
            setStatus('Error');
        }
    };

    // Helper to strip HTML for preview
    const getPreview = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "Empty draft";
    };

    return (
        <div className="editor-page section-padding">
            <div className="container">
                {/* Header */}
                <div className="editor-header">
                    <div>
                        <h2>Secure Report Editor</h2>
                        <p className="wallet-status">
                            {address
                                ? <><span className="dot online"></span> {address.slice(0, 6)}...{address.slice(-4)}</>
                                : <><span className="dot offline"></span> Connect wallet to enable drafts</>
                            }
                        </p>
                    </div>
                    <div className="status-indicator">
                        <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>

                        <div style={{ position: 'relative' }}>
                            <button
                                className={`btn btn-outline ${showDraftsPanel ? 'active' : ''}`}
                                onClick={() => setShowDraftsPanel(!showDraftsPanel)}
                            >
                                📜 Drafts ({drafts.length})
                            </button>

                            {/* Drafts Dropdown Panel */}
                            {showDraftsPanel && (
                                <div className="drafts-panel glass-panel">
                                    <div className="panel-header">
                                        <h4>Your Stories</h4>
                                        <button className="btn-text" onClick={createNewReport}>+ New Report</button>
                                    </div>
                                    <div className="drafts-list">
                                        {drafts.length === 0 ? (
                                            <div className="empty-state">No saved drafts yet.</div>
                                        ) : (
                                            drafts.map(draft => (
                                                <div
                                                    key={draft.id}
                                                    className={`draft-item ${currentDraftId === draft.id ? 'current' : ''}`}
                                                    onClick={() => loadDraft(draft)}
                                                >
                                                    <div className="draft-info">
                                                        <span className="draft-date">{new Date(draft.updatedAt).toLocaleString()}</span>
                                                        <p className="draft-preview">{getPreview(draft.content).slice(0, 40)}...</p>
                                                        {draft.attachments?.length > 0 && <span className="att-badge">📎 {draft.attachments.length}</span>}
                                                    </div>
                                                    <button className="btn-icon delete" onClick={(e) => deleteDraft(e, draft.id)}>×</button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>


                        <button className="btn btn-primary" onClick={() => setShowSubmitModal(true)}>Submit Report</button>
                    </div>
                </div>

                {/* Info Header */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧅</span>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1rem' }}>Anonymity Recommendation</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            For true anonymity, we strongly recommend using the Tor Browser or a reliable VPN. This masks your IP address from your ISP and prevents network surveillance, ensuring your submission remains untraceable.
                        </p>
                    </div>
                </div>

                {/* Editor Card */}
                <div className="editor-wrapper glass-panel">
                    {/* Toolbar */}
                    <div className="toolbar">
                        {/* Font Controls */}
                        <div className="toolbar-group">
                            <select
                                className="toolbar-select font-family"
                                onChange={(e) => execCommand('fontName', e.target.value)}
                                defaultValue="Inter"
                            >
                                <option value="Inter">Inter</option>
                                <option value="Arial">Arial</option>
                                <option value="Georgia">Georgia</option>
                                <option value="Courier New">Monospace</option>
                            </select>
                            <select
                                className="toolbar-select font-size"
                                onChange={(e) => execCommand('fontSize', e.target.value)}
                                defaultValue="3"
                            >
                                <option value="1">Small</option>
                                <option value="3">Normal</option>
                                <option value="5">Large</option>
                                <option value="7">Huge</option>
                            </select>
                        </div>

                        <div className="divider"></div>

                        {/* Format: B I U */}
                        <div className="toolbar-group">
                            <button className="tool-btn" title="Bold" onClick={() => execCommand('bold')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>
                            </button>
                            <button className="tool-btn" title="Italic" onClick={() => execCommand('italic')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>
                            </button>
                            <button className="tool-btn" title="Underline" onClick={() => execCommand('underline')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>
                            </button>
                        </div>

                        {/* Color Picker */}
                        <div className="toolbar-group">
                            <label className="color-picker-wrapper" title="Text Color">
                                <input
                                    type="color"
                                    onChange={(e) => execCommand('foreColor', e.target.value)}
                                    defaultValue="#e2e8f0"
                                />
                                <div className="color-circle"></div>
                            </label>
                        </div>

                        <div className="divider"></div>

                        {/* Alignment */}
                        <div className="toolbar-group">
                            <button className="tool-btn" title="Align Left" onClick={() => execCommand('justifyLeft')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="17" y1="18" x2="3" y2="18"></line></svg>
                            </button>
                            <button className="tool-btn" title="Align Center" onClick={() => execCommand('justifyCenter')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="18" y1="18" x2="6" y2="18"></line></svg>
                            </button>
                            <button className="tool-btn" title="Align Right" onClick={() => execCommand('justifyRight')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="7" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Lists */}
                        <div className="toolbar-group">
                            <button className="tool-btn" title="Bullet List" onClick={() => execCommand('insertUnorderedList')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                            </button>
                            <button className="tool-btn" title="Ordered List" onClick={() => execCommand('insertOrderedList')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
                            </button>
                        </div>

                        <div className="divider"></div>

                        {/* Media / Extra */}
                        <div className="toolbar-group">
                            <button className="tool-btn" title="Insert Link" onClick={() => {
                                const url = prompt('Enter URL');
                                if (url) execCommand('createLink', url);
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            </button>
                            <button className="tool-btn" title="Upload Image/File" onClick={() => fileInputRef.current.click()}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            </button>
                            <button className="tool-btn" title="AI Magic (Coming Soon)" style={{ opacity: 0.7 }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                            </button>
                        </div>
                    </div>

                    {/* Editor Input */}
                    <div
                        className="editor-content"
                        contentEditable
                        ref={editorRef}
                        onInput={handleInput}
                        placeholder="Start writing your secure report..."
                    />
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf"
                    multiple
                />

                {/* Attachments Section */}
                {attachments.length > 0 && (
                    <div className="attachments-section glass-panel">
                        <h4>Attachments ({attachments.length})</h4>
                        <div className="attachments-grid">
                            {attachments.map(att => (
                                <div key={att.id} className="attachment-card">
                                    {att.type.startsWith('image/') ? (
                                        <div className="att-preview-img" style={{ backgroundImage: `url(${att.data})` }}></div>
                                    ) : (
                                        <div className="att-preview-file">📄 PDF</div>
                                    )}
                                    <div className="att-info">
                                        <span className="att-name" title={att.name}>{att.name}</span>
                                        <button className="btn-icon delete-att" onClick={() => removeAttachment(att.id)}>×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="wallet-modal-overlay" onClick={() => setShowSubmitModal(false)}>
                    <div className="wallet-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', background: 'var(--bg-color)', border: '1px solid var(--glass-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧅</div>
                            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Confirm Secure Submission</h3>
                        </div>

                        <p style={{
                            color: 'var(--text-secondary)',
                            lineHeight: '1.6',
                            textAlign: 'center',
                            marginBottom: '2rem',
                            padding: '0 1rem'
                        }}>
                            For maximum security, please ensure you are using the Tor network or a trusted VPN.
                            This hides your IP address from your ISP and prevents source tracing, ensuring your submission remains truly anonymous.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowSubmitModal(false)}
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={executeSubmit}
                                style={{ flex: 1, background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }}
                            >
                                Confirm Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportEditor;
