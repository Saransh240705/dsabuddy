import { BlacklistedToken } from "../models/user.model.js";


export const logoutUser = async (req, res) => {
   try {
     if(!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
     }
     const token = req.headers.authorization?.split(" ")[1];

     await BlacklistedToken.create({ token, expiresAt: new Date(Date( req.user.exp*1000)) });

     return res.status(200).json({ status: "success", message: "Logged out successfully" });
   } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
   }
}
