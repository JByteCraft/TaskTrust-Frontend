// src/lib/utils/cloudinary.utils.ts

const CLOUDINARY_CLOUD_NAME = "djtleiouz";
const CLOUDINARY_UPLOAD_PRESET = "tasktrust-preset";

export const uploadToCloudinary = async (
  file: File,
  folder: string = "tasktrust"
): Promise<{ url: string; publicId: string }> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary configuration is missing. Please check your .env file."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
    };
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw new Error(error.message || "Failed to upload image");
  }
};

export const uploadMultipleToCloudinary = async (
  files: File[],
  folder: string = "tasktrust"
): Promise<{ url: string; publicId: string }[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};

