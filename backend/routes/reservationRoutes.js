import express from "express";
import { extendReservation } from "../controllers/reservationController.js";

const router = express.Router();

router.put("/extend/:reservationId", extendReservation);

export default router;
