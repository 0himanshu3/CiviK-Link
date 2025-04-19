import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken"

export const isAuthenticated = async(req, res, next) => {
    const { token, accessToken } = req.cookies;
    const jwtToken = token || accessToken;
    if(!jwtToken) {
        return res.status(401).json({msg: "user is not authenticated"});
    }
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET);
    console.log(decoded);
    
    // If user is admin, set req.user directly without database lookup
    if (decoded.role === 'admin') {
        req.user = {
            _id: decoded.id,
            role: 'admin',
            name: 'Admin',
            email: process.env.ADMIN_EMAIL
        };
        return next();
    }
    
    // For regular users, look up in database
    req.user = await User.findById(decoded.id);
    next();
};

// Export protect as an alias for isAuthenticated
export const protect = isAuthenticated;

export const isAdmin = (req, res, next) => {

  if (!req.user || req.user.role !== 'admin') {
    console.log('Admin access denied');
    return res.status(403).json({ message: 'Admin access only' });
  }
  
  console.log('Admin access granted');
  next();
};
        