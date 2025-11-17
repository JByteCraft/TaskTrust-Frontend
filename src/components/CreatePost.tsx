import { useState, useEffect } from "react";
import { FiImage, FiX } from "react-icons/fi";
import { createPost } from "../lib/api/posts.api";
import { getAuthenticatedUserFromToken, getStoredAuthToken } from "../lib/utils/auth.utils";
import { GET } from "../lib/utils/fetch.utils";
import { uploadToCloudinary } from "../lib/utils/cloudinary.utils";

type CreatePostProps = {
  onPostCreated?: () => void;
};

const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "connections" | "private">("public");
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  const user = getAuthenticatedUserFromToken<{
    firstName?: string;
    lastName?: string;
    middleName?: string;
    name?: string;
    userId?: number;
    id?: number;
    sub?: number | string;
  }>();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = getStoredAuthToken();
      if (!token || !user) return;

      const userId = user.userId ?? user.id ?? (typeof user.sub === "string" ? Number(user.sub) : user.sub);
      if (!userId) return;

      try {
        const response = await GET<any>(`/users/${userId}`, "", token);
        
        // Extract payload
        const payload =
          response?.data ||
          response?.profile ||
          response?.user ||
          response?.response ||
          response ||
          {};
        
        const picUrl = 
          payload?.profilePictureUrl ||
          payload?.avatarUrl ||
          payload?.avatar ||
          payload?.profileImage ||
          payload?.profilePicture ||
          "";
        
        setProfilePictureUrl(picUrl);

        // Extract name
        const names = [
          payload?.firstName || user.firstName,
          payload?.middleName || user.middleName,
          payload?.lastName || user.lastName,
        ].filter(Boolean);
        
        if (names.length > 0) {
          setUserName(names.join(" "));
        } else if (payload?.name || user.name) {
          setUserName(payload?.name || user.name || "");
        } else {
          setUserName(user.firstName || "User");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Fallback to token data
        const names = [
          user.firstName,
          user.middleName,
          user.lastName,
        ].filter(Boolean);
        setUserName(names.length > 0 ? names.join(" ") : user.name || user.firstName || "User");
      }
    };

    fetchUserProfile();
  }, [user]);

  const getUserInitials = () => {
    if (userName) {
      const parts = userName.split(" ").filter(Boolean);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0]?.[0]?.toUpperCase() || "U";
    }
    return user?.firstName?.charAt(0)?.toUpperCase() || "U";
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadToCloudinary(file));
      const results = await Promise.all(uploadPromises);
      const urls = results.map((result) => result.url);
      setImages([...images, ...urls]);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      alert("Please add some content or images");
      return;
    }

    setPosting(true);
    try {
      await createPost({
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        visibility,
      });
      
      setContent("");
      setImages([]);
      setVisibility("public");
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error("Create post error:", error);
      alert(error.response?.data?.message || "Failed to create post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <div className="shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={userName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-blue-700 font-semibold text-sm sm:text-base">
                  {getUserInitials()}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${userName ? userName.split(" ")[0] : user?.firstName || "there"}?`}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm sm:text-base"
              rows={3}
            />
          </div>
        </div>

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {images.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-2 text-gray-600 hover:text-blue-600 cursor-pointer text-sm">
              <FiImage />
              <span className="text-xs sm:text-sm">Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              className="text-xs sm:text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="public">Public</option>
              <option value="connections">Connections Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={posting || uploading || (!content.trim() && images.length === 0)}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;

