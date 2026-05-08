//const express = require("express");
//const { getSlotById } = require("../controllers/parkingSlotController");

import express from "express";
import { getSlotById } from "../controllers/parkingSlotController.js";

const router = express.Router();

router.get("/:id", getSlotById);

//module.exports = router;
export default router;
