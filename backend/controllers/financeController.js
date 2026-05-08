const Finance = require('../models/Finance');
const User = require('../models/User');
const axios = require('axios');


// This simulates the Settings collection for now
const PARKING_SETTINGS = {
    baseHourlyRate: 100,
    penaltyBlockPeriod: 10,
    penaltyBlockRate: 25,
    gracePeriodinMinutes: 15,                    //gracePeriodinMinutes = user.accessibilityVerified ? 30 : 15;    ///future plan for special needs
    buffer: 10,
    bookingPreHour:1,

    freeCancellationBeforeEntryMinutes: 30,
    cancellationBlockPeriod: 30,
    cancellationBlockRate: 20
};

//Function to calculate the multiplier based on vehicle size
function getVehicleMultiplier(vehicleType) { 
    if (vehicleType === '🏍️ 2-Wheeler') return 0.5;          // Half price
    if (vehicleType === '🚛 6-Wheeler') return 2.0;         // Double price
    return 1.0;                                            // Default for 🚗 4-Wheeler
}

function calculateWalkInChargedHours(actualStayMins) {
    const blockSize = 30;
    const buffer = PARKING_SETTINGS.buffer;

    const fullBlocks = Math.floor(actualStayMins / blockSize);
    const extraMins = actualStayMins % blockSize;

    if (actualStayMins <= buffer) {
        return 0;
    }

    if (extraMins <= buffer) {
        return fullBlocks * 0.5;
    }

    return (fullBlocks + 1) * 0.5;
}

//For parking penalties, rounding up to the nearest 5,so penalties can be charged in fixed payable blocks. 
function roundUpToNearest5(amount) {
    return Math.ceil(amount / 5) * 5;            //(25/2=12.5 bdt is not practical. So charging 15bdt.)
}

//converting minutes into a readable duration for display.
function formatMinutesDuration(totalMinutes) {
    const fullHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    if (fullHours === 0) {
        return `${remainingMinutes} minutes`;
    }

    if (remainingMinutes === 0) {
        return fullHours === 1 ? "1 hour" : `${fullHours} hours`;
    }

    const hourText = fullHours === 1 ? "1 hour" : `${fullHours} hours`;
    return `${hourText} ${remainingMinutes} minutes`;
}

function formatHoursDuration(hours) {
    const totalMinutes = Math.round(hours * 60);
    return formatMinutesDuration(totalMinutes);
}

//using 10 minutes blocks for overstay calculation. 
function formatOverstayDuration(totalBlocks) {                        // 6 blocks = 1 hour
    const totalMinutes = totalBlocks * 10;
    return formatMinutesDuration(totalMinutes);
}




