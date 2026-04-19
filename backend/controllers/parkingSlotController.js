import ParkingSlot from "../models/ParkingSlot.js";

export const getSlotById = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
