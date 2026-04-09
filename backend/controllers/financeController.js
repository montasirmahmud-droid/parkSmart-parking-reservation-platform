const Finance = require('../models/Finance');

// Feature 15: Create a new activity log entry when a car enters
exports.logEntry = async (req, res) => {
    try {
        const { userId, hourlyRate } = req.body;
        const newLog = new Finance({
            userId,
            hourlyRate // Feature 17: Apply the current rate
        });
        await newLog.save();
        res.status(201).json({ message: "Entry logged successfully", data: newLog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Feature 17: Update the parking rate (Admin/Manager task)
exports.updateRate = async (req, res) => {
    try {
        const { recordId, newRate } = req.body;
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

// Feature 15: Get all logs (The Activity History)
exports.getLogs = async (req, res) => {
    try {
        const logs = await Finance.find().populate('userId', 'username');
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
