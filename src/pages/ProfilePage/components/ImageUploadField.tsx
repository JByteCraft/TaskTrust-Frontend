import type { FC } from "react";
import { useState, useRef } from "react";
import { FiUpload, FiX, FiImage } from "react-icons/fi";
import { uploadToCloudinary } from "../../../lib/utils/cloudinary.utils";

interface ImageUploadFieldProps {
  label: string;
  currentUrl?: string;
  onUploadComplete: (url: string) => void;
  folder?: string;
  helperText?: string;
}

const ImageUploadField: FC<ImageUploadFieldProps> = ({
  label,
  currentUrl,
  onUploadComplete,
  folder = "tasktrust",
  helperText,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    try {
      setUploading(true);
      const { url } = await uploadToCloudinary(file, folder);
      onUploadComplete(url);
      setPreviewUrl(url);
    } catch (error: any) {
      alert(error.message || "Failed to upload image");
      setPreviewUrl(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="space-y-3">
        {/* Preview */}
        {previewUrl && (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt={label}
              className="h-32 w-32 rounded-lg border-2 border-gray-200 object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
              title="Remove image"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Upload Button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                {previewUrl ? <FiImage className="h-4 w-4" /> : <FiUpload className="h-4 w-4" />}
                {previewUrl ? "Change Image" : "Upload Image"}
              </>
            )}
          </button>
        </div>

        {/* Helper Text */}
        {helperText && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    </div>
  );
};

export default ImageUploadField;

