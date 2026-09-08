const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

const initCloudinary = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure:     true,
    });
  }
};

// Initialize on module load
initCloudinary();

/**
 * Upload a buffer to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options (e.g. folder, public_id, resource_type)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Re-verify config in case env vars were set dynamically
    initCloudinary();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete asset from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @param {Object} options - Deletion options
 * @returns {Promise<Object|null>}
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  if (!isCloudinaryConfigured() || !publicId) return null;
  try {
    initCloudinary();
    return await cloudinary.uploader.destroy(publicId, options);
  } catch (err) {
    console.warn('[Cloudinary] Failed to delete asset:', publicId, err.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
