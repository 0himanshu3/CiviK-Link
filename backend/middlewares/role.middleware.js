import { ApiError } from "../utils/ApiError.js";

export const isNGO = (req, res, next) => {
    try {
        if (req.user.role !== "NGO") {
            throw new ApiError(403, "Only NGOs can perform this action");
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const isAdmin = (req, res, next) => {
    try {
        if (req.user.role !== "Admin") {
            throw new ApiError(403, "Only Admins can perform this action");
        }
        next();
    } catch (error) {
        next(error);
    }
};

export const isUser = (req, res, next) => {
    try {
        if (req.user.role !== "User") {
            throw new ApiError(403, "Only Users can perform this action");
        }
        next();
    } catch (error) {
        next(error);
    }
}; 