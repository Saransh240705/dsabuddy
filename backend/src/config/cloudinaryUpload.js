import { Readable } from "stream";
import cloudinary from "./cloudinary.js";

export function uploadBufferToCloudinary(
  buffer,
  { folder = "dsabuddy_uploads", publicId, resourceType = "auto" } = {}
) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    Readable.from([buffer]).pipe(uploadStream);
  });
}

