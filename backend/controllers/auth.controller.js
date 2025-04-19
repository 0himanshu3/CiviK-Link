import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
dotenv.config({ path: './config/.env' });

export const login = async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;

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
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log('Invalid password');
            return res.status(401).json({ success: false, message: 'Invalid password' });
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
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const register = async (req, res) => {
    try {
        const { email } = req.body;
        if (email === process.env.ADMIN_EMAIL) {
            return res.status(400).json({
                success: false,
                message: "Registration with admin email is not allowed."
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const userData = {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            location: req.body.location,
            role: req.body.role
        };

        if (req.body.role === 'NGO' && req.body.interests) {
            userData.interests = JSON.parse(req.body.interests);
        }

        const user = await User.create(userData);
        const verificationCode = user.generateVerificationCode();
        await user.save();

        // Send verification email with the code
        // ... existing email sending logic ...

        res.status(201).json({
            success: true,
            message: "Registration successful. Please verify your email.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({
            success: false,
            message: "Error while registering",
            error: error.message
        });
    }
}; 