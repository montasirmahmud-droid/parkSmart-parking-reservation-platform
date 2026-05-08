//const express = require("express");
//const { extendReservation } = require("../controllers/reservationController");

import express from "express";
import { extendReservation } from "../controllers/reservationController.js";

const router = express.Router();

router.put("/extend/:reservationId", extendReservation);

//module.exports = router;
export default router;
