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
    try {
        const { email, password } = req.body;
        console.log("Registering user:", email);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashed },
        });

        console.log("User registered:", user.id);

        const tokens = generateTokens(user.id);
        return res.status(201).json({ user: { id: user.id, email }, ...tokens });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            description: error?.message || "Unexpected error during registration",
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login attempt:", email);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const tokens = generateTokens(user.id);
        console.log("User logged in:", user.id);

        return res.json({ user: { id: user.id, email }, ...tokens });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            description: error?.message || "Unexpected error during login",
        });
    }
};

exports.refreshToken = (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: "Missing refresh token" });
        }

        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);
        const tokens = generateTokens(decoded.userId);
        return res.json(tokens);
    } catch (error) {
        console.error("Refresh token error:", error);
        return res.status(401).json({
            message: "Invalid refresh token",
            description: error?.message || "Token verification failed",
        });
    }
};
