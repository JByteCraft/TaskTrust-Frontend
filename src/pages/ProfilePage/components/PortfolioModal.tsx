import React, { useState, useRef } from "react";
import { FiX, FiUpload, FiImage, FiCalendar, FiBriefcase, FiMapPin } from "react-icons/fi";
import { uploadToCloudinary } from "../../../lib/utils/cloudinary.utils";

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
  loading?: boolean;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  loading = false,
}) => {
  const [type, setType] = useState<"certification" | "project">(
    initialData?.type || "certification"
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [date, setDate] = useState(
    initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : ""
  );
  const [issuer, setIssuer] = useState(initialData?.issuer || "");
  const [company, setCompany] = useState(initialData?.company || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || "");
  const [imageUrls, setImageUrls] = useState<string[]>(initialData?.imageUrls || []);
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    try {
      setUploading(true);
      const { url } = await uploadToCloudinary(
        file,
        type === "certification" ? "tasktrust/certifications" : "tasktrust/projects"
      );
      
      if (type === "certification") {
        setImageUrl(url);
      } else {
        setImageUrls([...imageUrls, url]);
      }
    } catch (error: any) {
      alert(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    const data: any = {
      type,
      title,
      description,
      date: date || undefined,
    };

    if (type === "certification") {
      data.issuer = issuer;
      data.imageUrl = imageUrl;
    } else {
      data.company = company;
      data.location = location;
      data.imageUrls = imageUrls;
      data.skills = skills;
    }

    await onSave(data);
  };

  const handleClose = () => {
    if (!loading) {
      setTitle("");
      setDescription("");
      setDate("");
      setIssuer("");
      setCompany("");
      setLocation("");
      setImageUrl("");
      setImageUrls([]);
      setSkills([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Edit Portfolio Item" : "Add Portfolio Item"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            disabled={loading}
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="certification"
                  checked={type === "certification"}
                  onChange={(e) => setType(e.target.value as "certification")}
                  className="mr-2"
                  disabled={loading}
                />
                Certification
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="project"
                  checked={type === "project"}
                  onChange={(e) => setType(e.target.value as "project")}
                  className="mr-2"
                  disabled={loading}
                />
                Project
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter title"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description"
              disabled={loading}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Certification-specific fields */}
          {type === "certification" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiBriefcase className="inline w-4 h-4 mr-1" />
                  Issuing Organization
                </label>
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., TESDA, PRC"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Image
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading || uploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploading}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition disabled:opacity-50"
                >
                  <FiUpload className="w-5 h-5" />
                  {uploading ? "Uploading..." : imageUrl ? "Change Image" : "Upload Image"}
                </button>
                {imageUrl && (
                  <div className="mt-2">
                    <img src={imageUrl} alt="Certificate" className="max-w-xs rounded-lg" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Project-specific fields */}
          {type === "project" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiBriefcase className="inline w-4 h-4 mr-1" />
                  Client/Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Client or company name"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiMapPin className="inline w-4 h-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Project location"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Images</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading || uploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploading}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition disabled:opacity-50 mb-2"
                >
                  <FiUpload className="w-5 h-5" />
                  {uploading ? "Uploading..." : "Add Image"}
                </button>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Project ${index + 1}`} className="w-full h-24 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills Used</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Add skill and press Enter"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={loading}
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-600"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
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
            onClick={handleSubmit}
            disabled={!title.trim() || loading || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;

