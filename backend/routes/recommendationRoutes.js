//const express = require("express");
//const { getRecommendedSlots } = require("../controllers/recommendationController");
//const { requireAuth } = require("../middleware/auth");

import express from "express";
import { getRecommendedSlots } from "../controllers/recommendationController.js";

const router = express.Router();

router.get("/", getRecommendedSlots);

//module.exports = router;
export default router;
