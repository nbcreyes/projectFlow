import { v2 as cloudinary } from "cloudinary";

/**
 * Configures and exports the Cloudinary client.
 * Called once at module load time.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;