import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import ErrorHandler from "../utils/utility-classes.js";
import { TryCatch } from "../middlewares/error.js";



export const newUser =  TryCatch(
    async (
    req:Request <{},{} ,NewUserRequestBody>, 
    res:Response , 
    next:NextFunction) => 
{

const {name,email,photo,gender,role,_id,dob} = req.body;
let user = await User.findById(_id);
if(user){
    res.status(201).json({
        success:true,
        message:`Welcome ${user.name}`,
    })
}

if(!_id || !name || !email || !photo || !gender || !dob || !role){
    next(new ErrorHandler("Please enter all the fields", 405))
}
 
user = await User.create({
    name,
    email,
    photo,
    gender,
    _id,
    dob: new Date(dob)

});
res.status(201).json({
    success:true,
    message:`Welcome ${user.name}`,
})

} 
)


export const getAllUsers = TryCatch(async (req , res , next) => {

    const users = await User.find({})
        res.status(201).json({
        success:true,
        users
    })
})

export const getUser = TryCatch(async (req , res , next) => {

    const id = req.params.id
    const user = await User.findById(id);

    if(!user){
         return next(new ErrorHandler("Invalid Id", 400))
    }
    res.status(201).json({
        success:true,
        user,
    })
})

export const deleteUser = TryCatch(async (req , res , next) => {

    const id = req.params.id
    const user = await User.findById(id);

    await user?.deleteOne();

    if(!user){
         return next(new ErrorHandler("Invalid Id", 400))
    }
    res.status(201).json({
        success:true,
        message:"User deleted successfully"
    })
})