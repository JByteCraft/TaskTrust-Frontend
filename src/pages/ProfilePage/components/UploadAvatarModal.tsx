import type { FC } from "react";
import { useState, useRef } from "react";
import { FiX, FiUpload, FiCamera } from "react-icons/fi";
import { uploadToCloudinary } from "../../../lib/utils/cloudinary.utils";

interface UploadAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  currentAvatarUrl?: string;
  loading?: boolean;
}

const UploadAvatarModal: FC<UploadAvatarModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onRemove,
  currentAvatarUrl,
  loading = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      // Upload to Cloudinary
      const { url } = await uploadToCloudinary(selectedFile, "tasktrust/avatars");
      await onUpload(url);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error: any) {
      alert(error.message || "Failed to upload image");
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Upload Profile Picture
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
            disabled={loading}
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-gray-200 bg-gray-100">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt="Current avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiCamera className="h-16 w-16 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* File Input */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-sm font-medium text-gray-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
              >
                <FiUpload className="h-5 w-5" />
                {selectedFile
                  ? selectedFile.name
                  : "Click to select an image"}
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF (Max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div>
            {currentAvatarUrl && onRemove && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Are you sure you want to remove your profile picture?")) {
                    await onRemove();
                    handleClose();
                  }
                }}
                disabled={loading}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Remove Photo
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload className="h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadAvatarModal;

