import mongoose from "mongoose"
import { config } from "dotenv";
config();
export const connectDB=async()=>{
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to DB");
    }).catch((err)=>{
        console.log("Error connecting to DB",err);
        
    })
}