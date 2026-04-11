const express = require('express'); // 1. Load the tool
const mongoose = require('mongoose'); 
const cors = require('cors');        // Load the security pass

const app = express();              // 2. NOW start the "App" (the car is built)

// --- MIDDLEWARE (The settings) ---
app.use(cors());                    // Now it's okay to use cors
app.use(express.json());            // Lets the server read JSON data

// --- DATABASE CONNECTION ---

//const dbURI = 'mongodb://localhost:27017/parksmart'

// from this part is for temp database
const dbURI = "mongodb://SysAdmin_1:SysAdmin12345@ac-v0rralt-shard-00-00.zyigojp.mongodb.net:27017,ac-v0rralt-shard-00-01.zyigojp.mongodb.net:27017,ac-v0rralt-shard-00-02.zyigojp.mongodb.net:27017/?ssl=true&replicaSet=atlas-xlu1r0-shard-0&authSource=admin&appName=ParkSmartCluster"


mongoose.connect(dbURI)
    .then(() => console.log("Database Connected! ParkSmart is ready."))
    .catch((err) => console.log("Database Error: ", err));

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


//temp database didn't connect with these:
//mongodb+srv://SysAdmin_1:<db_password>@parksmartcluster.zyigojp.mongodb.net/?appName=ParkSmartCluster
//const dbURI = 'mongodb+srv://SysAdmin_1:SysAdmin12345@parksmartcluster.zyigojp.mongodb.net/?appName=ParkSmartCluster'
