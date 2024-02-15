import dotenv from "dotenv";
dotenv.config();
import cloudinaryPackage from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

//configure cloudinary
const cloudinary = cloudinaryPackage.v2;
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY,
  });
} catch (error) {
  console.error("Error configuring Cloudinary:", error);
  throw error;
}
// Create storage engine for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  allowedFormats: ["jpg", "png"],
  params: {
    folder: "file",
  },
});

// Init Multer with the storage engine
let upload;
try {
  // Initialize Multer with the storage engine
  upload = multer({ storage: storage });
} catch (error) {
  console.error("Error initializing Multer:", error);
  throw error;
}

export default upload;

