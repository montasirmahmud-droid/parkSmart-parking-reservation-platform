const User = require('../models/User'); // Import our "Library Card" (Model)
const bcrypt = require('bcryptjs');     // Import the "Scrambler" tool

// This function handles the "Sign Up" logic
exports.signup = async (req, res) => {
    try {
        // 1. Get the data from the user (from the website)
        const { username, email, password } = req.body;

        // 2. Security Check: Scramble the password so it's safe
        // We "hash" it so even we can't see the real password!
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create a new User using our Model
        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword // Save the scrambled one, not the real one!
        });

        // 4. Save the user into the MongoDB database
        await newUser.save();

        // 5. Tell the user "Success!"
        res.status(201).json({ message: "User created successfully! Welcome to ParkSmart." });

    } catch (error) {
        // If something goes wrong (like a duplicate email), tell the user why
        res.status(500).json({ error: error.message });
    }
};
