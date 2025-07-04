require('dotenv').config();
const { PrismaClient } = require("@prisma/client");
const { ethers } = require("ethers");
const prisma = new PrismaClient();

console.log("Using RPC URL:", process.env.RPC_URL);
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// POST /api/wallet/create
exports.createWallet = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

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
                userId: req.userId,
            },
        });

        console.log("Wallet created for user:", req.userId, savedWallet.address);

        res.status(201).json({
            message: "Wallet created and saved",
            wallet: {
                address: savedWallet.address,
                privateKey: savedWallet.privateKey,
            },
        });
    } catch (err) {
        console.error("Wallet creation error:", err);
        res.status(500).json({ error: "Failed to create wallet", detail: err.message });
    }
};

// POST /api/wallet/import
exports.importWallet = async (req, res) => {
    try {
        const { address, privateKey } = req.body;

        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!address || !privateKey) {
            return res.status(400).json({ message: "Address and privateKey are required" });
        }

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

        console.log("Wallet imported:", savedWallet.address);

        res.status(201).json({ message: "Wallet imported", wallet: { address } });
    } catch (err) {
        console.error("Wallet import error:", err);
        res.status(500).json({ error: "Import failed", detail: err.message });
    }
};

// GET /api/wallet/my
exports.getMyWallets = async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const wallets = await prisma.wallet.findMany({
            where: { userId: req.userId },
            select: { id: true, address: true, createdAt: true },
        });

        res.json(wallets);
    } catch (err) {
        console.error("Fetching wallets failed:", err);
        res.status(500).json({ message: "Failed to fetch wallets", detail: err.message });
    }
};

// GET /api/wallet/balance
exports.getBalance = async (req, res) => {
    try {
        const address = req.query.address || req.body.address;

        if (!address) {
            return res.status(400).json({ message: "Wallet address is required" });
        }

        if (!ethers.isAddress(address)) {
            return res.status(400).json({ message: "Invalid Ethereum address" });
        }

        const balanceWei = await provider.getBalance(address);
        const balanceEth = ethers.formatEther(balanceWei);

        res.json({ address, balance: balanceEth });
    } catch (err) {
        console.error("Fetching balance error:", err);
        res.status(500).json({ message: "Failed to fetch balance", detail: err.message });
    }
};

// Stub for /api/wallet/send
exports.sendTransaction = async (req, res) => {
    res.status(200).json({ message: "Send transaction endpoint not implemented yet." });
};
