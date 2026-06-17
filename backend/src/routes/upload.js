import express from "express";
import upload from "../config/multer.js";
import { uploadBufferToCloudinary } from "../config/cloudinaryUpload.js";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    try {
      const result = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "dsabuddy_uploads",
      });

      return res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        filename: result.original_filename,
        raw: result,
      });
    } catch (cloudinaryErr) {
      console.warn("Cloudinary upload failed, falling back to Base64 data URL:", cloudinaryErr.message || cloudinaryErr);
      
      const base64Data = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;
      
      return res.json({
        success: true,
        url: dataUrl,
        publicId: "local_base64",
        filename: req.file.originalname,
        raw: { fallback: true }
      });
    }
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
});

export default router;
