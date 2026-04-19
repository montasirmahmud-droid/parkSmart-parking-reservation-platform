import mongoose from "mongoose";

const parkingSlotSchema = new mongoose.Schema({
  slotId: { type: String, required: true },
  location: String,
  vehicleType: String,
  isAvailable: { type: Boolean, default: true }
});

export default mongoose.model("ParkingSlot", parkingSlotSchema);
