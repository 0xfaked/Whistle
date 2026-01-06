import axios from 'axios';

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

export const uploadToIPFS = async (data) => {
    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${PINATA_JWT}`
            }
        });
        return res.data.IpfsHash; // Returns the CID
    } catch (error) {
        console.error("Error uploading to IPFS:", error);
        throw error;
    }
};

export const getIPFSUrl = (cid) => {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
};
