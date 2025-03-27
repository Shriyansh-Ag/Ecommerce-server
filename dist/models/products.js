import mongoose from "mongoose";
const schema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please Enter the product's name"]
    },
    photo: {
        type: String,
        required: [true, "Please Enter the product's photo"]
    },
    price: {
        type: Number,
        required: [true, "Please Enter the product's price"]
    },
    stock: {
        type: Number,
        required: [true, "Please Enter the product's stock"]
    },
    category: {
        type: String,
        required: [true, "Please Enter the product's category"],
        trim: true,
    },
}, {
    timestamps: true
});
export const Product = mongoose.model("Product", schema);
