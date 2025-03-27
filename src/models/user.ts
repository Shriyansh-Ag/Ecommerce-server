import  mongoose  from "mongoose";
import  validator from "validator";

interface IUser extends Document {
    _id: string;
    name: string;
    photo: string;
    email : string;
    role : "admin" | "user";
    gender: "male" | "female";
    dob : Date;
    createdAt: Date;
    updatedAt: Date;
    // virtual attribute
    age: number;
}

const schema = new mongoose.Schema({

    _id: {
        type: String,
        required : [true , "Please Enter your Id"]
    },
    photo: {
        type: String,
        required : [true , "Please add your photo"]
    },
    role: {
        type: String,
        enum : ["admin" , "user"],
        default: "user",
    },
    name: {
        type: String,
        required : [true , "Please Enter your name"]
    },
    email: {
        type: String,
        unique:[true,"Email is already in use"],
        required : [true , "Please Enter your email"],
        validate: validator.default.isEmail
    },
    gender: {
        type: String,
        enum:["Male", "Female"],
        required : [true , "Please Enter your Gender"]
    },
    dob: {
        type: Date,
        required : [true , "Please Enter your Date of Birth"]
    }

},
{
    timestamps : true
}
);
schema.virtual("age").get(function(){
    const today = new Date();
    const dob =  this.dob
    let age = today.getFullYear() - dob.getFullYear();

    if(today.getMonth()< dob.getMonth() || today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()){
        age--;
    }

    return age;

})



export const User = mongoose.model<IUser>("User",schema)   

