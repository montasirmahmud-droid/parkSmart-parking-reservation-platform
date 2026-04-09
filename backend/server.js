const express = require('express'); // 1. Load the web server tool
const mongoose = require('mongoose'); // NEW: Load the Database tool
const app = express();              // 2. Start the "App" (the server)

app.use(express.json()); // 3. Logic: This lets the server read JSON data from the user

// --- NEW: DATABASE CONNECTION ---
// This tells the server WHERE to save the data (Member 3 Finance logic needs this!)
mongoose.connect('mongodb://localhost:27017/parksmart')
    .then(() => console.log("Database Connected! ParkSmart is ready to save users."))
    .catch(err => console.log("Database Error: ", err));
// --------------------------------

// 4. Link your Member 3 Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); // This makes your signup live at /api/auth/signup

// 5. Start the engine
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}. ParkSmart is alive!`);
});
