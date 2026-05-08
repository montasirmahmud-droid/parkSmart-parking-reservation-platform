const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null,
    },
    type: {
      type: String,
      enum: ["reservation_created", "reservation_cancelled", "reservation_status"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
