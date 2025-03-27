import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { DeleteProduct, getAdminProducts, getAllProducts, getCategories, getlatestProducts, getSingleProduct, newProduct, UpdateProduct } from "../controllers/product.js";
import { singleUpload } from "../middlewares/multer.js";
const app = express.Router();
//Create a new product
app.post("/new", adminOnly, singleUpload, newProduct);
//Get the last 5 products
app.get("/latest", getlatestProducts);
//to get all products with filterss
app.get("/all", getAllProducts);
//Gets all the categories
app.get("/categories", getCategories);
//To get all the products through admin
app.get("/admin-products", adminOnly, getAdminProducts);
//combinational route to get a single product based on id
//to update a single product based on id
//to delete a single product based on id
app.route("/:id")
    .get(getSingleProduct)
    .put(adminOnly, singleUpload, UpdateProduct)
    .delete(adminOnly, DeleteProduct);
export default app;
