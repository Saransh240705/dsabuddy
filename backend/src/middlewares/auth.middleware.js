import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        return next();
    } catch (error) {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
        });
        return next();
    }
}

export const ensureAuthenticated = (req, res, next) => {
    if(!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}