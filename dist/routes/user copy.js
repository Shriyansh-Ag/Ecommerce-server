import express from "express";
import { deleteUser, getAllUsers, getUser, newUser } from "../controllers/user.js";
import { adminOnly } from "../middlewares/auth.js";
const app = express.Router();
//route - /api/v1/new/new
app.post("/new", newUser);
//Route - /api/v1/user/all
app.get("/all", adminOnly, getAllUsers);
//Route - /api/v1/user/DynamicID
app.route("/:id").get(adminOnly, getUser).delete(adminOnly, deleteUser);
export default app;
