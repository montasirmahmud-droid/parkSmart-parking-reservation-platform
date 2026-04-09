const mongoose = require('mongoose');

/**
 * FINANCE & ACTIVITY LOG MODEL
 * Covers: Feature 15 (Activity Log) and Feature 17 (Rate Management)
 */
const financeSchema = new mongoose.Schema({
    // Feature 15: Links the log to a specific user
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    // Feature 15: Records the exact entry time for the activity log
    entryTime: { 
        type: Date, 
        default: Date.now 
    },
    // Feature 15: Records exit time (null until they leave)
    exitTime: { 
        type: Date 
    },
    // Feature 17: Stores the current hourly rate for this specific parking session
    hourlyRate: { 
        type: Number, 
        default: 10 // Standard rate: $10/hour
    },
    // Feature 15: Status log (e.g., "Parked", "Completed", "Overstay")
    status: { 
        type: String, 
        default: 'Active' 
    }
});

module.exports = mongoose.model('Finance', financeSchema);
