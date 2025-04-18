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
    req.user = await User.findById(decoded.id);
    next();
};

// Export protect as an alias for isAuthenticated
export const protect = isAuthenticated;
        