import { prisma } from "../config/prismaClient.js";


export const logoutUser = async (req, res) => {
   try {
     if(!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
     }
     const token = req.headers.authorization?.split(" ")[1];

     const expSeconds = req.user?.exp;
     const expiresAt = typeof expSeconds === "number" ? new Date(expSeconds * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

     await prisma.blacklistedToken.create({ data: { token, expiresAt } });

     return res.status(200).json({ status: "success", message: "Logged out successfully" });
   } catch (error) {
        return res.status(500).json({ error: "Internal server error" });
   }
}
