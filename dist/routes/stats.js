import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { getBarChart, getDashboardStats, getLineChart, getPieChart } from "../controllers/stats.js";
const app = express.Router();
//route - /api/v1/dashboard/stats
app.get("/stats", adminOnly, getDashboardStats);
//route - /api/v1/dashboard/pie
app.get("/pie", adminOnly, getPieChart);
//route - /api/v1/dashboard/line
app.get("/line", adminOnly, getLineChart);
//route - /api/v1/dashboard/bar
app.get("/bar", adminOnly, getBarChart);
export default app;
