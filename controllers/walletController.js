require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { ethers } = require("ethers");
const prisma = new PrismaClient();

// Use global RPC provider
console.log("Using RPC URL:", process.env.RPC_URL);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// sample
// {
//   "message": "Wallet created and saved",
//   "wallet": {
//     "address": "0x88114d1ea55a918c9Cc7e6A71cCc02Da6E1A3A0D",
//     "privateKey": "0x8221eea99d098bfa2c117fe66f9737c8a9a8f6787744bb0bf6b0e2833295bc6c"
//   }
// }

// POST /api/wallet/create
exports.createWallet = async (req, res) => {
    try {
        const wallet = ethers.Wallet.createRandom();
        const connectedWallet = wallet.connect(provider);

        const existing = await prisma.wallet.findUnique({
            where: { address: wallet.address },
        });

        if (existing) {
            return res.status(400).json({ message: "Wallet already exists" });
        }

        const savedWallet = await prisma.wallet.create({
            data: {
                address: wallet.address,
                privateKey: wallet.privateKey,
                userId: req.userId, // comes from JWT middleware
            },
        });

        res.json({
            message: "Wallet created and saved",
            wallet: {
                address: savedWallet.address,
                privateKey: savedWallet.privateKey,
            },
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to create wallet", detail: err.message });
    }
};

// POST /api/wallet/import
exports.importWallet = async (req, res) => {
    const { address, privateKey } = req.body;

    try {
        const exists = await prisma.wallet.findUnique({ where: { address } });

        if (exists) {
            return res.status(400).json({ message: "Wallet already imported" });
        }

        const wallet = new ethers.Wallet(privateKey);
        if (wallet.address.toLowerCase() !== address.toLowerCase()) {
            return res.status(400).json({ message: "Address doesn't match private key" });
        }

        const savedWallet = await prisma.wallet.create({
            data: {
                address,
                privateKey,
                userId: req.userId,
            },
        });

        res.json({ message: "Wallet imported", wallet: { address } });
    } catch (err) {
        res.status(500).json({ error: "Import failed", detail: err.message });
    }
};

// sample
// [
//   {
//     "id": 1,
//     "address": "0x88114d1ea55a918c9Cc7e6A71cCc02Da6E1A3A0D",
//     "createdAt": "2025-07-04T05:32:26.036Z"
//   }
// ]
// GET /api/wallet/my
exports.getMyWallets = async (req, res) => {
    const wallets = await prisma.wallet.findMany({
        where: { userId: req.userId },
        select: { id: true, address: true, createdAt: true },
    });

    res.json(wallets);
};

// GET /api/wallet/balance
// Accept address as query param or in request body
// sample
// {
//     "address": "0x88114d1ea55a918c9Cc7e6A71cCc02Da6E1A3A0D",
//     "balance": "0.0"
// }
exports.getBalance = async (req, res) => {
    try {
        // You can send address as query param or in body, e.g. ?address=0x...
        const address = req.query.address || req.body.address;
        if (!address) {
            return res.status(400).json({ message: "Wallet address is required" });
        }

        // Validate that the address is a valid Ethereum address
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ message: "Invalid Ethereum address" });
        }

        // Use global provider from your setup
        const balanceWei = await provider.getBalance(address);

        // Convert balance from Wei to ETH string
        const balanceEth = ethers.formatEther(balanceWei);

        res.json({ address, balance: balanceEth });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch balance", detail: err.message });
    }
};

exports.sendTransaction = async (req, res) => {
    res.status(200).json({ message: "Send transaction endpoint not implemented yet." });
};
