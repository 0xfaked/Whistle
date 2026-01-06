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
        if (!address) {
            alert('Connect your wallet first.');
            return;
        }
        const content = editorRef.current?.innerHTML || '';

        if (!content.trim() && attachments.length === 0) {
            alert("Report is empty.");
            return;
        }

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

                        <button className="btn btn-outline" onClick={saveCurrentDraft}>Save Draft</button>
                        <button className="btn btn-primary" onClick={handleSubmit}>Submit Report</button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="toolbar">
                    <button className="tool-btn" title="Bold" onClick={() => execCommand('bold')}><strong>B</strong></button>
                    <button className="tool-btn" title="Italic" onClick={() => execCommand('italic')}><em>I</em></button>
                    <button className="tool-btn" title="Underline" onClick={() => execCommand('underline')}><u>U</u></button>
                    <button className="tool-btn" title="Link" onClick={() => {
                        const url = prompt('Enter URL');
                        if (url) execCommand('createLink', url);
                    }}>🔗</button>
                    <div className="divider"></div>
                    <button className="tool-btn" title="Attach File" onClick={() => fileInputRef.current.click()}>
                        📎 <span style={{ fontSize: '0.8rem', marginLeft: '0.2rem' }}>Attach</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept="image/*,application/pdf"
                        multiple
                    />
                </div>

                {/* Editor */}
                <div
                    className="glass-panel editor-container"
                    contentEditable
                    ref={editorRef}
                    onInput={handleInput}
                    placeholder="Start typing your report here..."
                    style={{ minHeight: '300px', padding: '1.5rem' }}
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
        </div>
    );
};

export default ReportEditor;
