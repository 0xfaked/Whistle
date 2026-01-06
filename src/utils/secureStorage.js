// utils/secureStorage.js
// Simple encryption/decryption helpers for draft storage.
// In a real app you would use proper cryptography (e.g., AES with a derived key).
// Here we simulate encryption by base64‑encoding the JSON string combined with a simple XOR using the address as a key.

export const encryptDraft = (data, address) => {
    try {
        const json = JSON.stringify(data);
        // Simple XOR with address characters (not secure, just for demo)
        const key = address || '';
        let xor = '';
        for (let i = 0; i < json.length; i++) {
            const charCode = json.charCodeAt(i) ^ (key.charCodeAt(i % key.length) || 0);
            xor += String.fromCharCode(charCode);
        }
        // Encode to base64 for safe storage
        return btoa(xor);
    } catch (e) {
        console.error('Encryption error', e);
        return null;
    }
};

export const decryptDraft = (cipher, address) => {
    try {
        const decoded = atob(cipher);
        const key = address || '';
        let json = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ (key.charCodeAt(i % key.length) || 0);
            json += String.fromCharCode(charCode);
        }
        return JSON.parse(json);
    } catch (e) {
        console.error('Decryption error', e);
        return null;
    }
};
