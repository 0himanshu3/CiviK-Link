import { User } from "../models/user.model.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs"
import crypto from "crypto"

const { ObjectId } = mongoose.Types;
import jwt from "jsonwebtoken"

export const register = async (req, res) => {
    try {
        const { name, email, password, role, location } = req.body;
        let interests = req.body.interests;

        if (!name || !email || !password || !role || !location) {
            return res.status(400).json({ msg: "Please fill in all fields" });
        }

        // Handle interests array from FormData
        if (role === 'NGO') {
            // If interests is a string, try to parse it
            if (typeof interests === 'string') {
                try {
                    interests = JSON.parse(interests);
                } catch (e) {
                    // If parsing fails, it might be a single value or array from FormData
                    interests = Array.isArray(req.body.interests) ? req.body.interests : [req.body.interests];
                }
            }
            
            // Validate interests
            if (!interests || !Array.isArray(interests) || interests.length === 0) {
                return res.status(400).json({ msg: "NGO users must select at least one interest" });
            }
        }

        const isAlreadyPresent = await User.findOne({ email, accountVerified: true });
        if (isAlreadyPresent) {
            return res.status(400).json({ msg: "Email is already registered" });
        }

        if (password.length < 8 || password.length > 16) {
            return res.status(400).json({ msg: "Password must be between 8 and 16 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
            location
        };

        // Add interests only for NGO users
        if (role === 'NGO') {
            userData.interests = interests;
        }

        const user = await User.create(userData);

        const verificationCode = await user.generateVerificationCode();
        await user.save();

        sendVerificationCode(verificationCode, email, res);

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
}


export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        if (!email || !otp) {
            return res.status(400).json({ msg: "Please fill in all fields" });
        }
        const userAllEntries = await User.find({
            email,
            accountVerified: false,
        }).sort({ createdAt: -1 });
        console.log(userAllEntries);
        

        if (!userAllEntries) {
            return res.status(400).json({ msg: "Invalid OTP" });
        }
       const user=userAllEntries[0];
       console.log(user);
       
        
        console.log(user.verificationCode);
        console.log("Here");
        

        if(user.verificationCode !== Number(otp)){
            return res.status(400).json({ msg: "Invalid OTP" });
        }
        const currentTime=Date.now();

        const verificationCodeExpire= new Date(
            user.verificationCodeExpire
        ).getTime();

        if(currentTime>verificationCodeExpire){
            return res.status(400).json({ msg: "OTP has expired" });
        }
        
        
        user.accountVerified=true;
        user.verificationCode=null;
        user.verificationCodeExpire=null;
        await user.save({validateModifiedOnly: true});

        sendToken(user,200,"Account Verified",res)
    } catch (error) {
        console.log(error.message);
        
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

export const login = async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ msg: "Please fill in all fields" });
        }
        
        // Check for admin credentials first
        if (email === process.env.ADMIN_EMAIL) {
            console.log('Admin email match detected');
            if (password === process.env.ADMIN_PASSWORD) {
                console.log('Admin password match detected, creating admin token');
                const token = jwt.sign(
                    { id: 'admin', role: 'admin' },
                    process.env.JWT_SECRET,
                    { expiresIn: '1d' }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000 // 1 day
                });

                return res.status(200).json({
                    success: true,
                    message: 'Admin login successful',
                    user: {
                        id: 'admin',
                        name: 'Admin',
                        email: process.env.ADMIN_EMAIL,
                        role: 'admin'
                    }
                });
            } else {
                console.log('Admin password incorrect');
                return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
            }
        }
        
        // If not admin, proceed with regular user login
        console.log('Regular user login attempt');
        const user = await User.findOne({ email, accountVerified: true }).select("+password");

        if (!user) {
            console.log('User not found');
            return res.status(400).json({ msg: "User not found" });
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
            console.log('Invalid password');
            return res.status(400).json({ msg: "Invalid password" });
        }

        // Create user object for response
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            location: user.location
        };

        // Add interests only for NGO users
        if (user.role === 'NGO') {
            userResponse.interests = user.interests;
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: userResponse
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}


export const logout =async(req,res)=>{
    try {
        
        res.clearCookie('token', { httpOnly: true });
        return res.status(200).json({ success: true, message: "Logged out successfully"})
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ success: false, message: "Internal Server Error"
             })
        }
}

export const getUser = async (req, res) => {
    try {
       const user = req.user;
       return res.status(200).json({ success: true, user });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });

        
    }
}

export const forgotPassword= async(req,res)=>{
    const user = await User.findOne({
        email: req.body.email,
        accountVerified: true,
    });
    
    if (!user) {
        return res.status(400).json({success:false,message:"Invalid email"})
    }
    
    const resetToken = user.getResetPasswordToken();
    
    await user.save({ validateBeforeSave: false });
    
    const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
    
    const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

    
    try {
        await sendEmail({
            email: user.email,
            subject: "Samartharam Password Recovery",
            message,
        });
        
    
        return res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully.`,
        });
    } catch (error) {
        console.log(error.message);
        
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
        
    }
}


export const resetPassword=async(req,res)=>{
    const {token}=req.params;
    const resetPasswordToken= crypto.createHash("sha256").update(token).digest("hex");
    const user=await User.findOne({
        resetPasswordToken,
        resetPasswordExpires:{$gt: Date.now()},
    });
    if(!user){
        return res.status
    }

    if(req.body.password !==req.body.confirmPassword){
        return res.status(400).json({success:false,message:"Passwords do not match."})
    }
    if(req.body.password.length<8 || req.body.password.length>16 ){
        return res.status(400).json({success:false,message:"Password must be between 8 and 16 characters"})
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    return res.status(200).json({success:true,message:"Password reset successfully."})


}

// Get all NGOs for donation page
export const getAllNGOs = async (req, res) => {
  try {
    // Get all NGOs with role NGO
    const ngos = await User.find({ role: 'NGO' })
      .select('name email location description totalDonations issuesResolved');

    return res.status(200).json({
      success: true,
      data: ngos
    });
  } catch (error) {
    console.error('Error fetching NGOs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch NGOs'
    });
  }
};

// Temporary function to create a test NGO
export const createTestNGO = async (req, res) => {
  try {
    const testNGO = await User.create({
      name: "Test NGO",
      email: "testngo@example.com",
      password: await bcrypt.hash("password123", 10),
      role: "NGO",
      location: "Test Location",
      description: "This is a test NGO for development purposes",
      isActive: true,
      accountVerified: true,
      totalDonations: 0,
      issuesResolved: 0
    });

    return res.status(201).json({
      success: true,
      message: "Test NGO created successfully",
      data: testNGO
    });
  } catch (error) {
    console.error('Error creating test NGO:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test NGO'
    });
  }
};

export const getUserDetails = async (req, res) => {
    try {
      const userId = req.params.id;
      console.log(userId);
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
  
      const user = await User.findById(userId).select('-password'); // Exclude password
  
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      return res.status(200).json({
        success: true,
        data: user
      });
  
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  };