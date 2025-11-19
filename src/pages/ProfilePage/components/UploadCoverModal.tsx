import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { FiX, FiUpload, FiImage, FiCheck } from "react-icons/fi";
import { uploadToCloudinary } from "../../../lib/utils/cloudinary.utils";
import { cropImage } from "../../../lib/utils/image-crop.utils";

interface UploadCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (url: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  currentCoverUrl?: string;
  loading?: boolean;
}

const UploadCoverModal: FC<UploadCoverModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  onRemove,
  currentCoverUrl,
  loading = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global mouse event handlers for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && imageRef.current && containerRef.current && imageSize.width > 0) {
        const img = imageRef.current;
        const imgRect = img.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const imgOffsetX = imgRect.left - containerRect.left;
        const imgOffsetY = imgRect.top - containerRect.top;
        
        const imgDisplayWidth = img.offsetWidth;
        const imgDisplayHeight = img.offsetHeight;
        const scaleX = imgDisplayWidth / imageSize.width;
        const scaleY = imgDisplayHeight / imageSize.height;
        
        const newX = (e.clientX - dragStart.x - imgOffsetX) / scaleX;
        const newY = (e.clientY - dragStart.y - imgOffsetY) / scaleY;
        
        setCropArea(prev => ({
          ...prev,
          x: Math.max(0, Math.min(newX, imageSize.width - prev.width)),
          y: Math.max(0, Math.min(newY, imageSize.height - prev.height)),
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, imageSize]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB for cover photos)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setPreviewUrl(url);
      setShowCrop(true);
      
      // Initialize crop area after image loads
      const img = new Image();
      img.onload = () => {
        const containerWidth = 600; // Approximate container width
        const aspectRatio = 3; // Cover photo aspect ratio (width/height)
        const displayHeight = containerWidth / aspectRatio;
        const scale = Math.min(containerWidth / img.width, displayHeight / img.height);
        
        const displayWidth = img.width * scale;
        const displayHeight2 = img.height * scale;
        
        // Center crop area
        const cropWidth = displayWidth * 0.8;
        const cropHeight = cropWidth / aspectRatio;
        const cropX = (displayWidth - cropWidth) / 2;
        const cropY = (displayHeight2 - cropHeight) / 2;
        
        setImageSize({ width: img.width, height: img.height });
        setCropArea({
          x: cropX / scale,
          y: cropY / scale,
          width: cropWidth / scale,
          height: cropHeight / scale,
        });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = async () => {
    if (!previewUrl) return;
    
    try {
      const croppedUrl = await cropImage(previewUrl, cropArea, 3); // 3:1 aspect ratio for cover
      setPreviewUrl(croppedUrl);
      setShowCrop(false);
    } catch (error: any) {
      console.error("Crop error:", error);
      alert("Failed to crop image");
    }
  };

  const getCropStyle = () => {
    if (!imageRef.current || !containerRef.current) return {};
    
    const img = imageRef.current;
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const aspectRatio = 3;
    const displayHeight = containerWidth / aspectRatio;
    const scale = Math.min(containerWidth / imageSize.width, displayHeight / imageSize.height);
    
    const displayWidth = imageSize.width * scale;
    const displayHeight2 = imageSize.height * scale;
    
    return {
      position: 'absolute' as const,
      left: `${(cropArea.x * scale) + (containerWidth - displayWidth) / 2}px`,
      top: `${(cropArea.y * scale) + (displayHeight2 - displayHeight) / 2}px`,
      width: `${cropArea.width * scale}px`,
      height: `${cropArea.height * scale}px`,
      border: '2px dashed #3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      cursor: isDragging ? 'grabbing' : 'grab',
    };
  };

  const handleUpload = async () => {
    if (!previewUrl) return;
    
    try {
      setUploading(true);
      // Convert data URL to File if needed
      let fileToUpload = selectedFile;
      
      // If image was cropped, convert the cropped data URL to a File
      if (previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')) {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        fileToUpload = new File([blob], selectedFile?.name || 'cover.jpg', { type: blob.type });
      }
      
      if (!fileToUpload) return;
      
      // Upload to Cloudinary
      const { url } = await uploadToCloudinary(fileToUpload, "tasktrust/covers");
      await onUpload(url);
      setPreviewUrl(null);
      setSelectedFile(null);
      setShowCrop(false);
    } catch (error: any) {
      alert(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setShowCrop(false);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            Upload Cover Photo
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
            {/* Preview with Crop */}
            <div className="flex justify-center">
              <div ref={containerRef} className="relative w-full">
                <div className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100">
                  {previewUrl ? (
                    <>
                      <img
                        ref={imageRef}
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-contain"
                        style={{ maxHeight: '400px' }}
                      />
                      {showCrop && (
                        <div
                          style={getCropStyle()}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                            if (imageRef.current && containerRef.current) {
                              const img = imageRef.current;
                              const imgRect = img.getBoundingClientRect();
                              const containerRect = containerRef.current.getBoundingClientRect();
                              const imgOffsetX = imgRect.left - containerRect.left;
                              const imgOffsetY = imgRect.top - containerRect.top;
                              
                              const imgDisplayWidth = img.offsetWidth;
                              const imgDisplayHeight = img.offsetHeight;
                              const scaleX = imgDisplayWidth / imageSize.width;
                              const scaleY = imgDisplayHeight / imageSize.height;
                              
                              setDragStart({
                                x: e.clientX - (imgOffsetX + cropArea.x * scaleX),
                                y: e.clientY - (imgOffsetY + cropArea.y * scaleY),
                              });
                            }
                          }}
                        >
                          <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-600 rounded-full cursor-nwse-resize" />
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-600 rounded-full cursor-nesw-resize" />
                          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-600 rounded-full cursor-nesw-resize" />
                          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 rounded-full cursor-nwse-resize" />
                        </div>
                      )}
                    </>
                  ) : currentCoverUrl ? (
                    <img
                      src={currentCoverUrl}
                      alt="Current cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FiImage className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                {showCrop && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleCrop}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      <FiCheck className="h-4 w-4" />
                      Apply Crop
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCrop(false)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      Cancel Crop
                    </button>
                  </div>
                )}
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
                Supported formats: JPG, PNG, GIF (Max 10MB)
              </p>
              <p className="mt-1 text-center text-xs text-gray-400">
                Recommended size: 1200x400px for best results
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div>
            {currentCoverUrl && onRemove && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm("Are you sure you want to remove your cover photo?")) {
                    await onRemove();
                    handleClose();
                  }
                }}
                disabled={loading || uploading}
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
              disabled={loading || uploading}
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || loading || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? (
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

export default UploadCoverModal;

