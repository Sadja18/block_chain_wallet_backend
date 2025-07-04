const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_EXPIRY,
    });

    return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { email, password: hashed },
    });

    const tokens = generateTokens(user.id);
    res.json({ user: { id: user.id, email }, ...tokens });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const tokens = generateTokens(user.id);
    res.json({ user: { id: user.id, email }, ...tokens });
};

exports.refreshToken = (req, res) => {
    const { token } = req.body;
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
        const tokens = generateTokens(decoded.userId);
        res.json(tokens);
    } catch (err) {
        res.status(401).json({ message: "Invalid refresh token" });
    }
};
