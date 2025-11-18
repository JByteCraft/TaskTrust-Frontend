import type { FC } from "react";
import { useState, useEffect, useRef } from "react";
import { FiX, FiSave } from "react-icons/fi";
import ImageUploadField from "./ImageUploadField";
import { getAllSkills } from "../../../lib/api/skills.api";
import { getAllExpertise } from "../../../lib/api/expertise.api";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData: {
    firstName: string;
    lastName: string;
    middleName: string;
    gender: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    expertise?: string[];
    bio?: string;
    skills?: string[];
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
    zipCode?: string;
    profilePictureUrl?: string;
    idType?: string;
    idNumber?: string;
    idImgUrl?: string;
    selfieImgUrl?: string;
  };
  userRole?: string; // User role to determine if skills should be shown
  loading?: boolean;
}

const EditProfileModal: FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  userRole,
  loading = false,
}) => {
  const isTasker = userRole === "tasker";
  const [formData, setFormData] = useState(initialData);
  const [skillInput, setSkillInput] = useState("");
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Expertise states (similar to skills)
  const [expertiseInput, setExpertiseInput] = useState("");
  const [allExpertise, setAllExpertise] = useState<string[]>([]);
  const [expertiseSuggestions, setExpertiseSuggestions] = useState<string[]>([]);
  const [showExpertiseSuggestions, setShowExpertiseSuggestions] = useState(false);
  const expertiseInputRef = useRef<HTMLInputElement>(null);
  const expertiseSuggestionsRef = useRef<HTMLDivElement>(null);
  
  // Track if modal was just opened to initialize formData only once
  const prevIsOpenRef = useRef(false);
  const initializedDataRef = useRef<string | null>(null);

  // Only initialize formData when modal opens (not on every initialData change)
  useEffect(() => {
    // When modal opens (isOpen changes from false to true)
    if (isOpen && !prevIsOpenRef.current) {
      // Ensure expertise is always an array when initializing
      const normalizedInitialData = {
        ...initialData,
        expertise: Array.isArray(initialData.expertise) 
          ? initialData.expertise 
          : (initialData.expertise ? [initialData.expertise] : []),
      };
      
      // Initialize formData with normalized initialData
      const initialDataStr = JSON.stringify(normalizedInitialData);
      setFormData(normalizedInitialData);
      initializedDataRef.current = initialDataStr;
    }
    
    // When modal closes, reset tracking
    if (!isOpen && prevIsOpenRef.current) {
      initializedDataRef.current = null;
    }
    
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData]); // Include initialData but only initialize when modal opens

  // Separate effect to handle initialData changes ONLY when modal is closed
  // This ensures fresh data when modal reopens after save
  useEffect(() => {
    if (!isOpen) {
      // Modal is closed, we can update the reference for next open
      initializedDataRef.current = null;
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isTasker) {
      const loadSkills = async () => {
        try {
          // GET from fetch.utils returns: { status, response, message }
          const response = await getAllSkills();
          let skillsData: string[] = [];
          if (response?.response?.skills && Array.isArray(response.response.skills)) {
            skillsData = response.response.skills;
          } else if (Array.isArray(response?.response)) {
            skillsData = response.response;
          } else if (Array.isArray(response?.skills)) {
            skillsData = response.skills;
          }
          setAllSkills(skillsData);
        } catch (error) {
          console.error("Load skills error:", error);
        }
      };
      loadSkills();
      
      const loadExpertise = async () => {
        try {
          const response = await getAllExpertise();
          let expertiseData: string[] = [];
          if (response?.response?.expertise && Array.isArray(response.response.expertise)) {
            expertiseData = response.response.expertise;
          } else if (Array.isArray(response?.response)) {
            expertiseData = response.response;
          } else if (Array.isArray(response?.expertise)) {
            expertiseData = response.expertise;
          }
          setAllExpertise(expertiseData);
        } catch (error) {
          console.error("Load expertise error:", error);
        }
      };
      loadExpertise();
    }
  }, [isTasker]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        skillInputRef.current &&
        !skillInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        expertiseSuggestionsRef.current &&
        !expertiseSuggestionsRef.current.contains(event.target as Node) &&
        expertiseInputRef.current &&
        !expertiseInputRef.current.contains(event.target as Node)
      ) {
        setShowExpertiseSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !formData.skills?.includes(trimmedSkill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), trimmedSkill],
      }));
      setSkillInput("");
      setShowSuggestions(false);
      setSkillSuggestions([]);
    }
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSkillInput(value);
    
    if (value.trim().length > 0) {
      const filtered = allSkills.filter((skill) =>
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !formData.skills?.includes(skill)
      );
      setSkillSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSkillSuggestionClick = (skill: string) => {
    if (!formData.skills?.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), skill],
      }));
      setSkillInput("");
      setShowSuggestions(false);
      setSkillSuggestions([]);
      if (skillInputRef.current) {
        skillInputRef.current.focus();
      }
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || [],
    }));
  };

  // Expertise handlers (similar to skills)
  const handleAddExpertise = () => {
    const trimmedExpertise = expertiseInput.trim();
    if (trimmedExpertise && !formData.expertise?.includes(trimmedExpertise)) {
      setFormData((prev) => ({
        ...prev,
        expertise: [...(prev.expertise || []), trimmedExpertise],
      }));
      setExpertiseInput("");
      setShowExpertiseSuggestions(false);
      setExpertiseSuggestions([]);
    }
  };

  const handleExpertiseInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExpertiseInput(value);
    
    if (value.trim().length > 0) {
      const filtered = allExpertise.filter((exp) =>
        exp.toLowerCase().includes(value.toLowerCase()) &&
        !formData.expertise?.includes(exp)
      );
      setExpertiseSuggestions(filtered.slice(0, 5));
      setShowExpertiseSuggestions(filtered.length > 0);
    } else {
      setExpertiseSuggestions([]);
      setShowExpertiseSuggestions(false);
    }
  };

  const handleExpertiseSuggestionClick = (expertise: string) => {
    if (!formData.expertise?.includes(expertise)) {
      setFormData((prev) => ({
        ...prev,
        expertise: [...(prev.expertise || []), expertise],
      }));
      setExpertiseInput("");
      setShowExpertiseSuggestions(false);
      setExpertiseSuggestions([]);
      if (expertiseInputRef.current) {
        expertiseInputRef.current.focus();
      }
    }
  };

  const handleRemoveExpertise = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // Prevent double submission
    
    // Ensure expertise is always an array (even if empty)
    const cleanedFormData = {
      ...formData,
      expertise: Array.isArray(formData.expertise) ? formData.expertise : (formData.expertise ? [formData.expertise] : []),
      skills: Array.isArray(formData.skills) ? formData.skills : (formData.skills ? [formData.skills] : []),
    };
    
    // Remove skills from formData if user is not a tasker
    const dataToSave = isTasker 
      ? cleanedFormData 
      : { ...cleanedFormData, skills: undefined, expertise: undefined };
    
    try {
      await onSave(dataToSave);
      // onSave should handle closing the modal, but we can also close it here as fallback
    } catch (error) {
      console.error("Save error:", error);
      // Error handling is done in onSave
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="+63 912 345 6789"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Professional Information
              </h3>
              <div className="space-y-4">
                {/* Expertise - Only for Taskers */}
                {isTasker && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Expertise
                    </label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          ref={expertiseInputRef}
                          type="text"
                          value={expertiseInput}
                          onChange={handleExpertiseInputChange}
                          onFocus={() => {
                            if (expertiseSuggestions.length > 0) setShowExpertiseSuggestions(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddExpertise();
                            }
                          }}
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Add expertise (press Enter)"
                        />
                        <button
                          type="button"
                          onClick={handleAddExpertise}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      {showExpertiseSuggestions && expertiseSuggestions.length > 0 && (
                        <div
                          ref={expertiseSuggestionsRef}
                          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {expertiseSuggestions.map((expertise, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleExpertiseSuggestionClick(expertise)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition"
                            >
                              {expertise}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.expertise && formData.expertise.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.expertise.map((expertise, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                          >
                            {expertise}
                            <button
                              type="button"
                              onClick={() => handleRemoveExpertise(index)}
                              className="ml-1 rounded-full p-0.5 hover:bg-green-200"
                              aria-label={`Remove ${expertise}`}
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Professional Summary
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Tell others about yourself and your expertise..."
                  />
                </div>
                {/* Skills - Only for Taskers */}
                {isTasker && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Skills
                    </label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          ref={skillInputRef}
                          type="text"
                          value={skillInput}
                          onChange={handleSkillInputChange}
                          onFocus={() => {
                            if (skillSuggestions.length > 0) setShowSuggestions(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder="Add a skill (press Enter)"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                      {showSuggestions && skillSuggestions.length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        >
                          {skillSuggestions.map((skill, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSkillSuggestionClick(skill)}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition"
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.skills && formData.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(index)}
                              className="ml-1 rounded-full p-0.5 hover:bg-blue-200"
                              aria-label={`Remove ${skill}`}
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Address</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Street
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Barangay
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    value={formData.barangay || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    City/Municipality
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Province
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="1000"
                  />
                </div>
              </div>
            </div>

            {/* Verification Information (for Taskers) */}
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Verification
              </h3>
              <p className="mb-4 text-sm text-gray-600">
                For taskers: Upload your ID and selfie to get verified and build trust with customers
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ID Type
                  </label>
                  <select
                    name="idType"
                    value={formData.idType || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select ID Type</option>
                    <option value="passport">Passport</option>
                    <option value="driver_license">Driver's License</option>
                    <option value="national_id">National ID</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber || ""}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Enter your ID number"
                  />
                </div>
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="ID Image"
                    currentUrl={formData.idImgUrl}
                    onUploadComplete={(url) => setFormData((prev) => ({ ...prev, idImgUrl: url }))}
                    folder="tasktrust/id-verification"
                    helperText="Upload a clear photo of your ID (Passport, Driver's License, or National ID)"
                  />
                </div>
                <div className="sm:col-span-2">
                  <ImageUploadField
                    label="Selfie with ID"
                    currentUrl={formData.selfieImgUrl}
                    onUploadComplete={(url) => setFormData((prev) => ({ ...prev, selfieImgUrl: url }))}
                    folder="tasktrust/id-verification"
                    helperText="Upload a selfie holding your ID next to your face for verification"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <FiSave className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;

