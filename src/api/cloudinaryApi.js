import axios from "axios";

const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;

/** Timeout cho upload video (5 phút) - tránh timeout với file lớn */
const UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Upload video lên Cloudinary.
 * @param {File} file - File video
 * @param {Object} options - { onProgress: (percent) => void } - callback % upload (0-100)
 * @returns {Promise<string>} secure_url của video
 */
export const uploadVideoToCloudinary = async (file, options = {}) => {
  const { onProgress } = options;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET || import.meta.env.VITE_UPLOAD_PRESET);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME|| import.meta.env.VITE_CLOUD_NAME}/video/upload`,
    formData,
    {
      timeout: UPLOAD_TIMEOUT_MS,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => {
            const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            onProgress(percent);
          }
        : undefined,
    }
  );

  return res.data.secure_url;
};

/**
 * Upload ảnh lên Cloudinary.
 * @param {File} file - File ảnh (jpg, png, webp, …)
 * @param {Object} options - { onProgress: (percent) => void }
 * @returns {Promise<string>} secure_url của ảnh
 */
export const uploadImageToCloudinary = async (file, options = {}) => {
  const { onProgress } = options;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET || import.meta.env.VITE_UPLOAD_PRESET);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME || import.meta.env.VITE_CLOUD_NAME}/image/upload`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (e) => {
            const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            onProgress(percent);
          }
        : undefined,
    }
  );

  return res.data.secure_url;
};