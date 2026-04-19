const Vehicle = require("../models/Vehicle");

exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create({ ...req.body, user: req.user._id });
    return res.status(201).json(vehicle);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.listVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(vehicles);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    return res.status(200).json(vehicle);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    return res.status(200).json({ message: "Vehicle deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
