const express = require("express");
const {
  createVehicle,
  listVehicles,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

//feature1
router.post("/", requireAuth, createVehicle);
router.get("/", requireAuth, listVehicles);
router.put("/:id", requireAuth, updateVehicle);
router.delete("/:id", requireAuth, deleteVehicle);

module.exports = router;
