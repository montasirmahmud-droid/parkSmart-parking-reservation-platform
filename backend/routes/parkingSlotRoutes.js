import express from "express";
import { getSlotById } from "../controllers/parkingSlotController.js";

const router = express.Router();

router.get("/:id", getSlotById);

export default router;
