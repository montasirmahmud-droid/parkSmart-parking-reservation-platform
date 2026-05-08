const mongoose = require('mongoose');

/**
 * FINANCE & ACTIVITY LOG MODEL
 * Covers: Feature 15 (Activity Log) and Feature 17 (Rate Management)
 */

const financeSchema = new mongoose.Schema(
    {
        // Feature 15: Links the log to a specific user
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User',
            required: true 
        }, 

        // Added enum to prevent typos in vehicle types
        vehicleType: { 
            type: String, 
            enum: ['🏍️ 2-Wheeler', '🚗 4-Wheeler', '🚛 6-Wheeler'],
            default: '🚗 4-Wheeler'
        },

        parkingType: {
            type: String,
            enum: ['Booked', 'WalkIn'],
            default: 'Booked'
        },

        // Feature 17: Stores the current hourly rate for this specific parking session
        hourlyRate: { 
            type: Number, 
            default: 100  // Standard rate: BDT100/hour
        },
        
        penaltyRatePer10Minutes: {
            type: Number,
            default: 25
        },

        //accessibilityVerified: {type: Boolean,default: false},  /// fututre plan


        gracePeriodinMinutes: {
            type: Number, 
            default: 15
        },

        //gracePeriod: {type: String, default: "30 minutes"},  
        
        //parkingSpaceType: {type: String, enum: ['Regular', 'Accessible'], default: 'Regular'},   /// fututre plan


        // Feature 15: Records the exact entry time for the activity log
        entryTime: { 
            type: Date, 
            default: Date.now 
        },

        // Feature 15: Records exit time (null until they leave)
        expectedExitTime: { 
            type: Date 
        },

        expectedDurationInHours: {
            type: Number,
            default: 1.0    // Standard duration: 1hour
        },   

        expectedFee: {
            type: Number,
            default: 0
        },


        //Records the actual exit time in case of a overstay(Grace Period included.)
        actualExitTime: {
            type: Date
        },

        overstayDuration: {
            type: String,
            default: "0 minutes"
        },

        receivedGracePeriod: {
            type: String,
            default: "0 minutes"
        },
        
        //overstayMinutes: {type: Number,default: 0},
        penalizedDuration: {
            type: String,
            default: "0 minutes"
        },

        penaltyFee: {
            type: Number,
            default: 0
        },

        totalFee: { 
            type: Number, 
            default: 0 
        },
        

        // Feature 15: Status log (e.g., "Parked", "Completed", "Overstay")
        status: { 
            type: String, 
            enum: ['Booked', 'Active', 'Completed', 'Cancelled', 'Overstay'], 
            default: 'Active' 
        },


        cancelledAt: {
            type: Date
        },

        cancellationFee: {
            type: Number,
            default: 0
        },

        cancellationNote: {
            type: String,
            default: ""
        }        

    },
    { versionKey: false }

);

module.exports = mongoose.model('Finance', financeSchema);

