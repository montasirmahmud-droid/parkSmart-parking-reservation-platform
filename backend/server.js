const express = require('express'); // 1. Load the tool
const mongoose = require('mongoose'); 
const cors = require('cors');        // Load the security pass

const app = express();              // 2. NOW start the "App" (the car is built)

// --- MIDDLEWARE (The settings) ---
app.use(cors());                    // Now it's okay to use cors
app.use(express.json());            // Lets the server read JSON data

// --- DATABASE CONNECTION ---
mongoose.connect('mongodb://localhost:27017/parksmart')
    .then(() => console.log("Database Connected! ParkSmart is ready."))
    .catch(err => console.log("Database Error: ", err));

// --- ROUTES ---
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes); 

const financeRoutes = require('./routes/financeRoutes');
app.use('/api/finance', financeRoutes);

// --- START ENGINE ---
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}. ParkSmart is alive!`);
});


