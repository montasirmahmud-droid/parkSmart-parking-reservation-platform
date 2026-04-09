const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    entryTime: { type: Date, default: Date.now },
    exitTime: { type: Date },
    hourlyRate: { type: Number, default: 10 },
    totalFee: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 }
});

module.exports = mongoose.model('Finance', financeSchema);
