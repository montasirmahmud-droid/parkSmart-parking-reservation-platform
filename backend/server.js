require('dotenv').config();

const express = require('express'); // 1. Load the tool
const mongoose = require('mongoose'); 
const cors = require('cors');        // Load the security pass

const app = express();              // 2. NOW start the "App"

// --- MIDDLEWARE (The settings) ---
app.use(cors());                    // Now it's okay to use cors
app.use(express.json());            // Lets the server read JSON data

// --- DATABASE CONNECTION ---

//const dbURI = 'mongodb://localhost:27017/parksmart'

// from this part is for temp database
const dbURI = process.env.MONGO_URI;


mongoose.connect(dbURI)
    .then(() => console.log("Database Connected! ParkSmart is ready."))
    .catch((err) => console.log("Database Error: ", err));



// --- IMPORT ROUTES ---  
const authRoutes = require('./routes/authRoutes');  
const parkingSlotRoutes = require('./routes/parkingSlotRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const financeRoutes = require('./routes/financeRoutes');
const vehicleRoutes = require('./routes/vehiclesRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


// --- ROUTES ---

//--- Authentication Routes ---
app.use('/api/auth', authRoutes); 

// --- PARKING SLOT ROUTES (Feature 18) ---
//  allows users to view slot details
app.use('/api/slots', parkingSlotRoutes);

// --- RESERVATION ROUTES (Feature 19) ---
// allows extending reservation time
app.use('/api/reservations', reservationRoutes);

// --- RECOMMENDATION ROUTES (Feature 20) ---
//  shows frequently used slots
app.use('/api/recommendations', recommendationRoutes);

//---Vehicle Routes---
app.use('/api/vehicles', vehicleRoutes);

//---Notification Routes---
app.use('/api/notifications', notificationRoutes);

//---Finance Routes---
app.use('/api/finance', financeRoutes);




// --- START ENGINE ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
