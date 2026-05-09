import express from "express";
import { getRecommendedSlots } from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/", getRecommendedSlots);

export default router;
