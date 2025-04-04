import mongoose from "mongoose";
import { isMongoId } from "validator";



const schema = new mongoose.Schema({

    code:{
        type: String ,
        required:[true, "Please entert the coupon code"],
        unique : true
    },
    amount:{
        type: Number,
        required: [true, "Please enter the discount amount"]
    }
})

export const Coupon = mongoose.model("Coupon",schema)