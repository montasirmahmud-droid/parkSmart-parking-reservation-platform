const User = require('../models/User'); 
const bcrypt = require('bcryptjs');
// Step 1: Add the JWT tool
const jwt = require('jsonwebtoken'); 

// --- SIGNUP LOGIC (Exactly as you wrote it) ---
exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "That email is already registered!" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword 
        });
        await newUser.save();
        res.status(201).json({ message: "User created successfully! Welcome to ParkSmart." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- LOGIN LOGIC (Safe Update) ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Wrong password!" });

        // Step 2: Create the "Digital Key" (Token)
        // We put the User ID and Role inside the key
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || "dev-secret",
            //'secret_key_123',  //previously used
            { expiresIn: '1d' }
        );

        // Step 3: Send back the response (Added token: token)
        res.status(200).json({
            message: "Login successful!",
            token: token, 
            role: user.role,
            username: user.username
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- LOGOUT LOGIC (Exactly as you wrote it) ---
exports.logout = async (req, res) => {
    res.status(200).json({ message: "Logged out successfully." });
};
