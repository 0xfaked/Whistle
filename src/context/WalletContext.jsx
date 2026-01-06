import React, { createContext, useState, useEffect, useContext } from 'react';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [injectedProviders, setInjectedProviders] = useState(new Map());

    // EIP-6963: Detect multiple injected providers
    useEffect(() => {
        const onAnnounceProvider = (event) => {
            setInjectedProviders(prev => {
                const newMap = new Map(prev);
                newMap.set(event.detail.info.uuid, event.detail);
                return newMap;
            });
        };

        window.addEventListener("eip6963:announceProvider", onAnnounceProvider);
        window.dispatchEvent(new Event("eip6963:requestProvider"));

        return () => window.removeEventListener("eip6963:announceProvider", onAnnounceProvider);
    }, []);

    // Check for existing connection (MetaMask standard)
    useEffect(() => {
        if (typeof window.ethereum !== 'undefined') {
            // access existing accounts if already connected
            window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                }
            });

            window.ethereum.on('accountsChanged', (accounts) => {
                setWalletAddress(accounts.length > 0 ? accounts[0] : null);
            });
        }
    }, []);

    const connectWallet = async (providerDetail) => {
        setIsConnecting(true);
        try {
            const provider = providerDetail.provider;
            const accounts = await provider.request({ method: 'eth_requestAccounts' });
            if (accounts.length > 0) setWalletAddress(accounts[0]);
        } catch (error) {
            console.error("Connection failed", error);
            alert("Connection failed: " + error.message);
        } finally {
            setIsConnecting(false);
        }
    };

    const connectStandard = async (type) => {
        if (type === 'MetaMask') {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    setIsConnecting(true);
                    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                    setWalletAddress(accounts[0]);
                } catch (e) { console.error(e); } finally { setIsConnecting(false); }
            } else {
                alert("MetaMask not detected.");
            }
        } else {
            alert("Please use a supported wallet extension.");
        }
    };

    const disconnectWallet = () => {
        setWalletAddress(null);
    };

    return (
        <WalletContext.Provider value={{
            walletAddress,
            isConnecting,
            injectedProviders,
            provider: window.ethereum, // Simple fallback for now, ideally we store the selected provider
            connectWallet,
            connectStandard,
            disconnectWallet
        }}>
            {children}
        </WalletContext.Provider>
    );
};