// Preview parking entry before saving to MongoDB, record entry confirmation check
exports.previewEntry = async (req, res) => {
    try {
        const { userId, hourlyRate, vehicleType, entryTime, exitTime } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "Please enter a username, email, or user ID." });
        }

        let user = await User.findOne({
            $or: [
                { username: userId },
                { email: userId }
            ]
        });

        if (!user && userId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await User.findById(userId);
        }

        if (!user) {
            return res.status(404).json({ message: "User not found. Try username, email, or MongoDB ID." });
        }

        const finalVehicleType = vehicleType || '🚗 4-Wheeler';
        const multiplier = getVehicleMultiplier(finalVehicleType);

        const finalHourlyRate = roundUpToNearest5(
            Number(hourlyRate ?? PARKING_SETTINGS.baseHourlyRate) * multiplier
        );

        const finalPenaltyRate = roundUpToNearest5(
            PARKING_SETTINGS.penaltyBlockRate * multiplier
        );

        const selectedEntryTime = entryTime ? new Date(entryTime) : new Date();
        const selectedExpectedExitTime = exitTime ? new Date(exitTime) : null;

        const parkingType = selectedExpectedExitTime ? "Booked" : "WalkIn";

        const now = new Date();
        const bookingAllowedFrom = new Date(
            now.getTime() + PARKING_SETTINGS.bookingPreHour * 60 * 60 * 1000
        );

        if (parkingType === "Booked" && selectedEntryTime < bookingAllowedFrom) {
            return res.status(400).json({
                message: `⚠️ Bookings must be made at least ${PARKING_SETTINGS.bookingPreHour} hour(s) before entry time.`
            });
        }

        let finalExpectedDurationInHours = 0;
        let expectedFee = 0;
        let expectedStay = "0 minutes";

        if (parkingType === "Booked") {
            const durationInMinutes = Math.ceil(
                (selectedExpectedExitTime - selectedEntryTime) / (1000 * 60)
            );

            finalExpectedDurationInHours = Number((durationInMinutes / 60).toFixed(1));

            if (finalExpectedDurationInHours <= 0) {
                return res.status(400).json({ message: "Exit time must be after entry time." });
            }

            expectedStay = formatHoursDuration(finalExpectedDurationInHours);
            expectedFee = roundUpToNearest5(finalExpectedDurationInHours * finalHourlyRate);
        }

        res.status(200).json({
            message: "Preview generated successfully",

            userName: user.username,
            userId: user._id,

            parkingType,
            vehicleType: finalVehicleType,

            hourlyRate: finalHourlyRate,
            penaltyRatePer10Minutes: finalPenaltyRate,
            gracePeriodinMinutes: PARKING_SETTINGS.gracePeriodinMinutes,
            buffer: PARKING_SETTINGS.buffer,

            entryTime: selectedEntryTime,
            expectedExitTime: selectedExpectedExitTime,

            expectedDurationInHours: finalExpectedDurationInHours,
            expectedStay,
            expectedFee,

            walkInRule: `Walk-in parking gets a ${PARKING_SETTINGS.buffer}-minute buffer. After that, billing is rounded into 30-minute blocks.`
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// --- THE TIMEKEEPER PART (Features 15 & 17) ---
// Feature 15: Create a new activity log entry when a car enters

// --- THE TIMEKEEPER PART (Features 15 & 17) ---
// Feature 15: Create a new activity log entry when a car enters
exports.logEntry = async (req, res) => {
    try {
        const { userId, hourlyRate, vehicleType, expectedDuration, entryTime, exitTime } = req.body;

        // 1. Make sure something was typed
        if (!userId) {
            return res.status(400).json({ message: "Please enter a username, email, or user ID." });
        }

        // 2. Try to find the user by username or email
        let user = await User.findOne({
            $or: [
                { username: userId },
                { email: userId }
            ]
        });

        // 3. If username/email did not work, try MongoDB _id
        if (!user && userId.match(/^[0-9a-fA-F]{24}$/)) {
            user = await User.findById(userId);
        }

        // 4. If no user was found, stop
        if (!user) {
            return res.status(404).json({ message: "User not found. Try username, email, or MongoDB ID." });
        }

        // 5. Save the parking ticket using the real MongoDB _id. 

        const finalVehicleType = vehicleType || '🚗 4-Wheeler';
        const multiplier = getVehicleMultiplier(finalVehicleType);

        const finalHourlyRate = roundUpToNearest5(
            Number(hourlyRate ?? PARKING_SETTINGS.baseHourlyRate) * multiplier  // Used provided rate or  PARKING_SETTINGS.baseHourlyRate (default 100)
        );

        const finalPenaltyRate = roundUpToNearest5(
            PARKING_SETTINGS.penaltyBlockRate * multiplier
        );

        // Using the time selected from frontend
        const selectedEntryTime = entryTime ? new Date(entryTime) : new Date();
        const selectedExpectedExitTime = exitTime ? new Date(exitTime) : null;

        const parkingType = selectedExpectedExitTime ? 'Booked' : 'WalkIn';

        // Booking rule: bookings must be made at least 1 hour before entry time
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + PARKING_SETTINGS.bookingPreHour * 60 * 60 * 1000);

        if (selectedExpectedExitTime && selectedEntryTime < twoHoursFromNow) {
            return res.status(400).json({
                message: `⚠️ Bookings must be made at least ${PARKING_SETTINGS.bookingPreHour} hour(s) before entry time.`
            });
        }
        

        // Default for walk-in parking: Walk-in has no booked exit time, so expected duration and expected fee stay 0.
        let finalExpectedDurationInHours = 0;
        let expectedFee = 0;

        
        // Only booked parking has an expected exit time. So only booked parking needs expected duration and expected fee.
        if (parkingType === 'Booked') {

            const durationInMinutes = Math.ceil(
                (selectedExpectedExitTime - selectedEntryTime) / (1000 * 60)  //minutes between entry time and expected exit time
            );
            
            //Converting minutes into hours. Example: 90 minutes becomes 1.5 hours.
            finalExpectedDurationInHours = durationInMinutes / 60;

            // Keep the number neat. Example: 1.500000 becomes 1.5.
            finalExpectedDurationInHours = Number(finalExpectedDurationInHours.toFixed(1));
       
            if (finalExpectedDurationInHours <= 0) {
                return res.status(400).json({ message: "Exit time must be after entry time." });  // prevent having exit time before entry time.
            }

            // Calculate the booked fee. Example: 1.5 hours × 100 BDT = 150 BDT.
            expectedFee = roundUpToNearest5(finalExpectedDurationInHours * finalHourlyRate);
        }


        const newLog = new Finance({
            userId: user._id,
            parkingType,
            vehicleType: finalVehicleType,
            hourlyRate: finalHourlyRate,
            penaltyRatePer10Minutes: finalPenaltyRate,
            gracePeriodinMinutes: PARKING_SETTINGS.gracePeriodinMinutes,
             
            entryTime: selectedEntryTime,
            expectedExitTime: parkingType === 'Booked' ? selectedExpectedExitTime : undefined,
            expectedDurationInHours: finalExpectedDurationInHours,
            expectedFee,  

            status: parkingType === 'Booked' ? 'Booked' : 'Active'
        });



        await newLog.save();  // Save this "parking ticket" to the database

        res.status(201).json({
            message: "Entry logged successfully",
            data: newLog,
            recordId: newLog._id
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Feature 17: Update the parking rate (Admin/Manager task). The Admin wants to change the price per hour.
exports.updateRate = async (req, res) => {
    try {
        const { recordId, newRate } = req.body;
        // Find the record by ID and swap the old price with the new one
        const updatedRecord = await Finance.findByIdAndUpdate(
            recordId, 
            { hourlyRate: newRate }, 
            { new: true }
        );
        res.status(200).json({ message: "Rate updated", data: updatedRecord });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Feature 15: Get all logs (The Activity History). Show a list of everyone who has ever parked here (The History).
exports.getLogs = async (req, res) => {
    try {
        await Finance.updateMany(
            {
                status: 'Booked',
                entryTime: { $lte: new Date() }
            },
            {
                $set: { status: 'Active' }
            }
        );


        const logs = await Finance.find().populate('userId', 'username');
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Handles booking cancellation.
exports.cancelEntry = async (req, res) => {
    try {
        const { recordId } = req.body;                                        // Get the booking/parking record ID from the frontend
        //const record = await Finance.findById(recordId);                     // Find that parking record in MongoDB
        // We get the ID from the URL (e.g., /api/finance/receipt/12345)
        const record = await Finance.findById(recordId).populate('userId', 'username');

        // If no record exists with that ID, stop
        if (!record) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Only Booked or Active records can be cancelled. Completed or already Cancelled records should not be cancelled again
        if (record.status !== "Booked" && record.status !== "Active") {
            return res.status(400).json({ message: "Only booked/active entries can be cancelled" });
        }
        
        const cancelTime = new Date();                                       // The exact time when admin/user clicked cancel

        const entryTime = new Date(record.entryTime);                          // The booked entry time
        const expectedExitTime = new Date(record.expectedExitTime);           // The booked expected exit time

        let cancellationFee = 0;                                             // Start with no cancellation fee        
        let cancellationNote = "";                                           // This explains why the fee was charged or not charged

        // How many minutes before entry time the booking is being cancelled
        const minsBeforeEntry = Math.floor((entryTime - cancelTime) / (1000 * 60));

        // CASE 1:
        // If cancelled 30 minutes or more before entry time, cancellation is free.
        if (minsBeforeEntry >= PARKING_SETTINGS.freeCancellationBeforeEntryMinutes) {
            cancellationFee = 0;
            cancellationNote = `Cancelled at least ${PARKING_SETTINGS.freeCancellationBeforeEntryMinutes} minutes before entry time. No fee charged.`;
        }

        // CASE 2:
        // If cancelled less than 30 minutes before entry time, but before the car was supposed to enter, charge a small 30-minute fee.
        else if (cancelTime < entryTime) {
            cancellationFee = roundUpToNearest5(0.5 * record.hourlyRate);
            cancellationNote = `Cancelled within ${PARKING_SETTINGS.freeCancellationBeforeEntryMinutes} minutes before entry time. Charged ${PARKING_SETTINGS.freeCancellationBeforeEntryMinutes}-minutes fee.`;
        }

        // CASE 3:
        // If the booking time already started, then user pays for used time + a small remaining booking cancellation charge.
        else {
            const stayedMins = Math.floor((cancelTime - entryTime) / (1000 * 60));                     // How many minutes passed after entry time

            // Convert used time into billable walk-in style hours. Example: 1h06m becomes 1.5 hours
            const chargedHoursForUsedTime = calculateWalkInChargedHours(stayedMins);

            const usedTimeFee = roundUpToNearest5(chargedHoursForUsedTime * record.hourlyRate);         // Fee for the time already used

            // How much booked time is still left after cancelling
            const remainingMins = Math.max(
                0,
                Math.floor((expectedExitTime - cancelTime) / (1000 * 60))
            );

            const remainingBlocks = Math.ceil(
                remainingMins / PARKING_SETTINGS.cancellationBlockPeriod          // Count remaining booked time after cancellation in 30-minute blocks
            );     

            // Charge a fixed fee for each remaining cancellation block. Example: 3 blocks × 20 BDT = 60 BDT. 
            const remainingCancellationFee = 
                remainingBlocks * PARKING_SETTINGS.cancellationBlockRate;                   // Charge 20 BDT for each remaining 30-minute block

            cancellationFee = usedTimeFee + remainingCancellationFee;                       // Final cancellation fee

            cancellationNote = "Cancelled after entry time. Charged used time fee plus remaining booking cancellation fee.";
        }

        
        record.actualExitTime = cancelTime;       // Save actual cancellation time        
        record.cancellationFee = cancellationFee;     
        record.cancellationNote = cancellationNote;
        record.totalFee = cancellationFee;         // Since this record is cancelled, totalFee becomes the cancellation fee
        record.status = "Cancelled";              // Mark this record as cancelled instead of deleting it
        await record.save();                     // Save all changes to MongoDB

        // Send result back to frontend
        res.status(200).json({
            message: "     Your Booking is cancelled successfully.     ",
            cancellationFee,
            cancellationNote,
            cancelledAt: cancelTime
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Feature 17: Calculate Fees and handle Exit. (A car is leaving! Calculate the bill.)

exports.handleExit = async (req, res) => {
    try {
        const { recordId } = req.body;
        const record = await Finance.findById(recordId).populate('userId', 'username');
        
        if (!record) return res.status(404).json({ message: "Record not found" });

        const actualExitTime = new Date();                     // Right now- the real exiting time
        const entryTime = new Date(record.entryTime);         // When they arrived, booked entry time
        const expectedExitTime = new Date(record.expectedExitTime);  //booked exit time, expected exit time

        if (record.parkingType === "Booked" && actualExitTime < entryTime) {
            return res.status(400).json({
                message: "This booking has not started yet. You cannot check out before entry time."
            });
        }        

        //Calculate duration in milliseconds and minutes ONCE
        // Math: Exit Time minus Entry Time = Total Time Stayed. Calculate hours (rounding up)
        const durationInMs = actualExitTime - entryTime;
        const actualStayMins = Math.floor(durationInMs / (1000 * 60)); // calculate actual minutes
        const actualStayDuration = formatMinutesDuration(actualStayMins);  // calculate actual duration in humane language

        const isBooked = !!record.expectedExitTime;

        

        // Apply the PARKING_SETTINGS.buffer (5-minute buffer logic)
        let effectiveMins = actualStayMins;

        // If they stayed 64 mins, we treat it as 60. If 66 mins, it stays 66.
        if (actualStayMins % 60 <= PARKING_SETTINGS.buffer && actualStayMins > PARKING_SETTINGS.buffer) {
            effectiveMins = actualStayMins - (actualStayMins % 60);
        }

        //Calculate hours based on "Effective" minutes (Round up)
        let durationInHours = 0;

        // If car stayed less than 5 minutes, no parking fee
        if (effectiveMins >= PARKING_SETTINGS.buffer) {
            durationInHours = Math.ceil(effectiveMins / 60);
        }

 
        
        // Calculate Fee: Calculate the money
        //let totalFee = roundUpToNearest5(durationInHours * record.hourlyRate); //record.hourlyRate = Price x multiplier //Hours x Price x multiplier;

        let totalFee = 0;

        if (isBooked) {
            totalFee = record.expectedFee;
        } else {
            const chargedHours = calculateWalkInChargedHours(actualStayMins);
            totalFee = roundUpToNearest5(chargedHours * record.hourlyRate);
        }


        // --- THE SMART PENALTY LOGIC ---
        let penaltyFee = 0;
        let overstayMins = 0;
        let overstayBlocks = 0;
        let overstayDuration = "0 minutes";  
        
        let receivedGracePeriod = "0 minutes";
        let penalizedDuration = "0 minutes";
        let penalizedMinutes = 0;

        let rawOverstayMins = 0;
        let chargedOverstayDuration = "0 minutes";

        if (isBooked){
            rawOverstayMins = Math.max(
                0,
                Math.floor((actualExitTime - expectedExitTime) / (1000 * 60))
            );

            const receivedGraceMins = Math.min(rawOverstayMins, record.gracePeriodinMinutes);
            receivedGracePeriod = formatMinutesDuration(receivedGraceMins);

            // Store/display overstay if the car left after expected exit time. This includes grace period too.      
            if (rawOverstayMins > 0) {

                //  Calculate how many PARKING_SETTINGS.penaltyBlockPeriod (10-minute blocks) they used (rounding up)
                // Example: 11 mins over = 2 blocks. 5 mins over = 1 block.
                overstayBlocks = Math.ceil(rawOverstayMins / PARKING_SETTINGS.penaltyBlockPeriod);

                // Chargeable overstay minutes                
                overstayMins = overstayBlocks * PARKING_SETTINGS.penaltyBlockPeriod;  //charged
                //overstayMins = rawOverstayMins;

                // Human-readable duration
                overstayDuration = formatMinutesDuration(rawOverstayMins);
                chargedOverstayDuration = formatMinutesDuration(overstayMins);

            }



            // Check if they are past the record.gracePeriodinMinutes (30-minute grace period). Only charge penalty if they passed the grace period
            if (rawOverstayMins > record.gracePeriodinMinutes)  {
                const taxableOverstayMins = rawOverstayMins - record.gracePeriodinMinutes;   // Subtract the gracePeriod (30 mins) and charge penalty only after grace period

                const penaltyBlocks = Math.ceil(taxableOverstayMins / PARKING_SETTINGS.penaltyBlockPeriod);  // Calculate chargeable 10-minute blocks after grace period
                
                penalizedMinutes = penaltyBlocks * PARKING_SETTINGS.penaltyBlockPeriod;
                penalizedDuration = formatOverstayDuration(penaltyBlocks);

                penaltyFee = roundUpToNearest5(
                    penaltyBlocks * record.penaltyRatePer10Minutes   //record.penaltyRatePer10Minutes already includes vehicle multiplier. 
                );
            }

            totalFee += penaltyFee;
        }
        

        // Important: Saved the final bill and the exit time so we don't forget
        record.actualExitTime = actualExitTime;  //records the actual checkout time, not the booked expected exit time.
                                                //record.overstayBlocks = overstayBlocks;
                                                //record.overstayMinutes = overstayMins;         
        record.overstayDuration = overstayDuration;
        record.receivedGracePeriod = receivedGracePeriod;
        record.penalizedDuration = penalizedDuration;
        record.penaltyFee = penaltyFee;           // permanently record the penaltyFee
        record.totalFee = totalFee;               // permanently record the totalFee

        record.status = "Completed";    // The car is gone
        await record.save();


        res.status(200).json({                                       //This does not save anything. It only sends information back to your frontend.
            message: "Checkout successful!", 

            parkingType: record.parkingType,

            customerName: record.userId ? record.userId.username : "Guest",
            customerId: record.userId ? record.userId._id : "N/A",   
            
            vehicle: record.vehicleType,            
            duration: actualStayDuration,

            hourlyRate: record.hourlyRate,  //recoreded hourlyRate already is calculated using multiplier
            penaltyRatePer10Minutes: record.penaltyRatePer10Minutes,
            gracePeriodinMinutes: record.gracePeriodinMinutes,  
            receivedGracePeriod,    

            entryTime: record.entryTime,
            expectedExitTime: record.expectedExitTime,
            actualExitTime: record.actualExitTime,   
            
            expectedDurationInHours: record.expectedDurationInHours,
            expectedStay: formatHoursDuration(record.expectedDurationInHours),
            expectedFee: record.expectedFee,            

            rawOverstayMins: rawOverstayMins,
            chargedOverstayMinutes: overstayMins,

            overstayDuration,
            chargedOverstayDuration,            

            penalizedMinutes,
            penalizedDuration,
            penaltyFee,

            finalFee: totalFee 

        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// --- THE ACCOUNTANT PART (Feature 9 - External API) ---                              (Newly added)

// Total Revenue Report (For Foreigners)
exports.getRevenueReport = async (req, res) => {
    try {
        // Which currency does the user want? (USD? EUR?) If nothing, use BDT.
        // Optimized: Default to BDT for speed, but allow conversion if requested
        const targetCurrency = req.query.target || 'BDT';
        //const targetCurrency = req.query.target || 'USD'; // Default to USD for testing

        // Find all "Completed" parking records and add all the bills together
        const logs = await Finance.find({ status: "Completed" });
        const totalRevenueBDT = logs.reduce((sum, log) => sum + (log.totalFee || 0), 0);        

        // If they just want BDT, stop here and show the total. No API needed.
        if (targetCurrency === 'BDT') {
            return res.json({
                success: true,
                total: totalRevenueBDT,
                currency: 'BDT',
                message: "Total Revenue in local money"
            });
        }

        // Using the 'live' endpoint which is usually more stable for free keys
        // If a foreigner wants to see the total in USD/EUR, ask the External API
        const apiKey = 'f94a0ca3d02ab911740056e0c9f288e9'; 
        const url = `http://api.exchangerate.host/live?access_key=${apiKey}&source=BDT&currencies=${targetCurrency}`;
        
        const response = await axios.get(url); // Send the request to the API
        
        // 3. Logic to extract the rate from the 'live' response
        // The API returns rates inside 'quotes' like this: { "quotes": { "BDTUSD": 0.0084 } }
        const rateKey = `BDT${targetCurrency}`;
        const rate = response.data.quotes ? response.data.quotes[rateKey] : null;

        if (!rate) {
            return res.json({ success: false, message: "Could not find rate for " + targetCurrency });
        }

        const convertedAmount = totalRevenueBDT * rate;  // Get the converted money back
        
        res.json({
            success: true,
            originalTotal: totalRevenueBDT + " BDT",
            convertedTotal: convertedAmount.toFixed(2),
            currency: targetCurrency,
            currentRate: rate
            //provider: "exchangerate.host" // Proof that external API is used!
        });


    } catch (error) {
        res.status(500).json({ message: "Revenue report failed", error: error.message });
    }
};

// Feature 17: Get Receipt Data
exports.getReceipt = async (req, res) => {
    try {
        // We get the ID from the URL (e.g., /api/finance/receipt/12345)
        const record = await Finance.findById(req.params.id).populate('userId', 'username');

        if (!record) {
            return res.status(404).json({ message: "Receipt not found" });
        }

        // We only show the receipt if they have already paid
        if (record.status !== "Completed") {
            return res.status(400).json({ message: "Payment not completed yet" });
        }

        const actualStayMins = Math.max(
            0,
            Math.floor((new Date(record.actualExitTime) - new Date(record.entryTime)) / (1000 * 60))
        );

        const actualStayDuration = formatMinutesDuration(actualStayMins);


        // Common receipt fields for both Walk-in and Booking
        const baseReceipt = {
            customerName: record.userId ? record.userId.username : "Guest",
            customerId: record.userId ? record.userId._id : "N/A",
            parkingType: record.parkingType,
            vehicleType: record.vehicleType,

            hourlyRate: record.hourlyRate,

            checkIn: record.entryTime,
            actualCheckOut: record.actualExitTime,
            totalStay: actualStayDuration,

            amountPaid: record.totalFee,
            currency: "BDT"
        };



        // Walk-in receipt: simple, no booking/penalty fields
        if (record.parkingType === "WalkIn") {
            return res.status(200).json({                                        // Send the data to the frontend so it can be printed
                ...baseReceipt,
                receiptType: "Walk-in Receipt"
            });
        }

        // Booking receipt: includes booking/overstay/penalty details
        return res.status(200).json({                                              // Send the data to the frontend so it can be printed
            ...baseReceipt,
            receiptType: "Booking Receipt",

            expectedCheckOut: record.expectedExitTime,
            expectedStay: formatHoursDuration(record.expectedDurationInHours),
            expectedFee: record.expectedFee,

            gracePeriodinMinutes: record.gracePeriodinMinutes, 
            penaltyRatePer10Minutes: record.penaltyRatePer10Minutes,
            
            overstayDuration: record.overstayDuration,
            receivedGracePeriod: record.receivedGracePeriod|| "0 minutes",
            penalizedDuration: record.penalizedDuration,
            penaltyFee: record.penaltyFee
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
