const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["car", "bike", "bus"],
      required: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ user: 1, vehicleNumber: 1 }, { unique: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
