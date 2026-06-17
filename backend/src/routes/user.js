import express from "express";
import upload from "../config/multer.js";
import { uploadBufferToCloudinary } from "../config/cloudinaryUpload.js";

const router = express.Router();

router.post(
  "/upload-avatar",
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "dsabuddy_avatars",
      });

      res.json({
        url: result.secure_url,
        msg: "Upload successful",
      });
    } catch (err) {
      console.error("Avatar upload error:", err);
      res.status(500).json({ success: false, message: "Upload failed" });
    }
  }
);

export default router;
