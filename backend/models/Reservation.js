const mongoose = require("mongoose");
//import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingSlot" },
  startTime: Date,
  endTime: Date
});

//export default mongoose.model("Reservation", reservationSchema);
module.exports = mongoose.model("Reservation", ReservationSchema);
