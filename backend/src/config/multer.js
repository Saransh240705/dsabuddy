import multer from "multer";

// Use in-memory storage instead of multer-storage-cloudinary
// (which is incompatible with cloudinary v2).
// After multer parses the file, upload the buffer via
// cloudinary.uploader.upload_stream() â see cloudinaryUpload.js.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ok =
      allowed.test(file.mimetype) &&
      allowed.test(file.originalname.split(".").pop().toLowerCase());
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

export default upload;
